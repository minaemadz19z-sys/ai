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

import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { saveConversation, getUserConversations, getConversationWithTurns } from './src/db/conversations.ts';
import { getOrCreateUser } from './src/db/users.ts';

const app = express();
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Helper to get GoogleGenAI instance
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API health and status check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-live',
    transcribeModel: 'gemini-3.5-transcribe',
    chatModels: ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'],
    hasCloudSql: Boolean(process.env.SQL_HOST),
  });
});

// Audio transcription endpoint using gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 data in request body' });
    }

    const ai = getGeminiClient();

    // Call gemini-3.5-transcribe model for audio transcription
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBase64,
          },
        },
        {
          text: 'Transcribe this spoken audio accurately and verbatim. Return only the transcription.',
        },
      ],
    });

    const transcript = response.text?.trim() || '';
    res.json({
      success: true,
      transcript,
      model: 'gemini-3.5-transcribe',
    });
  } catch (error: any) {
    console.error('[Transcribe] Error with gemini-3.5-transcribe:', error);
    res.status(500).json({
      error: error?.message || 'Failed to transcribe audio with gemini-3.5-transcribe',
    });
  }
});

// Multi-turn Gemini chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.5-flash', systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages array in request body' });
    }

    // Supported models per brief:
    // - gemini-3.1-pro-preview for particularly complex tasks
    // - gemini-3.5-flash for general tasks
    // - gemini-3.1-flash-lite for tasks that should happen fast
    const allowedModels = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    const ai = getGeminiClient();

    // Format conversation history for Gemini generateContent
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.text || m.content || '') }],
    }));

    const config: any = {};
    if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    res.json({
      success: true,
      text: response.text?.trim() || '',
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('[Chat] Error generating chat response:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate chat response from Gemini',
    });
  }
});

// Extract user profile facts and conversational memory from conversation transcript
app.post('/api/memory/extract', async (req, res) => {
  try {
    const { transcript, existingFacts = [], existingInterests = [], existingGoals = [] } = req.body;
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: 'Missing or empty transcript array' });
    }

    const ai = getGeminiClient();

    // Format transcript turns for analysis
    const formattedDialogue = transcript
      .map((t: any) => `${t.role === 'user' ? 'User' : 'Alex (AI)'}: ${t.text}`)
      .join('\n');

    const prompt = `Analyze this spoken voice conversation between a user and Alex (an American conversational AI coach).
Your goal is to build an ongoing personal knowledge dossier/memory about the user so Alex can remember everything about them in future conversations.
The primary language of interaction and notes MUST be English.

Existing memory facts already known:
${existingFacts.length > 0 ? existingFacts.map((f: string) => `- ${f}`).join('\n') : '(None yet)'}

Conversation Transcript:
${formattedDialogue}

Extract and return a valid JSON object strictly matching this schema:
{
  "detectedName": string | null (user's name if mentioned),
  "detectedEnglishLevel": "Beginner" | "Intermediate" | "Advanced" | "Fluent",
  "newFacts": string[] (concrete, durable facts about the user: occupation, location, family/friends, hobbies, personal preferences. Do not duplicate existing facts),
  "newInterests": string[] (topics, hobbies, or cultural areas they enjoy),
  "newGoals": string[] (any learning goals, life goals, or aspirations mentioned),
  "culturalTopicsDiscussed": string[] (American culture, slang, or daily habits discussed),
  "conversationSummary": string (a concise 1-2 sentence English summary of what was discussed)
}
Return ONLY valid JSON with no markdown fences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let extracted: any = {};
    try {
      const text = response.text?.trim() || '{}';
      extracted = JSON.parse(text);
    } catch (parseErr) {
      console.warn('[Memory] Failed to parse JSON, falling back:', parseErr);
    }

    res.json({
      success: true,
      memory: {
        detectedName: extracted.detectedName || null,
        detectedEnglishLevel: extracted.detectedEnglishLevel || 'Intermediate',
        newFacts: Array.isArray(extracted.newFacts) ? extracted.newFacts : [],
        newInterests: Array.isArray(extracted.newInterests) ? extracted.newInterests : [],
        newGoals: Array.isArray(extracted.newGoals) ? extracted.newGoals : [],
        culturalTopicsDiscussed: Array.isArray(extracted.culturalTopicsDiscussed)
          ? extracted.culturalTopicsDiscussed
          : [],
        conversationSummary:
          extracted.conversationSummary || 'Spoke with Alex about daily conversational English and American culture.',
        primaryLanguage: 'English',
      },
    });
  } catch (error: any) {
    console.error('[Memory] Error extracting user memory:', error);
    res.status(500).json({
      error: error?.message || 'Failed to extract user memory from transcript',
    });
  }
});

// Synchronize authenticated Firebase user into Cloud SQL
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { email, displayName, photoUrl } = req.body;
    const uid = req.user?.uid;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing uid or email' });
    }

    const user = await getOrCreateUser(uid, email, displayName, photoUrl);
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Failed to sync user with database:', error);
    res.status(500).json({ error: error.message || 'Database user sync failed' });
  }
});

// Save voice conversation and turns to Cloud SQL
app.post('/api/conversations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || (req.body.userEmail as string) || 'user@example.com';
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized: Missing user UID' });
    }

    const { title, voiceModel, durationSeconds, turns } = req.body;
    const saved = await saveConversation({
      userUid: uid,
      userEmail: email,
      userDisplayName: req.user?.name,
      title: title || 'Voice Conversation',
      voiceModel: voiceModel || 'Zephyr',
      durationSeconds: Number(durationSeconds) || 0,
      turns: Array.isArray(turns) ? turns : [],
    });

    res.json({ success: true, conversation: saved });
  } catch (error: any) {
    console.error('Failed to save conversation:', error);
    res.status(500).json({ error: error.message || 'Failed to save conversation to database' });
  }
});

// Fetch user conversation history from Cloud SQL
app.get('/api/conversations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized: Missing user UID' });
    }

    const list = await getUserConversations(uid);
    res.json({ success: true, conversations: list });
  } catch (error: any) {
    console.error('Failed to fetch conversations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

// Fetch single conversation with turns from Cloud SQL
app.get('/api/conversations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const convId = parseInt(req.params.id, 10);
    if (!uid || isNaN(convId)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const details = await getConversationWithTurns(convId, uid);
    if (!details) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, conversation: details });
  } catch (error: any) {
    console.error('Failed to fetch conversation details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversation details' });
  }
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
          voice = 'Alex',
          systemInstruction = 'You are a friendly, warm, natural, and concise voice AI assistant. Keep responses punchy, expressive, and conversational.',
          model = 'gemini-3.8-live',
        } = data;

        // Map Alex to 'Puck' (youthful native American male voice) for Gemini Live API
        let targetVoiceName = 'Puck';
        if (voice === 'Alex' || voice.toLowerCase().includes('alex')) {
          targetVoiceName = 'Puck';
        } else if (['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'].includes(voice)) {
          targetVoiceName = voice;
        } else {
          targetVoiceName = 'Puck';
        }

        console.log(`[Live] Initializing session with model=${model}, requestedVoice=${voice}, liveVoice=${targetVoiceName}`);

        try {
          liveSession = await ai.live.connect({
            model: model || 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: targetVoiceName },
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
