package com.example.livevoice.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.livevoice.audio.AudioPlaybackManager
import com.example.livevoice.audio.AudioRecorderHelper
import com.example.livevoice.data.api.GeminiClient
import com.example.livevoice.data.local.AppDatabase
import com.example.livevoice.data.local.ConversationEntity
import com.example.livevoice.data.local.TranscriptTurnEntity
import com.example.livevoice.data.local.UserMemoryEntity
import com.example.livevoice.data.model.CultureTip
import com.example.livevoice.data.model.PERSONAS
import com.example.livevoice.data.model.TranscriptTurn
import com.example.livevoice.data.model.UserProfileMemory
import com.example.livevoice.data.model.VOICES
import com.example.livevoice.data.model.VoiceState
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

class LiveVoiceViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val conversationDao = db.conversationDao()

    private val _voiceState = MutableStateFlow(VoiceState.DISCONNECTED)
    val voiceState = _voiceState.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted = _isMuted.asStateFlow()

    private val _selectedVoiceId = MutableStateFlow("Alex")
    val selectedVoiceId = _selectedVoiceId.asStateFlow()

    private val _selectedPersonaId = MutableStateFlow("alex_culture_coach")
    val selectedPersonaId = _selectedPersonaId.asStateFlow()

    private val _systemPrompt = MutableStateFlow(PERSONAS[0].systemInstruction)
    val systemPrompt = _systemPrompt.asStateFlow()

    private val _selectedModel = MutableStateFlow("gemini-3.5-flash")
    val selectedModel = _selectedModel.asStateFlow()

    private val _transcriptTurns = MutableStateFlow<List<TranscriptTurn>>(emptyList())
    val transcriptTurns = _transcriptTurns.asStateFlow()

    private val _userMemory = MutableStateFlow(UserProfileMemory())
    val userMemory = _userMemory.asStateFlow()

    private val _sessionDurationSeconds = MutableStateFlow(0L)
    val sessionDurationSeconds = _sessionDurationSeconds.asStateFlow()

    private val _audioAmplitude = MutableStateFlow(0f)
    val audioAmplitude = _audioAmplitude.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage = _errorMessage.asStateFlow()

    private var timerJob: Job? = null
    private var playbackManager: AudioPlaybackManager? = null
    private var recorderHelper: AudioRecorderHelper? = null

    init {
        loadUserMemoryFromDb()
        initAudioEngines()
    }

    private fun initAudioEngines() {
        val app = getApplication<Application>()

        playbackManager = AudioPlaybackManager(
            context = app,
            onSpeechStarted = {
                _voiceState.value = VoiceState.SPEAKING
            },
            onSpeechCompleted = {
                if (_voiceState.value != VoiceState.DISCONNECTED) {
                    _voiceState.value = VoiceState.LISTENING
                    if (!_isMuted.value) {
                        recorderHelper?.startListening()
                    }
                }
            },
            onError = { err ->
                _errorMessage.value = err
            }
        )

        recorderHelper = AudioRecorderHelper(
            context = app,
            onSpeechRecognized = { spokenText ->
                handleUserSpeech(spokenText)
            },
            onPartialRecognized = { _ -> },
            onError = { err ->
                if (_voiceState.value == VoiceState.LISTENING) {
                    // Automatically retry listening
                    recorderHelper?.startListening()
                }
            }
        )

        // Observe amplitude for dynamic UI visualizer
        viewModelScope.launch {
            playbackManager?.audioAmplitude?.collectLatest { amp ->
                if (_voiceState.value == VoiceState.SPEAKING) {
                    _audioAmplitude.value = amp
                }
            }
        }

        viewModelScope.launch {
            recorderHelper?.inputRms?.collectLatest { rms ->
                if (_voiceState.value == VoiceState.LISTENING) {
                    _audioAmplitude.value = rms
                }
            }
        }
    }

    private fun loadUserMemoryFromDb() {
        viewModelScope.launch {
            try {
                val entity = conversationDao.getUserMemory()
                if (entity != null) {
                    val json = Json { ignoreUnknownKeys = true }
                    _userMemory.value = UserProfileMemory(
                        name = entity.name,
                        primaryLanguage = entity.primaryLanguage,
                        englishLevel = entity.englishLevel,
                        facts = json.decodeFromString(entity.factsJson),
                        interests = json.decodeFromString(entity.interestsJson),
                        goals = json.decodeFromString(entity.goalsJson),
                        culturalTopicsExplored = json.decodeFromString(entity.culturalTopicsJson),
                        totalSessions = entity.totalSessions,
                        totalDurationSeconds = entity.totalDurationSeconds,
                        lastConversationSummary = entity.lastSummary,
                        updatedAt = entity.updatedAt
                    )
                }
            } catch (_: Exception) {}
        }
    }

    fun startSession() {
        _errorMessage.value = null
        _voiceState.value = VoiceState.CONNECTING
        _sessionDurationSeconds.value = 0L

        startTimer()

        viewModelScope.launch {
            delay(600) // Brief connection sync
            _voiceState.value = VoiceState.LISTENING

            // Welcome greeting from Alex if new conversation
            if (_transcriptTurns.value.isEmpty()) {
                val greeting = if (_userMemory.value.name.isNotBlank() && _userMemory.value.name != "Friend") {
                    "Hey ${_userMemory.value.name}! Great to hear from you again. What's on your mind today?"
                } else {
                    "Hey there! I'm Alex, your American culture coach. How's your day going?"
                }

                val aiTurn = TranscriptTurn(role = "model", text = greeting)
                _transcriptTurns.value = listOf(aiTurn)
                playbackManager?.speak(greeting, _selectedVoiceId.value)
            } else {
                if (!_isMuted.value) {
                    recorderHelper?.startListening()
                }
            }
        }
    }

    fun endSession() {
        stopTimer()
        playbackManager?.stop()
        recorderHelper?.stopListening()

        val turnsSnapshot = _transcriptTurns.value
        val duration = _sessionDurationSeconds.value
        val voiceUsed = _selectedVoiceId.value
        val personaUsed = _selectedPersonaId.value

        _voiceState.value = VoiceState.DISCONNECTED
        _isMuted.value = false
        _audioAmplitude.value = 0f

        // Auto-extract user memory and save session to local Room Database
        if (turnsSnapshot.isNotEmpty()) {
            viewModelScope.launch {
                val conversationId = UUID.randomUUID().toString()

                // Extract summary and updated facts via Gemini
                val pairs = turnsSnapshot.map { it.role to it.text }
                val extractResult = GeminiClient.extractUserMemory(pairs, _userMemory.value.facts)

                val summary = extractResult.getOrNull()?.conversationSummary
                    ?: "Conversational session with Alex exploring American culture."

                // Save to Room DB
                val convEntity = ConversationEntity(
                    id = conversationId,
                    title = "Chat with $voiceUsed",
                    voiceModel = voiceUsed,
                    personaId = personaUsed,
                    durationSeconds = duration,
                    totalTurns = turnsSnapshot.size,
                    summary = summary,
                    createdAt = System.currentTimeMillis()
                )

                val turnEntities = turnsSnapshot.map {
                    TranscriptTurnEntity(
                        id = it.id,
                        conversationId = conversationId,
                        role = it.role,
                        text = it.text,
                        timestamp = it.timestamp
                    )
                }

                conversationDao.saveFullConversation(convEntity, turnEntities)

                // Update continuous user memory
                extractResult.getOrNull()?.let { extracted ->
                    val updatedFacts = (_userMemory.value.facts + extracted.newFacts).distinct()
                    val updatedInterests = (_userMemory.value.interests + extracted.newInterests).distinct()
                    val updatedGoals = (_userMemory.value.goals + extracted.newGoals).distinct()
                    val updatedTopics = (_userMemory.value.culturalTopicsExplored + extracted.culturalTopicsDiscussed).distinct()

                    val newMemory = _userMemory.value.copy(
                        name = extracted.detectedName ?: _userMemory.value.name,
                        englishLevel = extracted.detectedEnglishLevel ?: _userMemory.value.englishLevel,
                        facts = updatedFacts,
                        interests = updatedInterests,
                        goals = updatedGoals,
                        culturalTopicsExplored = updatedTopics,
                        totalSessions = _userMemory.value.totalSessions + 1,
                        totalDurationSeconds = _userMemory.value.totalDurationSeconds + duration,
                        lastConversationSummary = summary,
                        updatedAt = System.currentTimeMillis()
                    )

                    _userMemory.value = newMemory
                    saveUserMemoryToDb(newMemory)
                }
            }
        }
    }

    private fun handleUserSpeech(userText: String) {
        if (userText.isBlank()) {
            if (_voiceState.value == VoiceState.LISTENING) {
                recorderHelper?.startListening()
            }
            return
        }

        // Add user turn
        val userTurn = TranscriptTurn(role = "user", text = userText)
        _transcriptTurns.value = _transcriptTurns.value + userTurn

        _voiceState.value = VoiceState.CONNECTING

        // Build continuous memory prompt
        val memoryPrompt = buildMemoryInstruction()

        viewModelScope.launch {
            val historyPairs = _transcriptTurns.value.map { it.role to it.text }
            val result = GeminiClient.sendVoiceTurn(
                systemInstruction = memoryPrompt,
                conversationHistory = historyPairs.dropLast(1),
                userText = userText,
                modelName = _selectedModel.value
            )

            result.onSuccess { aiReply ->
                val aiTurn = TranscriptTurn(role = "model", text = aiReply)
                _transcriptTurns.value = _transcriptTurns.value + aiTurn
                playbackManager?.speak(aiReply, _selectedVoiceId.value)
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Failed to get AI response"
                _voiceState.value = VoiceState.LISTENING
                if (!_isMuted.value) {
                    recorderHelper?.startListening()
                }
            }
        }
    }

    fun interrupt() {
        playbackManager?.stop()
        _voiceState.value = VoiceState.LISTENING
        if (!_isMuted.value) {
            recorderHelper?.startListening()
        }
    }

    fun toggleMute() {
        val next = !_isMuted.value
        _isMuted.value = next
        if (next) {
            recorderHelper?.stopListening()
        } else if (_voiceState.value == VoiceState.LISTENING) {
            recorderHelper?.startListening()
        }
    }

    fun selectVoice(voiceId: String) {
        _selectedVoiceId.value = voiceId
        playbackManager?.applyVoiceConfig(voiceId)
        if (voiceId == "Alex") {
            _selectedPersonaId.value = "alex_culture_coach"
            _systemPrompt.value = PERSONAS[0].systemInstruction
        }
    }

    fun selectPersona(personaId: String, instruction: String) {
        _selectedPersonaId.value = personaId
        _systemPrompt.value = instruction
    }

    fun updateSystemPrompt(newPrompt: String) {
        _systemPrompt.value = newPrompt
    }

    fun selectModel(modelId: String) {
        _selectedModel.value = modelId
    }

    fun practiceTopic(tip: CultureTip) {
        val focusInstruction = "\n\n[Active Immersion Focus: \"${tip.title}\"]\nAlex, proactively introduce this conversational topic and practice it with the user: ${tip.tip} Teach and roleplay with example: ${tip.example}"
        if (!_systemPrompt.value.contains(tip.title)) {
            _systemPrompt.value = _systemPrompt.value.trim() + focusInstruction
        }

        if (_voiceState.value == VoiceState.DISCONNECTED) {
            startSession()
        } else {
            handleUserSpeech("Hey Alex, let's talk about ${tip.title}! Can you explain it and give me an example?")
        }
    }

    fun saveUserMemory(memory: UserProfileMemory) {
        _userMemory.value = memory
        saveUserMemoryToDb(memory)
    }

    private fun saveUserMemoryToDb(mem: UserProfileMemory) {
        viewModelScope.launch {
            try {
                val json = Json { encodeDefaults = true }
                val entity = UserMemoryEntity(
                    name = mem.name,
                    primaryLanguage = mem.primaryLanguage,
                    englishLevel = mem.englishLevel,
                    factsJson = json.encodeToString(mem.facts),
                    interestsJson = json.encodeToString(mem.interests),
                    goalsJson = json.encodeToString(mem.goals),
                    culturalTopicsJson = json.encodeToString(mem.culturalTopicsExplored),
                    totalSessions = mem.totalSessions,
                    totalDurationSeconds = mem.totalDurationSeconds,
                    lastSummary = mem.lastConversationSummary,
                    updatedAt = mem.updatedAt
                )
                conversationDao.saveUserMemory(entity)
            } catch (_: Exception) {}
        }
    }

    fun clearTranscript() {
        _transcriptTurns.value = emptyList()
    }

    private fun buildMemoryInstruction(): String {
        val mem = _userMemory.value
        return """
            ${_systemPrompt.value}

            [USER CONTINUOUS MEMORY & PERSONAL DOSSIER]
            You are speaking with: ${mem.name}.
            Primary Language: English. Keep this voice conversation entirely in conversational American English.
            English Proficiency: ${mem.englishLevel}.
            Key Facts You Remember About This Person:
            ${if (mem.facts.isNotEmpty()) mem.facts.joinToString("\n") { "- $it" } else "- First conversation! Greet them warmly and learn about their day."}
            Interests: ${mem.interests.joinToString(", ")}
            Goals: ${mem.goals.joinToString(", ")}

            CRITICAL MEMORY RULES FOR ALEX:
            1. Greet the user by name if known. Remember what they told you in past conversations.
            2. Naturally reference their facts, interests, or previous topics like an authentic friend.
            3. The primary language MUST be English. Speak naturally in conversational American English with friendly cadence and idioms.
            4. Keep spoken turns punchy (2-4 natural sentences) so the user has plenty of space to speak and practice.
        """.trimIndent()
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                _sessionDurationSeconds.value += 1
            }
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }

    override fun onCleared() {
        super.onCleared()
        stopTimer()
        playbackManager?.release()
        recorderHelper?.release()
    }
}
