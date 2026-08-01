// Genera los .wav placeholder de resources/audio/ por síntesis pura (sin red, sin assets de terceros).
// Correr con: npm run generate-audio
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'resources', 'audio')
const SAMPLE_RATE = 22050

mkdirSync(OUT_DIR, { recursive: true })

function writeWav(filename, samples) {
  const numSamples = samples.length
  const blockAlign = 2 // 16-bit mono
  const byteRate = SAMPLE_RATE * blockAlign
  const dataSize = numSamples * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // fmt chunk size
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(16, 34) // bits per sample
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2)
  }

  writeFileSync(join(OUT_DIR, filename), buffer)
  console.log(`  ${filename}  (${(buffer.length / 1024).toFixed(0)} KB, ${(numSamples / SAMPLE_RATE).toFixed(1)}s)`)
}

/** Ruido blanco pasado por un filtro pasa-bajos IIR simple de un polo (suaviza a "shhh"). */
function lowpassNoise(n, cutoff) {
  const out = new Float32Array(n)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1
    prev = prev + cutoff * (white - prev)
    out[i] = prev
  }
  return out
}

/** Aplica fade-in/fade-out cortos para que el loop no chasquee al repetirse. */
function seamlessLoop(samples, fadeSamples) {
  const n = samples.length
  const out = Float32Array.from(samples)
  for (let i = 0; i < fadeSamples; i++) {
    const t = i / fadeSamples
    const head = out[i]
    const tail = out[n - fadeSamples + i]
    const crossfaded = head * t + tail * (1 - t)
    out[i] = crossfaded
    out[n - fadeSamples + i] = crossfaded
  }
  return out
}

function normalize(samples, peak = 0.85) {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  if (max === 0) return samples
  const scale = peak / max
  return samples.map((s) => s * scale)
}

function generateRain(durationSec) {
  const n = SAMPLE_RATE * durationSec
  const base = lowpassNoise(n, 0.35)
  // Gotas ocasionales más agudas encima del "shhh" de fondo.
  const drops = lowpassNoise(n, 0.7)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const dropHit = Math.random() < 0.0015 ? 1 : 0
    out[i] = base[i] * 0.5 + drops[i] * dropHit * 0.6
  }
  return normalize(seamlessLoop(out, SAMPLE_RATE * 0.5))
}

function generateFireplace(durationSec) {
  const n = SAMPLE_RATE * durationSec
  const bed = lowpassNoise(n, 0.15) // rumor grave constante de la base del fuego
  const out = new Float32Array(n)
  let crackleEnv = 0
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.0009) crackleEnv = 1
    crackleEnv *= 0.9
    const crackle = (Math.random() * 2 - 1) * crackleEnv
    out[i] = bed[i] * 0.6 + crackle * 0.8
  }
  return normalize(seamlessLoop(out, SAMPLE_RATE * 0.5))
}

function generateCafe(durationSec) {
  const n = SAMPLE_RATE * durationSec
  const murmur = lowpassNoise(n, 0.08) // murmullo grave de voces indistinguibles
  const clinks = lowpassNoise(n, 0.6)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const clinkHit = Math.random() < 0.0006 ? 1 : 0
    out[i] = murmur[i] * 0.7 + clinks[i] * clinkHit * 0.4
  }
  return normalize(seamlessLoop(out, SAMPLE_RATE * 0.5))
}

function generateLibrary(durationSec) {
  const n = SAMPLE_RATE * durationSec
  const roomTone = lowpassNoise(n, 0.05) // aire acondicionado / silencio de sala, muy tenue
  const pageTurn = lowpassNoise(n, 0.5)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const turnHit = Math.random() < 0.00025 ? 1 : 0
    out[i] = roomTone[i] * 0.5 + pageTurn[i] * turnHit * 0.3
  }
  return normalize(seamlessLoop(out, SAMPLE_RATE * 0.5), 0.5)
}

function generateChime(durationSec) {
  const n = SAMPLE_RATE * durationSec
  const out = new Float32Array(n)
  const freqs = [660, 880, 1320] // acorde simple, suave
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    const envelope = Math.exp(-t * 2.2)
    let sample = 0
    for (const f of freqs) sample += Math.sin(2 * Math.PI * f * t)
    out[i] = (sample / freqs.length) * envelope
  }
  return normalize(out, 0.7)
}

console.log('Generando audio placeholder en resources/audio/ ...')
writeWav('rain.wav', generateRain(10))
writeWav('fireplace.wav', generateFireplace(10))
writeWav('cafe.wav', generateCafe(12))
writeWav('library.wav', generateLibrary(12))
writeWav('chime.wav', generateChime(1.6))
console.log('Listo.')
