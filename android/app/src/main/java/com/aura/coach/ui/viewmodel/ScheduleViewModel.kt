package com.aura.coach.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aura.coach.data.local.entity.DailyReflectionEntity
import com.aura.coach.data.local.entity.FrictionReason
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.data.local.entity.TaskStatus
import com.aura.coach.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime

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

class ScheduleViewModel(
    private val repository: TaskRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScheduleUiState())
    val uiState: StateFlow<ScheduleUiState> = _uiState.asStateFlow()

    init {
        observeCurrentDateTasks()
        observeCurrentDateReflection()
    }

    private fun observeCurrentDateTasks() {
        viewModelScope.launch {
            _uiState.flatMapLatest { state ->
                repository.getTasksForDateFlow(state.selectedDate)
            }.collect { taskList ->
                _uiState.update { it.copy(tasks = taskList, isLoading = false) }
            }
        }
    }

    private fun observeCurrentDateReflection() {
        viewModelScope.launch {
            _uiState.flatMapLatest { state ->
                repository.getReflectionForDate(state.selectedDate)
            }.collect { reflectionEntity ->
                _uiState.update { it.copy(reflection = reflectionEntity) }
            }
        }
    }

    fun setSelectedDate(date: LocalDate) {
        _uiState.update { it.copy(selectedDate = date) }
    }

    fun markTaskCompleted(taskId: Long) {
        viewModelScope.launch {
            repository.completeTask(taskId)
        }
    }

    fun markTaskPending(taskId: Long) {
        viewModelScope.launch {
            val task = _uiState.value.tasks.find { it.id == taskId } ?: return@launch
            repository.updateTask(task.copy(status = TaskStatus.PENDING, completedAtTime = null))
        }
    }

    /**
     * Direct UI trigger for Domino Rescheduling (+30m push forward)
     */
    fun triggerDominoReschedule(taskId: Long, minutes: Long = 30L) {
        viewModelScope.launch {
            val shifted = repository.extendTaskAndDominoShift(taskId, minutes)
            _uiState.update { it.copy(lastDominoShiftCount = shifted.size) }
        }
    }

    fun openBedtimePlanner() {
        _uiState.update { it.copy(bedtimePlannerVisible = true, parsedPreviewTasks = emptyList(), errorMessage = null) }
    }

    fun closeBedtimePlanner() {
        _uiState.update { it.copy(bedtimePlannerVisible = false, parsedPreviewTasks = emptyList()) }
    }

    fun openEveningReview() {
        _uiState.update { it.copy(eveningReviewVisible = true) }
        runEveningDiagnostic()
    }

    fun closeEveningReview() {
        _uiState.update { it.copy(eveningReviewVisible = false) }
    }

    fun generateScheduleFromBrainDump(brainDump: String) {
        if (brainDump.isBlank()) return
        _uiState.update { it.copy(isGeneratingSchedule = true, errorMessage = null) }

        viewModelScope.launch {
            // Bedtime planning is targeted for tomorrow or selectedDate
            val targetDate = _uiState.value.selectedDate
            val result = repository.generateScheduleFromBrainDump(brainDump, targetDate)

            result.fold(
                onSuccess = { previewList ->
                    _uiState.update {
                        it.copy(
                            isGeneratingSchedule = false,
                            parsedPreviewTasks = previewList
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isGeneratingSchedule = false,
                            errorMessage = error.localizedMessage ?: "Failed to generate schedule"
                        )
                    }
                }
            )
        }
    }

    fun commitParsedSchedule() {
        val preview = _uiState.value.parsedPreviewTasks
        if (preview.isEmpty()) return

        viewModelScope.launch {
            val targetDate = _uiState.value.selectedDate
            repository.deleteScheduleForDate(targetDate)
            repository.insertTasks(preview)
            _uiState.update { it.copy(bedtimePlannerVisible = false, parsedPreviewTasks = emptyList()) }
        }
    }

    fun runEveningDiagnostic() {
        _uiState.update { it.copy(isAnalyzingFriction = true) }
        viewModelScope.launch {
            val result = repository.generateEveningReflection(_uiState.value.selectedDate)
            _uiState.update { it.copy(isAnalyzingFriction = false) }
        }
    }

    fun tagTaskFriction(taskId: Long, reason: FrictionReason) {
        viewModelScope.launch {
            repository.tagFrictionReason(taskId, reason)
            // Re-run diagnostic with updated tags
            runEveningDiagnostic()
        }
    }

    fun seedSampleDayIfEmpty() {
        viewModelScope.launch {
            val currentTasks = repository.getTasksForDate(_uiState.value.selectedDate)
            if (currentTasks.isEmpty()) {
                val today = _uiState.value.selectedDate
                val sample = listOf(
                    TaskEntity(
                        id = 0,
                        title = "Architecture Refactor & Review",
                        scheduledDate = today,
                        startTime = LocalTime.of(9, 0),
                        endTime = LocalTime.of(10, 30),
                        status = TaskStatus.COMPLETED,
                        category = "DEEP_WORK",
                        bufferMinutes = 15
                    ),
                    TaskEntity(
                        id = 0,
                        title = "Client Sync & API Contract Finalization",
                        scheduledDate = today,
                        startTime = LocalTime.of(10, 45),
                        endTime = LocalTime.of(11, 45),
                        status = TaskStatus.PENDING,
                        category = "MEETING",
                        bufferMinutes = 15
                    ),
                    TaskEntity(
                        id = 0,
                        title = "MediaPipe GenAI Model Pipeline Testing",
                        scheduledDate = today,
                        startTime = LocalTime.of(13, 0),
                        endTime = LocalTime.of(14, 30),
                        status = TaskStatus.PENDING,
                        category = "DEEP_WORK",
                        bufferMinutes = 30
                    ),
                    TaskEntity(
                        id = 0,
                        title = "Cardio Run & Core Recovery",
                        scheduledDate = today,
                        startTime = LocalTime.of(16, 0),
                        endTime = LocalTime.of(17, 0),
                        status = TaskStatus.PENDING,
                        category = "HEALTH",
                        bufferMinutes = 20
                    )
                )
                repository.insertTasks(sample)
            }
        }
    }

    class Factory(private val repository: TaskRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(ScheduleViewModel::class.java)) {
                return ScheduleViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
