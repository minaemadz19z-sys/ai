import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, Check, User, Sparkles, Volume2 } from 'lucide-react';

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface LiveTranscriptProps {
  turns: TranscriptTurn[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  currentModelVoice: string;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  turns,
  isOpen,
  onClose,
  onClear,
  currentModelVoice,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleCopy = async () => {
    if (turns.length === 0) return;
    const text = turns
      .map(
        (t) =>
          `[${t.timestamp.toLocaleTimeString()}] ${
            t.role === 'user' ? 'User' : `Gemini (${currentModelVoice})`
          }:\n${t.text}`
      )
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy transcript:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Live Transcript</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
            {turns.length} turns
          </span>
        </div>

        <div className="flex items-center gap-1">
          {turns.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                title="Copy conversation"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onClear}
                title="Clear transcript"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-neutral-800"
      >
        {turns.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">
            <Volume2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>Transcript will appear in real time as you and Gemini speak.</p>
          </div>
        ) : (
          turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col gap-1 rounded-xl p-3 text-sm transition-all duration-200 ${
                turn.role === 'user'
                  ? 'bg-neutral-800/60 border border-neutral-700/50 self-end ml-8'
                  : 'bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-800/30 mr-8'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-1.5 font-medium">
                  {turn.role === 'user' ? (
                    <>
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-neutral-300">You</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-purple-300">Gemini</span>
                      <span className="text-[10px] text-neutral-400">({currentModelVoice})</span>
                    </>
                  )}
                </div>
                <span>{turn.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed mt-1">
                {turn.text}
                {turn.isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-400 animate-pulse align-middle" />
                )}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
