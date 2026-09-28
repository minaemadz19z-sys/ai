import React from 'react';
import { Mic, AlertTriangle, X, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  isOpen,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Microphone Access Required</h2>
              <p className="text-xs text-neutral-400">LiveVoice AI needs your microphone to converse in real time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm text-neutral-300">
          <p className="leading-relaxed">
            Your browser blocked or denied microphone permissions for this app. Follow these quick steps to grant access:
          </p>

          <div className="space-y-3 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white">Find the Address Bar Icon:</strong>
                <p className="text-neutral-400 text-xs mt-0.5">
                  Look at the top of your browser address bar. Click the <strong>lock / site info icon</strong> (or tune/microphone icon with a red slash).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white">Allow Microphone:</strong>
                <p className="text-neutral-400 text-xs mt-0.5">
                  Find <strong>Microphone</strong> in the permissions list and change it from <em>Blocked</em> or <em>Ask</em> to <span className="text-emerald-400 font-medium">Allow</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-white">Retry Connection:</strong>
                <p className="text-neutral-400 text-xs mt-0.5">
                  Click the <strong>Try Again</strong> button below to start your conversation.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-400 bg-neutral-800/40 p-3 rounded-xl border border-neutral-800 flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              Your audio is processed purely for real-time conversation with Gemini Live and is never stored permanently.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
