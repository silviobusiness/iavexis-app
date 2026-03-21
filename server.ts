import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  // WebSocket Server setup
  const wss = new WebSocketServer({ 
    server,
    path: '/ws-custom' // Use a specific path to avoid conflicts with Vite HMR
  });

  // Handle errors on the WebSocket server itself
  wss.on('error', (error) => {
    console.error('WebSocket Server error:', error);
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established from:', req.socket.remoteAddress);
    
    // Handle errors on individual socket connections
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });

    // Connection health tracking
    let isAlive = true;
    ws.on('pong', () => {
      isAlive = true;
    });

    // Keep-alive heartbeat
    const interval = setInterval(() => {
      if (isAlive === false) {
        console.log('WebSocket connection timed out, terminating');
        return ws.terminate();
      }
      
      isAlive = false;
      if (ws.readyState === ws.OPEN) {
        try {
          ws.ping();
        } catch (err) {
          console.error('Error sending ping:', err);
        }
      }
    }, 30000);

    ws.on('message', (message) => {
      try {
        console.log('Received message:', message.toString());
        // Echo for testing
        if (ws.readyState === ws.OPEN) {
          ws.send(`Echo: ${message}`);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    ws.on('close', (code, reason) => {
      clearInterval(interval);
      console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    });
  });

  // Global process error handling to prevent unhandled 'error' events from crashing the server
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    console.log(`WebSocket server active on wss://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
