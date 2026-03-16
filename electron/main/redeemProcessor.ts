import fileManager from './fileManager'
import { Alert } from "./types/alerts";

type AlertServer = {
  stop: () => Promise<void>
  port: number
  broadcast: (payload: any) => void
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
    console.debug("[RedeemProcessor] Replacing variables from text", text, "with data", redemption);
    return text
      .replace(/\$\{username\}/g, redemption.username)
      .replace(/\$\{user_display_name\}/g, redemption.userDisplayName)
      .replace(/\$\{reward_title\}/g, redemption.rewardTitle || "Unk title")
      .replace(/\$\{reward_cost\}/g, String(redemption.rewardCost))
      .replace(/\$\{user_input\}/g, redemption.userInput || '')
      .replace(/\$\{tier\}/g, String(redemption.tier || 1))
      .replace(/\$\{total\}/g, String(redemption.total || 1))
      .replace(/\$\{cumulative_total\}/g, String(redemption.cumulative_total || 1))
      .replace(/\$\{message\}/g, redemption.message || "No message provided")
      .replace(/\$\{cumulative_months\}/g, String(redemption.cumulative_total || 1))
      .replace(/\$\{streak_months\}/g, String(redemption.streak_months || 1))
      .replace(/\$\{duration_months\}/g, String(redemption.duration_months || 1))
      .replace(/\$\{bits\}/g, String(redemption.bits || 1))
      .replace(/\$\{viewers\}/g, String(redemption.viewers || 0))
  }

  process(eventData: Alert): void {
    try {
      switch (eventData.type) {
        case "reward":
          this.processTwitchRedemption(eventData);
          break;

        case "follow":
          this.processTwitchFollowAlert(eventData);
          break;

        case "subscriber":
          this.processTwitchSubscribeAlert(eventData);
          break;

        case "bits":
          this.processBitsAlert(eventData);
          break;

        case "raid":
          this.processRaidAlert(eventData);
          break;
      }
    } catch (e: any) {
      console.error("[RedeemProcessor] Error in .process function: ", e)
    }
  }

  private async processRaidAlert(data: Alert): Promise<void> {
    try {
      console.debug("[RedeemProcessor] Processing raid alert with data", data)
      const template = await this.loadTemplate(data.templateId)
      if (!template) {
        console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
      }
      const alertText = template?.text ? this.replaceVariables(template.text, data) : `${data.userDisplayName} has raided with ${data.viewers} viewers!`
      this.sendToServer({
        type: 'twitch-alert',
        templateId: data.templateId,
        imageDataUrl: template?.imageDataUrl || undefined,
        text: alertText,
        duration: template?.duration || 6000,
      });
    } catch (e: any) {
      console.error("[RedeemProcessor] Error in processRaidAlert: ", e)
    }
  }

  private async processBitsAlert(data: Alert): Promise<void> {
    try {
      console.debug("[RedeemProcessor] Processing alert with data", data)
      const template = await this.loadTemplate(data.templateId)
      if (!template) {
        // TODO: implement fallback template
        console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
      }
      const alertText = template?.text ? this.replaceVariables(template.text, data) : `${data.userDisplayName} has cheered ${data.bits}!`
      this.sendToServer({
        type: 'twitch-alert',
        templateId: data.templateId,
        imageDataUrl: template?.imageDataUrl || undefined,
        text: alertText,
        duration: template?.duration || 6000,
      });
    } catch (e: any) {
      console.error("[RedeemProcessor] Error in processTwitchFollowAlert: ", e)
    }
  }

  private async processTwitchSubscribeAlert(data: Alert): Promise<void> {
    try {
      console.debug("[RedeemProcessor] Processing alert with data", data)
      const template = await this.loadTemplate(data.templateId)
      if (!template) {
        // TODO: implement fallback template
        console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
      }
      const alertText = template?.text ? this.replaceVariables(template.text, data) : `${data.userDisplayName} has subscribed to the channel!`
      this.sendToServer({
        type: 'twitch-alert',
        templateId: data.templateId,
        imageDataUrl: template?.imageDataUrl || undefined,
        text: alertText,
        duration: template?.duration || 6000,
      });
    } catch (e: any) {
      console.error("[RedeemProcessor] Error in processTwitchFollowAlert: ", e)
    }
  }

  private async processTwitchFollowAlert(data: Alert): Promise<void> {
    try {
      console.debug("[RedeemProcessor] Processing alert with data", data)
      const template = await this.loadTemplate(data.templateId)
      if (!template) {
        // TODO: implement fallback template
        console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
      }
      const alertText = template?.text ? this.replaceVariables(template.text, data) : `${data.userDisplayName} has followed the channel!`
      this.sendToServer({
        type: 'twitch-alert',
        templateId: data.templateId,
        imageDataUrl: template?.imageDataUrl || undefined,
        text: alertText,
        duration: template?.duration || 6000,
      });
    } catch (e: any) {
      console.error("[RedeemProcessor] Error in processTwitchFollowAlert: ", e)
    }
  }

  private async processTwitchRedemption(data: Alert): Promise<void> {
    try {
      if (!data.rewardId) {
        throw new Error(`[RedeemProcessor] No reward id found for reward with data ${JSON.stringify(data)}`)
      }
      const def = await this.loadMapping(data.rewardId).catch(err => console.error('[RedeemProcessor] Failed to load mapping:', err))
      console.debug('[RedeemProcessor] Processing redemption for reward:', data.rewardId, 'Definition:', def)
      if (!def) {
        console.debug('[RedeemProcessor] No local audio for reward:', data.rewardId)
        throw new Error("[RedeemProcessor] No local audio for reward: " + data.rewardId)
      }
      const template = await this.loadTemplate(data.templateId)
      if (!template) {
        // TODO: implement fallback template
        console.warn(`[RedeemProcessor] Template ${data.templateId} not found, using fallback`)
      }
      let audioBuffer: Buffer = Buffer.from([])
      if (def.audioPath) {
        const audioPathInput = def.audioPath
        try {
          const { buffer } = fileManager.readFile(this.CONTEXT, { relativePath: audioPathInput });
          audioBuffer = await buffer;
        } catch (e) {
          console.error('[RedeemProcessor] Audio file missing or unreadable:', audioPathInput, '->', e)
          throw new Error(`[RedeemProcessor] Audio file missing or unreadable: ${audioPathInput} ${e}`)
        }
      }
      const alertText = template?.text ? this.replaceVariables(template.text, data) : `${data.userDisplayName} has redeemed ${data.rewardTitle}!`
      this.sendToServer({
        type: 'twitch-redeem',
        templateId: data.templateId,
        imageDataUrl: template?.imageDataUrl || undefined,
        text: alertText,
        duration: template?.duration || 6000,

        audio: {
          base64: audioBuffer.toString('base64') || null,
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
      });
    } catch (e: any) {
      console.error("[RedeemProcessor] Error in processTwitchRedemption: ", e)
    }
  }

  private async sendToServer(payload: any): Promise<void> {
    const alertServer = this.getAlertServer()
    if (!alertServer) {
      console.error('[RedeemProcessor] Alert server not available')
      throw new Error("[RedeemProcessor] Alert server not available")
    }

    try {
      alertServer.broadcast(payload)
    } catch (e) {
      console.error('[RedeemProcessor] Failed to broadcast alert:', e)
      throw new Error(`[RedeemProcessor] Failed to broadcast alert: ${e}`)
    }
  }
}
