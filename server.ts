import express from 'express';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client lazily or safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function generateProceduralCharacterImage(characterType: string): string {
  const title = characterType || 'Guerreiro Lendário';
  const cleanTitle = title.replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="60%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#030712" />
      </radialGradient>
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="50%" stop-color="#cbd5e1" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>
      <linearGradient id="armorMetal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="30%" stop-color="#1e293b" />
        <stop offset="70%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Studio Dark Ambient Background -->
    <rect width="800" height="800" fill="url(#bgGlow)" />

    <!-- Rim Light Vignette Rings -->
    <circle cx="400" cy="400" r="380" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.15" />
    <circle cx="400" cy="400" r="320" fill="none" stroke="#6366f1" stroke-width="1.5" opacity="0.2" />

    <!-- Character Shoulders & Armor -->
    <path d="M 150 800 L 250 550 L 320 500 L 400 520 L 480 500 L 550 550 L 650 800 Z" fill="url(#armorMetal)" />
    <!-- Metallic Shoulder Pauldrons -->
    <path d="M 120 780 C 180 520, 280 480, 340 540 C 260 620, 180 720, 120 780 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
    <path d="M 680 780 C 620 520, 520 480, 460 540 C 540 620, 620 720, 680 780 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />

    <!-- Neck & Jawline -->
    <path d="M 340 520 L 350 420 L 450 420 L 460 520 Z" fill="#334155" />
    <!-- Face Skull Structure -->
    <path d="M 310 240 C 310 160, 490 160, 490 240 C 490 360, 440 450, 400 460 C 360 450, 310 360, 310 240 Z" fill="url(#skinGrad)" />

    <!-- Cyber / Fantasy Visor Helmet Accent -->
    <path d="M 290 220 C 350 180, 450 180, 510 220 L 520 280 C 450 310, 350 310, 280 280 Z" fill="#0f172a" stroke="#a855f7" stroke-width="3" />
    <path d="M 320 240 L 480 240 L 470 270 L 330 270 Z" fill="#38bdf8" filter="url(#glow)" opacity="0.9" />

    <!-- Glowing Iris / Eyes -->
    <circle cx="360" cy="255" r="14" fill="url(#eyeGlow)" />
    <circle cx="360" cy="255" r="5" fill="#ffffff" />
    <circle cx="440" cy="255" r="14" fill="url(#eyeGlow)" />
    <circle cx="440" cy="255" r="5" fill="#ffffff" />

    <!-- Studio Highlights & War Paint -->
    <path d="M 400 170 L 400 230" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
    <path d="M 340 330 Q 400 360 460 330" fill="none" stroke="#475569" stroke-width="4" stroke-linecap="round" />

    <!-- Title Badge -->
    <rect x="180" y="700" width="440" height="60" rx="12" fill="#09090b" stroke="#38bdf8" stroke-width="2" opacity="0.9" />
    <text x="400" y="736" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="20" font-weight="bold">${cleanTitle}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'MNAnimat Visuals', creator: 'Micael Nildo' });
});

// Gemini AI Text Generation Endpoint
app.post('/api/gemini/generate-text', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: false,
        error: 'GEMINI_API_KEY environment variable is not configured.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt || 'Olá',
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error('Gemini text error:', error?.message || error);
    res.status(200).json({
      success: false,
      error: error?.message || 'Erro no servidor Gemini',
      text: 'Serviço de IA temporariamente indisponível por cota.',
    });
  }
});

// Gemini AI Game Character Painting & Image Generation Endpoint
app.post('/api/gemini/generate-painting', async (req, res) => {
  const { characterType, style, prompt } = req.body;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackUrl = generateProceduralCharacterImage(characterType || 'Guerreiro');
      return res.json({
        success: true,
        imageUrl: fallbackUrl,
        prompt: prompt || characterType,
        isFallback: true,
      });
    }

    const imagePrompt =
      prompt ||
      `Ultra-realistic AAA video game character portrait face, ${characterType || 'human male warrior hero'}, hyperdetailed digital painting, sub-surface skin scattering, realistic iris detail, studio lighting, highly detailed pores, 8k resolution`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ success: true, imageUrl, prompt: imagePrompt });
      }
    } catch (apiErr: any) {
      console.warn('Gemini API quota or image generation fallback triggered:', apiErr?.message || apiErr);
    }

    // Fallback to high detail procedural painting SVG data URL
    const fallbackUrl = generateProceduralCharacterImage(characterType || 'Guerreiro');
    res.json({
      success: true,
      imageUrl: fallbackUrl,
      prompt: imagePrompt,
      isFallback: true,
      note: 'Retrato gerado via motor procedural artístico de reserva.',
    });
  } catch (error: any) {
    console.error('Gemini image error:', error);
    const fallbackUrl = generateProceduralCharacterImage(characterType || 'Guerreiro');
    res.json({ success: true, imageUrl: fallbackUrl, isFallback: true });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/ws/collaborate' });

  interface ClientInfo {
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
    mode: string;
    activeTool: string;
  }

  const clients = new Map<WebSocket, ClientInfo>();

  const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#f43f5e'];
  const NAMES = ['Ana (Design)', 'Carlos (Vetores)', 'Micael (Pintura)', 'Juliana (3D)', 'Lucas (Animação)'];

  wss.on('connection', (ws) => {
    const id = `user_${Math.random().toString(36).substring(2, 9)}`;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];

    const info: ClientInfo = {
      id,
      name,
      color,
      x: 300,
      y: 300,
      mode: 'painting',
      activeTool: 'Pincel',
    };
    clients.set(ws, info);

    const sendPresence = () => {
      const usersList = Array.from(clients.values());
      const msg = JSON.stringify({ type: 'presence', users: usersList });
      for (const client of clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }
    };

    sendPresence();

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'cursor') {
          info.x = data.x;
          info.y = data.y;
          if (data.mode) info.mode = data.mode;
          if (data.activeTool) info.activeTool = data.activeTool;
          if (data.name) info.name = data.name;

          const updateMsg = JSON.stringify({
            type: 'cursor_update',
            id: info.id,
            name: info.name,
            color: info.color,
            x: info.x,
            y: info.y,
            mode: info.mode,
            activeTool: info.activeTool,
          });

          for (const [client] of clients.entries()) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(updateMsg);
            }
          }
        }
      } catch (e) {
        // ignore parse error
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      sendPresence();
    });
  });
}

startServer();
