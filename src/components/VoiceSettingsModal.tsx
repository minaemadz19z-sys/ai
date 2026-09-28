import React from 'react';
import { X, Mic, Brain, Sparkles, Check, Info } from 'lucide-react';

export interface VoiceOption {
  id: string;
  name: string;
  tone: string;
  gender: string;
  sampleDescription: string;
}

export const VOICES: VoiceOption[] = [
  {
    id: 'Zephyr',
    name: 'Zephyr',
    tone: 'Warm, natural & versatile',
    gender: 'Neutral / Gentle',
    sampleDescription: 'Great for general conversations, coaching, and everyday companionship.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    tone: 'Animated, upbeat & energetic',
    gender: 'Youthful / Dynamic',
    sampleDescription: 'Fun and lively tone, perfect for creative sessions and casual banter.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    tone: 'Calm, grounding & authoritative',
    gender: 'Deep / Resonant',
    sampleDescription: 'Thoughtful and measured, ideal for complex deep dives and tutorials.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    tone: 'Empathetic, clear & soothing',
    gender: 'Bright / Soft',
    sampleDescription: 'Supportive and compassionate voice, great for learning and reflections.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    tone: 'Direct, confident & crisp',
    gender: 'Bold / Articulate',
    sampleDescription: 'Fast, precise, and executive for rapid brainstorming and coding discussions.',
  },
];

export interface PersonaPreset {
  id: string;
  title: string;
  description: string;
  systemInstruction: string;
}

export const PERSONAS: PersonaPreset[] = [
  {
    id: 'natural',
    title: 'Natural Conversationalist',
    description: 'Human-like cadence, warm, concise, and quick-witted.',
    systemInstruction:
      'You are a warm, witty, and natural AI companion engaging in a live voice conversation. Speak in a conversational, human tone. Keep your responses short and punchy (1-3 sentences) so the conversation flows naturally back and forth. Avoid bullet points, monologues, or robotic greetings. React organically to the user.',
  },
  {
    id: 'tutor',
    title: 'Insightful Coding Mentor',
    description: 'Practical, sharp technical guidance without lengthy soliloquies.',
    systemInstruction:
      'You are an insightful, friendly senior software engineering mentor in a real-time voice call. Explain technical concepts simply, using spoken analogies. Keep answers brief and invite the developer to ask follow-up questions or share what they are working on.',
  },
  {
    id: 'creative',
    title: 'Creative Sparring Partner',
    description: 'Bouncing ideas, storytelling, and provocative brainstorming.',
    systemInstruction:
      'You are an imaginative creative brainstorm partner. Spark exciting ideas, ask intriguing what-if questions, and build on whatever the user suggests in spontaneous real-time dialogue.',
  },
  {
    id: 'concise',
    title: 'Direct & Rapid Assistant',
    description: 'Ultra-concise, rapid answers with zero fluff.',
    systemInstruction:
      'You are an ultra-concise live voice assistant. Provide direct, immediate answers in one or two punchy sentences. Never repeat what the user said. Prioritize clarity and brevity.',
  },
];

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  selectedPersona: string;
  onSelectPersona: (personaId: string) => void;
  systemPrompt: string;
  onChangeSystemPrompt: (prompt: string) => void;
  model: string;
  onChangeModel: (model: string) => void;
  isSessionActive: boolean;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  selectedPersona,
  onSelectPersona,
  systemPrompt,
  onChangeSystemPrompt,
  model,
  onChangeModel,
  isSessionActive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-200 scrollbar-thin scrollbar-thumb-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voice & Intelligence Settings</h2>
              <p className="text-xs text-neutral-400">Configure Gemini Live voice persona and reasoning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSessionActive && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Changes will apply when starting your next live voice session.</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Select Voice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Prebuilt Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedVoice === v.id
                      ? 'bg-purple-600/15 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-white">{v.name}</span>
                    {selectedVoice === v.id && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <span className="text-xs text-purple-300/90 mt-0.5">{v.tone}</span>
                  <span className="text-[11px] text-neutral-400 mt-1 leading-snug line-clamp-2">
                    {v.sampleDescription}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Live AI Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onChangeModel('gemini-3.8-live')}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  model === 'gemini-3.8-live'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">Gemini 3.8 Live</span>
                  {model === 'gemini-3.8-live' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-neutral-400">
                  Ultra-low latency, native audio-to-audio streaming for natural real-time dialogue.
                </p>
              </button>

              <button
                onClick={() => onChangeModel('gemini-3.8-live-extended-thinking')}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  model === 'gemini-3.8-live-extended-thinking'
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                    : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Extended Thinking</span>
                  </div>
                  {model === 'gemini-3.8-live-extended-thinking' && (
                    <Check className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <p className="text-xs text-neutral-400">
                  High-level internal reasoning for complex problem solving and math.
                </p>
              </button>
            </div>
          </div>

          {/* Persona Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Persona Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPersona(p.id);
                    onChangeSystemPrompt(p.systemInstruction);
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedPersona === p.id
                      ? 'bg-neutral-800 border-neutral-600 text-white font-medium'
                      : 'bg-neutral-800/30 border-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-medium text-white">{p.title}</div>
                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt Customization */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              System Instruction
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => {
                onChangeSystemPrompt(e.target.value);
                onSelectPersona('custom');
              }}
              placeholder="Give Gemini instructions on how to speak and behave..."
              className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-purple-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
