import fs from 'node:fs/promises'
import path from 'node:path'

export const defaults = {
  bannerMessages: ['Follow for the next stream'],
  socials: [],
  messageDuration: 12,
  priorityMessage: '',
  priorityDuration: 24,
}
const networks = new Set(['youtube', 'instagram', 'x', 'discord'])
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 160
const seconds = (value, fallback) => value === undefined ? fallback :
  Number.isFinite(value) && value >= 3 && value <= 120 ? value : NaN

export function cameraConfig(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid camera configuration')
  const messages = value.bannerMessages ?? defaults.bannerMessages
  const socials = value.socials ?? []
  if (!Array.isArray(messages) || messages.length > 30 || !messages.every(text) ||
      !Array.isArray(socials) || socials.length > 20 ||
      !socials.every(s => s && networks.has(s.network) && text(s.handle)) ||
      messages.length + socials.length === 0) throw Error('Invalid banner content')
  const messageDuration = seconds(value.messageDuration, 12)
  const priorityDuration = seconds(value.priorityDuration, 24)
  const priorityMessage = value.priorityMessage ?? ''
  if (!Number.isFinite(messageDuration) || !Number.isFinite(priorityDuration) ||
      (priorityMessage !== '' && !text(priorityMessage))) throw Error('Invalid banner timing')
  // Copy only the supported fields. User text is rendered with textContent.
  return {bannerMessages: [...messages], socials: socials.map(({network, handle}) => ({network, handle})),
    messageDuration, priorityDuration, priorityMessage}
}

export async function readCameraConfig(data) {
  try {
    return cameraConfig(JSON.parse((await fs.readFile(path.join(data, 'camera-config.json'), 'utf8')).replace(/^\uFEFF/, '')))
  } catch (error) {
    if (error.code === 'ENOENT') return cameraConfig()
    throw error
  }
}
