package com.aura.coach.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.FastForward
import androidx.compose.material.icons.filled.HourglassBottom
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.MoreTime
import androidx.compose.material.icons.filled.NightlightRound
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.data.local.entity.TaskStatus
import com.aura.coach.ui.theme.*
import com.aura.coach.ui.viewmodel.ScheduleUiState
import com.aura.coach.ui.viewmodel.ScheduleViewModel
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScheduleScreen(
    viewModel: ScheduleViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val completedCount = uiState.tasks.count { it.status == TaskStatus.COMPLETED }
    val totalCount = uiState.tasks.size
    val completionPercentage = if (totalCount > 0) (completedCount.toFloat() / totalCount.toFloat()) else 0f

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Aura",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = "OFFLINE AI",
                                    color = PrimaryLight,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = uiState.selectedDate.format(DateTimeFormatter.ofPattern("EEEE, MMM d")),
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.openEveningReview() }) {
                        Icon(
                            imageVector = Icons.Default.Insights,
                            contentDescription = "Evening Review",
                            tint = AccentCyan
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { viewModel.openBedtimePlanner() },
                icon = { Icon(Icons.Default.NightlightRound, contentDescription = null) },
                text = { Text("Bedtime Brain Dump") },
                containerColor = PrimaryIndigo,
                contentColor = Color.White
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            // Execution Stats & Progress Banner
            ExecutionSummaryBanner(
                completed = completedCount,
                total = totalCount,
                progress = completionPercentage
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Domino Cascade Alert (if recently triggered)
            uiState.lastDominoShiftCount?.let { count ->
                DominoRescheduleAlert(
                    shiftedCount = count,
                    onDismiss = { /* auto-clears on state */ }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Timeline header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TODAY'S TIMETABLE",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextTertiary,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "${uiState.tasks.size} blocks",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextTertiary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (uiState.tasks.isEmpty()) {
                EmptyScheduleView(
                    onSeedSample = { viewModel.seedSampleDayIfEmpty() },
                    onOpenPlanner = { viewModel.openBedtimePlanner() }
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(uiState.tasks, key = { it.id }) { task ->
                        TimelineTaskCard(
                            task = task,
                            onToggleComplete = {
                                if (task.status == TaskStatus.COMPLETED) {
                                    viewModel.markTaskPending(task.id)
                                } else {
                                    viewModel.markTaskCompleted(task.id)
                                }
                            },
                            onDominoExtend = {
                                viewModel.triggerDominoReschedule(task.id, 30L)
                            }
                        )
                    }
                }
            }
        }
    }

    // Bedtime Brain Dump Bottom Sheet
    if (uiState.bedtimePlannerVisible) {
        BedtimePlannerBottomSheet(
            isGenerating = uiState.isGeneratingSchedule,
            parsedPreview = uiState.parsedPreviewTasks,
            errorMessage = uiState.errorMessage,
            onDismiss = { viewModel.closeBedtimePlanner() },
            onSubmitBrainDump = { dump -> viewModel.generateScheduleFromBrainDump(dump) },
            onCommitSchedule = { viewModel.commitParsedSchedule() }
        )
    }

    // Evening Reflection & Friction Diagnostic Dialog
    if (uiState.eveningReviewVisible) {
        EveningReviewDialog(
            tasks = uiState.tasks,
            reflection = uiState.reflection,
            isAnalyzing = uiState.isAnalyzingFriction,
            onDismiss = { viewModel.closeEveningReview() },
            onTagFriction = { taskId, reason -> viewModel.tagTaskFriction(taskId, reason) },
            onRefreshDiagnostic = { viewModel.runEveningDiagnostic() }
        )
    }
}

@Composable
fun ExecutionSummaryBanner(
    completed: Int,
    total: Int,
    progress: Float,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle)),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Daily Discipline Score",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "$completed of $total blocks completed",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                Surface(
                    color = if (progress >= 0.75f) StatusCompletedGreen.copy(alpha = 0.2f) else DarkSurfaceElevated,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = "${(progress * 100).toInt()}%",
                        color = if (progress >= 0.75f) StatusCompletedGreen else PrimaryLight,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            LinearProgressIndicator(
                progress = progress,
                color = if (progress >= 0.8f) StatusCompletedGreen else PrimaryIndigo,
                trackColor = DarkSurfaceElevated,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(CircleShape)
            )
        }
    }
}

