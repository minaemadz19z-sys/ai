package com.example.livevoice.audio

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Locale
import java.util.UUID

class AudioPlaybackManager(
    context: Context,
    private val onSpeechStarted: () -> Unit,
    private val onSpeechCompleted: () -> Unit,
    private val onError: (String) -> Unit
) {
    private var tts: TextToSpeech? = null
    private var isInitialized = false

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking = _isSpeaking.asStateFlow()

    private val _audioAmplitude = MutableStateFlow(0f)
    val audioAmplitude = _audioAmplitude.asStateFlow()

    private var amplitudeJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Default)

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.US
                isInitialized = true
                setupProgressListener()
            } else {
                onError("Failed to initialize text-to-speech engine")
            }
        }
    }

    private fun setupProgressListener() {
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                _isSpeaking.value = true
                startSimulatingAmplitude()
                onSpeechStarted()
            }

            override fun onDone(utteranceId: String?) {
                _isSpeaking.value = false
                stopSimulatingAmplitude()
                onSpeechCompleted()
            }

            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                _isSpeaking.value = false
                stopSimulatingAmplitude()
                onSpeechCompleted()
            }

            override fun onError(utteranceId: String?, errorCode: Int) {
                _isSpeaking.value = false
                stopSimulatingAmplitude()
                onSpeechCompleted()
            }
        })
    }

    fun applyVoiceConfig(voiceId: String) {
        when (voiceId) {
            "Alex" -> {
                tts?.setPitch(1.05f)
                tts?.setSpeechRate(1.08f) // Energetic young American pace
            }
            "Zephyr" -> {
                tts?.setPitch(0.95f)
                tts?.setSpeechRate(1.0f)
            }
            "Puck" -> {
                tts?.setPitch(1.2f)
                tts?.setSpeechRate(1.15f)
            }
            "Charon" -> {
                tts?.setPitch(0.75f)
                tts?.setSpeechRate(0.92f)
            }
            "Kore" -> {
                tts?.setPitch(1.1f)
                tts?.setSpeechRate(0.98f)
            }
            "Fenrir" -> {
                tts?.setPitch(0.85f)
                tts?.setSpeechRate(1.12f)
            }
            else -> {
                tts?.setPitch(1.0f)
                tts?.setSpeechRate(1.0f)
            }
        }
    }

    fun speak(text: String, voiceId: String = "Alex") {
        if (!isInitialized) return
        stop()
        applyVoiceConfig(voiceId)

        val utteranceId = UUID.randomUUID().toString()
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stop() {
        stopSimulatingAmplitude()
        tts?.stop()
        _isSpeaking.value = false
    }

    private fun startSimulatingAmplitude() {
        amplitudeJob?.cancel()
        amplitudeJob = scope.launch {
            while (isActive && _isSpeaking.value) {
                // Generate natural dynamic speech modulation
                val base = (0.3f..0.85f).random()
                _audioAmplitude.value = base
                delay(60)
            }
            _audioAmplitude.value = 0f
        }
    }

    private fun stopSimulatingAmplitude() {
        amplitudeJob?.cancel()
        amplitudeJob = null
        _audioAmplitude.value = 0f
    }

    fun release() {
        stop()
        tts?.shutdown()
        tts = null
    }

    private fun ClosedFloatingPointRange<Float>.random(): Float {
        return (start + Math.random() * (endInclusive - start)).toFloat()
    }
}
