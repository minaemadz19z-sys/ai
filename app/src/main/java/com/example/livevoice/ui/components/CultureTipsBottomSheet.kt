package com.example.livevoice.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.livevoice.data.model.AMERICAN_CULTURE_TIPS
import com.example.livevoice.data.model.CultureTip
import com.example.livevoice.ui.theme.AccentCyan
import com.example.livevoice.ui.theme.DarkBorder
import com.example.livevoice.ui.theme.DarkSurface
import com.example.livevoice.ui.theme.DarkSurfaceCard
import com.example.livevoice.ui.theme.DarkSurfaceCardElevated
import com.example.livevoice.ui.theme.PrimaryIndigo
import com.example.livevoice.ui.theme.SecondaryViolet
import com.example.livevoice.ui.theme.TextPrimary
import com.example.livevoice.ui.theme.TextSecondary
import com.example.livevoice.ui.theme.TextTertiary

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CultureTipsBottomSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onPracticeTopic: (CultureTip) -> Unit
) {
    var selectedCategory by remember { mutableStateOf("all") }
    var activeTipId by remember { mutableStateOf(AMERICAN_CULTURE_TIPS[0].id) }

    val categories = listOf(
        "all" to "All Tips",
        "slang" to "Slang & Idioms",
        "culture" to "Everyday Etiquette",
        "conversational" to "Natural Flow",
        "session30" to "30-Min Immersion"
    )

    val filteredTips = remember(selectedCategory) {
        if (selectedCategory == "all") AMERICAN_CULTURE_TIPS
        else AMERICAN_CULTURE_TIPS.filter { it.category == selectedCategory }
    }

    val activeTip = remember(activeTipId, filteredTips) {
        AMERICAN_CULTURE_TIPS.find { it.id == activeTipId } ?: filteredTips.firstOrNull() ?: AMERICAN_CULTURE_TIPS[0]
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = DarkSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .background(PrimaryIndigo.copy(alpha = 0.2f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lightbulb,
                            contentDescription = null,
                            tint = AccentCyan,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "American Culture & Slang Tips",
                            color = TextPrimary,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Curated daily insights by Alex for conversational fluency",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }

                IconButton(
                    onClick = {
                        val currentIdx = filteredTips.indexOfFirst { it.id == activeTip.id }
                        val nextIdx = (currentIdx + 1) % filteredTips.size
                        activeTipId = filteredTips[nextIdx].id
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Shuffle,
                        contentDescription = "Shuffle Tip",
                        tint = AccentCyan
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Category Filter Chips
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                categories.forEach { (catId, label) ->
                    FilterChip(
                        selected = selectedCategory == catId,
                        onClick = {
                            selectedCategory = catId
                            val list = if (catId == "all") AMERICAN_CULTURE_TIPS else AMERICAN_CULTURE_TIPS.filter { it.category == catId }
                            if (list.isNotEmpty()) activeTipId = list[0].id
                        },
                        label = { Text(text = label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryIndigo,
                            selectedLabelColor = TextPrimary,
                            containerColor = DarkSurfaceCard,
                            labelColor = TextSecondary
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            borderColor = DarkBorder,
                            enabled = true,
                            selected = selectedCategory == catId
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Active Featured Tip Card
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceCardElevated),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = PrimaryIndigo.copy(alpha = 0.25f)
                        ) {
                            Text(
                                text = activeTip.categoryLabel,
                                color = AccentCyan,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                        Text(
                            text = "Daily Culture Insight",
                            color = TextTertiary,
                            fontSize = 11.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = activeTip.title,
                        color = TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = activeTip.tip,
                        color = TextSecondary,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Real-World Example
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = DarkSurface,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = "REAL-WORLD US EXAMPLE:",
                                color = AccentCyan,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = activeTip.example,
                                color = TextPrimary,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = {
                            onPracticeTopic(activeTip)
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("practice_topic_button")
                    ) {
                        Text("Practice this topic with Alex", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "MORE DAILY TOPICS",
                color = TextTertiary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(filteredTips) { tip ->
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (tip.id == activeTip.id) PrimaryIndigo.copy(alpha = 0.2f) else DarkSurfaceCard,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { activeTipId = tip.id }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                        ) {
                            Text(
                                text = "• ${tip.title}",
                                color = if (tip.id == activeTip.id) AccentCyan else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = if (tip.id == activeTip.id) FontWeight.SemiBold else FontWeight.Normal,
                                maxLines = 1,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}
