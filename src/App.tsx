/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  AlertCircle,
  Sparkles,
  Radio,
  SlidersHorizontal,
  Volume2,
  RefreshCw,
  Github,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { VoiceVisualizer, VoiceState } from './components/VoiceVisualizer';
import { AudioControls } from './components/AudioControls';
import { LiveTranscript, TranscriptTurn } from './components/LiveTranscript';
import { VoiceSettingsModal, PERSONAS } from './components/VoiceSettingsModal';
import {
  resampleTo16k,
  float32ToPcm16,
  arrayBufferToBase64,
  pcm16Base64ToAudioBuffer,
  calculateRMS,
} from './utils/audioUtils';

export default function App() {
  const [voiceState, setVoiceState] = useState<VoiceState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  // Settings state
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [selectedPersona, setSelectedPersona] = useState('natural');
  const [systemPrompt, setSystemPrompt] = useState(PERSONAS[0].systemInstruction);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-live');

  // Transcript state
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([]);

  // Session duration timer state
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Refs for audio pipeline and WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>('disconnected');
  const currentTurnIdRef = useRef<string | null>(null);

  // Synchronize ref with state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Real-time conversation session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (voiceState !== 'disconnected' && voiceState !== 'connecting') {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
      setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
      interval = setInterval(() => {
        if (sessionStartTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
        }
      }, 1000);
    } else if (voiceState === 'disconnected') {
      sessionStartTimeRef.current = null;
      setSessionDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [voiceState]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio frequency analyser loop for AI output
  useEffect(() => {
    let animId: number;
    const updateAudioMeters = () => {
      if (outputAnalyserRef.current && voiceStateRef.current === 'speaking') {
        const bufferLength = outputAnalyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        outputAnalyserRef.current.getByteFrequencyData(dataArray);
        setFrequencyData(dataArray);

        // Calculate average output volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (bufferLength * 255);
        setAiVolume(avg);
      } else {
        setAiVolume(0);
        setFrequencyData(null);
      }
      animId = requestAnimationFrame(updateAudioMeters);
    };

    animId = requestAnimationFrame(updateAudioMeters);
    return () => cancelAnimationFrame(animId);
  }, []);

  /**
   * Stop all playing audio sources immediately (Barge-in / Interruption)
   */
  const stopAllPlayback = useCallback(() => {
    console.log('[LiveClient] Halting audio playback');
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    });
    activeSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  }, []);

  /**
   * Manual Interrupt Trigger
   */
  const handleInterrupt = useCallback(() => {
    stopAllPlayback();
    setVoiceState('listening');
  }, [stopAllPlayback]);

  /**
   * Teardown audio contexts and media streams
   */
  const cleanupAudioPipeline = useCallback(() => {
    stopAllPlayback();

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (_) {}
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_) {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (_) {}
      outputAudioCtxRef.current = null;
    }

    setUserVolume(0);
    setAiVolume(0);
  }, [stopAllPlayback]);

  /**
   * End Voice Session
   */
  const handleEndSession = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'end_session' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    cleanupAudioPipeline();
    setVoiceState('disconnected');
    setIsMuted(false);
  }, [cleanupAudioPipeline]);

  /**
   * Start Live Voice Session
   */
  const handleStartSession = useCallback(async () => {
    setErrorMessage(null);
    setVoiceState('connecting');

    try {
      // 1. Request Microphone Permission
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      } catch (micErr: any) {
        console.error('Microphone access denied:', micErr);
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser settings to have a voice conversation.'
        );
        setVoiceState('disconnected');
        return;
      }

      // 2. Initialize Output AudioContext (24kHz for Gemini Live speech)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      if (outputAudioCtx.state === 'suspended') {
        await outputAudioCtx.resume();
      }
      outputAudioCtxRef.current = outputAudioCtx;

      const analyser = outputAudioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(outputAudioCtx.destination);
      outputAnalyserRef.current = analyser;
      nextStartTimeRef.current = outputAudioCtx.currentTime;

      // 3. Connect WebSocket to Server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[LiveClient] Connected to live proxy server');
        // Send session initialization configuration
        ws.send(
          JSON.stringify({
            type: 'init',
            voice: selectedVoice,
            systemInstruction: systemPrompt,
            model: selectedModel,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'session_ready') {
            console.log('[LiveClient] Gemini Live session is ready');
            setVoiceState('listening');
          } else if (msg.type === 'audio' && msg.data) {
            // Received model audio output chunk (16-bit PCM, 24kHz)
            const audioCtx = outputAudioCtxRef.current;
            if (!audioCtx) return;

            const audioBuffer = pcm16Base64ToAudioBuffer(msg.data, audioCtx, 24000);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAnalyserRef.current || audioCtx.destination);

            // Precision gapless scheduling
            const now = audioCtx.currentTime;
            if (nextStartTimeRef.current < now) {
              nextStartTimeRef.current = now;
            }
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;

            activeSourcesRef.current.add(source);
            setVoiceState('speaking');

            source.onended = () => {
              activeSourcesRef.current.delete(source);
              if (activeSourcesRef.current.size === 0 && voiceStateRef.current === 'speaking') {
                setVoiceState('listening');
              }
            };
          } else if (msg.type === 'interrupted') {
            console.log('[LiveClient] Model was interrupted');
            stopAllPlayback();
            setVoiceState('listening');
          } else if (msg.type === 'turn_complete') {
            if (activeSourcesRef.current.size === 0) {
              setVoiceState('listening');
            }
          } else if (msg.type === 'transcript') {
            const role = msg.role as 'user' | 'model';
            const text = msg.text as string;

            setTranscriptTurns((prev) => {
              const last = prev[prev.length - 1];
              // If last turn is from same speaker and recent (< 3 seconds), append
              if (last && last.role === role) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text: last.text ? `${last.text} ${text}` : text,
                    timestamp: new Date(),
                  },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(7),
                    role,
                    text,
                    timestamp: new Date(),
                  },
                ];
              }
            });
          } else if (msg.type === 'error') {
            console.error('[LiveClient] Server error:', msg.message);
            setErrorMessage(msg.message || 'An error occurred with Gemini Live');
            handleEndSession();
          } else if (msg.type === 'session_closed') {
            console.log('[LiveClient] Session closed by server');
            handleEndSession();
          }
        } catch (err) {
          console.error('[LiveClient] Failed to parse message:', err);
        }
      };

      ws.onerror = (wsErr) => {
        console.error('[LiveClient] WebSocket error:', wsErr);
        setErrorMessage('Failed to connect to the live conversation server.');
        handleEndSession();
      };

      ws.onclose = () => {
        console.log('[LiveClient] WebSocket closed');
        if (voiceStateRef.current !== 'disconnected') {
          handleEndSession();
        }
      };

      // 4. Initialize Input AudioContext (Mic Capture -> 16kHz PCM)
      const inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      if (inputAudioCtx.state === 'suspended') {
        await inputAudioCtx.resume();
      }
      inputAudioCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      // ScriptProcessorNode for streaming PCM chunks
      const bufferSize = 4096;
      const processor = inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) {
          setUserVolume(0);
          return;
        }

        const inputChannelData = e.inputBuffer.getChannelData(0);
        const rms = calculateRMS(inputChannelData);
        setUserVolume(rms);

        // User speech detection for automatic barge-in / interruption
        if (rms > 0.12 && voiceStateRef.current === 'speaking') {
          console.log('[LiveClient] User speech detected during model output, triggering interruption');
          handleInterrupt();
        }

        // Resample to 16kHz if browser initialized at 44.1k/48k
        const resampled = resampleTo16k(inputChannelData, inputAudioCtx.sampleRate, 16000);
        const pcm16Buffer = float32ToPcm16(resampled);
        const base64Audio = arrayBufferToBase64(pcm16Buffer);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'realtime_input',
              audio: base64Audio,
            })
          );
        }
      };
    } catch (err: any) {
      console.error('[LiveClient] Initialization error:', err);
      setErrorMessage(err?.message || 'Failed to start live voice session.');
      handleEndSession();
    }
  }, [selectedVoice, systemPrompt, selectedModel, stopAllPlayback, handleInterrupt, handleEndSession]);

  /**
   * Toggle Mute
   */
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !next;
        });
      }
      setVoiceState(next ? 'muted' : 'listening');
      return next;
    });
  }, []);

  /**
   * Toggle Session (Start / Stop)
   */
  const handleToggleSession = useCallback(() => {
    if (voiceState === 'disconnected') {
      handleStartSession();
    } else {
      handleEndSession();
    }
  }, [voiceState, handleStartSession, handleEndSession]);

  // Keyboard shortcuts: Space for toggle call, M for mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        if (voiceState !== 'disconnected' && voiceState !== 'connecting') {
          handleToggleMute();
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleToggleSession();
      } else if (e.code === 'KeyI' || e.code === 'Escape') {
        if (voiceState === 'speaking') {
          e.preventDefault();
          handleInterrupt();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, handleToggleMute, handleToggleSession, handleInterrupt]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-neutral-950 text-neutral-100 selection:bg-purple-500 selection:text-white overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-t from-purple-900/20 via-pink-900/10 to-transparent blur-3xl opacity-50" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">LiveVoice AI</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini Live
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Natural real-time voice conversation</p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Session Duration Timer */}
          {voiceState !== 'disconnected' && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border backdrop-blur-md transition-all duration-300 shadow-sm ${
                voiceState === 'connecting'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
              }`}
              title="Active conversation timer"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  voiceState === 'connecting' ? 'bg-indigo-400' : 'bg-emerald-400 animate-ping'
                }`}
              />
              <Clock className="w-3.5 h-3.5 text-current shrink-0" />
              <span>{formatDuration(sessionDuration)}</span>
            </div>
          )}

          {/* Active Voice badge */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden xs:inline">{selectedVoice}</span>
            <span className="hidden sm:inline text-neutral-500">•</span>
            <span className="hidden sm:inline text-neutral-400 truncate max-w-[100px]">
              {selectedModel.replace('gemini-3.8-', '')}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors cursor-pointer"
            title="Open Voice Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area: Focus is the Living Voice Interface */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-3 backdrop-blur-md shadow-xl animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-300 mb-0.5">Connection Notice</p>
              <p className="text-red-300/80 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900/50 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Central Fluid Voice Visualizer */}
        <div className="w-full flex flex-col items-center justify-center flex-1 my-auto">
          <VoiceVisualizer
            state={voiceState}
            userVolume={userVolume}
            aiVolume={aiVolume}
            analyserData={frequencyData}
            onOrbClick={() => {
              if (voiceState === 'disconnected') {
                handleStartSession();
              } else if (voiceState === 'speaking') {
                handleInterrupt();
              }
            }}
          />
        </div>

        {/* Optional Live Transcript Drawer */}
        <LiveTranscript
          turns={transcriptTurns}
          isOpen={showTranscript}
          onClose={() => setShowTranscript(false)}
          onClear={() => setTranscriptTurns([])}
          currentModelVoice={selectedVoice}
        />
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="relative z-10 px-4 pb-8 pt-2">
        <AudioControls
          state={voiceState}
          isMuted={isMuted}
          onToggleSession={handleToggleSession}
          onToggleMute={handleToggleMute}
          onInterrupt={handleInterrupt}
          onOpenSettings={() => setShowSettings(true)}
          onToggleTranscript={() => setShowTranscript((prev) => !prev)}
          showTranscript={showTranscript}
        />
      </footer>

      {/* Settings Modal */}
      <VoiceSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        selectedPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
        systemPrompt={systemPrompt}
        onChangeSystemPrompt={setSystemPrompt}
        model={selectedModel}
        onChangeModel={setSelectedModel}
        isSessionActive={voiceState !== 'disconnected'}
      />
    </div>
  );
}
