import { WebSocket } from 'ws';
import { BrowserWindow } from 'electron';
import fileManager from './fileManager';
import { getRedeemProcessor } from './redeemRegistry';
import { Alert } from "./types/alerts";
import { getChannelEmotes } from "./twitchWorker";

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
  messageFragment: {
    emoteUrl?: string;
    isGif?: boolean;
    type: string;
    text: string;
    cheerEmote?: object;
    emote: {
      id: string;
      emote_set_id: string;
      owner_id: string;
      format: string[];
    },
    mention?: object;
  }[]
}

interface Emote {
  id: string;
  name: string;
  images: { url_1x: string; url_2x: string; url_4x: string };
  tier: string;
  emote_type: string;
  emote_set_id: string;
  format: string[];
  scale: string[];
  theme_mode: string[];
  template: string;
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
  private safeStore: any | null = null;

  private chatMessages: ChatMessage[] = [];
  private rewardRedemptions: Alert[] = [];
  private emotes: Map<string, Emote> = new Map();
  private readonly MAX_CACHE_SIZE = 50000;
  private readonly CACHE_FILE = 'twitch-cache.json';
  private readonly EMOTES_CACHE = "twitch-emotes.json";
  private readonly MESSAGES_CACHE = "twitch-messages.json";
  private readonly CACHE_CONTEXT = 'twitch';

  constructor(safeStore: any, mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.safeStore = safeStore;
    this.loadAllCache();
  }

  private async loadAllCache(): Promise<void> {
    try {
      const redemptionCache = await this.loadCache(this.CACHE_CONTEXT, this.CACHE_FILE);
      if (redemptionCache) {
        this.rewardRedemptions = (redemptionCache as Alert[]).map(redemption => ({
          ...redemption,
          timestamp: new Date(redemption.timestamp)
        }));
      }

      const messagesCache = await this.loadCache(this.CACHE_CONTEXT, this.MESSAGES_CACHE);
      if (messagesCache) {
        this.chatMessages = (messagesCache as ChatMessage[]).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }

      const emotesCache = await this.loadCache(this.CACHE_CONTEXT, this.EMOTES_CACHE);
      if (emotesCache) {
        for (var i in emotesCache) {
          this.emotes.set(i, (emotesCache[i] as Emote));
        }
      }

      console.debug(`[TwitchEventListener] Cache loaded: ${this.chatMessages.length} messages, ${this.rewardRedemptions.length} redemptions, ${this.emotes.size} cached emotes.`);
    } catch (error: any) {
      console.error("[TwitchEventListener] Error while loading global cache", error)
    }
  }

  private async loadCache(context: string, path: string): Promise<ChatMessage[] | Emote[] | Alert[] | null> {
    try {
      const exists = await fileManager.fileExists(context, { relativePath: path });
      if (!exists) {
        console.debug('[TwitchEventListener] No cache file found, starting fresh');
        return null;
      }

      const { buffer } = fileManager.readFile(context, { relativePath: path });
      const data = await buffer;
      const cache: ChatMessage[] | Emote[] | Alert[] = JSON.parse(data.toString());
      return cache;
    } catch (error) {
      console.error('[TwitchEventListener] Failed to load cache:', error);
      return null;
    }
  }

  private async saveCache(context: string, path: string): Promise<void> {
    try {
      console.debug(`[TwitchEventListener] Saving from context ${context} the cache in path ${path}`);
      switch (path) {
        case this.EMOTES_CACHE:
          await fileManager.writeFile(context, { relativePath: path }, JSON.stringify(Object.fromEntries(this.emotes), null, 2));
          break;
        case this.CACHE_FILE:
          await fileManager.writeFile(context, { relativePath: path }, JSON.stringify(this.rewardRedemptions, null, 2));
          break;
        case this.MESSAGES_CACHE:
          await fileManager.writeFile(context, { relativePath: path }, JSON.stringify(this.chatMessages, null, 2));
          break;
      }
      console.debug(`[TwitchEventListener] Cache from context ${context} in path ${path} saved successfully!`);
    } catch (error: any) {
      console.error(`[TwitchEventListener] Error while saving cache from context ${context} in path ${path}`, error);
    }
  }

  getCachedMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  getCachedRedemptions(): Alert[] {
    return [...this.rewardRedemptions];
  }

