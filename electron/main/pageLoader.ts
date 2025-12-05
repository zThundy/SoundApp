import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';

let originalAppPath = app.getPath('userData');
if (!originalAppPath) originalAppPath = app.getAppPath();

export function loadHtmlPage(pageName: string): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // check if dev environment
  if (process.env.NODE_ENV === 'development') {
    const devPageDir = path.join(__dirname, '../../electron/pages');
    const devFilePath = path.join(devPageDir, `${pageName}.html`);
    let htmlContent = readFileSync(devFilePath, 'utf-8');
    
    // Inject custom HTML/CSS/JS for chat page
    if (pageName === 'chat') {
      htmlContent = injectChatCustomization(htmlContent);
    }
    
    return htmlContent;
  }

  const pageDir = path.join(__dirname, '../pages');
  const filePath = path.join(pageDir, `${pageName}.html`);
  let htmlContent = readFileSync(filePath, 'utf-8');
  
  // Inject custom HTML/CSS/JS for chat page
  if (pageName === 'chat') {
    htmlContent = injectChatCustomization(htmlContent);
  }
  
  return htmlContent;
}

function injectChatCustomization(htmlContent: string): string {
  try {
    const chatPath = `${originalAppPath}/chat`;
    
    // Try to load custom HTML/CSS/JS
    let customHtml = '';
    let customCss = '';
    let customJs = '';
    
    const htmlPath = path.join(chatPath, 'custom.html');
    const cssPath = path.join(chatPath, 'custom.css');
    const jsPath = path.join(chatPath, 'custom.js');
    
    if (existsSync(htmlPath)) {
      customHtml = readFileSync(htmlPath, 'utf-8');
    }
    
    if (existsSync(cssPath)) {
      customCss = readFileSync(cssPath, 'utf-8');
    }
    
    if (existsSync(jsPath)) {
      customJs = readFileSync(jsPath, 'utf-8');
    }
    
    // Replace placeholders if custom content exists
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
