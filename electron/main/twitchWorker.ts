

const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2';

const getApiPath = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

export type RewardSettings = {
  title?: string;
  prompt?: string;
  cost?: number;
  background_color?: string;
  is_enabled?: boolean;
  is_user_input_required?: boolean;
  is_max_per_stream_enabled?: boolean;
  max_per_stream?: number;
  is_max_per_user_enabled?: boolean;
  max_per_user?: number;
  is_global_cooldown_enabled?: boolean;
  global_cooldown_seconds?: number;
  is_paused?: boolean;
  should_redemptions_skip_request_queue?: boolean;
};

const getTwitchRedemptions = async (accessToken: string, broadcasterId: string) => {
  const url = 'https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions';
  const requestUrl = `${url}?broadcaster_id=${broadcasterId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  console.debug(`[TwitchWorker] API GET ${getApiPath(requestUrl)}`);
  const response = await fetch(requestUrl, { headers });
  console.debug(`[TwitchWorker] API GET ${getApiPath(requestUrl)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API GET ${getApiPath(requestUrl)} failed:`, await response.text());
    throw new Error('Failed to fetch Twitch redemptions: ' + response.statusText);
  }
  const data = await response.json();
  return data;
};

const getOnlyManageableRewards = async (accessToken: string, broadcasterId: string) => {
  const url = 'https://api.twitch.tv/helix/channel_points/custom_rewards';
  const requestUrl = `${url}?broadcaster_id=${broadcasterId}&only_manageable_rewards=true`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  console.debug(`[TwitchWorker] API GET ${getApiPath(requestUrl)}`);
  const response = await fetch(requestUrl, { headers });
  console.debug(`[TwitchWorker] API GET ${getApiPath(requestUrl)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API GET ${getApiPath(requestUrl)} failed:`, await response.text());
    throw new Error('Failed to fetch manageable rewards: ' + response.statusText);
  }
  const data = await response.json();
  return data;
};

const getCustomRewards = async (accessToken: string, broadcasterId: string) => {
  const url = 'https://api.twitch.tv/helix/channel_points/custom_rewards';
  const requestUrl = `${url}?broadcaster_id=${broadcasterId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  console.debug(`[TwitchWorker] API GET ${getApiPath(requestUrl)}`);
  const response = await fetch(requestUrl, { headers });
  console.debug(`[TwitchWorker] API GET ${getApiPath(requestUrl)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API GET ${getApiPath(requestUrl)} failed:`, await response.text());
    throw new Error('Failed to fetch custom rewards: ' + response.statusText);
  }
  const data = await response.json();
  return data;
};

const getBroadcasterId = async (accessToken: string): Promise<string> => {
  const url = 'https://api.twitch.tv/helix/users';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  console.debug(`[TwitchWorker] API GET ${getApiPath(url)}`);
  const response = await fetch(url, { headers });
  console.debug(`[TwitchWorker] API GET ${getApiPath(url)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API GET ${getApiPath(url)} failed:`, await response.text());
    throw new Error('Failed to fetch broadcaster ID');
  }
  const data = await response.json();
  return data.data[0].id;
};

const updateCustomReward = async (accessToken: string, broadcasterId: string, rewardId: string, settings: RewardSettings) => {
  const url = `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId,
    'Content-Type': 'application/json'
  };
  console.debug(`[TwitchWorker] API PATCH ${getApiPath(url)}`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(settings)
  });
  console.debug(`[TwitchWorker] API PATCH ${getApiPath(url)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API PATCH ${getApiPath(url)} failed:`, await response.text());
    throw new Error('Failed to update custom reward: ' + response.statusText);
  }
  const data = await response.json();
  return data;
};

const createCustomReward = async (accessToken: string, broadcasterId: string, settings: RewardSettings) => {
  const url = `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId,
    'Content-Type': 'application/json'
  };
  console.debug(`[TwitchWorker] API POST ${getApiPath(url)}`);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(settings)
  });
  console.debug(`[TwitchWorker] API POST ${getApiPath(url)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API POST ${getApiPath(url)} failed:`, await response.text());
    throw new Error('Failed to create custom reward: ' + response.statusText);
  }
  console.debug("[TwitchWorker] Create Reward Response Status:", response.status);
  const data = await response.json();
  return data;
};

const deleteCustomReward = async (accessToken: string, broadcasterId: string, rewardId: string) => {
  const url = `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  console.debug(`[TwitchWorker] API DELETE ${getApiPath(url)}`);
  const response = await fetch(url, {
    method: 'DELETE',
    headers
  });
  console.debug(`[TwitchWorker] API DELETE ${getApiPath(url)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API DELETE ${getApiPath(url)} failed:`, await response.text());
    throw new Error('Failed to delete custom reward: ' + response.statusText);
  }
  return;
}

const getGlobalEmotes = async (accessToken: string) => {
  const url = 'https://api.twitch.tv/helix/chat/emotes/global';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId,
    'Content-Type': 'application/json'
  };

  console.debug(`[TwitchWorker] API GET ${getApiPath(url)}`);
  const response = await fetch(url, { headers });
  console.debug(`[TwitchWorker] API GET ${getApiPath(url)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
  if (!response.ok) {
    console.error(`[TwitchWorker] API GET ${getApiPath(url)} failed:`, await response.text());
    throw new Error('Failed to get global emotes: ' + response.statusText);
  }

  return response.json();
}

const getChannelEmotes = async (accessToken: string, broadcasterId: string) => {
  const trimmedBroadcasterId = broadcasterId?.toString().trim() ?? '';

  // The Helix channel emotes endpoint accepts only numeric broadcaster IDs.
  if (!/^\d+$/.test(trimmedBroadcasterId)) {
    console.warn(`[TwitchWorker] Invalid broadcaster_id "${trimmedBroadcasterId}". Falling back to global emotes.`);
    return getGlobalEmotes(accessToken);
  }

  const url = `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${trimmedBroadcasterId}`
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId,
    'Content-Type': 'application/json'
  };

  try {
    console.debug(`[TwitchWorker] API GET ${getApiPath(url)}`);
    const response = await fetch(url, { headers });
    console.debug(`[TwitchWorker] API GET ${getApiPath(url)} -> ${response.status} (${response.ok ? 'ok' : 'error'})`);
    if (!response.ok) {
      const body = await response.text();
      console.error(`[TwitchWorker] API GET ${getApiPath(url)} failed:`, body);
      throw new Error('Failed to get channel emotes: ' + response.statusText);
    }
    return response.json();
  } catch (error) {
    console.error(`[TwitchWorker] API GET ${getApiPath(url)} failed`, error);
    console.warn('[TwitchWorker] Falling back to global emotes after channel emotes failure:', error);
    return getGlobalEmotes(accessToken);
  }
}

export {
  getTwitchRedemptions,
  getBroadcasterId,
  getCustomRewards,
  updateCustomReward,
  createCustomReward,
  deleteCustomReward,
  getOnlyManageableRewards,
  getChannelEmotes
};