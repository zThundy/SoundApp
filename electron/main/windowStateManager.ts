import { BrowserWindow } from 'electron';
import fileManager from './fileManager';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

const DEFAULT_STATE: WindowState = {
  width: 1600,
  height: 900,
};

const STATE_CONTEXT = 'state';
const STATE_FILE = 'window-state.json';

class WindowStateManager {
  private window: BrowserWindow | null = null;
  private state: WindowState = DEFAULT_STATE;
  private saveTimeout: NodeJS.Timeout | null = null;

  async loadState(): Promise<WindowState> {
    try {
      const exists = await fileManager.fileExists(STATE_CONTEXT, STATE_FILE);
      if (exists) {
        const data = await fileManager.readFile(STATE_CONTEXT, STATE_FILE);
        const parsedState = JSON.parse(data.toString()) as WindowState;
        
        this.state = {
          width: parsedState.width || DEFAULT_STATE.width,
          height: parsedState.height || DEFAULT_STATE.height,
          x: parsedState.x,
          y: parsedState.y,
          isMaximized: parsedState.isMaximized,
        };

        console.log('[WindowStateManager] Stato caricato:', this.state);
      } else {
        console.log('[WindowStateManager] File di stato non trovato, uso valori di default');
        this.state = DEFAULT_STATE;
      }
    } catch (error) {
      console.error('[WindowStateManager] Errore nel caricamento dello stato:', error);
      this.state = DEFAULT_STATE;
    }

    return this.state;
  }

  private async saveState(): Promise<void> {
    if (!this.window) return;

    try {
      const bounds = this.window.getBounds();
      const isMaximized = this.window.isMaximized();

      this.state = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized,
      };

      const data = JSON.stringify(this.state, null, 2);
      await fileManager.writeFile(STATE_CONTEXT, STATE_FILE, data);
      console.log('[WindowStateManager] Stato salvato:', this.state);
    } catch (error) {
      console.error('[WindowStateManager] Errore nel salvataggio dello stato:', error);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveState();
      this.saveTimeout = null;
    }, 500);
  }

  track(window: BrowserWindow): void {
    this.window = window;

    window.on('resize', () => this.scheduleSave());
    window.on('move', () => this.scheduleSave());
    window.on('maximize', () => this.scheduleSave());
    window.on('unmaximize', () => this.scheduleSave());

    window.on('close', () => {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveState();
    });

    console.log('[WindowStateManager] Tracking attivo per la finestra');
  }

  getState(): WindowState {
    return this.state;
  }

  applyState(window: BrowserWindow): void {
    if (this.state.x !== undefined && this.state.y !== undefined) {
      window.setBounds({
        x: this.state.x,
        y: this.state.y,
        width: this.state.width,
        height: this.state.height,
      });
    } else {
      window.setSize(this.state.width, this.state.height);
      window.center();
    }

    if (this.state.isMaximized) {
      window.maximize();
    }

    console.log('[WindowStateManager] Stato applicato alla finestra');
  }
}

export const windowStateManager = new WindowStateManager();
export default windowStateManager;
