import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Trash2,
  Check,
  User,
  Sparkles,
  Volume2,
  Download,
  Clock,
  MessageSquare,
  ChevronDown,
  FileText,
  FileCode,
  HardDrive,
} from 'lucide-react';

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
  sessionDuration?: number;
  isSessionActive?: boolean;
  onOpenWorkspace?: () => void;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  turns,
  isOpen,
  onClose,
  onClear,
  currentModelVoice,
  sessionDuration = 0,
  isSessionActive = false,
  onOpenWorkspace,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<'txt' | 'json' | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  const userTurnCount = turns.filter((t) => t.role === 'user').length;
  const aiTurnCount = turns.filter((t) => t.role === 'model').length;

  const formatSessionTime = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    if (turns.length === 0) return;
    const text = turns
      .map(
        (t) =>
          `[${(t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp)).toLocaleTimeString()}] ${
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

  const handleExportText = () => {
    if (turns.length === 0) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');

    const header = [
      '==================================================',
      'LiveVoice AI - Conversation Transcript',
      `Date: ${now.toLocaleString()}`,
      `Model Voice: ${currentModelVoice}`,
      `Total Turns: ${turns.length} (${userTurnCount} You, ${aiTurnCount} AI)`,
      `Session Duration: ${formatSessionTime(sessionDuration)}`,
      '==================================================',
      '',
    ].join('\n');

    const conversationText = turns
      .map(
        (t) =>
          `[${(t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp)).toLocaleTimeString()}] ${
            t.role === 'user' ? 'User' : `Gemini (${currentModelVoice})`
          }:\n${t.text}\n`
      )
      .join('\n');

    const footer = [
      '',
      '==================================================',
      'Exported from LiveVoice AI (Gemini Live API)',
      '==================================================',
    ].join('\n');

    const fullContent = `${header}${conversationText}${footer}`;
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `livevoice-conversation-${dateStr}_${timeStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('txt');
    setShowDownloadMenu(false);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleExportJson = () => {
    if (turns.length === 0) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');

    const exportPayload = {
      app: 'LiveVoice AI',
      exportedAt: now.toISOString(),
      session: {
        durationSeconds: sessionDuration,
        formattedDuration: formatSessionTime(sessionDuration),
        voiceModel: currentModelVoice,
        totalTurns: turns.length,
        userTurns: userTurnCount,
        aiTurns: aiTurnCount,
      },
      turns: turns.map((t) => ({
        id: t.id,
        role: t.role,
        speaker: t.role === 'user' ? 'You' : `Gemini (${currentModelVoice})`,
        text: t.text,
        timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : new Date(t.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `livevoice-conversation-${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('json');
    setShowDownloadMenu(false);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Live Transcript</h3>
        </div>

        <div className="flex items-center gap-1.5">
          {turns.length > 0 && (
            <>
              {/* Download Dropdown (JSON or TXT) */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setShowDownloadMenu((prev) => !prev)}
                  title="Download conversation history as JSON or text file"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 border cursor-pointer ${
                    downloadSuccess
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-200 hover:text-white border-neutral-700/60'
                  }`}
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Downloaded .{downloadSuccess}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-purple-400" />
                      <span>Download</span>
                      <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* Dropdown Options */}
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-neutral-900/95 border border-neutral-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 border-b border-neutral-800/80 mb-1">
                      Download Format
                    </div>
                    <button
                      onClick={handleExportText}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-neutral-200 hover:text-white hover:bg-purple-600/20 text-left transition-colors cursor-pointer group"
                    >
                      <div className="p-1 rounded bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-200 group-hover:text-white">Text File (.txt)</div>
                        <div className="text-[10px] text-neutral-400">Clean readable transcript</div>
                      </div>
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-neutral-200 hover:text-white hover:bg-indigo-600/20 text-left transition-colors cursor-pointer group"
                    >
                      <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                        <FileCode className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-200 group-hover:text-white">JSON File (.json)</div>
                        <div className="text-[10px] text-neutral-400">Structured data with turns</div>
                      </div>
                    </button>
                    {onOpenWorkspace && (
                      <button
                        onClick={() => {
                          setShowDownloadMenu(false);
                          onOpenWorkspace();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-neutral-200 hover:text-white hover:bg-emerald-600/20 text-left transition-colors cursor-pointer group border-t border-neutral-800/80 mt-1 pt-2"
                      >
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                          <HardDrive className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-200 group-hover:text-white">Google Drive Hub</div>
                          <div className="text-[10px] text-neutral-400">Upload & browse Drive files</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Copy Transcript Button */}
              <button
                onClick={handleCopy}
                title="Copy conversation to clipboard"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Clear Transcript Button */}
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
            className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3.5">
        {/* Total Turns Widget */}
        <div className="flex items-center gap-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-400 font-medium">Total Turns</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-white tracking-tight">{turns.length}</span>
              <span className="text-[10px] text-neutral-500 truncate">
                ({userTurnCount} You • {aiTurnCount} AI)
              </span>
            </div>
          </div>
        </div>

        {/* Total Session Time Widget */}
        <div className="flex items-center gap-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5">
          <div
            className={`p-2 rounded-lg border shrink-0 ${
              isSessionActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/60'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-400 font-medium">Session Time</div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold font-mono text-white tracking-tight">
                {formatSessionTime(sessionDuration)}
              </span>
              {isSessionActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Model Voice Widget (Shown on sm+ screens or 3rd column) */}
        <div className="hidden sm:flex items-center gap-2.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-400 font-medium">Voice Model</div>
            <div className="text-base font-bold text-white truncate tracking-tight">
              {currentModelVoice}
            </div>
          </div>
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
