package com.aura.coach.data.repository

import android.content.Context
import com.aura.coach.ai.MediaPipeAIEngine
import com.aura.coach.alarm.AlarmScheduler
import com.aura.coach.data.local.TaskDao
import com.aura.coach.data.local.entity.DailyReflectionEntity
import com.aura.coach.data.local.entity.FrictionReason
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.data.local.entity.TaskStatus
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import java.time.LocalTime

class TaskRepositoryImpl(
    private val context: Context,
    private val taskDao: TaskDao,
    private val aiEngine: MediaPipeAIEngine
) : TaskRepository {

    override fun getTasksForDateFlow(date: LocalDate): Flow<List<TaskEntity>> {
        return taskDao.getTasksForDateFlow(date)
    }

    override suspend fun getTasksForDate(date: LocalDate): List<TaskEntity> {
        return taskDao.getTasksForDate(date)
    }

    override suspend fun insertTasks(tasks: List<TaskEntity>) {
        val insertedIds = taskDao.insertTasks(tasks)
        // Schedule alarms for today's new pending tasks
        val today = LocalDate.now()
        val allTasks = taskDao.getTasksForDate(today)
        AlarmScheduler.rescheduleAllFutureTasks(context, allTasks)
    }

    override suspend fun updateTask(task: TaskEntity) {
        taskDao.updateTask(task)
        if (task.status == TaskStatus.COMPLETED) {
            AlarmScheduler.cancelTaskAlarm(context, task.id)
        } else {
            AlarmScheduler.scheduleTaskEndCheckIn(context, task)
        }
    }

    override suspend fun completeTask(taskId: Long) {
        val task = taskDao.getTaskById(taskId) ?: return
        val updated = task.copy(
            status = TaskStatus.COMPLETED,
            completedAtTime = LocalTime.now()
        )
        taskDao.updateTask(updated)
        AlarmScheduler.cancelTaskAlarm(context, taskId)
    }

    /**
     * Domino Rescheduling:
     * Extends the specified task by `shiftMinutes` (default +30m).
     * Automatically ripples the delay forward to all downstream tasks on the same day.
     * Persists new times and updates AlarmManager triggers.
     */
    override suspend fun extendTaskAndDominoShift(taskId: Long, shiftMinutes: Long): List<TaskEntity> {
        val currentTask = taskDao.getTaskById(taskId) ?: return emptyList()
        val allTasks = taskDao.getTasksForDate(currentTask.scheduledDate)

        val updatedCurrent = currentTask.copy(
            endTime = currentTask.endTime.plusMinutes(shiftMinutes),
            status = TaskStatus.RESCHEDULED,
            rescheduledFromTime = currentTask.rescheduledFromTime ?: currentTask.endTime
        )

        val modifiedList = mutableListOf<TaskEntity>()
        modifiedList.add(updatedCurrent)

        // Find subsequent tasks that must shift forward
        for (task in allTasks) {
            if (task.id == currentTask.id) continue
            // Downstream tasks starting after or at current task start, not yet finished
            if (task.startTime >= currentTask.startTime && task.status != TaskStatus.COMPLETED) {
                val shifted = task.copy(
                    startTime = task.startTime.plusMinutes(shiftMinutes),
                    endTime = task.endTime.plusMinutes(shiftMinutes),
                    status = TaskStatus.RESCHEDULED,
                    rescheduledFromTime = task.rescheduledFromTime ?: task.startTime
                )
                modifiedList.add(shifted)
            }
        }

        taskDao.updateTasks(modifiedList)

        // Reschedule alarms for modified items
        for (task in modifiedList) {
            AlarmScheduler.cancelTaskAlarm(context, task.id)
            AlarmScheduler.scheduleTaskEndCheckIn(context, task)
        }

        return modifiedList
    }

    override suspend fun tagFrictionReason(taskId: Long, reason: FrictionReason) {
        val task = taskDao.getTaskById(taskId) ?: return
        taskDao.updateTask(task.copy(frictionReason = reason, status = TaskStatus.FAILED))
    }

    override suspend fun generateScheduleFromBrainDump(brainDump: String, targetDate: LocalDate): Result<List<TaskEntity>> {
        return aiEngine.generateSchedule(brainDump, targetDate)
    }

    override suspend fun generateEveningReflection(date: LocalDate): Result<DailyReflectionEntity> {
        val tasks = taskDao.getTasksForDate(date)
        val completed = tasks.filter { it.status == TaskStatus.COMPLETED }
        val failed = tasks.filter { it.status != TaskStatus.COMPLETED }

        val reflectionResult = aiEngine.analyzeFriction(date, completed, failed)
        reflectionResult.onSuccess { reflection ->
            taskDao.insertReflection(reflection)
        }
        return reflectionResult
    }

    override fun getReflectionForDate(date: LocalDate): Flow<DailyReflectionEntity?> {
        return taskDao.getReflectionForDate(date)
    }

    override suspend fun deleteScheduleForDate(date: LocalDate) {
        val tasks = taskDao.getTasksForDate(date)
        for (task in tasks) {
            AlarmScheduler.cancelTaskAlarm(context, task.id)
        }
        taskDao.deleteTasksForDate(date)
    }
}
