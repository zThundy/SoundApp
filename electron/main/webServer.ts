import http from 'node:http';
import { loadHtmlPage } from './pageLoader';
import { injectCustomization } from './pageLoader';

interface SseClient {
  id: number;
  res: http.ServerResponse;
}

export interface AlertServer {
  port: number;
  broadcast: (payload: unknown) => void;
  stop: () => Promise<void>;
}

export function startAlertServer(preferredPort = 3137): Promise<AlertServer> {
  return new Promise((resolve, reject) => {
    let nextClientId = 1;
    const clients: SseClient[] = [];
    const sockets = new Set<import('net').Socket>();

    const server = http.createServer(async (req, res) => {
      const origin = req.headers.origin;

      if (origin && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        // res.setHeader("Access-Control-Allow-Credentials", "true");
      }

      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

      const rawUrl = req.url || '/'
      let pathname = '/'
      try {
        const u = new URL(rawUrl, `http://127.0.0.1:${preferredPort}`)
        pathname = u.pathname || '/'
      } catch {
        pathname = rawUrl.split('?')[0] || '/'
      }
      if (!req.socket.remoteAddress || req.socket.remoteAddress !== '127.0.0.1') {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      if (pathname === '/events') {
        // SSE endpoint
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': 'http://localhost:' + preferredPort,
        });
        res.write(': connected\n\n');
        const client: SseClient = { id: nextClientId++, res };
        clients.push(client);
        req.on('close', () => {
          const idx = clients.findIndex(c => c.id === client.id);
          if (idx !== -1) clients.splice(idx, 1);
        });
        return;
      }

      if (pathname === "/health") {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (pathname === '/alerts') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        try {
          let htmlContent = await loadHtmlPage('alerts');
          htmlContent = await injectCustomization(htmlContent);
          res.end(htmlContent);
        } catch (err) {
          console.error('Failed to load alerts page:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
        return;
      }

      if (pathname === "/chat") {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        try {
          let htmlContent = await loadHtmlPage('chat');
          htmlContent = await injectCustomization(htmlContent);
          res.end(htmlContent);
        } catch (err) {
          console.error('Failed to load chat page:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
        return;
      }

      if (pathname === "/" || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        try {
          const htmlContent = loadHtmlPage('index');
          res.end(htmlContent);
        } catch (err) {
          console.error('Failed to load index page:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
        return;
      }

      // 404 fallback
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    // Track sockets so we can destroy them on shutdown (SSE keeps them open)
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });

    function broadcast(payload: unknown) {
      console.debug('[AlertServer] Broadcasting payload to', clients.length, 'clients');
      console.debug('[AlertServer] Payload:', payload);
      const dataStr = JSON.stringify(payload);
      for (const c of clients) {
        c.res.write(`data: ${dataStr}\n\n`);
      }
    }

    server.on('error', err => reject(err));

    server.listen(preferredPort, '127.0.0.1', () => {
      const actualPort = (server.address() as any).port;
      resolve({
        port: actualPort,
        broadcast,
        stop: () => new Promise<void>((res, rej) => {
          try {
            // End SSE clients cleanly
            for (const c of clients.splice(0, clients.length)) {
              try { c.res.end(); } catch { /* noop */ }
            }
            // Destroy all sockets to ensure server.close resolves
            for (const s of Array.from(sockets)) {
              try { s.destroy(); } catch { /* noop */ }
            }
            // Close the server
            server.close(err => err ? rej(err) : res());
          } catch (e) {
            rej(e as any);
          }
        })
      });
    });
  });
}