@Composable
fun DominoRescheduleAlert(
    shiftedCount: Int,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = StatusRescheduledAmber.copy(alpha = 0.15f)),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(StatusRescheduledAmber.copy(alpha = 0.4f))),
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.FastForward,
                contentDescription = null,
                tint = StatusRescheduledAmber
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Domino Rescheduling Applied",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = StatusRescheduledAmber
                )
                Text(
                    text = "Pushed $shiftedCount tasks forward by 30 mins. Future alarms recalibrated.",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
fun TimelineTaskCard(
    task: TaskEntity,
    onToggleComplete: () -> Unit,
    onDominoExtend: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isCompleted = task.status == TaskStatus.COMPLETED
    val isRescheduled = task.status == TaskStatus.RESCHEDULED

    val borderColor by animateColorAsState(
        targetValue = when {
            isCompleted -> StatusCompletedGreen.copy(alpha = 0.5f)
            isRescheduled -> StatusRescheduledAmber.copy(alpha = 0.5f)
            task.status == TaskStatus.FAILED -> StatusFailedRed.copy(alpha = 0.5f)
            else -> BorderSubtle
        },
        label = "borderColor"
    )

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isCompleted) DarkSurfaceVariant.copy(alpha = 0.6f) else DarkSurface
        ),
        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(borderColor)),
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Interactive Checkbox / Status Indicator
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(
                        if (isCompleted) StatusCompletedGreen else Color.Transparent
                    )
                    .border(
                        width = 2.dp,
                        color = if (isCompleted) StatusCompletedGreen else TextTertiary,
                        shape = CircleShape
                    )
                    .clickable { onToggleComplete() },
                contentAlignment = Alignment.Center
            ) {
                if (isCompleted) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Completed",
                        tint = Color.Black,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Details
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Time Range
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "${task.startTime} - ${task.endTime}",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = if (isCompleted) TextTertiary else PrimaryLight
                        )

                        if (isRescheduled) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Surface(
                                color = StatusRescheduledAmber.copy(alpha = 0.18f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "+30m Domino",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = StatusRescheduledAmber,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                    }

                    // Category Pill
                    Surface(
                        color = DarkSurfaceElevated,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = task.category,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = TextSecondary,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isCompleted) TextTertiary else TextPrimary,
                    textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None
                )

                if (task.bufferMinutes > 0 && !isCompleted) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Includes ${task.bufferMinutes}m buffer before next block",
                        fontSize = 11.sp,
                        color = TextTertiary
                    )
                }
            }

            // Quick "+30m Snooze" button (active if not completed)
            if (!isCompleted) {
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(
                    onClick = onDominoExtend,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(DarkSurfaceElevated)
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreTime,
                        contentDescription = "Extend +30m and ripple schedule",
                        tint = StatusRescheduledAmber,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyScheduleView(
    onSeedSample: () -> Unit,
    onOpenPlanner: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(vertical = 40.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp)
        ) {
            Icon(
                imageVector = Icons.Default.NightlightRound,
                contentDescription = null,
                tint = PrimaryIndigo,
                modifier = Modifier.size(56.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "No Schedule for Today",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Dump your unstructured thoughts before bed. On-device AI parses it into an exact timetable with buffers and actionable alarms.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = onOpenPlanner,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Start Bedtime Brain Dump")
            }
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedButton(
                onClick = onSeedSample,
                border = ButtonDefaults.outlinedButtonBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle))
            ) {
                Text("Load Sample Timetable", color = TextSecondary)
            }
        }
    }
}
