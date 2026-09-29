package com.example.livevoice.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.livevoice.data.model.VoiceState
import com.example.livevoice.ui.theme.AccentCyan
import com.example.livevoice.ui.theme.AccentEmerald
import com.example.livevoice.ui.theme.DarkSurfaceCard
import com.example.livevoice.ui.theme.OrbGradientEnd
import com.example.livevoice.ui.theme.OrbGradientMiddle
import com.example.livevoice.ui.theme.OrbGradientStart
import com.example.livevoice.ui.theme.PrimaryIndigo
import com.example.livevoice.ui.theme.SecondaryViolet
import com.example.livevoice.ui.theme.TextPrimary
import com.example.livevoice.ui.theme.TextSecondary
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun VoiceVisualizerComposable(
    voiceState: VoiceState,
    amplitude: Float,
    selectedVoiceName: String,
    sessionDurationSeconds: Long,
    onOrbClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "orb_pulse")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    val waveRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing)
        ),
        label = "wave_rotation"
    )

    val activeColor = when (voiceState) {
        VoiceState.SPEAKING -> SecondaryViolet
        VoiceState.LISTENING -> AccentCyan
        VoiceState.CONNECTING -> PrimaryIndigo
        VoiceState.DISCONNECTED -> Color(0xFF475569)
        VoiceState.ERROR -> Color(0xFFEF4444)
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Status Badge
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = DarkSurfaceCard.copy(alpha = 0.85f),
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(
                            if (voiceState == VoiceState.DISCONNECTED) Color.Gray
                            else AccentEmerald
                        )
                )
                Spacer(modifier = Modifier.size(8.dp))
                Text(
                    text = when (voiceState) {
                        VoiceState.SPEAKING -> "$selectedVoiceName Speaking…"
                        VoiceState.LISTENING -> "Listening to you…"
                        VoiceState.CONNECTING -> "Connecting to Live AI…"
                        VoiceState.DISCONNECTED -> "Tap Orb to Start Call"
                        VoiceState.ERROR -> "Connection Interrupted"
                    },
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                if (voiceState != VoiceState.DISCONNECTED && voiceState != VoiceState.CONNECTING) {
                    Spacer(modifier = Modifier.size(10.dp))
                    Text(
                        text = formatTime(sessionDurationSeconds),
                        color = AccentCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // Orb Canvas
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(240.dp)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onOrbClick
                )
                .testTag("visualizer_orb")
        ) {
            // Background blur glow
            Box(
                modifier = Modifier
                    .size(170.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            listOf(activeColor.copy(alpha = 0.35f), Color.Transparent)
                        )
                    )
                    .blur(20.dp)
            )

            // Dynamic Canvas Waves
            Canvas(modifier = Modifier.fillMaxSize()) {
                val centerOffset = Offset(size.width / 2f, size.height / 2f)
                val baseRadius = size.width * 0.30f
                val dynamicBoost = amplitude.coerceIn(0f, 1f) * 35f

                // Outer Ripple Wave
                if (voiceState == VoiceState.SPEAKING || voiceState == VoiceState.LISTENING) {
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color.Transparent, activeColor.copy(alpha = 0.22f)),
                            center = centerOffset,
                            radius = (baseRadius * 1.4f + dynamicBoost)
                        ),
                        radius = (baseRadius * 1.35f + dynamicBoost),
                        center = centerOffset,
                        style = Stroke(width = 2.dp.toPx())
                    )

                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color.Transparent, activeColor.copy(alpha = 0.35f)),
                            center = centerOffset,
                            radius = (baseRadius * 1.18f + dynamicBoost * 0.6f)
                        ),
                        radius = (baseRadius * 1.15f + dynamicBoost * 0.6f),
                        center = centerOffset,
                        style = Stroke(width = 3.dp.toPx())
                    )
                }

                // Core Pulsing Orb
                val currentRadius = (baseRadius * pulseScale + dynamicBoost).coerceAtMost(size.width * 0.45f)
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = when (voiceState) {
                            VoiceState.SPEAKING -> listOf(OrbGradientEnd, OrbGradientMiddle, OrbGradientStart)
                            VoiceState.LISTENING -> listOf(AccentCyan, PrimaryIndigo, Color(0xFF0F172A))
                            VoiceState.CONNECTING -> listOf(PrimaryIndigo, SecondaryViolet, Color(0xFF0F172A))
                            VoiceState.DISCONNECTED -> listOf(Color(0xFF334155), Color(0xFF1E293B), Color(0xFF090D16))
                            VoiceState.ERROR -> listOf(Color(0xFFEF4444), Color(0xFF991B1B), Color(0xFF090D16))
                        },
                        center = centerOffset,
                        radius = currentRadius
                    ),
                    radius = currentRadius,
                    center = centerOffset
                )

                // High-tech subtle orbital particles
                if (voiceState != VoiceState.DISCONNECTED) {
                    val angleRad = Math.toRadians(waveRotation.toDouble())
                    val particleX = centerOffset.x + (currentRadius + 14.dp.toPx()) * cos(angleRad).toFloat()
                    val particleY = centerOffset.y + (currentRadius + 14.dp.toPx()) * sin(angleRad).toFloat()
                    drawCircle(
                        color = AccentCyan.copy(alpha = 0.8f),
                        radius = 4.dp.toPx(),
                        center = Offset(particleX, particleY)
                    )
                }
            }

            // Center Icon inside Orb
            Icon(
                imageVector = when (voiceState) {
                    VoiceState.SPEAKING -> Icons.Default.RecordVoiceOver
                    VoiceState.LISTENING -> Icons.Default.Mic
                    VoiceState.CONNECTING -> Icons.Default.GraphicEq
                    VoiceState.DISCONNECTED -> Icons.Default.Mic
                    VoiceState.ERROR -> Icons.Default.VolumeUp
                },
                contentDescription = "Voice State Icon",
                tint = TextPrimary,
                modifier = Modifier.size(46.dp)
            )
        }

        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = if (voiceState == VoiceState.DISCONNECTED) "Ready to talk with Alex • English Culture & Daily Practice"
            else "Hands-free voice active. Speak naturally at any time.",
            color = TextSecondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Normal
        )
    }
}

private fun formatTime(totalSeconds: Long): String {
    val m = totalSeconds / 60
    val s = totalSeconds % 60
    return String.format("%02d:%02d", m, s)
}
