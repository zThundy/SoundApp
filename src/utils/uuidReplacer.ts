export function replaceUUIDs(text: string, uuidMap: Record<string, string>): string {
  let result = text

  for (const [uuid, filePath] of Object.entries(uuidMap)) {
    const pattern = new RegExp(`\\{${uuid}\\}`, 'g')
    result = result.replace(pattern, filePath)
  }

  return result
}

export function extractUUIDs(text: string): string[] {
  const pattern = /\{([a-f0-9\-]+)\}/g
  const matches = text.matchAll(pattern)
  return Array.from(matches, m => m[1])
}

export function hasUUIDs(text: string): boolean {
  return /\{[a-f0-9\-]+\}/.test(text)
}

export function replaceUUID(text: string, uuid: string, replacement: string): string {
  const pattern = new RegExp(`\\{${uuid}\\}`, 'g')
  return text.replace(pattern, replacement)
}

export default {
  replaceUUIDs,
  extractUUIDs,
  hasUUIDs,
  replaceUUID,
}
