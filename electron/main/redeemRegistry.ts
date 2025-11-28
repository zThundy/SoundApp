import { RedeemProcessor } from './redeemProcessor'

let _processor: RedeemProcessor | null = null

export function setRedeemProcessor(p: RedeemProcessor | null) {
  _processor = p
}

export function getRedeemProcessor(): RedeemProcessor | null {
  return _processor
}
