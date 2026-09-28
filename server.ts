import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());

// API health and status check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-live',
  });
});

const server = http.createServer(app);

// WebSocket Server for Gemini Live API
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live] Client connected to WebSocket');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please check your AI Studio secrets.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let liveSession: any = null;
  let isClosing = false;

  const safeCloseSession = async () => {
    if (liveSession && !isClosing) {
      isClosing = true;
      try {
        console.log('[Live] Closing Gemini Live session');
        await liveSession.close?.();
      } catch (err) {
        console.error('[Live] Error closing session:', err);
      } finally {
        liveSession = null;
      }
    }
  };

  clientWs.on('message', async (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.type === 'init') {
        const {
          voice = 'Zephyr',
          systemInstruction = 'You are a friendly, warm, natural, and concise voice AI assistant. Keep responses punchy, expressive, and conversational.',
          model = 'gemini-3.8-live',
        } = data;

        console.log(`[Live] Initializing session with model=${model}, voice=${voice}`);

        try {
          liveSession = await ai.live.connect({
            model: model || 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              // Enable transcription for both user input and AI output
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
            callbacks: {
              onopen: () => {
                console.log('[Live] Connected to Gemini Live API');
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'session_ready' }));
                }
              },
              onmessage: (message: LiveServerMessage) => {
                if (clientWs.readyState !== WebSocket.OPEN) return;

                // Handle server audio output
                const parts = message.serverContent?.modelTurn?.parts;
                if (parts && parts.length > 0) {
                  for (const part of parts) {
                    if (part.inlineData?.data) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          data: part.inlineData.data,
                        })
                      );
                    }
                    if (part.text) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'transcript',
                          role: 'model',
                          text: part.text,
                        })
                      );
                    }
                  }
                }

                // Handle user/model live transcription if emitted separately
                const outputText = (message.serverContent as any)?.outputAudioTranscription?.text;
                if (outputText) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'model',
                      text: outputText,
                    })
                  );
                }

                const inputText = (message.serverContent as any)?.inputAudioTranscription?.text;
                if (inputText) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'user',
                      text: inputText,
                    })
                  );
                }

                // Handle interruption flag
                if (message.serverContent?.interrupted) {
                  console.log('[Live] Model output was interrupted');
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // Handle turn completion
                if (message.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                }
              },
              onerror: (err: any) => {
                console.error('[Live] Error in Gemini Live API:', err);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'error',
                      message: err?.message || 'Error occurred in Gemini Live connection',
                    })
                  );
                }
              },
              onclose: (closeEvent: any) => {
                console.log('[Live] Gemini Live session closed:', closeEvent?.reason);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'session_closed',
                      reason: closeEvent?.reason,
                    })
                  );
                }
              },
            },
          });
        } catch (initErr: any) {
          console.error('[Live] Failed to connect to Gemini Live API:', initErr);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: initErr?.message || 'Failed to establish Gemini Live session',
              })
            );
          }
        }
      } else if (data.type === 'realtime_input' && data.audio) {
        if (liveSession) {
          try {
            liveSession.sendRealtimeInput({
              audio: {
                data: data.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (sendErr) {
            console.error('[Live] Error sending realtime input:', sendErr);
          }
        }
      } else if (data.type === 'end_session') {
        await safeCloseSession();
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'session_ended' }));
        }
      }
    } catch (parseErr) {
      console.error('[Live] Invalid message from client:', parseErr);
    }
  });

  clientWs.on('close', async () => {
    console.log('[Live] Client WebSocket disconnected');
    await safeCloseSession();
  });

  clientWs.on('error', async (wsErr) => {
    console.error('[Live] Client WebSocket error:', wsErr);
    await safeCloseSession();
  });
});

// Configure Vite or Static files
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live AI Voice App running on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});
