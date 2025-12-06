import { ipcMain } from 'electron';
import fileManager from '../fileManager';

const LANGUAGE_CONTEXT = 'state';
const LANGUAGE_FILE = 'language.json';

interface LanguageConfig {
  language: string;
}

const DEFAULT_LANGUAGE = 'en-EN';

export function registerLanguageHandlers() {
  ipcMain.handle('language:get', async () => {
    try {
      const exists = await fileManager.fileExists(LANGUAGE_CONTEXT, LANGUAGE_FILE);
      if (!exists) {
        return { language: DEFAULT_LANGUAGE };
      }

      const data = await fileManager.readFile(LANGUAGE_CONTEXT, LANGUAGE_FILE);
      const config: LanguageConfig = JSON.parse(data.toString());
      
      console.debug('[LanguageHandlers] Lingua caricata:', config.language);
      return { language: config.language || DEFAULT_LANGUAGE };
    } catch (error) {
      console.error('[LanguageHandlers] Errore nel caricamento della lingua:', error);
      return { language: DEFAULT_LANGUAGE };
    }
  });

  ipcMain.handle('language:set', async (_event, language: string) => {
    try {
      const config: LanguageConfig = { language };
      const data = JSON.stringify(config, null, 2);
      
      await fileManager.writeFile(LANGUAGE_CONTEXT, LANGUAGE_FILE, data);
      console.debug('[LanguageHandlers] Lingua salvata:', language);
      
      return { success: true };
    } catch (error) {
      console.error('[LanguageHandlers] Errore nel salvataggio della lingua:', error);
      return { success: false, error: String(error) };
    }
  });
}
