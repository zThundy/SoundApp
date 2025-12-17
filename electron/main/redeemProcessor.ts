import fileManager from './fileManager'

type AlertServer = {
  stop: () => Promise<void>
  port: number
  broadcast: (payload: any) => void
}

interface Alert {
  type: string;
  templateId: string;
  id?: string;
  userId: string;
  username: string;
  userDisplayName: string;
  rewardId?: string;
  rewardTitle?: string;
  rewardCost?: number;
  userInput?: string;
  timestamp: Date;
  status?: 'unfulfilled' | 'fulfilled' | 'canceled';
}

export class RedeemProcessor {
  private readonly CONTEXT = 'alerts'
  private readonly MAP_FILE = 'settings/{rewardId}.json'
  private readonly TEMPLATE_FILE = 'templates/{templateId}.json'
  private getAlertServer: () => AlertServer | null

  constructor(getAlertServer: () => AlertServer | null) {
    this.getAlertServer = getAlertServer
  }

  async loadMapping(rewardId: string): Promise<any | null> {
    try {
      const exists = await fileManager.fileExists(this.CONTEXT, { relativePath: this.MAP_FILE.replace('{rewardId}', rewardId) })
      if (!exists) {
        console.warn('[RedeemProcessor] rewards.json not found in alerts context')
        return null
      }
      const { buffer } = fileManager.readFile(this.CONTEXT, { relativePath: this.MAP_FILE.replace('{rewardId}', rewardId) })
      const buf = await buffer;
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
      const exists = await fileManager.fileExists(this.CONTEXT, { relativePath: templatePath })
      if (!exists) {
        console.warn(`[RedeemProcessor] Template ${templateId} not found`)
        return null
      }
      const { buffer } = fileManager.readFile(this.CONTEXT, { relativePath: templatePath })
      const buf = await buffer;
      const template = JSON.parse(buf.toString())
      return template
    } catch (e) {
      console.error(`[RedeemProcessor] Error reading template ${templateId}:`, e)
      return null
    }
  }

  private replaceVariables(text: string, redemption: Alert): string {
    return text
      .replace(/\$\{username\}/g, redemption.username)
      .replace(/\$\{user_display_name\}/g, redemption.userDisplayName)
      .replace(/\$\{reward_title\}/g, redemption.rewardTitle || "Unk title")
      .replace(/\$\{reward_cost\}/g, String(redemption.rewardCost))
      .replace(/\$\{user_input\}/g, redemption.userInput || '')
  }

  process(redemption: Alert): void {
    switch(redemption.type) {
      case "reward":
        this.processTwitchRedemption(redemption);
        break;
      
      case "follow":
        this.processTwitchAlert(redemption);
        break;
      
      case "subscriber":
        this.processTwitchAlert(redemption);
        break;
    }
  }

  private async processTwitchAlert(data: Alert): Promise<void> {
    console.debug("[RedeemProcessor] Processing alert with data", data)

    // Load template (default or specified in reward definition)
    const template = await this.loadTemplate(data.templateId)
    if (!template) {
      // TODO: implement fallback template
      console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
    }

    const alertServer = this.getAlertServer()
    if (!alertServer) {
      console.error('[RedeemProcessor] Alert server not available')
      throw new Error("[RedeemProcessor] Alert server not available")
    }

    // Build the payload with template data and variable substitution
    const alertText = template?.text
      ? this.replaceVariables(template.text, data)
      : `${data.userDisplayName} has followed the channel!`

    const payload = {
      type: 'twitch-redeem',
      templateId: data.templateId,
      imageDataUrl: template?.imageDataUrl || undefined,
      text: alertText,
      duration: template?.duration || 6000,

      redemption: {
        id: data.id,
        user: {
          id: data.userId,
          login: data.username,
          name: data.userDisplayName,
        },
        reward: {
          id: data.rewardId,
          title: data.rewardTitle,
          cost: data.rewardCost,
        },
        input: data.userInput ?? '',
        timestamp: data.timestamp,
        status: data.status,
      }
    }

    try {
      alertServer.broadcast(payload)
      console.debug('[RedeemProcessor] Broadcasted alert for reward', data.rewardId)
    } catch (e) {
      console.error('[RedeemProcessor] Failed to broadcast alert:', e)
      throw new Error(`[RedeemProcessor] Failed to broadcast alert: ${e}`)
    }
  }

  private async processTwitchRedemption(data: Alert): Promise<void> {
    if (!data.rewardId) {
      throw new Error(`[RedeemProcessor] No reward id found for reward with data ${JSON.stringify(data)}`)
    }

    const def = await this.loadMapping(data.rewardId).catch(err => console.error('[RedeemProcessor] Failed to load mapping:', err))
    console.debug('[RedeemProcessor] Processing redemption for reward:', data.rewardId, 'Definition:', def)
    if (!def) {
      console.debug('[RedeemProcessor] No local audio for reward:', data.rewardId)
    }

    // Load template (default or specified in reward definition)
    const template = await this.loadTemplate(data.templateId)
    if (!template) {
      // TODO: implement fallback template
      console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
    }

    // Resolve audio path: if relative, it is under userData/alerts/
    const audioPathInput = def.audioPath
    let audioBuffer: Buffer = Buffer.from([])
    try {
      const { buffer } = fileManager.readFile(this.CONTEXT, { relativePath: audioPathInput });
      audioBuffer = await buffer;
    } catch (e) {
      console.error('[RedeemProcessor] Audio file missing or unreadable:', audioPathInput, '->', e)
      throw new Error(`[RedeemProcessor] Audio file missing or unreadable: ${audioPathInput} ${e}`)
    }

    const alertServer = this.getAlertServer()
    if (!alertServer) {
      console.error('[RedeemProcessor] Alert server not available')
      throw new Error("[RedeemProcessor] Alert server not available")
    }

    // Build the payload with template data and variable substitution
    const alertText = template?.text
      ? this.replaceVariables(template.text, data)
      : `${data.userDisplayName} has redeemed ${data.rewardTitle}!`

    const payload = {
      type: 'twitch-redeem',
      templateId: data.templateId,
      imageDataUrl: template?.imageDataUrl || undefined,
      text: alertText,
      duration: template?.duration || 6000,

      audio: {
        base64: audioBuffer.toString('base64'),
        volume: def.volume ?? 1.0,
      },
      redemption: {
        id: data.id,
        user: {
          id: data.userId,
          login: data.username,
          name: data.userDisplayName,
        },
        reward: {
          id: data.rewardId,
          title: data.rewardTitle,
          cost: data.rewardCost,
        },
        input: data.userInput ?? '',
        timestamp: data.timestamp,
        status: data.status,
      }
    }

    try {
      alertServer.broadcast(payload)
      console.debug('[RedeemProcessor] Broadcasted alert for reward', data.rewardId)
    } catch (e) {
      console.error('[RedeemProcessor] Failed to broadcast alert:', e)
      throw new Error(`[RedeemProcessor] Failed to broadcast alert: ${e}`)
    }
  }
}
