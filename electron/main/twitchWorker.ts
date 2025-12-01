

const clientId = '64aeehn5qo2902i5c4gvz41yjqd9h2';
const redirectUri = 'http://localhost/';

const getTwitchRedemptions = async (accessToken: string, broadcasterId: string) => {
  const url = 'https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Client-Id': clientId
  };
  const response = await fetch(`${url}?broadcaster_id=${broadcasterId}`, { headers });
  if (!response.ok) {
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
    throw new Error('Failed to fetch broadcaster ID');
  }
  const data = await response.json();
  return data.data[0].id;
};

const updateCustomReward = async (accessToken: string, broadcasterId: string, rewardId: string, settings: any) => {
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
    throw new Error('Failed to update custom reward: ' + response.statusText);
  }
  const data = await response.json();
  return data;
};

export {
  getTwitchRedemptions,
  getBroadcasterId,
  getCustomRewards,
  updateCustomReward
};