package com.aura.coach.ai

import android.content.Context
import android.util.Log
import com.aura.coach.data.local.entity.DailyReflectionEntity
import com.aura.coach.data.local.entity.FrictionReason
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.data.local.entity.TaskStatus
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

class MediaPipeAIEngine(private val context: Context) {

    companion object {
        private const val TAG = "MediaPipeAIEngine"
        private const val MODEL_ASSET_PATH = "models/model.bin"
        private const val LOCAL_MODEL_FILENAME = "model.bin"
    }

    private var llmInference: LlmInference? = null
    private var isInitialized = false

    /**
     * Initializes the MediaPipe LlmInference engine.
     * Ensures the uncompressed model in assets is extracted to internal storage if necessary.
     */
    suspend fun initialize(): Boolean = withContext(Dispatchers.IO) {
        if (isInitialized && llmInference != null) return@withContext true

        try {
            val modelFile = getOrCopyModelFile()
            if (!modelFile.exists()) {
                Log.w(TAG, "Bundled model file not found at ${modelFile.absolutePath}. Mock/rule-based engine will be used as offline fallback.")
                return@withContext false
            }

            val options = LlmInference.LlmInferenceOptions.builder()
                .setModelPath(modelFile.absolutePath)
                .setMaxTokens(1024)
                .setTemperature(0.2f)
                .setTopK(40)
                .build()

            llmInference = LlmInference.createFromOptions(context, options)
            isInitialized = true
            Log.i(TAG, "MediaPipe LlmInference successfully initialized with model at ${modelFile.absolutePath}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize MediaPipe GenAI engine", e)
            false
        }
    }

    /**
     * Bedtime Planning: Parses freeform user brain dump into a realistic, time-blocked schedule with buffers.
     */
    suspend fun generateSchedule(userBrainDump: String, targetDate: LocalDate): Result<List<TaskEntity>> = withContext(Dispatchers.IO) {
        try {
            val prompt = buildBedtimePlanningPrompt(userBrainDump)
            val rawOutput = runInference(prompt) ?: fallbackScheduleParser(userBrainDump, targetDate)

            val cleanedJson = sanitizeJsonOutput(rawOutput)
            val tasks = parseTasksJson(cleanedJson, targetDate)

            if (tasks.isEmpty()) {
                // If model produced no valid JSON, apply fallback heuristics to avoid blocking user
                val fallbackTasks = generateHeuristicSchedule(userBrainDump, targetDate)
                Result.success(fallbackTasks)
            } else {
                Result.success(tasks)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error generating schedule from brain dump", e)
            Result.success(generateHeuristicSchedule(userBrainDump, targetDate))
        }
    }

    /**
     * Evening Reflection: Analyzes completed vs failed/uncompleted tasks to summarize wins,
     * identify friction patterns, and output 1 actionable tip for tomorrow.
     */
    suspend fun analyzeFriction(
        date: LocalDate,
        completed: List<TaskEntity>,
        failed: List<TaskEntity>
    ): Result<DailyReflectionEntity> = withContext(Dispatchers.IO) {
        try {
            val total = completed.size + failed.size
            val rate = if (total > 0) (completed.size.toFloat() / total.toFloat()) * 100f else 0f

            val prompt = buildFrictionAnalysisPrompt(completed, failed, rate)
            val rawOutput = runInference(prompt)

            val reflection = if (rawOutput != null) {
                parseReflectionJson(sanitizeJsonOutput(rawOutput), date, rate)
            } else {
                generateHeuristicReflection(date, completed, failed, rate)
            }

            Result.success(reflection)
        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing friction", e)
            val total = completed.size + failed.size
            val rate = if (total > 0) (completed.size.toFloat() / total.toFloat()) * 100f else 0f
            Result.success(generateHeuristicReflection(date, completed, failed, rate))
        }
    }

    private fun runInference(prompt: String): String? {
        return try {
            if (llmInference == null) {
                initializeSync()
            }
            llmInference?.generateResponse(prompt)
        } catch (e: Exception) {
            Log.e(TAG, "Inference error", e)
            null
        }
    }

    private fun initializeSync() {
        try {
            val modelFile = getOrCopyModelFile()
            if (modelFile.exists()) {
                val options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(modelFile.absolutePath)
                    .setMaxTokens(1024)
                    .setTemperature(0.2f)
                    .setTopK(40)
                    .build()
                llmInference = LlmInference.createFromOptions(context, options)
                isInitialized = true
            }
        } catch (e: Exception) {
            Log.w(TAG, "Sync initialization skipped or model not yet present.")
        }
    }

    /**
     * Clean markdown backticks and extra text around JSON response.
     */
    fun sanitizeJsonOutput(raw: String): String {
        var text = raw.trim()
        if (text.startsWith("```json")) {
            text = text.removePrefix("```json")
        } else if (text.startsWith("```")) {
            text = text.removePrefix("```")
        }
        if (text.endsWith("```")) {
            text = text.removeSuffix("```")
        }
        text = text.trim()

        // Extract first array or object if surrounded by explanatory text
        val firstBracket = text.indexOf('[')
        val lastBracket = text.lastIndexOf(']')
        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            return text.substring(firstBracket, lastBracket + 1)
        }

        val firstBrace = text.indexOf('{')
        val lastBrace = text.lastIndexOf('}')
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return text.substring(firstBrace, lastBrace + 1)
        }

