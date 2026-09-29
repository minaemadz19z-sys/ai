package com.example.livevoice.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.livevoice.data.api.GeminiClient
import com.example.livevoice.data.model.ChatMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ChatbotViewModel : ViewModel() {

    private val _messages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                role = "model",
                content = "Hey! I'm your Gemini AI companion. Ask me anything about American culture, practice conversation, or brainstorm ideas!"
            )
        )
    )
    val messages = _messages.asStateFlow()

    private val _selectedModel = MutableStateFlow("gemini-3.5-flash")
    val selectedModel = _selectedModel.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage = _errorMessage.asStateFlow()

    val starterPrompts = listOf(
        "Explain the difference between \"I'm down\" and \"I'm up for it\"",
        "Simulate an American job interview for a junior engineer",
        "Give me a 5-minute cultural etiquette quiz on US dining and tipping",
        "How do Americans handle awkward elevator or hallway small talk?"
    )

    fun setModel(model: String) {
        _selectedModel.value = model
    }

    fun sendMessage(userText: String) {
        if (userText.isBlank() || _isLoading.value) return

        val userMsg = ChatMessage(role = "user", content = userText)
        _messages.value = _messages.value + userMsg
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            val pairs = _messages.value.map { it.role to it.content }
            val result = GeminiClient.sendChatMessage(
                messages = pairs,
                modelName = _selectedModel.value,
                systemInstruction = "You are an articulate, friendly, and culturally insightful conversational assistant. Provide clear, expressive explanations with practical American idioms and real-life examples."
            )

            _isLoading.value = false
            result.onSuccess { reply ->
                val modelMsg = ChatMessage(role = "model", content = reply)
                _messages.value = _messages.value + modelMsg
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Failed to generate reply"
            }
        }
    }

    fun clearChat() {
        _messages.value = listOf(
            ChatMessage(
                role = "model",
                content = "Chat cleared! What would you like to practice next?"
            )
        )
    }
}
