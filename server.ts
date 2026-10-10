import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { INITIAL_UNITS } from './src/data/pujaData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini AI client initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function parseBase64Image(dataUri: string) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/png', base64: dataUri };
}

// In-memory data store for server synchronization fallback
let serverUnitsData: Record<string, [string, number][]> = { ...INITIAL_UNITS };
let serverPaymentState: Record<string, any> = {};

// Committee Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body;
  const inputUser = (userId || '').trim().toLowerCase();
  const inputPass = (password || '').trim().toLowerCase();

  const isAdmin = (inputUser === 'kqu2026' && inputPass === '712407') ||
                  (inputUser === 'admin' && inputPass === 'durga2026') ||
                  (inputUser === 'kqu' && inputPass === 'kqu2026');

  const isUnit = inputUser.startsWith('unit') && inputPass === 'kqu';

  if (isAdmin) {
    res.json({
      success: true,
      user: {
        role: 'admin',
        userId: 'KQU2026',
        name: 'Committee Admin (KQU2026)',
        canChangeData: true,
      },
    });
  } else if (isUnit) {
    res.json({
      success: true,
      user: {
        role: 'unit',
        userId: inputUser.toUpperCase(),
        name: `${inputUser.toUpperCase()} User (Enter Once)`,
        canChangeData: false,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials. Unit: UNIT1.. & KQU. Admin: KQU2026 & 712407',
    });
  }
});

// Endpoint: Live text conversation fallback (powered by gemini-3.8-flash with Bengali & English knowledge)
app.post('/api/ai/live-chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const systemInstruction = `You are the official devotional AI companion for DURGA PUJA 2026 KQU (শারদোৎসব ২০২৬ / ১৪৩৩), celebrated at KQU PWI OFFICE Ground, West Bengal.
President: SANJOY KUMAR DAS.
Treasurer: DHANANJAY KUMAR.
Key Details:
- Schedule: Mahalaya (Oct 10, Chandi Path 4am, Tarpan 6am), Maha Sasthi (Oct 16, Bodhon 6pm), Maha Saptami (Oct 17, Kola Bou Snan 6am, Pushpanjali 10:30am, Dhunuchi Naach 7pm), Maha Ashtami (Oct 18, Kumari Puja 12pm, Sacred Sandhi Puja with 108 lamps and lotuses at 4:48pm), Maha Nabami (Oct 19, Nabami Homa 9am, Mahaprasad Bhog 1pm), Vijaya Dashami (Oct 20, Darpan Bisarjan 9:30am, Sindoor Khela 11am, Shobhajatra 5:30pm).
- Bhog: Khichuri, Chholar Dal, Luchi, Labra, Beguni, Payesh, Rosogolla.
- Online Chanda contributions generate verified e-receipts signed by the President & Treasurer.
Respond warmly, respectfully, and informatively. You are fluent in both Bengali and English. Give concise, spiritually uplifting and helpful answers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...history.map((h: any) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      text: response.text || 'শুভ শারদীয়া! মা দুর্গা সকলের কল্যাণ করুন।',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/live-chat:', error);
    res.status(500).json({ error: error?.message || 'Chat error' });
  }
});

// Endpoint: Generate Image using text prompt
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', imageSize = '1K' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt text is required' });
      return;
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(400).json({
        error: 'Gemini API key is not configured in environment variables.',
      });
      return;
    }

    const modelsToTry = [
      'gemini-3.1-flash-lite-image',
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-image-preview',
    ];

    let lastError: any = null;
    let generatedImageUrl: string | null = null;
    let modelUsed = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: (imageSize as any) || '1K',
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
              modelUsed = modelName;
              break;
            }
          }
        }
        if (generatedImageUrl) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (generatedImageUrl) {
      res.json({
        success: true,
        imageUrl: generatedImageUrl,
        prompt,
        modelUsed,
      });
      return;
    }

    res.status(502).json({
      error: lastError?.message || 'Failed to generate image from model.',
    });
  } catch (error: any) {
    console.error('Error in /api/image/generate:', error);
    res.status(500).json({
      error: error?.message || 'Internal server error while generating image',
    });
  }
});

// Explicit route for Standalone HTML Version
app.get(['/html', '/standalone', '/durga-puja-tracker.html'], (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'durga-puja-tracker.html'));
});

// WebSocket Server for Gemini 3.8 Live API real-time voice conversations
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Gemini 3.8 Live API voice channel');

  let session: any = null;

  try {
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are the official Bengali and English speaking live voice assistant for DURGA PUJA 2026 KQU at KQU PWI Office Ground. You converse warmly about puja schedule, pushpanjali, sandhi puja with 108 lamps, bhog, President Sanjoy Kumar Das, and Treasurer Dhananjay Kumar.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio, text }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });
    }
  } catch (err) {
    console.warn('Gemini Live session setup notice:', err);
  }

  clientWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.audio && session) {
        session.sendRealtimeInput({
          audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (msg.text && session) {
        session.send({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text: msg.text }] }],
            turnComplete: true,
          },
        });
      }
    } catch (e) {
      console.warn('Live websocket message error:', e);
    }
  });

  clientWs.on('close', () => {
    try {
      session?.close?.();
    } catch {}
  });
});

// Dev server vs Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DURGA PUJA 2026 KQU Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
