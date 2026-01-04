import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import fileManager from './fileManager';

const UUID_PATTERN = /\{([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\}/g;

function extnameFromPath(p?: string | null): string {
  if (!p) return '';
  const idx = p.lastIndexOf('.');
  return idx >= 0 ? p.slice(idx).toLowerCase() : '';
}

function isTextExt(ext: string): boolean {
  return ['.txt', '.html', '.htm', '.css', '.js', '.json', '.svg', '.md'].includes(ext);
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.ogg': return 'audio/ogg';
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.txt': return 'text/plain; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.html':
    case '.htm': return 'text/html; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

async function replaceUuidPlaceholders(input: string): Promise<string> {
  if (!input || typeof input !== 'string') return input;
  const uuids = new Set<string>();
  input.replace(UUID_PATTERN, (_m, g1) => {
    uuids.add(String(g1).toLowerCase());
    return '';
  });
  if (uuids.size === 0) return input;

  let output = input;
  for (const uuid of uuids) {
    try {
      const meta = fileManager.readFileMetadata({ uuid });
      if (!meta) throw new Error("[PageLoader] replaceUuidPlaceholders: Unable to get file meta")
      const ext = extnameFromPath(meta?.storagePath || meta?.originalName || '');
      const { buffer } = fileManager.readFile(meta.context, { uuid: meta.uuid });
      const buf = await buffer;
      if (!buf) continue;

      if (isTextExt(ext)) {
        const text = buf.toString('utf-8');
        const re = new RegExp(`\\{${uuid}\\}`, 'gi');
        output = output.replace(re, () => text);
      } else {
        const mime = mimeFromExt(ext);
        const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
        const re = new RegExp(`\\{${uuid}\\}`, 'gi');
        output = output.replace(re, () => dataUrl);
      }
    } catch (e) {
      console.warn('[PageLoader] Failed to replace UUID', uuid, e);
    }
  }
  console.debug('[PageLoader] UUID placeholders replaced, returning output', output);
  return output;
}

export async function loadHtmlPage(pageName: string): Promise<string> {
  let filePath: string;

  const __filename = fileURLToPath(import.meta.url);
  const __currentDir = path.dirname(__filename.replace(/\\/g, '/'));
  const __dirname = path.resolve(__currentDir, '..');

  if (process.env.ELECTRON_ENV === 'development' || process.env.NODE_ENV === 'development') {
    const originalAppPath = app.getAppPath();
    filePath = path.join(originalAppPath, "electron", 'pages', `${pageName}.html`);
  } else {
    filePath = path.join(__dirname, 'pages', `${pageName}.html`);
  }

  console.debug('[PageLoader] Loading HTML page from path:', filePath);
  let htmlContent = readFileSync(filePath, 'utf-8');
  return htmlContent as string;
}

export async function injectCustomization(htmlContent: string): Promise<string> {
  try {
    let customHtml: string = '';
    let customCss: string = '';
    let customJs: string = '';

    if (await fileManager.doesContextExist("chat")) {
      const { buffer: customHtmlBufferPromise } = fileManager.readFile("chat", { relativePath: "custom.html" });
      let customHtmlBuffer = await customHtmlBufferPromise;
      customHtml = customHtmlBuffer ? customHtmlBuffer.toString('utf-8') : '';
      customHtml = await replaceUuidPlaceholders(customHtml);
      // console.debug('[PageLoader] Loaded custom html', customHtml);
      const { buffer: customCssBufferPromise } = fileManager.readFile("chat", { relativePath: "custom.css" });
      let customCssBuffer = await customCssBufferPromise;
      customCss = customCssBuffer ? customCssBuffer.toString('utf-8') : '';
      customCss = await replaceUuidPlaceholders(customCss);
      // console.debug('[PageLoader] Loaded custom css', customCss);
      const { buffer: customJsBufferPromise } = fileManager.readFile("chat", { relativePath: "custom.js" });
      let customJsBuffer = await customJsBufferPromise;
      customJs = customJsBuffer ? customJsBuffer.toString('utf-8') : '';
      customJs = await replaceUuidPlaceholders(customJs);
      // console.debug('[PageLoader] Loaded custom js', customJs);
    }

    if (customCss) {
      htmlContent = htmlContent.replace(
        '<!-- Custom style from frontend -->',
        `<style>${customCss}</style>`
      );
    }

    if (customHtml) {
      htmlContent = htmlContent.replace(
        '<!-- Custom html from frontend -->',
        customHtml
      );
    }

    if (customJs) {
      htmlContent = htmlContent.replace(
        '<!-- Custom js from frontend -->',
        `<script>${customJs}</script>`
      );
    }
  } catch (err) {
    console.error('[PageLoader] Failed to inject chat customization:', err);
  }

  return htmlContent;
}
