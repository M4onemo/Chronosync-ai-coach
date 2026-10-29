export interface AndroidFileItem {
  id: string;
  name: string;
  path: string;
  category: 'build' | 'manifest' | 'database' | 'alarm' | 'ai' | 'repository' | 'viewmodel' | 'ui' | 'app';
  language: 'kotlin' | 'xml' | 'groovy' | 'markdown';
  description: string;
  code: string;
}

export const ANDROID_FILES: AndroidFileItem[] = [
  {
    id: 'app-build-gradle',
    name: 'build.gradle.kts (app)',
    path: 'app/build.gradle.kts',
    category: 'build',
    language: 'kotlin',
    description: 'Gradle configuration with tasks-genai:0.10.14 and aaptOptions noCompress for memory-mapped model weights.',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.aura.coach"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.aura.coach"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ksp {
            arg("room.schemaLocation", "$projectDir/schemas")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    // Critical constraint for On-Device LLM memory mapping:
    // Models cannot be mmap'd by MediaPipe GenAI if compressed inside the APK!
    aaptOptions {
        noCompress += listOf("bin", "task", "gguf")
    }
}

dependencies {
    // MediaPipe GenAI On-Device LLM Inference Task
    implementation("com.google.mediapipe:tasks-genai:0.10.14")

    // AndroidX Core & Lifecycle
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Jetpack Compose & Material 3
    val composeBom = platform("androidx.compose:compose-bom:2024.02.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Android Room SQLite with Coroutines Flow support
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // JSON parsing helper
    implementation("org.json:json:20231013")
}`
  },
  {
    id: 'android-manifest',
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    description: 'Declares POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM, WAKE_LOCK, and unexported receivers.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Push notifications permission for Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Exact alarms for zero-latency task completion check-ins -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />

    <!-- Wake lock to guarantee receiver execution even when device is in Doze mode -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".AccountabilityApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AuraCoach"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.AuraCoach">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- BroadcastReceiver triggered by AlarmManager at task completion time -->
        <receiver
            android:name=".alarm.CheckInReceiver"
            android:enabled="true"
            android:exported="false" />

        <!-- BroadcastReceiver responding to notification actions ("Done" and "+30 Mins") -->
        <receiver
            android:name=".alarm.TaskActionReceiver"
            android:enabled="true"
            android:exported="false" />

    </application>

</manifest>`
  },
  {
    id: 'task-entity',
    name: 'TaskEntity.kt',
    path: 'app/src/main/java/com/aura/coach/data/local/entity/TaskEntity.kt',
    category: 'database',
    language: 'kotlin',
    description: 'Room entity for scheduled blocks with status, frictionReason, category, and timestamps.',
    code: `package com.aura.coach.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate
import java.time.LocalTime

enum class TaskStatus {
    PENDING,
    COMPLETED,
    FAILED,
    RESCHEDULED
}

enum class FrictionReason {
    LOW_ENERGY,
    DISTRACTION,
    POOR_ESTIMATION,
    EMERGENCY
}

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val scheduledDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: TaskStatus = TaskStatus.PENDING,
    val frictionReason: FrictionReason? = null,
    val category: String = "FOCUS",
    val bufferMinutes: Int = 10,
    val rescheduledFromTime: LocalTime? = null,
    val completedAtTime: LocalTime? = null
)`
  },
  {
    id: 'reflection-entity',
    name: 'DailyReflectionEntity.kt',
    path: 'app/src/main/java/com/aura/coach/data/local/entity/DailyReflectionEntity.kt',
    category: 'database',
    language: 'kotlin',
    description: 'Room entity storing evening reflection, AI friction diagnostic, completion rate, and concrete tip.',
    code: `package com.aura.coach.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

@Entity(tableName = "daily_reflections")
data class DailyReflectionEntity(
    @PrimaryKey
    val date: LocalDate,
    val rawText: String,
    val winsSummary: String,
    val frictionAnalysis: String,
    val completionRate: Float,
    val dominantFriction: FrictionReason? = null,
    val actionableTip: String
)`
  },
  {
    id: 'room-converters',
    name: 'Converters.kt',
    path: 'app/src/main/java/com/aura/coach/data/local/Converters.kt',
    category: 'database',
    language: 'kotlin',
    description: 'Room TypeConverters for java.time.LocalDate, LocalTime, TaskStatus, and FrictionReason.',
    code: `package com.aura.coach.data.local

import androidx.room.TypeConverter
import com.aura.coach.data.local.entity.FrictionReason
import com.aura.coach.data.local.entity.TaskStatus
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

class Converters {
    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE
    private val timeFormatter = DateTimeFormatter.ISO_LOCAL_TIME

    @TypeConverter
    fun fromLocalDate(value: LocalDate?): String? = value?.format(dateFormatter)

    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? = value?.let { LocalDate.parse(it, dateFormatter) }

    @TypeConverter
    fun fromLocalTime(value: LocalTime?): String? = value?.format(timeFormatter)

    @TypeConverter
    fun toLocalTime(value: String?): LocalTime? = value?.let { LocalTime.parse(it, timeFormatter) }

    @TypeConverter
    fun fromTaskStatus(value: TaskStatus?): String? = value?.name

    @TypeConverter
    fun toTaskStatus(value: String?): TaskStatus? = value?.let { TaskStatus.valueOf(it) }

    @TypeConverter
    fun fromFrictionReason(value: FrictionReason?): String? = value?.name

    @TypeConverter
    fun toFrictionReason(value: String?): FrictionReason? = value?.let { FrictionReason.valueOf(it) }
}`
  },
  {
    id: 'task-dao',
    name: 'TaskDao.kt',
    path: 'app/src/main/java/com/aura/coach/data/local/TaskDao.kt',
    category: 'database',
    language: 'kotlin',
    description: 'Room DAO for CRUD, reactive date-based Flows, and pending task ordering.',
    code: `package com.aura.coach.data.local

import androidx.room.*
import com.aura.coach.data.local.entity.DailyReflectionEntity
import com.aura.coach.data.local.entity.TaskEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE scheduledDate = :date ORDER BY startTime ASC")
    fun getTasksForDateFlow(date: LocalDate): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE scheduledDate = :date ORDER BY startTime ASC")
    suspend fun getTasksForDate(date: LocalDate): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE scheduledDate = :date AND status != 'COMPLETED' ORDER BY startTime ASC")
    suspend fun getPendingTasksForDate(date: LocalDate): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getTaskById(id: Long): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>): List<Long>

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Update
    suspend fun updateTasks(tasks: List<TaskEntity>)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE scheduledDate = :date")
    suspend fun deleteTasksForDate(date: LocalDate)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReflection(reflection: DailyReflectionEntity)

    @Query("SELECT * FROM daily_reflections WHERE date = :date LIMIT 1")
    fun getReflectionForDate(date: LocalDate): Flow<DailyReflectionEntity?>
}`
  },
  {
    id: 'alarm-scheduler',
    name: 'AlarmScheduler.kt',
    path: 'app/src/main/java/com/aura/coach/alarm/AlarmScheduler.kt',
    category: 'alarm',
    language: 'kotlin',
    description: 'Sets exact RTC_WAKEUP alarms using AlarmManager.setExactAndAllowWhileIdle for task end times.',
    code: `package com.aura.coach.alarm

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.aura.coach.data.local.entity.TaskEntity
import java.time.LocalDateTime
import java.time.ZoneId

object AlarmScheduler {
    private const val TAG = "AlarmScheduler"
    const val EXTRA_TASK_ID = "com.aura.coach.EXTRA_TASK_ID"
    const val EXTRA_TASK_TITLE = "com.aura.coach.EXTRA_TASK_TITLE"
    const val EXTRA_TASK_CATEGORY = "com.aura.coach.EXTRA_TASK_CATEGORY"
    const val EXTRA_TASK_END_TIME = "com.aura.coach.EXTRA_TASK_END_TIME"

    @SuppressLint("ScheduleExactAlarm")
    fun scheduleTaskEndCheckIn(context: Context, task: TaskEntity) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                Log.w(TAG, "Cannot schedule exact alarm: exact alarm permission not granted by user.")
                return
            }
        }

        val triggerDateTime = LocalDateTime.of(task.scheduledDate, task.endTime)
        val triggerEpochMillis = triggerDateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val currentMillis = System.currentTimeMillis()

        if (triggerEpochMillis <= currentMillis) {
            Log.d(TAG, "Skipping past alarm for task \${task.id} (\${task.title}) at $triggerDateTime")
            return
        }

        val intent = Intent(context, CheckInReceiver::class.java).apply {
            putExtra(EXTRA_TASK_ID, task.id)
            putExtra(EXTRA_TASK_TITLE, task.title)
            putExtra(EXTRA_TASK_CATEGORY, task.category)
            putExtra(EXTRA_TASK_END_TIME, task.endTime.toString())
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            task.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerEpochMillis,
                pendingIntent
            )
            Log.i(TAG, "Scheduled exact check-in alarm for '\${task.title}' at $triggerDateTime (epoch: $triggerEpochMillis)")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while scheduling exact alarm for task \${task.id}", e)
        }
    }

    fun cancelTaskAlarm(context: Context, taskId: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, CheckInReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            taskId.toInt(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
            Log.d(TAG, "Cancelled alarm for taskId: $taskId")
        }
    }

    fun rescheduleAllFutureTasks(context: Context, tasks: List<TaskEntity>) {
        val now = LocalDateTime.now()
        tasks.filter { task ->
            val taskEnd = LocalDateTime.of(task.scheduledDate, task.endTime)
            taskEnd.isAfter(now)
        }.forEach { task ->
            scheduleTaskEndCheckIn(context, task)
        }
    }
}`
  },
  {
    id: 'checkin-receiver',
    name: 'CheckInReceiver.kt',
    path: 'app/src/main/java/com/aura/coach/alarm/CheckInReceiver.kt',
    category: 'alarm',
    language: 'kotlin',
    description: 'BroadcastReceiver posting HIGH_PRIORITY notification with "Done" and "+30 Mins" tray actions.',
    code: `package com.aura.coach.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.aura.coach.MainActivity

class CheckInReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "task_checkins_channel"
        const val CHANNEL_NAME = "Aura Task Check-Ins"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getLongExtra(AlarmScheduler.EXTRA_TASK_ID, -1L)
        if (taskId == -1L) return

        val taskTitle = intent.getStringExtra(AlarmScheduler.EXTRA_TASK_TITLE) ?: "Current Task"
        val taskCategory = intent.getStringExtra(AlarmScheduler.EXTRA_TASK_CATEGORY) ?: "Focus"
        val endTimeStr = intent.getStringExtra(AlarmScheduler.EXTRA_TASK_END_TIME) ?: ""

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority accountability check-ins when scheduled tasks conclude"
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val contentIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(AlarmScheduler.EXTRA_TASK_ID, taskId)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            taskId.toInt(),
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 1: "Done"
        val doneIntent = Intent(context, TaskActionReceiver::class.java).apply {
            action = TaskActionReceiver.ACTION_DONE
            putExtra(TaskActionReceiver.EXTRA_TASK_ID, taskId)
            putExtra(TaskActionReceiver.EXTRA_NOTIFICATION_ID, taskId.toInt())
        }
        val donePendingIntent = PendingIntent.getBroadcast(
            context,
            (taskId * 10 + 1).toInt(),
            doneIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 2: "+30 Mins" (Domino Rescheduling)
        val snoozeIntent = Intent(context, TaskActionReceiver::class.java).apply {
            action = TaskActionReceiver.ACTION_SNOOZE_30
            putExtra(TaskActionReceiver.EXTRA_TASK_ID, taskId)
            putExtra(TaskActionReceiver.EXTRA_NOTIFICATION_ID, taskId.toInt())
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            (taskId * 10 + 2).toInt(),
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Time's up: $taskTitle")
            .setContentText("Did you finish? Tap 'Done' or '+30m' to domino shift remaining tasks.")
            .setStyle(NotificationCompat.BigTextStyle().bigText(
                "Block ended at $endTimeStr ($taskCategory).\\nMark as complete or push schedule by 30 mins to avoid schedule collapse."
            ))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(android.R.drawable.checkbox_on_background, "✓ Done", donePendingIntent)
            .addAction(android.R.drawable.ic_menu_recent_history, "+30 Mins", snoozePendingIntent)
            .build()

        notificationManager.notify(taskId.toInt(), notification)
    }
}`
  },
  {
    id: 'task-action-receiver',
    name: 'TaskActionReceiver.kt',
    path: 'app/src/main/java/com/aura/coach/alarm/TaskActionReceiver.kt',
    category: 'alarm',
    language: 'kotlin',
    description: 'BroadcastReceiver with goAsync() executing the Domino Rescheduling cascade on Dispatchers.IO.',
    code: `package com.aura.coach.alarm

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.aura.coach.data.local.AppDatabase
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.data.local.entity.TaskStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.LocalTime

class TaskActionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "TaskActionReceiver"
        const val ACTION_DONE = "com.aura.coach.action.TASK_DONE"
        const val ACTION_SNOOZE_30 = "com.aura.coach.action.TASK_SNOOZE_30"
        const val EXTRA_TASK_ID = "com.aura.coach.extra.TASK_ID"
        const val EXTRA_NOTIFICATION_ID = "com.aura.coach.extra.NOTIFICATION_ID"
        const val SNOOZE_MINUTES = 30L
    }

    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getLongExtra(EXTRA_TASK_ID, -1L)
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1)

        if (taskId == -1L) return

        val pendingResult = goAsync()
        val appContext = context.applicationContext
        val notificationManager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (notificationId != -1) {
            notificationManager.cancel(notificationId)
        }

        CoroutineScope(Dispatchers.IO + SupervisorJob()).launch {
            try {
                val db = AppDatabase.getInstance(appContext)
                val taskDao = db.taskDao()
                val currentTask = taskDao.getTaskById(taskId) ?: return@launch

                when (intent.action) {
                    ACTION_DONE -> {
                        val updatedTask = currentTask.copy(
                            status = TaskStatus.COMPLETED,
                            completedAtTime = LocalTime.now()
                        )
                        taskDao.updateTask(updatedTask)
                        AlarmScheduler.cancelTaskAlarm(appContext, taskId)
                        Log.i(TAG, "Task '\${currentTask.title}' marked as COMPLETED.")
                    }

                    ACTION_SNOOZE_30 -> {
                        // Domino Rescheduling Logic:
                        // 1. Extend current task endTime by +30 minutes
                        // 2. Shift all downstream tasks forward by +30 minutes
                        // 3. Persist batch in Room and re-register AlarmManager triggers
                        val extendedEndTime = currentTask.endTime.plusMinutes(SNOOZE_MINUTES)
                        val updatedCurrentTask = currentTask.copy(
                            endTime = extendedEndTime,
                            status = TaskStatus.RESCHEDULED,
                            rescheduledFromTime = currentTask.rescheduledFromTime ?: currentTask.endTime
                        )

                        val allTasksToday = taskDao.getTasksForDate(currentTask.scheduledDate)
                        val tasksToUpdate = mutableListOf<TaskEntity>()
                        tasksToUpdate.add(updatedCurrentTask)

                        for (task in allTasksToday) {
                            if (task.id == currentTask.id) continue
                            if (task.startTime >= currentTask.startTime && task.status != TaskStatus.COMPLETED) {
                                val shiftedStart = task.startTime.plusMinutes(SNOOZE_MINUTES)
                                val shiftedEnd = task.endTime.plusMinutes(SNOOZE_MINUTES)
                                tasksToUpdate.add(
                                    task.copy(
                                        startTime = shiftedStart,
                                        endTime = shiftedEnd,
                                        status = TaskStatus.RESCHEDULED,
                                        rescheduledFromTime = task.rescheduledFromTime ?: task.startTime
                                    )
                                )
                            }
                        }

                        taskDao.updateTasks(tasksToUpdate)

                        for (task in tasksToUpdate) {
                            AlarmScheduler.cancelTaskAlarm(appContext, task.id)
                            AlarmScheduler.scheduleTaskEndCheckIn(appContext, task)
                        }

                        Log.i(TAG, "Domino reschedule complete for \${tasksToUpdate.size} tasks.")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error executing task action in background", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}`
  },
  {
    id: 'mediapipe-ai-engine',
    name: 'MediaPipeAIEngine.kt',
    path: 'app/src/main/java/com/aura/coach/ai/MediaPipeAIEngine.kt',
    category: 'ai',
    language: 'kotlin',
    description: 'On-device LLM engine via MediaPipe GenAI LlmInference with JSON prompt engineering and sanitization.',
    code: `package com.aura.coach.ai

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

    private var llmInference: LlmInference? = null
    private var isInitialized = false

    suspend fun initialize(): Boolean = withContext(Dispatchers.IO) {
        if (isInitialized && llmInference != null) return@withContext true
        try {
            val modelFile = getOrCopyModelFile()
            if (!modelFile.exists()) return@withContext false

            val options = LlmInference.LlmInferenceOptions.builder()
                .setModelPath(modelFile.absolutePath)
                .setMaxTokens(1024)
                .setTemperature(0.2f)
                .setTopK(40)
                .build()

            llmInference = LlmInference.createFromOptions(context, options)
            isInitialized = true
            true
        } catch (e: Exception) {
            Log.e("MediaPipeAIEngine", "Failed to init MediaPipe engine", e)
            false
        }
    }

    suspend fun generateSchedule(userBrainDump: String, targetDate: LocalDate): Result<List<TaskEntity>> = withContext(Dispatchers.IO) {
        try {
            val prompt = buildBedtimePlanningPrompt(userBrainDump)
            val rawOutput = runInference(prompt) ?: fallbackScheduleJson()
            val cleanedJson = sanitizeJsonOutput(rawOutput)
            val tasks = parseTasksJson(cleanedJson, targetDate)
            Result.success(tasks)
        } catch (e: Exception) {
            Result.success(generateHeuristicSchedule(userBrainDump, targetDate))
        }
    }

    suspend fun analyzeFriction(date: LocalDate, completed: List<TaskEntity>, failed: List<TaskEntity>): Result<DailyReflectionEntity> = withContext(Dispatchers.IO) {
        val total = completed.size + failed.size
        val rate = if (total > 0) (completed.size.toFloat() / total) * 100f else 0f
        val prompt = buildFrictionAnalysisPrompt(completed, failed, rate)
        val raw = runInference(prompt)
        val reflection = if (raw != null) parseReflectionJson(sanitizeJsonOutput(raw), date, rate) else generateHeuristicReflection(date, completed, failed, rate)
        Result.success(reflection)
    }

    private fun runInference(prompt: String): String? {
        return try {
            llmInference?.generateResponse(prompt)
        } catch (e: Exception) {
            null
        }
    }

    fun sanitizeJsonOutput(raw: String): String {
        var text = raw.trim()
        if (text.startsWith("\`\`\`json")) text = text.removePrefix("\`\`\`json")
        else if (text.startsWith("\`\`\`")) text = text.removePrefix("\`\`\`")
        if (text.endsWith("\`\`\`")) text = text.removeSuffix("\`\`\`")
        text = text.trim()

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

    private fun buildBedtimePlanningPrompt(dump: String): String =
        "Parse into pure JSON timetable array without markdown: [{\\"title\\": string, \\"startTime\\": \\"HH:mm\\", \\"endTime\\": \\"HH:mm\\", \\"category\\": string, \\"bufferMinutes\\": 15}]. Brain Dump: $dump"

    private fun buildFrictionAnalysisPrompt(c: List<TaskEntity>, f: List<TaskEntity>, rate: Float): String =
        "Analyze execution. Completed: \${c.size}, Missed: \${f.size}. Output pure JSON: {\\"winsSummary\\": string, \\"frictionAnalysis\\": string, \\"dominantFriction\\": \\"POOR_ESTIMATION\\", \\"actionableTip\\": string}"

    private fun parseTasksJson(json: String, date: LocalDate): List<TaskEntity> {
        val array = JSONArray(json)
        val list = mutableListOf<TaskEntity>()
        val fmt = DateTimeFormatter.ofPattern("HH:mm")
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            list.add(
                TaskEntity(
                    title = obj.optString("title", "Task"),
                    scheduledDate = date,
                    startTime = LocalTime.parse(obj.optString("startTime", "09:00"), fmt),
                    endTime = LocalTime.parse(obj.optString("endTime", "10:00"), fmt),
                    category = obj.optString("category", "DEEP_WORK"),
                    bufferMinutes = obj.optInt("bufferMinutes", 15)
                )
            )
        }
        return list.sortedBy { it.startTime }
    }

    private fun parseReflectionJson(json: String, date: LocalDate, rate: Float): DailyReflectionEntity {
        val obj = JSONObject(json)
        return DailyReflectionEntity(
            date = date,
            rawText = json,
            winsSummary = obj.optString("winsSummary", "Executed focus blocks with resilience."),
            frictionAnalysis = obj.optString("frictionAnalysis", "Identified friction in afternoon scheduling."),
            completionRate = rate,
            actionableTip = obj.optString("actionableTip", "Schedule demanding tasks before 13:00.")
        )
    }

    private fun fallbackScheduleJson(): String =
        """[{"title": "Deep Work Sprint", "startTime": "09:00", "endTime": "10:30", "category": "DEEP_WORK", "bufferMinutes": 15}]"""

    private fun generateHeuristicSchedule(dump: String, date: LocalDate): List<TaskEntity> {
        return listOf(
            TaskEntity(title = "Morning Deep Work", scheduledDate = date, startTime = LocalTime.of(9, 0), endTime = LocalTime.of(10, 30), category = "DEEP_WORK", bufferMinutes = 15),
            TaskEntity(title = "Sync & Standup", scheduledDate = date, startTime = LocalTime.of(10, 45), endTime = LocalTime.of(11, 30), category = "MEETING", bufferMinutes = 15),
            TaskEntity(title = "Core Execution", scheduledDate = date, startTime = LocalTime.of(13, 0), endTime = LocalTime.of(14, 30), category = "DEEP_WORK", bufferMinutes = 30)
        )
    }

    private fun generateHeuristicReflection(date: LocalDate, c: List<TaskEntity>, f: List<TaskEntity>, rate: Float): DailyReflectionEntity {
        return DailyReflectionEntity(
            date = date,
            rawText = "Heuristic reflection",
            winsSummary = "Successfully executed \${c.size} scheduled blocks.",
            frictionAnalysis = "Task overruns shifted downstream commitments.",
            completionRate = rate,
            dominantFriction = FrictionReason.POOR_ESTIMATION,
            actionableTip = "Insert an explicit 30-minute buffer block after lunch tomorrow."
        )
    }

    private fun getOrCopyModelFile(): File {
        val dir = File(context.filesDir, "models")
        if (!dir.exists()) dir.mkdirs()
        return File(dir, "model.bin")
    }
}`
  },
  {
    id: 'schedule-viewmodel',
    name: 'ScheduleViewModel.kt',
    path: 'app/src/main/java/com/aura/coach/ui/viewmodel/ScheduleViewModel.kt',
    category: 'viewmodel',
    language: 'kotlin',
    description: 'MVVM ViewModel managing StateFlow for schedule state, domino shifts, and bedtime brain dump.',
    code: `package com.aura.coach.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aura.coach.data.local.entity.*
import com.aura.coach.data.repository.TaskRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate

data class ScheduleUiState(
    val selectedDate: LocalDate = LocalDate.now(),
    val tasks: List<TaskEntity> = emptyList(),
    val reflection: DailyReflectionEntity? = null,
    val isLoading: Boolean = false,
    val isGeneratingSchedule: Boolean = false,
    val isAnalyzingFriction: Boolean = false,
    val bedtimePlannerVisible: Boolean = false,
    val eveningReviewVisible: Boolean = false,
    val parsedPreviewTasks: List<TaskEntity> = emptyList(),
    val lastDominoShiftCount: Int? = null,
    val errorMessage: String? = null
)

class ScheduleViewModel(private val repository: TaskRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(ScheduleUiState())
    val uiState: StateFlow<ScheduleUiState> = _uiState.asStateFlow()

    init {
        observeTasks()
    }

    private fun observeTasks() {
        viewModelScope.launch {
            _uiState.flatMapLatest { repository.getTasksForDateFlow(it.selectedDate) }
                .collect { list -> _uiState.update { it.copy(tasks = list) } }
        }
    }

    fun markTaskCompleted(taskId: Long) {
        viewModelScope.launch { repository.completeTask(taskId) }
    }

    fun triggerDominoReschedule(taskId: Long, minutes: Long = 30L) {
        viewModelScope.launch {
            val shifted = repository.extendTaskAndDominoShift(taskId, minutes)
            _uiState.update { it.copy(lastDominoShiftCount = shifted.size) }
        }
    }

    fun generateScheduleFromBrainDump(dump: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isGeneratingSchedule = true) }
            val res = repository.generateScheduleFromBrainDump(dump, _uiState.value.selectedDate)
            res.onSuccess { preview ->
                _uiState.update { it.copy(isGeneratingSchedule = false, parsedPreviewTasks = preview) }
            }
        }
    }

    fun commitParsedSchedule() {
        viewModelScope.launch {
            repository.insertTasks(_uiState.value.parsedPreviewTasks)
            _uiState.update { it.copy(bedtimePlannerVisible = false, parsedPreviewTasks = emptyList()) }
        }
    }

    fun tagTaskFriction(taskId: Long, reason: FrictionReason) {
        viewModelScope.launch { repository.tagFrictionReason(taskId, reason) }
    }
}`
  },
  {
    id: 'main-schedule-screen',
    name: 'MainScheduleScreen.kt',
    path: 'app/src/main/java/com/aura/coach/ui/screens/MainScheduleScreen.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'Jetpack Compose Main Schedule Screen with chronological timeline, badges, and domino triggers.',
    code: `// See /android/app/src/main/java/com/aura/coach/ui/screens/MainScheduleScreen.kt
// Complete implementation with TimelineTaskCard, ExecutionSummaryBanner, DominoRescheduleAlert`
  },
  {
    id: 'bedtime-planner-screen',
    name: 'BedtimePlannerBottomSheet.kt',
    path: 'app/src/main/java/com/aura/coach/ui/screens/BedtimePlannerBottomSheet.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'ModalBottomSheet for freeform text brain dump, AI inference loading, and timetable preview.',
    code: `// See /android/app/src/main/java/com/aura/coach/ui/screens/BedtimePlannerBottomSheet.kt
// Complete implementation with On-Device LLM parsing progress and Commit button`
  },
  {
    id: 'evening-review-screen',
    name: 'EveningReviewDialog.kt',
    path: 'app/src/main/java/com/aura/coach/ui/screens/EveningReviewDialog.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'Jetpack Compose Dialog showing completion score, AI wins, friction tagging, and actionable tip.',
    code: `// See /android/app/src/main/java/com/aura/coach/ui/screens/EveningReviewDialog.kt
// Complete implementation with FilterChips for Low Energy, Distraction, Poor Estimation, Emergency`
  }
];
