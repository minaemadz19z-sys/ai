package com.example.livevoice.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.livevoice.data.model.VoiceState
import com.example.livevoice.ui.components.CultureTipsBottomSheet
import com.example.livevoice.ui.components.LiveTranscriptView
import com.example.livevoice.ui.components.UserMemoryDialog
import com.example.livevoice.ui.components.VoiceSettingsBottomSheet
import com.example.livevoice.ui.components.VoiceVisualizerComposable
import com.example.livevoice.ui.theme.AccentCyan
import com.example.livevoice.ui.theme.AccentEmerald
import com.example.livevoice.ui.theme.AccentRose
import com.example.livevoice.ui.theme.DarkBackground
import com.example.livevoice.ui.theme.DarkBorder
import com.example.livevoice.ui.theme.DarkSurface
import com.example.livevoice.ui.theme.DarkSurfaceCard
import com.example.livevoice.ui.theme.PrimaryIndigo
import com.example.livevoice.ui.theme.SecondaryViolet
import com.example.livevoice.ui.theme.TextPrimary
import com.example.livevoice.ui.theme.TextSecondary
import com.example.livevoice.ui.viewmodel.LiveVoiceViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveVoiceScreen(
    viewModel: LiveVoiceViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    val voiceState by viewModel.voiceState.collectAsStateWithLifecycle()
    val isMuted by viewModel.isMuted.collectAsStateWithLifecycle()
    val selectedVoiceId by viewModel.selectedVoiceId.collectAsStateWithLifecycle()
    val selectedPersonaId by viewModel.selectedPersonaId.collectAsStateWithLifecycle()
    val systemPrompt by viewModel.systemPrompt.collectAsStateWithLifecycle()
    val selectedModel by viewModel.selectedModel.collectAsStateWithLifecycle()
    val transcriptTurns by viewModel.transcriptTurns.collectAsStateWithLifecycle()
    val userMemory by viewModel.userMemory.collectAsStateWithLifecycle()
    val sessionDuration by viewModel.sessionDurationSeconds.collectAsStateWithLifecycle()
    val amplitude by viewModel.audioAmplitude.collectAsStateWithLifecycle()
    val errorMessage by viewModel.errorMessage.collectAsStateWithLifecycle()

    var showSettingsSheet by remember { mutableStateOf(false) }
    var showTipsSheet by remember { mutableStateOf(false) }
    var showMemoryDialog by remember { mutableStateOf(false) }

    val settingsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val tipsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Permission Launcher for Record Audio
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.startSession()
        } else {
            Toast.makeText(context, "Microphone permission is required for live voice conversations", Toast.LENGTH_LONG).show()
        }
    }

    val requestMicAndStart: () -> Unit = {
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            viewModel.startSession()
        } else {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Top Bar
        Surface(
            color = DarkSurface,
            shadowElevation = 4.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "LiveVoice AI",
                            color = TextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = PrimaryIndigo.copy(alpha = 0.2f)
                        ) {
                            Text(
                                text = "Alex 20s",
                                color = AccentCyan,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = "Real-time English & American Culture Immersion",
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Culture Tips quick icon
                    IconButton(
                        onClick = { showTipsSheet = true },
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("open_culture_tips")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lightbulb,
                            contentDescription = "Culture Tips",
                            tint = AccentCyan,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // User Memory Dossier icon
                    IconButton(
                        onClick = { showMemoryDialog = true },
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("open_memory_dossier")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Psychology,
                            contentDescription = "User Memory Dossier",
                            tint = AccentEmerald,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Settings icon
                    IconButton(
                        onClick = { showSettingsSheet = true },
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("open_voice_settings")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Voice Settings",
                            tint = TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        // Error message banner if any
        if (errorMessage != null) {
            Surface(
                color = AccentRose.copy(alpha = 0.15f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = errorMessage ?: "",
                    color = AccentRose,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
        }

        // Voice Visualizer Section
        VoiceVisualizerComposable(
            voiceState = voiceState,
            amplitude = amplitude,
            selectedVoiceName = selectedVoiceId,
            sessionDurationSeconds = sessionDuration,
            onOrbClick = {
                if (voiceState == VoiceState.DISCONNECTED) {
                    requestMicAndStart()
                } else {
                    viewModel.endSession()
                }
            },
            modifier = Modifier.weight(0.48f)
        )

        // Live Captions & Transcript Section
        Surface(
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = DarkSurface,
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.52f)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Transcript sub-header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "LIVE TRANSCRIPT",
                        color = TextTertiary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (transcriptTurns.isNotEmpty()) {
                        IconButton(
                            onClick = { viewModel.clearTranscript() },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.DeleteSweep,
                                contentDescription = "Clear transcript",
                                tint = TextTertiary,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }

                // Scrollable Live Transcript Turns
                LiveTranscriptView(
                    turns = transcriptTurns,
                    modifier = Modifier.weight(1f)
                )

                // Bottom Control Action Bar
                Surface(
                    color = DarkSurfaceCard,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // Mute / Unmute Button
                        FilledTonalButton(
                            onClick = { viewModel.toggleMute() },
                            enabled = voiceState != VoiceState.DISCONNECTED,
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = if (isMuted) AccentRose.copy(alpha = 0.2f) else DarkBackground,
                                contentColor = if (isMuted) AccentRose else TextSecondary
                            ),
                            shape = CircleShape,
                            modifier = Modifier
                                .size(50.dp)
                                .testTag("mute_toggle_button")
                        ) {
                            Icon(
                                imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                                contentDescription = if (isMuted) "Unmute" else "Mute",
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        // Big Primary Start/End Call Button
                        Button(
                            onClick = {
                                if (voiceState == VoiceState.DISCONNECTED) {
                                    requestMicAndStart()
                                } else {
                                    viewModel.endSession()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (voiceState == VoiceState.DISCONNECTED) AccentEmerald else AccentRose
                            ),
                            shape = RoundedCornerShape(28.dp),
                            modifier = Modifier
                                .height(56.dp)
                                .padding(horizontal = 12.dp)
                                .testTag("session_toggle_button")
                        ) {
                            Icon(
                                imageVector = if (voiceState == VoiceState.DISCONNECTED) Icons.Default.Phone else Icons.Default.CallEnd,
                                contentDescription = null,
                                tint = TextPrimary,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = if (voiceState == VoiceState.DISCONNECTED) "Start Live Call" else "End Call",
                                color = TextPrimary,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Interrupt / Barge-In Button
                        FilledTonalButton(
                            onClick = { viewModel.interrupt() },
                            enabled = voiceState == VoiceState.SPEAKING,
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = if (voiceState == VoiceState.SPEAKING) SecondaryViolet.copy(alpha = 0.3f) else DarkBackground,
                                contentColor = if (voiceState == VoiceState.SPEAKING) AccentCyan else TextTertiary
                            ),
                            shape = CircleShape,
                            modifier = Modifier
                                .size(50.dp)
                                .testTag("interrupt_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Stop,
                                contentDescription = "Interrupt",
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
            }
        }
    }

    // Settings Bottom Sheet
    if (showSettingsSheet) {
        VoiceSettingsBottomSheet(
            sheetState = settingsSheetState,
            selectedVoiceId = selectedVoiceId,
            onSelectVoice = { viewModel.selectVoice(it) },
            selectedPersonaId = selectedPersonaId,
            onSelectPersona = { id, instr -> viewModel.selectPersona(id, instr) },
            systemPrompt = systemPrompt,
            onSystemPromptChange = { viewModel.updateSystemPrompt(it) },
            selectedModel = selectedModel,
            onSelectModel = { viewModel.selectModel(it) },
            onDismiss = { showSettingsSheet = false }
        )
    }

    // Culture Tips Bottom Sheet
    if (showTipsSheet) {
        CultureTipsBottomSheet(
            sheetState = tipsSheetState,
            onDismiss = { showTipsSheet = false },
            onPracticeTopic = { tip ->
                viewModel.practiceTopic(tip)
            }
        )
    }

    // User Knowledge Dossier Dialog
    if (showMemoryDialog) {
        UserMemoryDialog(
            memory = userMemory,
            onSaveMemory = { updated ->
                viewModel.saveUserMemory(updated)
            },
            onDismiss = { showMemoryDialog = false }
        )
    }
}
