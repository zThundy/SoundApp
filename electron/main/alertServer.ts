import http from 'node:http';
import { EventEmitter } from 'node:events';

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
    const emitter = new EventEmitter();
    let nextClientId = 1;
    const clients: SseClient[] = [];

    const server = http.createServer((req, res) => {
      if (!req.socket.remoteAddress || req.socket.remoteAddress !== '127.0.0.1') {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      if (req.url === '/events') {
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

      if (req.url === '/' || req.url?.startsWith('/index')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Twitch Alerts</title>
    <style>
        html,
        body {
            margin: 0;
            padding: 0;
            background: hsla(0 0% 100% / 0);
            color: #000;
            font-family: system-ui, Arial, sans-serif;
        }

        #container {
            position: relative;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            /* animation: fade 6s ease-in-out forwards; */
        }

        .alert {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: 600;
            animation: fade 5s ease-out forwards;
        }

        .fadeImageWrap {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .fadeImageWrap img {
            max-width: 50vw;
            height: auto;
            display: block;
            margin: 0 auto 1rem;
        }

        .fadeImageWrap .caption {
            font-size: 2rem;
            font-weight: 600;
        }

        @keyframes fade {
            0%, 100% {
              opacity: 0;
            }

            20%, 80% {
              opacity: 1;
            }

            50% {
              opacity: 1;
            }
        }
    </style>
</head>

<body>
    <div id="container"></div>
    <script>
        const es = new EventSource('/events');
        es.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                if (data.type === 'alert') {
                    const node = document.createElement('div');
                    node.className = 'alert';
                    node.textContent = data.text || 'Alert';
                    document.getElementById('container').appendChild(node);
                    setTimeout(() => node.remove(), 6000);
                } else if (data.type === 'imageTemplate') {
                    const wrap = document.createElement('div');
                    wrap.className = 'fadeImageWrap';
                    const img = document.createElement('img');
                    if (!data.imageDataUrl) data.imageDataUrl = "logo.png";
                    img.src = data.imageDataUrl;
                    const caption = document.createElement('div');
                    caption.className = 'caption';
                    caption.textContent = data.text || '';
                    wrap.appendChild(img);
                    wrap.appendChild(caption);
                    document.getElementById('container').appendChild(wrap);
                    setTimeout(() => wrap.remove(), (data.duration || 6000));
                } else if (data.type === 'raw') {
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'absolute';
                    wrapper.style.top = '0';
                    wrapper.style.left = '0';
                    wrapper.style.width = '100%';
                    wrapper.style.height = '100%';
                    let html = data.html || '';
                    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\\/script>/gi, '');
                    wrapper.innerHTML = html;
                    if (data.css) {
                      const styleEl = document.createElement('style');
                      styleEl.textContent = data.css;
                      wrapper.appendChild(styleEl);
                    }
                    document.getElementById('container').appendChild(wrapper);
                    if (data.js) {
                      try { new Function(data.js)(); } catch (e) { console.error('Raw JS error', e); }
                    }
                    setTimeout(() => wrapper.remove(), data.duration || 10000);
                }
            } catch (e) {
                console.error('Bad alert payload', e, ev.data);
            }
        };
    </script>
</body>

</html>          
`);
        return;
      }

      // 404 fallback
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    function broadcast(payload: unknown) {
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
          server.close(err => err ? rej(err) : res());
        })
      });
    });
  });
}
