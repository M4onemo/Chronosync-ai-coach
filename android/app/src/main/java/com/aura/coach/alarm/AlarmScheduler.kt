package com.aura.coach.alarm

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

        // On Android 12+ check exact alarm capability
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                Log.w(TAG, "Cannot schedule exact alarm: exact alarm permission not granted by user.")
                return
            }
        }

        val triggerDateTime = LocalDateTime.of(task.scheduledDate, task.endTime)
        val triggerEpochMillis = triggerDateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val currentMillis = System.currentTimeMillis()

        // If the task has already ended in the past, do not schedule an old alarm
        if (triggerEpochMillis <= currentMillis) {
            Log.d(TAG, "Skipping past alarm for task ${task.id} (${task.title}) at $triggerDateTime")
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
            Log.i(TAG, "Scheduled exact check-in alarm for '${task.title}' at $triggerDateTime (epoch: $triggerEpochMillis)")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException while scheduling exact alarm for task ${task.id}", e)
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
}
