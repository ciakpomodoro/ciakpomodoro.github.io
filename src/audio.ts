/*
  Suoni generati dal codice (nessun file audio): campane con armoniche, plettri
  morbidi, il "ciak" di legno. Tutto passa da un riverbero leggero e un
  compressore, così il volume resta pulito.
*/
let ctx: AudioContext | null = null
let master: GainNode
let bus: GainNode
let rev: GainNode
let noiseBuf: AudioBuffer
let on = true
let vol = 0.7

export function configure(enabled: boolean, volume: number) {
  on = enabled
  vol = volume
  if (ctx) master.gain.setTargetAtTime(volume * 0.9, ctx.currentTime, 0.02)
}

function init(): AudioContext {
  if (ctx) return ctx
  const Ctor: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  ctx = new Ctor({ latencyHint: 'interactive' })
  master = ctx.createGain()
  master.gain.value = vol * 0.9
  const comp = ctx.createDynamicsCompressor()
  master.connect(comp)
  comp.connect(ctx.destination)
  bus = ctx.createGain()
  bus.connect(master)

  const len = Math.floor(ctx.sampleRate * 2.4)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4)
  }
  const conv = ctx.createConvolver()
  conv.buffer = ir
  rev = ctx.createGain()
  rev.gain.value = 0.35
  rev.connect(conv)
  conv.connect(master)

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const nd = noiseBuf.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
  return ctx
}

/* Va chiamata dentro un tocco dell'utente: serve a iPhone/Safari per sbloccare l'audio. */
export async function unlock() {
  try {
    const c = init()
    if (c.state !== 'running') await c.resume()
    const s = c.createBufferSource()
    s.buffer = c.createBuffer(1, 1, 22050)
    s.connect(c.destination)
    s.start(0)
  } catch {
    /* audio non disponibile */
  }
}

function tone(type: OscillatorType, f: number, t: number, dur: number, g: number, send = 0.5, attack = 0.004) {
  const c = ctx!
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  const e = c.createGain()
  e.gain.setValueAtTime(0.0001, t)
  e.gain.linearRampToValueAtTime(g, t + attack)
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(e)
  e.connect(bus)
  const s = c.createGain()
  s.gain.value = send
  e.connect(s)
  s.connect(rev)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noise(t: number, dur: number, type: BiquadFilterType, f0: number, f1: number, g: number, q = 1) {
  const c = ctx!
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(f0, t)
  f.frequency.exponentialRampToValueAtTime(f1, t + dur)
  const e = c.createGain()
  e.gain.setValueAtTime(g, t)
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f)
  f.connect(e)
  e.connect(bus)
  const s = c.createGain()
  s.gain.value = 0.25
  e.connect(s)
  s.connect(rev)
  src.start(t)
  src.stop(t + dur + 0.05)
}

const bell = (f: number, t: number, dur = 2.6, g = 0.26) =>
  [
    [1, 1],
    [2.01, 0.35],
    [2.76, 0.28],
    [5.4, 0.1],
    [8.93, 0.04],
  ].forEach(([r, a], i) => tone('sine', f * r, t, dur / (1 + i * 0.7), g * a, 0.7))

const pluck = (f: number, t: number, dur = 0.9, g = 0.3) => {
  tone('sine', f, t, dur, g, 0.5)
  tone('triangle', f * 2, t, dur * 0.4, g * 0.25, 0.3)
  tone('sine', f * 4, t, dur * 0.15, g * 0.1, 0.2)
}

function clack(t: number) {
  const c = ctx!
  noise(t, 0.07, 'bandpass', 3200, 1700, 0.9, 0.9)
  noise(t, 0.03, 'highpass', 5200, 5200, 0.45)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(230, t)
  o.frequency.exponentialRampToValueAtTime(85, t + 0.1)
  const e = c.createGain()
  e.gain.setValueAtTime(0.5, t)
  e.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
  o.connect(e)
  e.connect(bus)
  o.start(t)
  o.stop(t + 0.2)
}

function play(fn: (t: number) => void) {
  if (!on) return
  try {
    const c = init()
    const go = () => fn(c.currentTime + 0.02)
    if (c.state === 'running') go()
    else c.resume().then(go).catch(() => {})
  } catch {
    /* audio non disponibile */
  }
}

export const sfx = {
  ciak: () =>
    play((t) => {
      clack(t)
      pluck(880, t + 0.11, 0.8, 0.2)
      pluck(1318.5, t + 0.2, 0.9, 0.15)
    }),
  resume: () => play((t) => pluck(659.25, t, 0.7, 0.25)),
  pause: () => play((t) => pluck(493.88, t, 0.55, 0.22)),
  focusEnd: () =>
    play((t) => {
      bell(659.25, t)
      bell(987.77, t + 0.22)
      bell(1318.5, t + 0.46, 3.2)
    }),
  breakEnd: () =>
    play((t) => {
      pluck(523.25, t, 0.9, 0.22)
      pluck(659.25, t + 0.14, 0.9, 0.22)
      pluck(783.99, t + 0.28, 1.1, 0.22)
      clack(t + 0.62)
    }),
  skip: () => play((t) => noise(t, 0.28, 'bandpass', 400, 2600, 0.5, 1.4)),
  tick: () => play((t) => tone('sine', 1900, t, 0.05, 0.05, 0.1, 0.001)),
  open: () => play((t) => pluck(783.99, t, 0.35, 0.12)),
  on: () => play((t) => pluck(880, t, 0.4, 0.14)),
  off: () => play((t) => pluck(587.33, t, 0.4, 0.12)),
}
