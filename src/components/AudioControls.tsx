import React from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Hand,
  Settings,
  MessageSquareText,
  Volume2,
} from 'lucide-react';
import { VoiceState } from './VoiceVisualizer';

interface AudioControlsProps {
  state: VoiceState;
  isMuted: boolean;
  onToggleSession: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onOpenSettings: () => void;
  onToggleTranscript: () => void;
  showTranscript: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  state,
  isMuted,
  onToggleSession,
  onToggleMute,
  onInterrupt,
  onOpenSettings,
  onToggleTranscript,
  showTranscript,
}) => {
  const isConnected = state !== 'disconnected' && state !== 'connecting';
  const isSpeaking = state === 'speaking';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Primary Action Button Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 p-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-full shadow-2xl">
        {/* Toggle Transcript */}
        <button
          onClick={onToggleTranscript}
          title={showTranscript ? 'Hide transcript' : 'Show live transcript'}
          className={`p-3 rounded-full transition-all duration-200 cursor-pointer ${
            showTranscript
              ? 'bg-neutral-700/80 text-white shadow-inner'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <MessageSquareText className="w-5 h-5" />
        </button>

        {/* Mute / Unmute Button (Active during session) */}
        {isConnected && (
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone (M)' : 'Mute microphone (M)'}
            className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Main Connect / Disconnect Live Conversation Button */}
        <button
          onClick={onToggleSession}
          disabled={state === 'connecting'}
          title={isConnected ? 'End voice conversation' : 'Start live voice conversation'}
          className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm sm:text-base cursor-pointer transition-all duration-300 shadow-xl ${
            isConnected
              ? 'bg-red-600 hover:bg-red-500 text-white hover:shadow-red-600/30 active:scale-95'
              : state === 'connecting'
              ? 'bg-indigo-600/50 text-indigo-200 cursor-wait animate-pulse'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white hover:shadow-purple-500/25 active:scale-95'
          }`}
        >
          {state === 'connecting' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : isConnected ? (
            <>
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-5 h-5" />
              <span>Start Live Voice</span>
            </>
          )}
        </button>

        {/* Interrupt Button (Visible when AI is speaking) */}
        {isConnected && (
          <button
            onClick={onInterrupt}
            title="Interrupt AI speaking (or simply speak)"
            disabled={!isSpeaking}
            className={`p-3.5 rounded-full transition-all duration-200 cursor-pointer ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                : 'text-neutral-600 cursor-not-allowed border border-transparent'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>
        )}

        {/* Voice Persona Settings */}
        <button
          onClick={onOpenSettings}
          title="Voice & Assistant Settings"
          className="p-3 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-200 cursor-pointer"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Helpful Subtitle / Instructions */}
      <div className="text-center text-xs text-neutral-400 tracking-wide">
        {isConnected ? (
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Speak naturally • Interrupt anytime by speaking or tapping Hand</span>
          </div>
        ) : (
          <span>Low-latency natural audio streaming powered by Gemini Live</span>
        )}
      </div>
    </div>
  );
};
