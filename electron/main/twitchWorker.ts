

const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2';

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
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  const response = await fetch(`${url}?broadcaster_id=${broadcasterId}`, { headers });
  if (!response.ok) {
    console.error("Failed to fetch Twitch redemptions:", await response.text());
    throw new Error('Failed to fetch Twitch redemptions: ' + response.statusText);
  }
  const data = await response.json();
  return data;
};

const getCustomRewards = async (accessToken: string, broadcasterId: string) => {
  const url = 'https://api.twitch.tv/helix/channel_points/custom_rewards';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  const response = await fetch(`${url}?broadcaster_id=${broadcasterId}`, { headers });
  if (!response.ok) {
    console.error("Failed to fetch custom rewards:", await response.text());
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
  const response = await fetch(url, { headers });
  if (!response.ok) {
    console.error("Failed to fetch broadcaster ID:", await response.text());
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
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    console.error("Failed to update custom reward:", await response.text());
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
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    console.error("Failed to create custom reward:", await response.text());
    throw new Error('Failed to create custom reward: ' + response.statusText);
  }
  console.log("Create Reward Response Status:", response.status);
  const data = await response.json();
  return data;
};

const deleteCustomReward = async (accessToken: string, broadcasterId: string, rewardId: string) => {
  const url = `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${rewardId}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  const response = await fetch(url, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) {
    console.error("Failed to delete custom reward:", await response.text());
    throw new Error('Failed to delete custom reward: ' + response.statusText);
  }
  return;
}

export {
  getTwitchRedemptions,
  getBroadcasterId,
  getCustomRewards,
  updateCustomReward,
  createCustomReward,
  deleteCustomReward
};