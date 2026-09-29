# LiveVoice AI - Android Application

A real-time voice conversation and American culture immersion companion built with **Kotlin**, **Jetpack Compose**, **Material 3**, and **Google Gemini API**.

## Overview

LiveVoice AI provides real-time spoken English conversation practice with Alex, an enthusiastic, culturally savvy American AI coach in his 20s. Practice authentic conversational American English, slang, everyday etiquette, idioms, college/workplace banter, and daily 30-minute immersive dialogues.

## Key Features

1. **Live Voice Interaction & Organic Visualizer**:
   - Hands-free, real-time voice conversation loop with speech recognition and speech synthesis.
   - Dynamic 60fps pulsating glowing orb visualizer reacting to amplitude/RMS with harmonic ripples and visual state cues (`Listening`, `Speaking`, `Connecting`, `Disconnected`).
   - Mute/Unmute microphone controls and barge-in / instant interruption support.
   - Live session timer tracking daily practice duration.

2. **Prebuilt Voices & Persona Presets**:
   - Voices: *Alex (American Young Man)*, *Zephyr*, *Puck*, *Charon*, *Kore*, *Fenrir*.
   - Personas: *Alex Culture Coach*, *Natural Conversationalist*, *Insightful Coding Mentor*, *Creative Sparring Partner*, *Direct & Rapid Assistant*, plus full custom system prompt editing.
   - AI Model support: `gemini-3.5-flash`, `gemini-3.1-pro-preview` (extended thinking), and `gemini-3.1-flash-lite-preview`.

3. **Curated American Culture & Slang Tips**:
   - Curated daily lessons across slang & idioms, everyday etiquette, conversational flow, and 30-min immersion topics.
   - Real-world US quotes and one-tap "Practice this topic with Alex" interactive prompts.

4. **Continuous User Memory & Personal Dossier**:
   - Automatically extracts durable facts, user interests, learning goals, and conversation summaries from dialogues using Gemini.
   - Alex greets you by name and naturally recalls past conversations.
   - Editable dossier dialog for full user control.

5. **Multi-turn Gemini Chatbot & Audio Transcriber**:
   - Full conversational text chat with model selection and prompt suggestions.
   - Audio recording & note transcription tool powered by Gemini multimodal reasoning.

6. **Local Persistence with Room Database**:
   - Offline-capable conversation archive storing session history, timestamps, durations, summaries, and full dialogue turns.
   - Persistent storage for the user memory dossier.

## Architecture & Technology Stack

- **Platform**: Android SDK 36 (Min SDK 26)
- **Language**: Kotlin 2.1.0 with Coroutines & StateFlow
- **UI Toolkit**: Jetpack Compose & Material Design 3 (M3)
- **Local Persistence**: Room Database 2.7 (with KSP)
- **Networking**: Retrofit 2.11 + OkHttp 4.12 + Kotlinx Serialization
- **AI Models**: Gemini API (`gemini-3.5-flash`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`)
- **Build System**: Gradle 9.3.1 (Kotlin DSL) with Version Catalog (`gradle/libs.versions.toml`)

## Building and Running

1. Add your Gemini API key in the AI Studio Secrets panel or `.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Build the debug APK with Gradle:
   ```bash
   gradle :app:assembleDebug
   ```
3. The generated APK will be located at:
   `app/build/outputs/apk/debug/app-debug.apk`