        return text
    }

    private fun buildBedtimePlanningPrompt(brainDump: String): String {
        return """
            You are a strict, pragmatic offline executive function assistant.
            Convert the following bedtime brain dump into a realistic, chronologically ordered daily schedule starting at 09:00.
            Rules:
            1. Allocate 10-15 minute buffers between deep focus blocks.
            2. Never overlap tasks.
            3. Must output ONLY valid JSON without explanation, markdown fences, or conversational filler.
            4. Each JSON item must have:
               "title": string,
               "startTime": "HH:mm" (24-hour format),
               "endTime": "HH:mm" (24-hour format),
               "category": one of ["DEEP_WORK", "MEETING", "HEALTH", "ADMIN", "PERSONAL"],
               "bufferMinutes": integer

            Target JSON format:
            [
              {"title": "Morning Deep Work", "startTime": "09:00", "endTime": "10:30", "category": "DEEP_WORK", "bufferMinutes": 15},
              {"title": "Team Standup", "startTime": "10:45", "endTime": "11:15", "category": "MEETING", "bufferMinutes": 10}
            ]

            Brain Dump:
            $brainDump
        """.trimIndent()
    }

    private fun buildFrictionAnalysisPrompt(
        completed: List<TaskEntity>,
        failed: List<TaskEntity>,
        completionRate: Float
    ): String {
        val completedTitles = completed.joinToString(", ") { "${it.title} (${it.category})" }
        val failedTitles = failed.joinToString(", ") { "${it.title} [Friction: ${it.frictionReason ?: "Unspecified"}]" }

        return """
            You are an offline behavioral psychologist analyzing today's task execution.
            Stats:
            - Completed: $completedTitles
            - Missed/Uncompleted: $failedTitles
            - Completion Rate: ${completionRate.toInt()}%

            Output ONLY a JSON object with:
            {
              "winsSummary": "2-sentence celebration of high-leverage execution",
              "frictionAnalysis": "Direct diagnostic of why missed tasks failed",
              "dominantFriction": "LOW_ENERGY" | "DISTRACTION" | "POOR_ESTIMATION" | "EMERGENCY",
              "actionableTip": "1 concrete, tactical instruction for tomorrow's schedule to prevent this breakdown"
            }
        """.trimIndent()
    }

    private fun parseTasksJson(jsonString: String, date: LocalDate): List<TaskEntity> {
        val list = mutableListOf<TaskEntity>()
        val array = JSONArray(jsonString)
        val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            val title = obj.optString("title", "Scheduled Task")
            val startTimeStr = obj.optString("startTime", "09:00")
            val endTimeStr = obj.optString("endTime", "10:00")
            val category = obj.optString("category", "FOCUS")
            val buffer = obj.optInt("bufferMinutes", 10)

            val startTime = LocalTime.parse(startTimeStr, timeFormatter)
            val endTime = LocalTime.parse(endTimeStr, timeFormatter)

            list.add(
                TaskEntity(
                    title = title,
                    scheduledDate = date,
                    startTime = startTime,
                    endTime = endTime,
                    status = TaskStatus.PENDING,
                    category = category,
                    bufferMinutes = buffer
                )
            )
        }
        return list.sortedBy { it.startTime }
    }

    private fun parseReflectionJson(jsonString: String, date: LocalDate, rate: Float): DailyReflectionEntity {
        val obj = JSONObject(jsonString)
        val wins = obj.optString("winsSummary", "Maintained momentum across core priority blocks.")
        val analysis = obj.optString("frictionAnalysis", "Identified friction points in afternoon energy allocation.")
        val dominantStr = obj.optString("dominantFriction", "POOR_ESTIMATION")
        val dominant = try { FrictionReason.valueOf(dominantStr) } catch (e: Exception) { FrictionReason.POOR_ESTIMATION }
        val tip = obj.optString("actionableTip", "Schedule demanding cognitive blocks before 13:00 tomorrow.")

        return DailyReflectionEntity(
            date = date,
            rawText = jsonString,
            winsSummary = wins,
            frictionAnalysis = analysis,
            completionRate = rate,
            dominantFriction = dominant,
            actionableTip = tip
        )
    }

    private fun fallbackScheduleParser(brainDump: String, date: LocalDate): String {
        return """
            [
              {"title": "Deep Work Block", "startTime": "09:00", "endTime": "10:30", "category": "DEEP_WORK", "bufferMinutes": 15},
              {"title": "Communications & Email", "startTime": "10:45", "endTime": "11:30", "category": "ADMIN", "bufferMinutes": 15},
              {"title": "Key Project Milestone", "startTime": "13:00", "endTime": "15:00", "category": "DEEP_WORK", "bufferMinutes": 30},
              {"title": "Daily Review & Wind Down", "startTime": "16:00", "endTime": "16:45", "category": "PERSONAL", "bufferMinutes": 15}
            ]
        """.trimIndent()
    }

    private fun generateHeuristicSchedule(brainDump: String, date: LocalDate): List<TaskEntity> {
        val lines = brainDump.lines().map { it.trim().removePrefix("-").removePrefix("*").trim() }.filter { it.isNotEmpty() }
        val tasks = mutableListOf<TaskEntity>()
        var cursorTime = LocalTime.of(9, 0)

        if (lines.isEmpty()) {
            tasks.add(TaskEntity(title = "Deep Focus Morning Block", scheduledDate = date, startTime = LocalTime.of(9, 0), endTime = LocalTime.of(10, 30), category = "DEEP_WORK", bufferMinutes = 15))
            tasks.add(TaskEntity(title = "Strategic Planning & Review", scheduledDate = date, startTime = LocalTime.of(10, 45), endTime = LocalTime.of(11, 45), category = "ADMIN", bufferMinutes = 15))
            tasks.add(TaskEntity(title = "Execution Sprint", scheduledDate = date, startTime = LocalTime.of(13, 0), endTime = LocalTime.of(15, 0), category = "DEEP_WORK", bufferMinutes = 30))
            return tasks
        }

        for ((index, item) in lines.take(6).withIndex()) {
            val durationMinutes = when {
                item.contains("quick", true) || item.contains("email", true) -> 30L
                item.contains("meet", true) || item.contains("sync", true) -> 45L
                item.contains("code", true) || item.contains("write", true) || item.contains("build", true) -> 90L
                else -> 60L
            }
            val endTime = cursorTime.plusMinutes(durationMinutes)
            val category = when {
                item.contains("gym", true) || item.contains("workout", true) || item.contains("run", true) -> "HEALTH"
                item.contains("meet", true) || item.contains("call", true) -> "MEETING"
                item.contains("email", true) || item.contains("admin", true) -> "ADMIN"
                else -> "DEEP_WORK"
            }

            tasks.add(
                TaskEntity(
                    id = 0,
                    title = item,
                    scheduledDate = date,
                    startTime = cursorTime,
                    endTime = endTime,
                    status = TaskStatus.PENDING,
                    category = category,
                    bufferMinutes = 15
                )
            )

            // Shift cursor forward by duration + 15m buffer
            cursorTime = endTime.plusMinutes(15)
        }
        return tasks
    }

    private fun generateHeuristicReflection(
        date: LocalDate,
        completed: List<TaskEntity>,
        failed: List<TaskEntity>,
        rate: Float
    ): DailyReflectionEntity {
        val dominantFriction = if (failed.isEmpty()) {
            null
        } else {
            failed.mapNotNull { it.frictionReason }
                .groupingBy { it }
                .eachCount()
                .maxByOrNull { it.value }?.key ?: FrictionReason.POOR_ESTIMATION
        }

        val wins = if (completed.isNotEmpty()) {
            "Conquered ${completed.size} focus blocks today, including '${completed.first().title}'. You protected core deep work periods."
        } else {
            "Showed up to initiate the day's accountability cycle and diagnose bottlenecks honestly."
        }

        val analysis = when (dominantFriction) {
            FrictionReason.LOW_ENERGY -> "Cognitive depletion hit during afternoon blocks. Tasks required more physical stamina than scheduled."
            FrictionReason.DISTRACTION -> "Context switching and unplanned digital interruptions fragmented attention spans."
            FrictionReason.POOR_ESTIMATION -> "Task scopes expanded beyond initial blocks, triggering downstream domino delays."
            FrictionReason.EMERGENCY -> "Unanticipated external interrupts derailed the afternoon timeline."
            null -> "Flawless execution! All planned blocks were delivered on time without friction."
        }

        val tip = when (dominantFriction) {
            FrictionReason.LOW_ENERGY -> "Cap deep work at 75 minutes maximum and insert a mandatory 20-minute physical walk at 14:00."
            FrictionReason.DISTRACTION -> "Set your phone to Work Focus mode 10 minutes before your first morning block starts."
            FrictionReason.POOR_ESTIMATION -> "Add an extra 25% buffer to your longest deep work task tomorrow evening."
            FrictionReason.EMERGENCY -> "Leave a 45-minute blank 'Buffer & Triage' block at 15:30 tomorrow to absorb shocks."
            null -> "Maintain this exact sleep and morning routine tomorrow to preserve psychological momentum."
        }

        return DailyReflectionEntity(
            date = date,
            rawText = "Heuristic diagnostic fallback",
            winsSummary = wins,
            frictionAnalysis = analysis,
            completionRate = rate,
            dominantFriction = dominantFriction,
            actionableTip = tip
        )
    }

    private fun getOrCopyModelFile(): File {
        val modelsDir = File(context.filesDir, "models")
        if (!modelsDir.exists()) modelsDir.mkdirs()

        val modelFile = File(modelsDir, LOCAL_MODEL_FILENAME)
        if (!modelFile.exists()) {
            try {
                context.assets.open(MODEL_ASSET_PATH).use { input ->
                    FileOutputStream(modelFile).use { output ->
                        input.copyTo(output)
                    }
                }
                Log.i(TAG, "Copied bundled model from assets to ${modelFile.absolutePath}")
            } catch (e: Exception) {
                Log.d(TAG, "Model not present in assets (requires external download or user injection).")
            }
        }
        return modelFile
    }
}
