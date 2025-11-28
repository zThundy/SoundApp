import fileManager from './fileManager'

type AlertServer = {
  stop: () => Promise<void>
  port: number
  broadcast: (payload: any) => void
}

export interface RewardRedemption {
  id: string
  userId: string
  username: string
  userDisplayName: string
  rewardId: string
  rewardTitle: string
  rewardCost: number
  userInput?: string
  timestamp: Date
  status: 'unfulfilled' | 'fulfilled' | 'canceled'
}

export class RedeemProcessor {
  private readonly CONTEXT = 'alerts'
  private readonly MAP_FILE = 'settings/{rewardId}.json'
  private readonly TEMPLATE_FILE = 'templates/{templateId}.json'
  private getAlertServer: () => AlertServer | null
  private readonly ALERTS_DIR = 'alerts'

  constructor(getAlertServer: () => AlertServer | null) {
    this.getAlertServer = getAlertServer
  }

  async loadMapping(rewardId: string): Promise<any | null> {
    try {
      const exists = await fileManager.fileExists(this.CONTEXT, this.MAP_FILE.replace('{rewardId}', rewardId))
      if (!exists) {
        console.warn('[RedeemProcessor] rewards.json not found in alerts context')
        return null
      }
      const buf = await fileManager.readFile(this.CONTEXT, this.MAP_FILE.replace('{rewardId}', rewardId))
      const data = JSON.parse(buf.toString())
      return data;
    } catch (e) {
      console.error('[RedeemProcessor] Error reading rewards.json:', e)
      return null
    }
  }

  async loadTemplate(templateId: string): Promise<any | null> {
    try {
      const templatePath = this.TEMPLATE_FILE.replace('{templateId}', templateId)
      const exists = await fileManager.fileExists(this.CONTEXT, templatePath)
      if (!exists) {
        console.warn(`[RedeemProcessor] Template ${templateId} not found`)
        return null
      }
      const buf = await fileManager.readFile(this.CONTEXT, templatePath)
      const template = JSON.parse(buf.toString())
      return template
    } catch (e) {
      console.error(`[RedeemProcessor] Error reading template ${templateId}:`, e)
      return null
    }
  }

  private replaceVariables(text: string, redemption: RewardRedemption): string {
    return text
      .replace(/\$\{username\}/g, redemption.username)
      .replace(/\$\{user_display_name\}/g, redemption.userDisplayName)
      .replace(/\$\{reward_title\}/g, redemption.rewardTitle)
      .replace(/\$\{reward_cost\}/g, String(redemption.rewardCost))
      .replace(/\$\{user_input\}/g, redemption.userInput || '')
  }

  /** Process a redemption: find local audio by rewardId and broadcast alert */
  async process(redemption: RewardRedemption): Promise<boolean> {
    const def = await this.loadMapping(redemption.rewardId).catch(err => console.error('[RedeemProcessor] Failed to load mapping:', err))
    console.log('[RedeemProcessor] Processing redemption for reward:', redemption.rewardId, 'Definition:', def)
    if (!def) {
      console.log('[RedeemProcessor] No local audio for reward:', redemption.rewardId)
      return false
    }

    // Load template (default or specified in reward definition)
    const templateId = def.templateId || 'default'
    const template = await this.loadTemplate(templateId)
    if (!template) {
      console.warn(`[RedeemProcessor] Template ${templateId} not found, using fallback`)
    }

    // Resolve audio path: if relative, it is under userData/alerts/
    const audioPathInput = def.audioPath
    let audioBuffer: Buffer
    try {
      audioBuffer = await fileManager.readFile(this.CONTEXT, audioPathInput)
    } catch (e) {
      console.error('[RedeemProcessor] Audio file missing or unreadable:', audioPathInput, '->', e)
      return false
    }

    const alertServer = this.getAlertServer()
    if (!alertServer) {
      console.error('[RedeemProcessor] Alert server not available')
      return false
    }

    // Build the payload with template data and variable substitution
    const alertText = template?.text 
      ? this.replaceVariables(template.text, redemption)
      : `${redemption.userDisplayName} has redeemed ${redemption.rewardTitle}!`

    const payload = {
      type: 'twitch-redeem',
      templateId: templateId,
      imageDataUrl: template?.imageDataUrl || undefined,
      text: alertText,
      duration: template?.duration || 6000,
      
      audio: {
        base64: audioBuffer.toString('base64'),
        volume: def.volume ?? 1.0,
      },
      redemption: {
        id: redemption.id,
        user: {
          id: redemption.userId,
          login: redemption.username,
          name: redemption.userDisplayName,
        },
        reward: {
          id: redemption.rewardId,
          title: redemption.rewardTitle,
          cost: redemption.rewardCost,
        },
        input: redemption.userInput ?? '',
        timestamp: redemption.timestamp,
        status: redemption.status,
      }
    }

    try {
      alertServer.broadcast(payload)
      console.log('[RedeemProcessor] Broadcasted alert for reward', redemption.rewardId)
      return true
    } catch (e) {
      console.error('[RedeemProcessor] Failed to broadcast alert:', e)
      return false
    }
  }
}
