package com.example.livevoice.data.api

import com.example.livevoice.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface GeminiEndpoints {
    @POST("v1beta/models/{model}:generateContent")
    suspend fun generateContent(
        @Path("model") model: String,
        @Query("key") apiKey: String,
        @Body request: GenerateContentRequest
    ): GenerateContentResponse
}

object GeminiClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val api: GeminiEndpoints by lazy {
        retrofit.create(GeminiEndpoints::class.java)
    }

    private fun getApiKey(): String {
        return BuildConfig.GEMINI_API_KEY
    }

    /**
     * Send conversation turns to Gemini and get conversational response
     */
    suspend fun sendVoiceTurn(
        systemInstruction: String,
        conversationHistory: List<Pair<String, String>>, // role to text
        userText: String,
        modelName: String = "gemini-3.5-flash"
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val key = getApiKey()
            val contentsList = mutableListOf<Content>()

            // Add previous turns
            for ((role, text) in conversationHistory.takeLast(10)) {
                val apiRole = if (role.equals("user", ignoreCase = true)) "user" else "model"
                contentsList.add(
                    Content(
                        role = apiRole,
                        parts = listOf(Part(text = text))
                    )
                )
            }

            // Add current user prompt
            contentsList.add(
                Content(
                    role = "user",
                    parts = listOf(Part(text = userText))
                )
            )

            val request = GenerateContentRequest(
                contents = contentsList,
                systemInstruction = Content(
                    parts = listOf(Part(text = systemInstruction))
                ),
                generationConfig = GenerationConfig(
                    temperature = 0.7f,
                    topP = 0.95f,
                    maxOutputTokens = 150
                )
            )

            val response = api.generateContent(
                model = modelName,
                apiKey = key,
                request = request
            )

            val reply = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: "I heard you loud and clear! Let's keep practicing."
            Result.success(reply.trim())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Multi-turn text chat with model selection
     */
    suspend fun sendChatMessage(
        messages: List<Pair<String, String>>,
        modelName: String,
        systemInstruction: String?
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val key = getApiKey()
            val contents = messages.map { (role, text) ->
                Content(
                    role = if (role == "user") "user" else "model",
                    parts = listOf(Part(text = text))
                )
            }

            val request = GenerateContentRequest(
                contents = contents,
                systemInstruction = systemInstruction?.takeIf { it.isNotBlank() }?.let {
                    Content(parts = listOf(Part(text = it)))
                },
                generationConfig = GenerationConfig(
                    temperature = 0.7f,
                    maxOutputTokens = 800
                )
            )

            val response = api.generateContent(
                model = modelName,
                apiKey = key,
                request = request
            )

            val text = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: "No response received."
            Result.success(text.trim())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Transcribe spoken audio accurately
     */
    suspend fun transcribeAudio(
        audioBase64: String,
        mimeType: String = "audio/wav"
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val key = getApiKey()
            val request = GenerateContentRequest(
                contents = listOf(
                    Content(
                        role = "user",
                        parts = listOf(
                            Part(inlineData = InlineData(mimeType = mimeType, data = audioBase64)),
                            Part(text = "Transcribe this spoken audio accurately and verbatim. Return only the transcription without commentary.")
                        )
                    )
                ),
                generationConfig = GenerationConfig(
                    temperature = 0.2f
                )
            )

            val response = api.generateContent(
                model = "gemini-3.5-flash",
                apiKey = key,
                request = request
            )

            val transcript = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: ""
            Result.success(transcript.trim())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Extract user memory facts, interests, goals and conversational summary
     */
    suspend fun extractUserMemory(
        turns: List<Pair<String, String>>,
        existingFacts: List<String>
    ): Result<ExtractedMemoryDto> = withContext(Dispatchers.IO) {
        try {
            val key = getApiKey()
            val dialogue = turns.joinToString("\n") { (role, text) ->
                "${if (role == "user") "User" else "Alex (AI)"}: $text"
            }

            val prompt = """
                Analyze this spoken voice conversation between a user and Alex (an American conversational AI coach).
                Your goal is to build an ongoing personal knowledge dossier/memory about the user so Alex can remember everything about them in future conversations.
                The primary language of interaction and notes MUST be English.

                Existing memory facts already known:
                ${if (existingFacts.isNotEmpty()) existingFacts.joinToString("\n") { "- $it" } else "(None yet)"}

                Conversation Transcript:
                $dialogue

                Extract and return a valid JSON object strictly matching this schema:
                {
                  "detectedName": string or null (user's name if mentioned),
                  "detectedEnglishLevel": "Beginner" | "Intermediate" | "Advanced" | "Fluent",
                  "newFacts": string[] (concrete, durable facts about the user: occupation, location, family/friends, hobbies, personal preferences. Do not duplicate existing facts),
                  "newInterests": string[] (topics, hobbies, or cultural areas they enjoy),
                  "newGoals": string[] (any learning goals, life goals, or aspirations mentioned),
                  "culturalTopicsDiscussed": string[] (American culture, slang, or daily habits discussed),
                  "conversationSummary": string (a concise 1-2 sentence English summary of what was discussed)
                }
            """.trimIndent()

            val request = GenerateContentRequest(
                contents = listOf(
                    Content(role = "user", parts = listOf(Part(text = prompt)))
                ),
                generationConfig = GenerationConfig(
                    responseMimeType = "application/json",
                    temperature = 0.3f
                )
            )

            val response = api.generateContent(
                model = "gemini-3.5-flash",
                apiKey = key,
                request = request
            )

            val rawJson = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: "{}"
            val cleanJson = rawJson.replace("```json", "").replace("```", "").trim()
            val parsed = json.decodeFromString<ExtractedMemoryDto>(cleanJson)
            Result.success(parsed)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
