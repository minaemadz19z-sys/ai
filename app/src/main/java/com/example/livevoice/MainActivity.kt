package com.example.livevoice

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.sp
import com.example.livevoice.ui.screens.AudioTranscriberScreen
import com.example.livevoice.ui.screens.ChatbotScreen
import com.example.livevoice.ui.screens.HistoryScreen
import com.example.livevoice.ui.screens.LiveVoiceScreen
import com.example.livevoice.ui.theme.DarkBackground
import com.example.livevoice.ui.theme.DarkSurface
import com.example.livevoice.ui.theme.LiveVoiceTheme
import com.example.livevoice.ui.theme.PrimaryIndigo
import com.example.livevoice.ui.theme.TextPrimary
import com.example.livevoice.ui.theme.TextSecondary
import com.example.livevoice.ui.viewmodel.ChatbotViewModel
import com.example.livevoice.ui.viewmodel.HistoryViewModel
import com.example.livevoice.ui.viewmodel.LiveVoiceViewModel
import com.example.livevoice.ui.viewmodel.TranscriberViewModel

class MainActivity : ComponentActivity() {

    private val liveVoiceViewModel: LiveVoiceViewModel by viewModels()
    private val chatbotViewModel: ChatbotViewModel by viewModels()
    private val transcriberViewModel: TranscriberViewModel by viewModels()
    private val historyViewModel: HistoryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            LiveVoiceTheme {
                MainAppShell(
                    liveVoiceViewModel = liveVoiceViewModel,
                    chatbotViewModel = chatbotViewModel,
                    transcriberViewModel = transcriberViewModel,
                    historyViewModel = historyViewModel
                )
            }
        }
    }
}

@Composable
fun MainAppShell(
    liveVoiceViewModel: LiveVoiceViewModel,
    chatbotViewModel: ChatbotViewModel,
    transcriberViewModel: TranscriberViewModel,
    historyViewModel: HistoryViewModel
) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    val navItems = listOf(
        NavigationItem("Live Voice", Icons.Default.Mic, "tab_live_voice"),
        NavigationItem("AI Chat", Icons.Default.ChatBubble, "tab_chat"),
        NavigationItem("Transcribe", Icons.Default.GraphicEq, "tab_transcribe"),
        NavigationItem("History", Icons.Default.History, "tab_history")
    )

    Scaffold(
        contentWindowInsets = WindowInsets.safeDrawing,
        containerColor = DarkBackground,
        bottomBar = {
            NavigationBar(
                containerColor = DarkSurface,
                modifier = Modifier.testTag("main_bottom_nav")
            ) {
                navItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label
                            )
                        },
                        label = {
                            Text(
                                text = item.label,
                                fontSize = 11.sp
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = TextPrimary,
                            selectedTextColor = TextPrimary,
                            indicatorColor = PrimaryIndigo,
                            unselectedIconColor = TextSecondary,
                            unselectedTextColor = TextSecondary
                        ),
                        modifier = Modifier.testTag(item.testTag)
                    )
                }
            }
        }
    ) { innerPadding ->
        val modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)

        when (selectedTab) {
            0 -> LiveVoiceScreen(viewModel = liveVoiceViewModel, modifier = modifier)
            1 -> ChatbotScreen(viewModel = chatbotViewModel, modifier = modifier)
            2 -> AudioTranscriberScreen(viewModel = transcriberViewModel, modifier = modifier)
            3 -> HistoryScreen(viewModel = historyViewModel, modifier = modifier)
        }
    }
}

data class NavigationItem(
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val testTag: String
)
