import { WebSocket } from 'ws';
import { BrowserWindow } from 'electron';
import fileManager from './fileManager';
import { getRedeemProcessor } from './redeemRegistry';

interface TwitchEventConfig {
  accessToken: string;
  broadcasterId: string;
  clientId: string;
}

interface ChatMessage {
  userId: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: Date;
  color?: string;
  badges?: string[];
}

interface RewardRedemption {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  rewardId: string;
  rewardTitle: string;
  rewardCost: number;
  userInput?: string;
  timestamp: Date;
  status: 'unfulfilled' | 'fulfilled' | 'canceled';
}

interface TwitchCache {
  messages: ChatMessage[];
  redemptions: RewardRedemption[];
}

class TwitchEventListener {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private config: TwitchEventConfig | null = null;
  private mainWindow: BrowserWindow | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private keepaliveTimer: NodeJS.Timeout | null = null;
  
  private chatMessages: ChatMessage[] = [];
  private rewardRedemptions: RewardRedemption[] = [];
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_FILE = 'twitch-cache.json';
  private readonly CACHE_CONTEXT = 'twitch';

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.loadCache();
  }

  private async loadCache(): Promise<void> {
    try {
      const exists = await fileManager.fileExists(this.CACHE_CONTEXT, this.CACHE_FILE);
      if (!exists) {
        console.log('[TwitchEventListener] No cache file found, starting fresh');
        return;
      }

      const data = await fileManager.readFile(this.CACHE_CONTEXT, this.CACHE_FILE);
      const cache: TwitchCache = JSON.parse(data.toString());
      
      this.chatMessages = cache.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      this.rewardRedemptions = cache.redemptions.map(redemption => ({
        ...redemption,
        timestamp: new Date(redemption.timestamp)
      }));
      
      console.log(`[TwitchEventListener] Cache loaded: ${this.chatMessages.length} messages, ${this.rewardRedemptions.length} redemptions`);
    } catch (error) {
      console.error('[TwitchEventListener] Failed to load cache:', error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cache: TwitchCache = {
        messages: this.chatMessages,
        redemptions: this.rewardRedemptions
      };
      
      await fileManager.writeFile(this.CACHE_CONTEXT, this.CACHE_FILE, JSON.stringify(cache, null, 2));
      console.log('[TwitchEventListener] Cache saved');
    } catch (error) {
      console.error('[TwitchEventListener] Failed to save cache:', error);
    }
  }

  getCachedMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  getCachedRedemptions(): RewardRedemption[] {
    return [...this.rewardRedemptions];
  }

  async connect(accessToken: string, broadcasterId: string, clientId: string): Promise<void> {
    if (this.isConnected()) {
      console.log('[TwitchEventListener] Already connected, skipping connect');
      return;
    }

    console.log('[TwitchEventListener] Connecting to Twitch EventSub...');
    this.config = { accessToken, broadcasterId, clientId };

    try {
      await this.connectWebSocket();
    } catch (error) {
      console.error('[TwitchEventListener] Failed to connect to Twitch EventSub:', error);
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
      console.log("[TwitchEventListener] WebSocket created");

      this.ws.on('open', () => {
        console.log('[TwitchEventListener] Connected to Twitch EventSub WebSocket');
      });

      this.ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message);
          
          if (message.metadata?.message_type === 'session_welcome') {
            resolve();
          }
        } catch (error) {
          console.error('[TwitchEventListener] Error handling message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('[TwitchEventListener] WebSocket error:', error);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`[TwitchEventListener] WebSocket closed - Code: ${code}, Reason: ${reason.toString()}`);
        
        if (this.keepaliveTimer) {
          clearTimeout(this.keepaliveTimer);
          this.keepaliveTimer = null;
        }
        
        this.handleReconnect();
      });

      setTimeout(() => {
        if (!this.sessionId) {
          reject(new Error('Connection timeout'));
        }
      }, 30 * 1000);
    });
  }

  private async handleMessage(message: any): Promise<void> {
    const messageType = message.metadata?.message_type;
    console.log('[TwitchEventListener] Received message type:', messageType);

    switch (messageType) {
      case 'session_welcome':
        await this.handleSessionWelcome(message);
        break;

      case 'session_keepalive':
        this.resetKeepaliveTimer();
        break;

      case 'notification':
        await this.handleNotification(message);
        break;

      case 'session_reconnect':
        await this.handleSessionReconnect(message);
        break;

      default:
        console.log('Unknown message type:', messageType);
    }
  }

  private async handleSessionWelcome(message: any): Promise<void> {
    this.sessionId = message.payload.session.id;
    console.log('[TwitchEventListener] Welcome - Session ID:', this.sessionId);

    this.resetKeepaliveTimer();

    if (this.config) {
      await this.subscribeToEvents();
    }
  }

  private async subscribeToEvents(): Promise<void> {
    if (!this.config || !this.sessionId) return;

    const events = [
      {
        type: 'channel.channel_points_custom_reward_redemption.add',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId
        }
      },
      {
        type: 'channel.channel_points_custom_reward_redemption.update',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId
        }
      },
      {
        type: 'channel.chat.message',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
          user_id: this.config.broadcasterId
        }
      }
    ];

    for (const event of events) {
      try {
        await this.subscribeToEvent(event);
      } catch (error) {
        console.error(`Failed to subscribe to ${event.type}:`, error);
      }
    }
  }

  private async subscribeToEvent(event: any): Promise<void> {
    if (!this.config || !this.sessionId) return;

    const url = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    const headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Client-Id': this.config.clientId,
      'Content-Type': 'application/json'
    };

    const body = {
      type: event.type,
      version: event.version,
      condition: event.condition,
      transport: {
        method: 'websocket',
        session_id: this.sessionId
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to subscribe to ${event.type}: ${JSON.stringify(error)}`);
    }

    console.log(`Subscribed to ${event.type}`);
  }

  private async handleNotification(message: any): Promise<void> {
    const subscriptionType = message.metadata.subscription_type;
    const event = message.payload.event;

    switch (subscriptionType) {
      case 'channel.channel_points_custom_reward_redemption.add':
      case 'channel.channel_points_custom_reward_redemption.update':
        this.handleRewardRedemption(event);
        break;

      case 'channel.chat.message':
        this.handleChatMessage(event);
        break;

      default:
        console.log('Unhandled subscription type:', subscriptionType);
    }
  }

  private handleRewardRedemption(event: any): void {
    const redemption: RewardRedemption = {
      id: event.id,
      userId: event.user_id,
      username: event.user_login,
      userDisplayName: event.user_name,
      rewardId: event.reward.id,
      rewardTitle: event.reward.title,
      rewardCost: event.reward.cost,
      userInput: event.user_input,
      timestamp: new Date(event.redeemed_at),
      status: event.status
    };

    console.log('Reward redeemed:', redemption);

    try {
      const processor = getRedeemProcessor()
      processor?.process(redemption)
    } catch (e) {
      console.error('[TwitchEventListener] Failed to process redemption locally:', e)
    }

    this.rewardRedemptions.unshift(redemption);
    if (this.rewardRedemptions.length > this.MAX_CACHE_SIZE) {
      this.rewardRedemptions.pop();
    }
    
    this.saveCache();

    if (this.mainWindow) {
      this.mainWindow.webContents.send('twitch:reward-redeemed', redemption);
    }
  }

  private handleChatMessage(event: any): void {
    const chatMessage: ChatMessage = {
      userId: event.chatter_user_id,
      username: event.chatter_user_login,
      displayName: event.chatter_user_name,
      message: event.message.text,
      timestamp: new Date(),
      color: event.color,
      badges: event.badges?.map((b: any) => b.set_id) || []
    };

    console.log('Chat message:', chatMessage);

    this.chatMessages.push(chatMessage);
    if (this.chatMessages.length > this.MAX_CACHE_SIZE) {
      this.chatMessages.shift();
    }
    
    this.saveCache();

    if (this.mainWindow) {
      this.mainWindow.webContents.send('twitch:chat-message', chatMessage);
    }

    // Broadcast to alert server for OBS overlay
    const alertBroadcast = (globalThis as any).alertBroadcast;
    if (alertBroadcast) {
      alertBroadcast({
        type: 'twitch-chat',
        username: chatMessage.displayName || chatMessage.username,
        message: chatMessage.message,
        color: chatMessage.color || '#FFFFFF',
        badges: chatMessage.badges,
        timestamp: chatMessage.timestamp
      });
    }
  }

  private async handleSessionReconnect(message: any): Promise<void> {
    const reconnectUrl = message.payload.session.reconnect_url;
    console.log('[TwitchEventListener] Server requested reconnect to:', reconnectUrl);
  }

  private async handleReconnect(): Promise<void> {
    if (this.isConnected()) {
      console.log('[TwitchEventListener] Already connected, skipping reconnect');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[TwitchEventListener] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[TwitchEventListener] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connectWebSocket();
        this.reconnectAttempts = 0;
        console.log('[TwitchEventListener] Reconnected successfully');
      } catch (error) {
        console.error('[TwitchEventListener] Reconnection failed:', error);
      }
    }, delay);
  }

  private resetKeepaliveTimer(): void {
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer);
    }
    console.log('[TwitchEventListener] Keepalive timer reset');

    this.keepaliveTimer = setTimeout(() => {
      console.warn('[TwitchEventListener] Keepalive timeout - connection appears dead');
    }, 60000);
  }

  disconnect(): void {
    console.log('[TwitchEventListener] Disconnecting...');
    
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
    this.config = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export { TwitchEventListener };
export type { ChatMessage, RewardRedemption };