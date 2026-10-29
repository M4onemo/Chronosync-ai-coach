package com.aura.coach.data.local

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
    fun fromLocalDate(value: LocalDate?): String? {
        return value?.format(dateFormatter)
    }

    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? {
        return value?.let { LocalDate.parse(it, dateFormatter) }
    }

    @TypeConverter
    fun fromLocalTime(value: LocalTime?): String? {
        return value?.format(timeFormatter)
    }

    @TypeConverter
    fun toLocalTime(value: String?): LocalTime? {
        return value?.let { LocalTime.parse(it, timeFormatter) }
    }

    @TypeConverter
    fun fromTaskStatus(value: TaskStatus?): String? {
        return value?.name
    }

    @TypeConverter
    fun toTaskStatus(value: String?): TaskStatus? {
        return value?.let { TaskStatus.valueOf(it) }
    }

    @TypeConverter
    fun fromFrictionReason(value: FrictionReason?): String? {
        return value?.name
    }

    @TypeConverter
    fun toFrictionReason(value: String?): FrictionReason? {
        return value?.let { FrictionReason.valueOf(it) }
    }
}
