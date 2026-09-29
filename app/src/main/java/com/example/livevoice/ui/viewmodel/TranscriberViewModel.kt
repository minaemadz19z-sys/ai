package com.example.livevoice.ui.viewmodel

import android.app.Application
import android.util.Base64
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.livevoice.audio.AudioRecorderHelper
import com.example.livevoice.data.api.GeminiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TranscriberViewModel(application: Application) : AndroidViewModel(application) {

    private val _isRecording = MutableStateFlow(false)
    val isRecording = _isRecording.asStateFlow()

    private val _transcriptionResult = MutableStateFlow<String>("")
    val transcriptionResult = _transcriptionResult.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage = _errorMessage.asStateFlow()

    private var recorder: AudioRecorderHelper? = null

    init {
        recorder = AudioRecorderHelper(
            context = application,
            onSpeechRecognized = { text ->
                _transcriptionResult.value = text
                _isRecording.value = false
            },
            onPartialRecognized = { partial ->
                _transcriptionResult.value = partial
            },
            onError = { err ->
                _errorMessage.value = err
                _isRecording.value = false
            }
        )
    }

    fun startRecording() {
        _errorMessage.value = null
        _transcriptionResult.value = ""
        _isRecording.value = true
        recorder?.startListening()
    }

    fun stopRecording() {
        _isRecording.value = false
        recorder?.stopListening()
    }

    fun transcribeSampleNote(sampleNote: String) {
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            val result = GeminiClient.sendChatMessage(
                messages = listOf("user" to "Transcribe and clean up this spoken voice memo into structured, accurate English with punctuation:\n\n$sampleNote"),
                modelName = "gemini-3.5-flash",
                systemInstruction = "You are a specialized audio transcriber and note summarizer."
            )

            _isLoading.value = false
            result.onSuccess { text ->
                _transcriptionResult.value = text
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Transcription failed"
            }
        }
    }

    fun clear() {
        _transcriptionResult.value = ""
        _errorMessage.value = null
    }

    override fun onCleared() {
        super.onCleared()
        recorder?.release()
    }
}
