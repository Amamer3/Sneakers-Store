import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { ViteDevServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

// Type for our WebSocket connections with extra metadata
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  subscriptions: Set<string>;
}

// Create a mock data generator for metrics
const generateMockMetrics = () => ({
  cpu: { usage: Math.random() * 100 },
  memory: {
    total: 16 * 1024 * 1024 * 1024,
    used: Math.random() * 16 * 1024 * 1024 * 1024,
  },
  requests: {
    activeConnections: Math.floor(Math.random() * 100),
    requestsPerMinute: Math.floor(Math.random() * 1000),
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 5173,
    // Configure WebSocket server
    configure: (server: ViteDevServer) => {
      if (!server.httpServer) return;

      const wss = new WebSocketServer({ 
        noServer: true 
      });
      
      server.httpServer.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      });

      // Set up heartbeat to detect stale connections
      const interval = setInterval(() => {
        wss.clients.forEach((ws: WebSocket) => {
          const extWs = ws as ExtWebSocket;
          if (extWs.isAlive === false) {
            return ws.terminate();
          }
          extWs.isAlive = false;
          ws.ping();
        });
      }, 30000);

      wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');
        const extWs = ws as ExtWebSocket;
        extWs.isAlive = true;
        extWs.subscriptions = new Set();

        // Handle pong messages for connection health checks
        ws.on('pong', () => {
          (ws as ExtWebSocket).isAlive = true;
        });

        // Handle subscription messages
        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            
            if (data.type === 'subscribe') {
              extWs.subscriptions.add(data.payload.type);
              console.log(`Client subscribed to: ${data.payload.type}`);
            } else if (data.type === 'unsubscribe') {
              extWs.subscriptions.delete(data.payload.type);
              console.log(`Client unsubscribed from: ${data.payload.type}`);
            }
          } catch (e) {
            console.error('Error processing message:', e);
          }
        });

        // Clean up on client disconnect
        ws.on('close', () => {
          console.log('Client disconnected');
        });

        // Start sending mock metrics if client subscribes
        const metricsInterval = setInterval(() => {
          if (extWs.subscriptions.has('metrics') && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'metrics',
              payload: generateMockMetrics()
            }));
          }
        }, 5000);

        // Clean up interval on close
        ws.on('close', () => {
          clearInterval(metricsInterval);
        });
      });

      // Clean up on server close
      server.httpServer.on('close', () => {
        clearInterval(interval);
      });
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

