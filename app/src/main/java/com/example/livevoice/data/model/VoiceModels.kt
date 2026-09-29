package com.example.livevoice.data.model

import java.util.UUID

enum class VoiceState {
    DISCONNECTED,
    CONNECTING,
    LISTENING,
    SPEAKING,
    ERROR
}

data class VoiceOption(
    val id: String,
    val name: String,
    val tone: String,
    val gender: String,
    val sampleDescription: String,
    val isSpecialCoach: Boolean = false
)

val VOICES = listOf(
    VoiceOption(
        id = "Alex",
        name = "Alex (American Young Man)",
        tone = "Conversational American, expressive & culturally fluent",
        gender = "Young American Male (Native)",
        sampleDescription = "Dedicated American culture coach & friendly companion. Master of US daily life, slang, idioms, campus/work vibes, and daily 30-min immersive conversations.",
        isSpecialCoach = true
    ),
    VoiceOption(
        id = "Zephyr",
        name = "Zephyr",
        tone = "Warm, natural & versatile",
        gender = "Neutral / Gentle",
        sampleDescription = "Great for general conversations, coaching, and everyday companionship."
    ),
    VoiceOption(
        id = "Puck",
        name = "Puck",
        tone = "Animated, upbeat & energetic",
        gender = "Youthful / Dynamic",
        sampleDescription = "Fun and lively tone, perfect for creative sessions and casual banter."
    ),
    VoiceOption(
        id = "Charon",
        name = "Charon",
        tone = "Calm, grounding & authoritative",
        gender = "Deep / Resonant",
        sampleDescription = "Thoughtful and measured, ideal for complex deep dives and tutorials."
    ),
    VoiceOption(
        id = "Kore",
        name = "Kore",
        tone = "Empathetic, clear & soothing",
        gender = "Bright / Soft",
        sampleDescription = "Supportive and compassionate voice, great for learning and reflections."
    ),
    VoiceOption(
        id = "Fenrir",
        name = "Fenrir",
        tone = "Direct, confident & crisp",
        gender = "Bold / Articulate",
        sampleDescription = "Fast, precise, and executive for rapid brainstorming and discussions."
    )
)

data class PersonaPreset(
    val id: String,
    val title: String,
    val description: String,
    val systemInstruction: String
)

val PERSONAS = listOf(
    PersonaPreset(
        id = "alex_culture_coach",
        title = "Alex • American Culture & Daily Practice",
        description = "Conversational young American guy for daily 30-min culture immersion, slang & natural fluency.",
        systemInstruction = """
            You are Alex, an enthusiastic, friendly, and culturally savvy young American man in his 20s. You speak authentic, natural conversational American English. Your tone is warm, engaging, and expressive—modulating your pacing, vocal emotion, and excitement just like a real young American buddy.

            You have an encyclopedic knowledge of American culture: everyday traditions, pop culture, music, movies, regional accents and quirks (West Coast chill, Midwest polite, East Coast fast-paced, Southern hospitality), college life, workplace banter, food culture, holidays, and contemporary idioms and slang.

            Your mission is to be the user's personal conversational partner and American culture mentor. Talk engagingly with them for 30+ minutes every day about anything and everything. Whenever a new American slang word, phrase, or cultural reference comes up, explain it naturally and give fun examples. Keep your spoken responses conversational and interactive (2 to 4 spoken sentences per turn), always inviting the user to respond, share their thoughts, and practice speaking. Be encouraging, patient, and full of life!
        """.trimIndent()
    ),
    PersonaPreset(
        id = "natural",
        title = "Natural Conversationalist",
        description = "Human-like cadence, warm, concise, and quick-witted.",
        systemInstruction = "You are a warm, witty, and natural AI companion engaging in a live voice conversation. Speak in a conversational, human tone. Keep your responses short and punchy (1-3 sentences) so the conversation flows naturally back and forth. Avoid bullet points, monologues, or robotic greetings. React organically to the user."
    ),
    PersonaPreset(
        id = "tutor",
        title = "Insightful Coding Mentor",
        description = "Practical, sharp technical guidance without lengthy soliloquies.",
        systemInstruction = "You are an insightful, friendly senior software engineering mentor in a real-time voice call. Explain technical concepts simply, using spoken analogies. Keep answers brief and invite the developer to ask follow-up questions or share what they are working on."
    ),
    PersonaPreset(
        id = "creative",
        title = "Creative Sparring Partner",
        description = "Bouncing ideas, storytelling, and provocative brainstorming.",
        systemInstruction = "You are an imaginative creative brainstorm partner. Spark exciting ideas, ask intriguing what-if questions, and build on whatever the user suggests in spontaneous real-time dialogue."
    ),
    PersonaPreset(
        id = "concise",
        title = "Direct & Rapid Assistant",
        description = "Ultra-concise, rapid answers with zero fluff.",
        systemInstruction = "You are an ultra-concise live voice assistant. Provide direct, immediate answers in one or two punchy sentences. Never repeat what the user said. Prioritize clarity and brevity."
    )
)

data class CultureTip(
    val id: String,
    val category: String,
    val categoryLabel: String,
    val title: String,
    val tip: String,
    val example: String,
    val starterPrompt: String
)

