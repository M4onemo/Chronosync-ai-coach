package com.aura.coach.alarm

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

        if (taskId == -1L) {
            Log.e(TAG, "Missing taskId in action intent")
            return
        }

        val pendingResult = goAsync()
        val appContext = context.applicationContext
        val notificationManager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Dismiss the active notification immediately
        if (notificationId != -1) {
            notificationManager.cancel(notificationId)
        }

        CoroutineScope(Dispatchers.IO + SupervisorJob()).launch {
            try {
                val db = AppDatabase.getInstance(appContext)
                val taskDao = db.taskDao()
                val currentTask = taskDao.getTaskById(taskId)

                if (currentTask == null) {
                    Log.w(TAG, "Task with ID $taskId not found in database.")
                    return@launch
                }

                when (intent.action) {
                    ACTION_DONE -> {
                        // Mark task completed
                        val updatedTask = currentTask.copy(
                            status = TaskStatus.COMPLETED,
                            completedAtTime = LocalTime.now()
                        )
                        taskDao.updateTask(updatedTask)
                        AlarmScheduler.cancelTaskAlarm(appContext, taskId)
                        Log.i(TAG, "Task '${currentTask.title}' marked as COMPLETED.")
                    }

                    ACTION_SNOOZE_30 -> {
                        // Domino Rescheduling Logic:
                        // 1. Extend current task endTime by +30 minutes
                        // 2. Fetch all subsequent tasks scheduled for the same date that start on or after original endTime
                        // 3. Shift both startTime and endTime by +30 minutes
                        // 4. Persist updates to Room SQLite
                        // 5. Update/reschedule alarms via AlarmScheduler
                        Log.i(TAG, "Initiating Domino Rescheduling for task '${currentTask.title}' (+30m)")

                        val extendedEndTime = currentTask.endTime.plusMinutes(SNOOZE_MINUTES)
                        val updatedCurrentTask = currentTask.copy(
                            endTime = extendedEndTime,
                            status = TaskStatus.RESCHEDULED,
                            rescheduledFromTime = currentTask.rescheduledFromTime ?: currentTask.endTime
                        )

                        // Fetch all tasks for the date ordered by startTime
                        val allTasksToday = taskDao.getTasksForDate(currentTask.scheduledDate)
                        val tasksToUpdate = mutableListOf<TaskEntity>()
                        tasksToUpdate.add(updatedCurrentTask)

                        // Identify downstream tasks that need to cascade
                        for (task in allTasksToday) {
                            if (task.id == currentTask.id) continue

                            // If this task starts at or after the current task's original start time
                            // and hasn't already been marked COMPLETED in the past:
                            if (task.startTime >= currentTask.startTime && task.status != TaskStatus.COMPLETED) {
                                val shiftedStart = task.startTime.plusMinutes(SNOOZE_MINUTES)
                                val shiftedEnd = task.endTime.plusMinutes(SNOOZE_MINUTES)

                                val updatedDownstream = task.copy(
                                    startTime = shiftedStart,
                                    endTime = shiftedEnd,
                                    status = TaskStatus.RESCHEDULED,
                                    rescheduledFromTime = task.rescheduledFromTime ?: task.startTime
                                )
                                tasksToUpdate.add(updatedDownstream)
                            }
                        }

                        // Persist in Room
                        taskDao.updateTasks(tasksToUpdate)

                        // Cancel and reschedule alarms for all modified tasks
                        for (task in tasksToUpdate) {
                            AlarmScheduler.cancelTaskAlarm(appContext, task.id)
                            AlarmScheduler.scheduleTaskEndCheckIn(appContext, task)
                        }

                        Log.i(TAG, "Domino reschedule complete. Updated ${tasksToUpdate.size} tasks.")
                    }
                    else -> {
                        Log.w(TAG, "Unknown action: ${intent.action}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error executing task action in background", e)
            } finally {
                // Inform the Android system that background work is complete
                pendingResult.finish()
            }
        }
    }
}
