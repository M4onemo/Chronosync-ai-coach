package com.aura.coach.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.coach.data.local.entity.TaskEntity
import com.aura.coach.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BedtimePlannerBottomSheet(
    isGenerating: Boolean,
    parsedPreview: List<TaskEntity>,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onSubmitBrainDump: (String) -> Unit,
    onCommitSchedule: () -> Unit,
    modifier: Modifier = Modifier
) {
    var brainDumpText by remember {
        mutableStateOf(
            "Need to review Android Room migrations first thing at 9am. Client sync on API contracts at 11am. Gym session at 4pm for 1 hour. Finish PR review before dinner."
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        dragHandle = { BottomSheetDefaults.DragHandle(color = TextTertiary) },
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 36.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = PrimaryLight,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Bedtime Brain Dump",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }
                    Text(
                        text = "Local MediaPipe GenAI extracts blocks & inserts buffers",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (parsedPreview.isEmpty()) {
                // Freeform Input Form
                OutlinedTextField(
                    value = brainDumpText,
                    onValueChange = { brainDumpText = it },
                    placeholder = {
                        Text(
                            text = "What is swirling in your mind for tomorrow? Voice or type everything freely: meetings, chores, workouts, deep work...",
                            color = TextTertiary
                        )
                    },
                    minLines = 4,
                    maxLines = 8,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryIndigo,
                        unfocusedBorderColor = BorderSubtle,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = DarkBackground,
                        unfocusedContainerColor = DarkBackground
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Suggestion chips
                Text(
                    text = "Quick templates:",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextTertiary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    SuggestionChip(
                        onClick = {
                            brainDumpText = "Morning deep work sprint 9-11am. Standup at 11:15am. Refactor database room DAO in afternoon. 30min walk at 5pm."
                        },
                        label = { Text("Engineering Sprint", fontSize = 11.sp) },
                        colors = SuggestionChipDefaults.suggestionChipColors(
                            containerColor = DarkSurfaceElevated,
                            labelColor = TextSecondary
                        ),
                        border = SuggestionChipDefaults.suggestionChipBorder(
                            borderColor = BorderSubtle,
                            borderWidth = 1.dp
                        )
                    )
                    SuggestionChip(
                        onClick = {
                            brainDumpText = "Executive review 10am. Pitch deck polish. Cardio at gym 2pm. Read 2 chapters in evening."
                        },
                        label = { Text("High Leverage Day", fontSize = 11.sp) },
                        colors = SuggestionChipDefaults.suggestionChipColors(
                            containerColor = DarkSurfaceElevated,
                            labelColor = TextSecondary
                        ),
                        border = SuggestionChipDefaults.suggestionChipBorder(
                            borderColor = BorderSubtle,
                            borderWidth = 1.dp
                        )
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                if (errorMessage != null) {
                    Text(
                        text = errorMessage,
                        color = StatusFailedRed,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }

                Button(
                    onClick = { onSubmitBrainDump(brainDumpText) },
                    enabled = !isGenerating && brainDumpText.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (isGenerating) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("On-Device LLM Parsing...")
                    } else {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Build Timetable & Alarms", fontWeight = FontWeight.SemiBold)
                    }
                }
            } else {
                // AI Preview & Review Screen
                Text(
                    text = "AI GENERATED TIMETABLE PREVIEW",
                    style = MaterialTheme.typography.labelSmall,
                    color = AccentCyan,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f, fill = false)
                ) {
                    items(parsedPreview) { previewItem ->
                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = DarkBackground),
                            border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = previewItem.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "${previewItem.startTime} - ${previewItem.endTime} (+${previewItem.bufferMinutes}m buffer)",
                                        fontSize = 12.sp,
                                        color = TextSecondary
                                    )
                                }
                                Surface(
                                    color = DarkSurfaceElevated,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = previewItem.category,
                                        fontSize = 10.sp,
                                        color = PrimaryLight,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { onSubmitBrainDump(brainDumpText) },
                        modifier = Modifier.weight(1f),
                        border = ButtonDefaults.outlinedButtonBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(BorderSubtle))
                    ) {
                        Text("Re-parse", color = TextSecondary)
                    }

                    Button(
                        onClick = onCommitSchedule,
                        colors = ButtonDefaults.buttonColors(containerColor = StatusCompletedGreen),
                        modifier = Modifier.weight(2f)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.Black)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Commit to Timetable", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
