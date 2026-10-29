package com.aura.coach.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.aura.coach.data.local.entity.DailyReflectionEntity
import com.aura.coach.data.local.entity.FrictionReason
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.data.local.entity.TaskStatus
import com.aura.coach.ui.theme.*

@Composable
fun EveningReviewDialog(
    tasks: List<TaskEntity>,
    reflection: DailyReflectionEntity?,
    isAnalyzing: Boolean,
    onDismiss: () -> Unit,
    onTagFriction: (taskId: Long, reason: FrictionReason) -> Unit,
    onRefreshDiagnostic: () -> Unit,
    modifier: Modifier = Modifier
) {
    val completedTasks = tasks.filter { it.status == TaskStatus.COMPLETED }
    val uncompletedTasks = tasks.filter { it.status != TaskStatus.COMPLETED }
    val completionRate = if (tasks.isNotEmpty()) (completedTasks.size.toFloat() / tasks.size.toFloat() * 100).toInt() else 0

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurface,
            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle)),
            modifier = modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.88f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Top header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = StatusCompletedGreen,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Evening Friction Reflection",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                        Text(
                            text = "Daily behavioral loop closure & diagnostic",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    // Score Card
                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = DarkBackground),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Execution Rate",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextTertiary
                                    )
                                    Text(
                                        text = "$completionRate%",
                                        style = MaterialTheme.typography.headlineLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = if (completionRate >= 75) StatusCompletedGreen else StatusRescheduledAmber
                                    )
                                    Text(
                                        text = "${completedTasks.size} done • ${uncompletedTasks.size} incomplete",
                                        fontSize = 12.sp,
                                        color = TextSecondary
                                    )
                                }

                                CircularProgressIndicator(
                                    progress = completionRate / 100f,
                                    strokeWidth = 6.dp,
                                    color = if (completionRate >= 75) StatusCompletedGreen else PrimaryIndigo,
                                    trackColor = DarkSurfaceElevated,
                                    modifier = Modifier.size(54.dp)
                                )
                            }
                        }
                    }

                    // Wins Summary
                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = StatusCompletedGreen.copy(alpha = 0.08f)),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(StatusCompletedGreen.copy(alpha = 0.25f))),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = StatusCompletedGreen,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "WINS SUMMARY",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = StatusCompletedGreen
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = reflection?.winsSummary
                                        ?: "Conquered your core blocks with high deliberate focus.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TextPrimary
                                )
                            }
                        }
                    }

                    // Uncompleted tasks friction tagging
                    if (uncompletedTasks.isNotEmpty()) {
                        item {
                            Text(
                                text = "TAG MISSED TASKS (FRICTION DIAGNOSTIC)",
                                style = MaterialTheme.typography.labelSmall,
                                color = StatusRescheduledAmber,
                                letterSpacing = 1.sp
                            )
                        }

                        items(uncompletedTasks, key = { it.id }) { task ->
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = DarkBackground),
                                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = task.title,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = "Scheduled: ${task.startTime} - ${task.endTime}",
                                        fontSize = 11.sp,
                                        color = TextTertiary
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    // Friction Category Chips
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        val frictionOptions = listOf(
                                            FrictionReason.LOW_ENERGY to "Low Energy",
                                            FrictionReason.DISTRACTION to "Distraction",
                                            FrictionReason.POOR_ESTIMATION to "Estimation",
                                            FrictionReason.EMERGENCY to "Emergency"
                                        )

                                        for ((reason, label) in frictionOptions) {
                                            val isSelected = task.frictionReason == reason
                                            FilterChip(
                                                selected = isSelected,
                                                onClick = { onTagFriction(task.id, reason) },
                                                label = { Text(label, fontSize = 10.sp) },
                                                colors = FilterChipDefaults.filterChipColors(
                                                    selectedContainerColor = StatusRescheduledAmber.copy(alpha = 0.25f),
                                                    selectedLabelColor = StatusRescheduledAmber,
                                                    containerColor = DarkSurfaceElevated,
                                                    labelColor = TextSecondary
                                                ),
                                                border = FilterChipDefaults.filterChipBorder(
                                                    borderColor = if (isSelected) StatusRescheduledAmber else BorderSubtle,
                                                    borderWidth = 1.dp
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Actionable Tip For Tomorrow
                    item {
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = PrimaryIndigo.copy(alpha = 0.12f)),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(PrimaryLight.copy(alpha = 0.3f))),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Lightbulb,
                                        contentDescription = null,
                                        tint = PrimaryLight,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "1 CONCRETE TIP FOR TOMORROW",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryLight
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = reflection?.actionableTip
                                        ?: "Cap deep cognitive sessions at 75 minutes and insert a mandatory walk at 14:00.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextPrimary
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onRefreshDiagnostic,
                        enabled = !isAnalyzing,
                        modifier = Modifier.weight(1f),
                        border = ButtonDefaults.outlinedButtonBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle))
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Re-diagnose", color = TextSecondary)
                    }

                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                        modifier = Modifier.weight(1.5f)
                    ) {
                        Text("Close Reflection")
                    }
                }
            }
        }
    }
}