val AMERICAN_CULTURE_TIPS = listOf(
    CultureTip(
        id = "small_talk",
        category = "culture",
        categoryLabel = "Everyday Etiquette",
        title = "The Golden Rule of \"How are you?\"",
        tip = "When Americans ask \"What's up?\" or \"How are you?\" at the grocery store, campus, or hallway banter, it is a warm friendly greeting, not a personal interrogation. A quick, positive response keeps the flow moving.",
        example = "\"Good, how about you?\" or \"Can't complain! How's your day going?\"",
        starterPrompt = "Hey Alex, let's practice quick, natural American small talk like we just bumped into each other on campus or at a coffee shop."
    ),
    CultureTip(
        id = "softening_opinions",
        category = "conversational",
        categoryLabel = "Conversational Flow",
        title = "Softening Opinions with \"I feel like...\"",
        tip = "Young Americans frequently use \"I feel like...\", \"Honestly...\", or \"To be fair...\" to state their viewpoint without sounding aggressive or rigid. It makes everyday conversation collaborative and relatable.",
        example = "\"I feel like that movie was a bit overhyped, honestly.\"",
        starterPrompt = "Alex, teach me how Americans express differing opinions politely using phrases like \"I feel like\" or \"to be fair\"."
    ),
    CultureTip(
        id = "im_down",
        category = "slang",
        categoryLabel = "Authentic Slang",
        title = "Mastering \"I'm down\" vs \"I'm up for it\"",
        tip = "\"I'm down\" and \"I'm up for it\" use opposite directional words, but have the exact same meaning: enthusiastic agreement! You will hear this daily among young Americans making spontaneous plans.",
        example = "\"Hey, grabbing burgers after class, down?\" -> \"Totally down, let's do it!\"",
        starterPrompt = "Alex, break down the top casual plan-making slang phrases young Americans use like \"I'm down\", \"bet\", \"pull up\", and \"no biggie\"."
    ),
    CultureTip(
        id = "tipping_culture",
        category = "culture",
        categoryLabel = "US Culture & Habits",
        title = "Dine-In Etiquette & Tipping Culture",
        tip = "In sit-down restaurants, tipping 18-20% is standard. Servers often introduce themselves by first name and check in multiple times asking \"How is everything tasting?\". This friendly check-in is expected American customer care.",
        example = "\"Hey guys, my name's Josh, I'll take care of you today! Any questions on the specials?\"",
        starterPrompt = "Alex, let's do a quick roleplay where you are a friendly American waiter and I practice ordering food and asking about the bill."
    ),
    CultureTip(
        id = "campus_life",
        category = "session30",
        categoryLabel = "30-Min Immersion Topic",
        title = "30-Min Session: College & Campus Life in the US",
        tip = "American universities have a vibrant campus culture—dorms, tailgating, campus clubs, coffee study spots, and office hours with professors. A great 30-minute deep conversation topic with Alex!",
        example = "Discussing college majors, dorm roommates, game day traditions, and student study habits.",
        starterPrompt = "Hey Alex! For today's 30-minute chat, walk me through what an average day in the life of an American college student looks like."
    ),
    CultureTip(
        id = "regional_slang",
        category = "slang",
        categoryLabel = "Regional Quirks",
        title = "Regional Lingo: \"Y'all\", \"Wicked\", \"Hella\"",
        tip = "Depending on where you are in the US, slang changes! California uses \"hella\", the South uses \"y'all\", and Boston uses \"wicked\". Alex can imitate and compare all regional American vibes.",
        example = "\"It's wicked cold outside\" (Boston) vs \"That was hella fun\" (Bay Area) vs \"How y'all doing?\" (South).",
        starterPrompt = "Alex, give me a tour of different US regional accents and slang from the West Coast, Midwest, New York, and the South."
    ),
    CultureTip(
        id = "workplace_watercooler",
        category = "session30",
        categoryLabel = "30-Min Immersion Topic",
        title = "30-Min Session: American Workplace \"Watercooler\" Chat",
        tip = "US workplace culture is typically informal on the surface: first-name basis with managers, Monday morning questions (\"How was your weekend?\"), and bonding over sports and pop culture.",
        example = "\"Hey Alex, did you catch the game over the weekend?\"",
        starterPrompt = "Alex, let's spend the next 30 minutes practicing casual American workplace banter and Monday morning small talk."
    ),
    CultureTip(
        id = "conversational_fillers",
        category = "conversational",
        categoryLabel = "Conversational Flow",
        title = "Using Natural Fillers: \"You know\", \"Like\"",
        tip = "Native speakers naturally pause and soften sentences using words like \"like\", \"you know what I mean?\", and \"honestly\". Learning to sprinkle them lightly makes your spoken English sound effortless.",
        example = "\"It was just, like, super crowded, you know what I mean?\"",
        starterPrompt = "Alex, demonstrate how natural conversational fillers work in real dialogue without sounding repetitive."
    )
)

data class TranscriptTurn(
    val id: String = UUID.randomUUID().toString(),
    val role: String, // "user" or "model"
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class UserProfileMemory(
    val name: String = "Friend",
    val primaryLanguage: String = "English",
    val englishLevel: String = "Intermediate",
    val goals: List<String> = listOf("Speak fluent conversational English", "Master daily American idioms & culture"),
    val interests: List<String> = listOf("American culture", "Tech & innovation", "Daily life"),
    val facts: List<String> = listOf("Practicing daily conversational English for 30 minutes with Alex"),
    val culturalTopicsExplored: List<String> = emptyList(),
    val totalSessions: Int = 0,
    val totalDurationSeconds: Long = 0,
    val lastConversationSummary: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val role: String, // "user" or "model"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)