  async connect(accessToken: string, broadcasterId: string, clientId: string): Promise<void> {
    if (this.isConnected()) {
      console.debug('[TwitchEventListener] Already connected, skipping connect');
      return;
    }

    console.debug('[TwitchEventListener] Connecting to Twitch EventSub...');
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
      if (process.env.IS_PACKAGED === "true") {
        this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
      } else {
        this.ws = new WebSocket("ws://127.0.0.1:8080/ws");
      }
      console.debug("[TwitchEventListener] WebSocket created");

      this.ws.on('open', () => {
        console.debug('[TwitchEventListener] Connected to Twitch EventSub WebSocket');
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
        console.debug(`[TwitchEventListener] WebSocket closed - Code: ${code}, Reason: ${reason.toString()}`);

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
    console.debug('[TwitchEventListener] Received message type:', messageType);

    try {
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
          console.debug('Unknown message type:', messageType);
      }
    } catch (e: any) {
      console.error("[TwitchEventListener] Error while handling websocket message: ", e)
      // } finally {
      //   console.debug("[TwitchEventListener] Received data: ", message)
    }
  }

  private resetKeepaliveTimer(timeInSeconds: number = 60): void {
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer);
    }
    console.debug('[TwitchEventListener] Keepalive timer reset');

    this.keepaliveTimer = setTimeout(() => {
      console.warn('[TwitchEventListener] Keepalive timeout - connection appears dead');
    }, timeInSeconds * 1000);
  }

  private async handleSessionWelcome(message: any): Promise<void> {
    this.sessionId = message.payload.session.id;
    console.debug('[TwitchEventListener] Welcome - Session:', message.payload.session);
    console.debug('[TwitchEventListener] Welcome - Session ID:', this.sessionId);

    this.resetKeepaliveTimer(message.payload.session.keepalive_timeout_seconds);

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
      },
      {
        type: 'channel.follow',
        version: '2',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
          moderator_user_id: this.config.broadcasterId
          // user_id: this.config.broadcasterId
        }
      },
      {
        type: 'channel.raid',
        version: '1',
        condition: {
          to_broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.subscribe',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.subscription.end',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.subscription.gift',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.subscription.message',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.bits.use',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.cheer',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.shared_chat.begin',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.shared_chat.update',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: 'channel.shared_chat.end',
        version: '1',
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: "stream.online",
        version: "1",
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      },
      {
        type: "stream.offline",
        version: "1",
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
        }
      }
    ];

    for (const event of events) {
      try {
        await this.subscribeToEvent(event);
      } catch (error) {
        console.error(`[TwitchEventListener] Failed to subscribe to ${event.type}:`, error);
      }
    }
  }

  private async subscribeToEvent(event: any): Promise<void> {
    if (!this.config || !this.sessionId) return;

    let url = "http://127.0.0.1:8080/eventsub/subscriptions";
    if (process.env.IS_PACKAGED === "true") url = "https://api.twitch.tv/helix/eventsub/subscriptions";
    const headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Client-Id': this.config.clientId,
      'Content-Type': 'application/json'
    };

    console.debug("[TwitchEventListener] Session ID for registering:", this.sessionId)
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
      throw new Error(`[TwitchEventListener] Failed to subscribe to ${event.type}: ${JSON.stringify(error)}`);
    }

    console.debug(`Subscribed to ${event.type}`);
  }

  private async handleNotification(message: any): Promise<void> {
    const subscriptionType = message.metadata.subscription_type;
    const event = message.payload.event;

    console.debug("[TwitchEventListener] Got notification with data: ", event)
    switch (subscriptionType) {
      case 'channel.channel_points_custom_reward_redemption.add':
      case 'channel.channel_points_custom_reward_redemption.update':
        this.handleAlertNotification({
          type: "reward",
          templateId: "default-soundAlert",
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
        });
        break;

      case 'channel.chat.message':
        this.handleChatMessage(event);
        break;

      case "channel.follow":
        this.handleAlertNotification({
          type: "follow",
          templateId: "default-followAlert",
          userId: event.user_id,
          username: event.user_login,
          userDisplayName: event.user_name,
          timestamp: new Date(event.followed_at)
        });
        break;

      case "channel.subscribe":
        this.handleAlertNotification({
          type: "subscriber",
          templateId: "default-subscriberAlert",
          userId: event.user_id,
          username: event.user_login,
          userDisplayName: event.user_name,
          tier: event.tier,
          is_gift: event.is_gift,
          timestamp: new Date()
        });
        break;

      case "channel.subscription.message":
        this.handleAlertNotification({
          type: "subscriber",
          templateId: "default-subscriberMessageAlert",
          userId: event.user_id,
          username: event.user_login,
          userDisplayName: event.user_name,
          tier: event.tier,
          // TODO: format the text with the emotes in message.text.emotes
          message: event.message.text,
          total_months: event.cumulative_months,
          streak_months: event.streak_months,
          duration_months: event.duration_months,
          is_gift: event.is_gift,
          timestamp: new Date()
        });
        break;

      case "channel.subscription.gift":
        this.handleAlertNotification({
          type: "subscriber",
          templateId: "default-subscriberGiftAlert",
          userId: event.user_id,
          username: event.user_login,
          userDisplayName: event.user_name,
          tier: event.tier,
          cumulative_total: event.cumulative_total,
          total: event.total,
          timestamp: new Date()
        });
        break;

      case "channel.cheer":
        this.handleAlertNotification({
          type: "bits",
          templateId: "default-bitsAlert",
          userId: event.user_id,
          username: event.user_login,
          userDisplayName: event.user_name,
          bits: event.bits,
          message: event.message,
          timestamp: new Date()
        });
        break;

      default:
        console.debug('Unhandled subscription type:', subscriptionType);
    }
  }

  private handleAlertNotification(alert: Alert): void {
    console.debug('[TwitchEventListener] Handling alert notification with data:', alert);
    try {
      const processor = getRedeemProcessor()
      processor?.process(alert)
    } catch (e) {
      console.error('[TwitchEventListener] Failed to process redemption locally:', e)
    }

    this.rewardRedemptions.unshift(alert);
    if (this.rewardRedemptions.length > this.MAX_CACHE_SIZE) {
      this.rewardRedemptions.pop();
    }

    this.saveCache(this.CACHE_CONTEXT, this.CACHE_FILE);

    if (this.mainWindow) {
      this.mainWindow.webContents.send('twitch:reward-redeemed', alert);
    }
  }

  private async translateEmotes(message: ChatMessage): Promise<ChatMessage["messageFragment"]> {
    let notFoundIds = []
    for (var i in message.messageFragment) {
      const fragment = message.messageFragment[i];
      if (fragment && fragment.type === "emote") {
        const emote = this.emotes.get(fragment.emote.id)
        if (!emote) {
          notFoundIds.push(fragment.emote.owner_id)
        }
      }
    }

    if (!this.config?.accessToken) {
      console.error("[TwitchEventListener] Access token is not defined in config.")
      return []
    }

    console.debug(`[TwitchEventListener] Got missing owner ids from fragments and cache: ${JSON.stringify(notFoundIds)}`);
    // const accessToken = await this.safeStore?.get('twitchAccessToken')
    for (var i in notFoundIds) {
      console.debug(`[TwitchEventListener] Getting emotes from user ${notFoundIds[i]}`)
      const channelEmotes = await getChannelEmotes(this.config.accessToken, notFoundIds[i])
      if (channelEmotes && channelEmotes.data) {
        (channelEmotes.data as Emote[]).forEach((emote, index) => {
          this.emotes.set(emote.id, emote);
        })
      }
    }

    for (var i in message.messageFragment) {
      const fragment = message.messageFragment[i];
      if (fragment.type === "emote") {
        const cachedEmote = this.emotes.get(fragment.emote.id);
        if (cachedEmote) {
          const isAnimated = Array.isArray(cachedEmote.format) && cachedEmote.format.includes("animated");
          const emoteUrl = isAnimated
            ? cachedEmote.images.url_4x.replace("/static/", "/animated/")
            : cachedEmote.images.url_4x;

          message.messageFragment[i].emoteUrl = emoteUrl;
          message.messageFragment[i].isGif = isAnimated;
        }
      }
    }

    this.saveCache(this.CACHE_CONTEXT, this.EMOTES_CACHE);
    return message.messageFragment;
  }

  private async handleChatMessage(event: any): Promise<void> {
    console.debug("[TwitchEventListener] Received a new chat message with data: ", event, event.message.fragments)
    const chatMessage: ChatMessage = {
      userId: event.chatter_user_id,
      username: event.chatter_user_login,
      displayName: event.chatter_user_name,
      message: event.message.text,
      timestamp: new Date(),
      color: event.color,
      badges: event.badges?.map((b: any) => b.set_id) || [],
      messageFragment: event.message.fragments
    };

    const translatedFragments = await this.translateEmotes(chatMessage);
    chatMessage.messageFragment = translatedFragments;

    console.debug('[TwitchEventListener] Chat message:', chatMessage);

    this.chatMessages.push(chatMessage);
    if (this.chatMessages.length > this.MAX_CACHE_SIZE) {
      this.chatMessages.shift();
    }

    this.saveCache(this.CACHE_CONTEXT, this.MESSAGES_CACHE);

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
        timestamp: chatMessage.timestamp,
        fragments: chatMessage.messageFragment
      });
    }
  }

  private async handleSessionReconnect(message: any): Promise<void> {
    const reconnectUrl = message.payload.session.reconnect_url;
    console.debug('[TwitchEventListener] Server requested reconnect to:', reconnectUrl);
  }

  private async handleReconnect(): Promise<void> {
    if (this.isConnected()) {
      console.debug('[TwitchEventListener] Already connected, skipping reconnect');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[TwitchEventListener] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.debug(`[TwitchEventListener] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connectWebSocket();
        this.reconnectAttempts = 0;
        console.debug('[TwitchEventListener] Reconnected successfully');
      } catch (error) {
        console.error('[TwitchEventListener] Reconnection failed:', error);
      }
    }, delay);
  }

  disconnect(): void {
    console.debug('[TwitchEventListener] Disconnecting...');

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
export type { ChatMessage, Alert };