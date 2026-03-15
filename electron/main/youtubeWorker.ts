import { createHash, randomBytes } from 'node:crypto'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_OAUTH_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || ''

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly'
]

export interface YouTubeTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: string
}

export function createPkcePair() {
  const codeVerifier = randomBytes(64)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return { codeVerifier, codeChallenge }
}

export function buildYouTubeAuthUrl(clientId: string, redirectUri: string, state: string, codeChallenge: string) {
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', YOUTUBE_SCOPES.join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('include_granted_scopes', 'true')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url.toString()
}

export async function exchangeYouTubeCodeForTokens(clientId: string, code: string, codeVerifier: string, redirectUri: string): Promise<YouTubeTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange YouTube auth code: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<YouTubeTokenResponse>
}

export async function refreshYouTubeAccessToken(clientId: string, refreshToken: string): Promise<YouTubeTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh YouTube token: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<YouTubeTokenResponse>
}

export async function revokeYouTubeToken(token: string): Promise<void> {
  const response = await fetch(GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ token })
  })

  if (!response.ok) {
    throw new Error(`Failed to revoke YouTube token: ${response.status} ${await response.text()}`)
  }
}

export async function getMyActiveLiveBroadcast(accessToken: string) {
  const url = new URL(`${YOUTUBE_API_BASE}/liveBroadcasts`)
  url.searchParams.set('part', 'id,snippet,contentDetails,status')
  url.searchParams.set('broadcastStatus', 'active')
  url.searchParams.set('broadcastType', 'all')
  url.searchParams.set('mine', 'true')

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube active broadcast: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<any>
}

export async function getVideoLiveStreamingDetails(accessToken: string, videoId: string) {
  const url = new URL(`${YOUTUBE_API_BASE}/videos`)
  url.searchParams.set('part', 'liveStreamingDetails')
  url.searchParams.set('id', videoId)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube video details: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<any>
}

export async function getYouTubeLiveChatMessages(accessToken: string, liveChatId: string, pageToken?: string | null) {
  const url = new URL(`${YOUTUBE_API_BASE}/liveChatMessages`)
  url.searchParams.set('part', 'id,snippet,authorDetails')
  url.searchParams.set('liveChatId', liveChatId)
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken)
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube live chat messages: ${response.status} ${await response.text()}`)
  }

  return response.json() as Promise<any>
}