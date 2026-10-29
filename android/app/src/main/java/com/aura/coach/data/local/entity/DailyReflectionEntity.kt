package com.aura.coach.data.local.entity

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
)
