# LiveVoice AI - Real-Time Live Voice Conversation

A real-time, low-latency live AI voice conversation web app built with **Gemini Live API** (`@google/genai`), React 19, TypeScript, and Tailwind CSS.

## Features

- **Gemini Live Streaming**: True bidirectional streaming audio via WebSockets using `gemini-3.8-live` and `gemini-3.8-live-extended-thinking`.
- **Natural Voice Interaction**: Speak naturally through your microphone (16kHz PCM linear audio capture) and hear human-like speech responses (24kHz PCM linear audio output) with zero text-to-speech delay.
- **Barge-in & Natural Interruption**: Interrupt the AI at any time simply by speaking over it or clicking the Hand/Interrupt button. Active audio buffers immediately clear and the conversation seamlessly continues.
- **Organic Fluid Voice Visualizer**: 60fps dynamic visualizer with reactive ripples, frequency response, harmonic distortion, and distinct visual states (`listening`, `thinking`, `speaking`, `muted`, `disconnected`).
- **Voice Selection & Personas**: Choose from Gemini's prebuilt voices (*Zephyr*, *Puck*, *Charon*, *Kore*, *Fenrir*) and customize persona instructions (*Natural Conversationalist*, *Coding Mentor*, *Creative Sparring Partner*, *Direct & Rapid Assistant*).
- **Live Real-time Transcript**: Toggleable real-time transcript drawer capturing speaker turns, with turn copying and clearing.
- **Keyboard Shortcuts**:
  - `Space`: Start / End call
  - `M`: Mute / Unmute microphone
  - `I` or `Esc`: Interrupt AI speech

## Setup & Running

1. Ensure `GEMINI_API_KEY` is present in your environment (configured automatically in AI Studio Secrets).
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` and grant microphone permissions when prompted.
4. Tap **Start Live Voice** to begin speaking.
