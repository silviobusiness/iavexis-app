import express from 'express';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/chat', express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { message, history, isProject, imageFiles } = req.body;
      const { generateChatResponse } = await import('./src/services/geminiService');
      const result = await generateChatResponse(message, history, null, imageFiles, isProject);
      res.json(result);
    } catch (error: any) {
      console.error('API Chat Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  app.post('/api/ai', express.json({ limit: '5mb' }), async (req, res) => {
    try {
      const { type, payload } = req.body;
      const gemini = await import('./src/services/geminiService');
      
      let result;
      switch (type) {
        case 'autoCorrect':
          result = await gemini.autoCorrectText(payload.text);
          break;
        case 'improvePrompt':
          result = await gemini.improvePrompt(payload.prompt);
          break;
        case 'extractAndImprove':
          result = await gemini.extractAndImprovePrompt(payload.aiResponse);
          break;
        case 'generateImage':
          result = await gemini.generateImage(payload.prompt);
          break;
        case 'generateProposal':
          result = await gemini.generateAIProposal(payload.clientName, payload.projectName, payload.description);
          break;
        default:
          throw new Error('Tipo de operação AI inválido');
      }
      res.json({ result });
    } catch (error: any) {
      console.error('API AI Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: server, // Use the same server for HMR
        }
      },
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
