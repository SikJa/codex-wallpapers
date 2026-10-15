import test from 'node:test'
import assert from 'node:assert/strict'
import {usageSnapshot} from '../obs-overlay/native-usage.mjs'
import {cameraConfig} from '../obs-overlay/camera-config.mjs'

test('native usage selects the limiting Codex window and its own reset', () => {
  const result = usageSnapshot({rateLimitsByLimitId: {codex: {
    primary: {usedPercent: 26, resetsAt: 2000}, secondary: {usedPercent: 72, resetsAt: 3000},
  }, 'image-generation': {primary: {usedPercent: 99}}}}, 1000)
  assert.deepEqual(result, {available: true, percent: 28, updatedAt: 1000, resetAt: 3000000, accent: '#b7bdc7'})
})
test('native usage rejects missing or unrelated quota rather than showing invented zero', () => {
  for (const result of [null, {}, {rateLimits: {limitId: 'image-generation', primary: {usedPercent: 1}}},
    {rateLimits: {primary: {usedPercent: NaN}}}]) assert.throws(() => usageSnapshot(result))
})
test('legacy quota clamps remaining usage and does not invent a reset', () => {
  const result = usageSnapshot({rateLimits: {primary: {usedPercent: 120, resetsAt: Infinity}}})
  assert.equal(result.percent, 0)
  assert.equal(result.resetAt, null)
})
test('camera config retains plain text and priority timing without arbitrary fields', () => {
  const config = cameraConfig({bannerMessages: ['<script>alert(1)</script>'], socials: [{network: 'discord', handle: 'example'}],
    priorityMessage: 'Important', priorityDuration: 30, secret: 'never publish'})
  assert.equal(config.bannerMessages[0], '<script>alert(1)</script>')
  assert.equal(config.priorityDuration, 30)
  assert.equal(config.messageDuration, 12)
  assert.equal('secret' in config, false)
  for (const bad of [{bannerMessages: [], socials: []}, {messageDuration: -1}, {priorityDuration: '24'},
    {socials: [{network: '__proto__', handle: 'bad'}]}, {bannerMessages: ['x'.repeat(161)]}]) assert.throws(() => cameraConfig(bad))
})
