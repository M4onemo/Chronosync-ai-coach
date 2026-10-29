package com.aura.coach.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
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

    @Query("""
        SELECT * FROM tasks 
        WHERE scheduledDate = :date AND status != 'COMPLETED' 
        ORDER BY startTime ASC
    """)
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
}
