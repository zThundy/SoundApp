import http from 'node:http';
import { loadHtmlPage } from './pageLoader';
import { injectCustomization } from './pageLoader';

interface SseClient {
  id: number;
  res: http.ServerResponse;
}

type TwitchAuthPayload = {
  accessToken?: string | null
  state?: string | null
  error?: string | null
}

type TwitchAuthCompletionHandler = (payload: TwitchAuthPayload) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string }

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

      if (pathname === '/twitch-auth/callback') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Twitch Login</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #0e0e10;
        color: #efeff1;
        display: grid;
        place-items: center;
        min-height: 100vh;
      }
      .card {
        width: min(420px, calc(100vw - 32px));
        padding: 24px;
        border-radius: 16px;
        background: #18181b;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
        text-align: center;
      }
      h1 {
        font-size: 20px;
        margin: 0 0 12px;
      }
      p {
        margin: 0;
        color: #adadb8;
        line-height: 1.5;
      }
      .ok { color: #00db84; }
      .error { color: #ff6b6b; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 id="title">Completing Twitch login…</h1>
      <p id="message">You can return to the app after this page finishes.</p>
    </div>
    <script>
      const titleEl = document.getElementById('title');
      const messageEl = document.getElementById('message');

      const setState = (title, message, className) => {
        titleEl.textContent = title;
        titleEl.className = className || '';
        messageEl.textContent = message;
      };

      const hash = new URLSearchParams(window.location.hash.slice(1));
      const payload = {
        accessToken: hash.get('access_token'),
        state: hash.get('state'),
        error: hash.get('error_description') || hash.get('error')
      };

      if (!payload.accessToken && !payload.error) {
        setState('Login failed', 'No Twitch access token was returned.', 'error');
      } else {
        fetch('/twitch-auth/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(async (response) => {
            const result = await response.json().catch(() => ({ ok: false, error: 'Invalid server response' }));
            if (!response.ok || !result.ok) {
              throw new Error(result.error || 'Failed to complete Twitch login');
            }
            setState('Login completed', 'You can close this tab and return to the app, or wait 60 seconds so that the page will close auto-magically.', 'ok');
            window.setTimeout(() => window.close(), 60 * 1000);
          })
          .catch((error) => {
            setState('Login failed', error.message || 'Unable to notify the app about Twitch login.', 'error');
          });
      }
    </script>
  </body>
</html>`)
        return;
      }

      if (pathname === '/twitch-auth/complete' && req.method === 'POST') {
        try {
          const body = await new Promise<string>((resolveBody, rejectBody) => {
            let raw = '';
            req.setEncoding('utf8');
            req.on('data', chunk => {
              raw += chunk;
              if (raw.length > 1024 * 1024) {
                rejectBody(new Error('Request body too large'));
                req.destroy();
              }
            });
            req.on('end', () => resolveBody(raw));
            req.on('error', rejectBody);
          });

          const payload = (body ? JSON.parse(body) : {}) as TwitchAuthPayload;
          const completionHandler = (globalThis as any).completeTwitchOAuth as TwitchAuthCompletionHandler | undefined;

          if (!completionHandler) {
            res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: 'No pending Twitch login request' }));
            return;
          }

          const result = await completionHandler(payload);
          res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (error: any) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: error?.message ?? 'Failed to process Twitch login callback' }));
        }
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
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ status: 'ok' }));
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
        }
        return;
      }

      if (pathname === "/emote-wall") {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        try {
          const htmlContent = await loadHtmlPage('emote-wall');
          res.end(htmlContent);
        } catch (err) {
          console.error('Failed to load emote wall page:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
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
