package com.aura.coach.data.local.entity

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
)
