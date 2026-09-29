import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mic,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  X,
  Database,
  ArrowRight,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  saveTranscriptToFirestore,
  getTranscriptsFromFirestore,
  FirestoreTranscriptRecord,
} from '../services/firestoreService';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  onLoadIntoVoicePrompt?: (text: string) => void;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  onLoadIntoVoicePrompt,
}) => {
  const { user } = useAuth();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedToFirestore, setSavedToFirestore] = useState(false);
  const [pastTranscripts, setPastTranscripts] = useState<FirestoreTranscriptRecord[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load history from Firestore if signed in
  useEffect(() => {
    if (isOpen && user?.uid) {
      getTranscriptsFromFirestore(user.uid).then(setPastTranscripts);
    }
  }, [isOpen, user?.uid]);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setSavedToFirestore(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      setAudioMimeType(mimeType);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAudioBase64(base64Data);
        };

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : 'Failed to access microphone.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleTranscribe = async () => {
    if (!audioBase64) return;
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      const resultText = data.transcript || '(No speech detected in audio clip)';
      setTranscript(resultText);

      // Auto-persist into Firestore if user is authenticated
      if (user?.uid) {
        await saveTranscriptToFirestore(user.uid, {
          text: resultText,
          model: 'gemini-3.5-transcribe',
          audioDurationSeconds: recordingDuration,
        });
        setSavedToFirestore(true);
        // Refresh past list
        getTranscriptsFromFirestore(user.uid).then(setPastTranscripts);
      }
    } catch (err: any) {
      console.error('Transcription API error:', err);
      setErrorMessage(err?.message || 'Error communicating with gemini-3.5-transcribe');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Audio Transcription
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                  gemini-3.5-transcribe
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Record audio with your microphone for fast, accurate speech-to-text
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Record Control Area */}
          <div className="flex flex-col items-center justify-center py-6 px-4 bg-neutral-950/60 border border-neutral-800 rounded-3xl text-center relative overflow-hidden">
            {/* Pulsing ring while recording */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-32 h-32 rounded-full bg-red-500/10 animate-ping" />
              </div>
            )}

            <div className="relative mb-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isTranscribing}
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Click to Record Microphone"
                >
                  <Mic className="w-9 h-9" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/30 transition-transform active:scale-95 cursor-pointer animate-pulse"
                  title="Click to Stop Recording"
                >
                  <Square className="w-8 h-8 fill-current" />
                </button>
              )}
            </div>

            <div className="text-sm font-semibold text-white">
              {isRecording ? (
                <span className="flex items-center gap-2 text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  Recording Audio... {formatSeconds(recordingDuration)}
                </span>
              ) : audioUrl ? (
                <span>Audio Recorded ({formatSeconds(recordingDuration)})</span>
              ) : (
                <span>Click microphone to begin speech recording</span>
              )}
            </div>

            <div className="text-xs text-neutral-500 mt-1 max-w-sm">
              {isRecording
                ? 'Speak clearly into your microphone, then click stop when done'
                : 'Input speech will be transcribed using Google\'s gemini-3.5-transcribe model'}
            </div>

            {/* Audio Playback & Transcribe Action */}
            {audioUrl && !isRecording && (
              <div className="mt-5 w-full max-w-md flex flex-col items-center gap-3 animate-fade-in">
                <audio
                  ref={audioPlayerRef}
                  src={audioUrl}
                  controls
                  className="w-full h-10 rounded-xl"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isTranscribing ? 'animate-spin' : ''}`} />
                    <span>{isTranscribing ? 'Transcribing with Gemini...' : 'Transcribe Audio'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setAudioUrl(null);
                      setAudioBase64(null);
                      setTranscript(null);
                    }}
                    disabled={isTranscribing}
                    className="p-2.5 text-neutral-400 hover:text-white rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Record Again"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transcript Result Box */}
          {transcript && (
            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-purple-500/30 space-y-4 animate-fade-in shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Transcription Result</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                    gemini-3.5-transcribe
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {savedToFirestore && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Database className="w-3 h-3" /> Saved to Firestore
                    </span>
                  )}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-neutral-100 leading-relaxed font-sans select-text">
                {transcript}
              </div>

              {/* Action buttons to send into Chat or Voice */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/60">
                {onSendToChat && (
                  <button
                    onClick={() => {
                      onSendToChat(transcript);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/20 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Send to Gemini Chatbot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onLoadIntoVoicePrompt && (
                  <button
                    onClick={() => {
                      onLoadIntoVoicePrompt(transcript);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/20 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Load into Voice Session</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Past Transcripts (Firestore Sync) */}
          {pastTranscripts.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  Recent Transcriptions in Firestore ({pastTranscripts.length})
                </span>
                <span className="text-[10px] text-neutral-500">Persistent across sessions</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {pastTranscripts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-neutral-200 line-clamp-2">{item.text}</p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1">
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-purple-400">{item.model}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTranscript(item.text);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Powered by Gemini 3.5 Transcribe</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
