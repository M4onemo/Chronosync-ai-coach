package com.aura.coach.data.repository

import com.aura.coach.data.local.entity.DailyReflectionEntity
import com.aura.coach.data.local.entity.FrictionReason
import com.aura.coach.data.local.entity.TaskEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

interface TaskRepository {
    fun getTasksForDateFlow(date: LocalDate): Flow<List<TaskEntity>>
    suspend fun getTasksForDate(date: LocalDate): List<TaskEntity>
    suspend fun insertTasks(tasks: List<TaskEntity>)
    suspend fun updateTask(task: TaskEntity)
    suspend fun completeTask(taskId: Long)
    suspend fun extendTaskAndDominoShift(taskId: Long, shiftMinutes: Long = 30L): List<TaskEntity>
    suspend fun tagFrictionReason(taskId: Long, reason: FrictionReason)
    suspend fun generateScheduleFromBrainDump(brainDump: String, targetDate: LocalDate): Result<List<TaskEntity>>
    suspend fun generateEveningReflection(date: LocalDate): Result<DailyReflectionEntity>
    fun getReflectionForDate(date: LocalDate): Flow<DailyReflectionEntity?>
    suspend fun deleteScheduleForDate(date: LocalDate)
}
