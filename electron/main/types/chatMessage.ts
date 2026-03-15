export interface ChatMessage {
  userId: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: Date;
  color?: string;
  badges?: string[];
  platform?: 'twitch' | 'youtube';
  avatarUrl?: string;
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

export interface Emote {
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