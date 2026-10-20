import { useSyncExternalStore } from 'react'

/*
  Modello dati. Tre blocchi, ognuno con il suo `updatedAt`, così in futuro
  locale e cloud si fondono blocco per blocco (vince l'ultima modifica).
*/
export type Phase = 'focus' | 'short' | 'long'
export type Status = 'idle' | 'running' | 'paused'

export interface Settings {
  focusMin: number
  shortMin: number
  longMin: number
  longEnabled: boolean
  longEvery: number
  autoStart: boolean
  soundOn: boolean
  volume: number
  notify: boolean
  updatedAt: number
}

export interface TimerState {
  phase: Phase
  status: Status
  endsAt: number | null // timestamp di fine: il tempo si calcola sempre da qui
  remainingMs: number // usato solo quando non è in corso
  totalMs: number
  cycle: number // take completati dall'ultima pausa lunga
  updatedAt: number
}

export interface DayStat {
  focusSessions: number
  focusMs: number
}

export interface Stats {
  days: Record<string, DayStat>
  updatedAt: number
}

export interface AppData {
  v: 1
  settings: Settings
  timer: TimerState
  stats: Stats
}

export interface FinishEvent {
  kind: 'focusEnd' | 'breakEnd'
  at: number
  next: Phase
}

const KEY = 'ciak.v1'

export const defaultSettings: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEnabled: true,
  longEvery: 4,
  autoStart: true,
  soundOn: true,
  volume: 0.7,
  notify: false,
  updatedAt: 0,
}

export const phaseMs = (s: Settings, p: Phase) =>
  (p === 'focus' ? s.focusMin : p === 'short' ? s.shortMin : s.longMin) * 60_000

const initialTimer = (s: Settings): TimerState => {
  const t = phaseMs(s, 'focus')
  return { phase: 'focus', status: 'idle', endsAt: null, remainingMs: t, totalMs: t, cycle: 0, updatedAt: 0 }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      const settings: Settings = { ...defaultSettings, ...p.settings }
      const timer: TimerState = { ...initialTimer(settings), ...p.timer }
      const stats: Stats = { days: {}, updatedAt: 0, ...p.stats }
      return { v: 1, settings, timer, stats }
    }
  } catch {
    /* dati rovinati o storage bloccato: si riparte puliti */
  }
  return { v: 1, settings: defaultSettings, timer: initialTimer(defaultSettings), stats: { days: {}, updatedAt: 0 } }
}

let state: AppData = load()
const listeners = new Set<() => void>()

function commit(patch: Partial<AppData>) {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage pieno o bloccato */
  }
  listeners.forEach((l) => l())
}

export const getState = () => state
export const useStore = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )

export const dayKey = (ms: number) => new Date(ms).toLocaleDateString('sv-SE')
export const todayStat = (s: Stats): DayStat => s.days[dayKey(Date.now())] ?? { focusSessions: 0, focusMs: 0 }

export const remainingOf = (t: TimerState, now = Date.now()) =>
  t.status === 'running' && t.endsAt !== null ? Math.max(0, t.endsAt - now) : t.remainingMs

function nextOf(s: Settings, t: TimerState, completed: boolean): { phase: Phase; cycle: number } {
  if (t.phase === 'focus') {
    const cycle = completed ? t.cycle + 1 : t.cycle
    const goLong = s.longEnabled && completed && cycle >= s.longEvery
    return { phase: goLong ? 'long' : 'short', cycle }
  }
  return { phase: 'focus', cycle: t.phase === 'long' ? 0 : t.cycle }
}

function enter(s: Settings, t: TimerState, n: { phase: Phase; cycle: number }, from: number, run: boolean): TimerState {
  const total = phaseMs(s, n.phase)
  return {
    ...t,
    phase: n.phase,
    cycle: n.cycle,
    totalMs: total,
    remainingMs: total,
    status: run ? 'running' : 'idle',
    endsAt: run ? from + total : null,
    updatedAt: Date.now(),
  }
}

function addFocus(stats: Stats, at: number, ms: number): Stats {
  const k = dayKey(at)
  const d = stats.days[k] ?? { focusSessions: 0, focusMs: 0 }
  return {
    days: { ...stats.days, [k]: { focusSessions: d.focusSessions + 1, focusMs: d.focusMs + ms } },
    updatedAt: Date.now(),
  }
}

/* Fa avanzare il timer fino a "adesso". Se l'app era chiusa, recupera le fasi passate. */
export function tick(now = Date.now()): FinishEvent[] {
  let t = state.timer
  if (t.status !== 'running' || t.endsAt === null || t.endsAt > now) return []
  const s = state.settings
  const events: FinishEvent[] = []
  let stats = state.stats
  let guard = 0
  while (t.status === 'running' && t.endsAt !== null && t.endsAt <= now && guard++ < 200) {
    const at = t.endsAt
    if (t.phase === 'focus') stats = addFocus(stats, at, t.totalMs)
    const n = nextOf(s, t, true)
    events.push({ kind: t.phase === 'focus' ? 'focusEnd' : 'breakEnd', at, next: n.phase })
    t = enter(s, t, n, at, s.autoStart)
  }
  commit({ timer: t, stats })
  return events
}

export const actions = {
  start() {
    const t = state.timer
    if (t.status === 'running') return
    const now = Date.now()
    commit({ timer: { ...t, status: 'running', endsAt: now + t.remainingMs, updatedAt: now } })
  },
  pause() {
    const t = state.timer
    if (t.status !== 'running') return
    const now = Date.now()
    commit({ timer: { ...t, status: 'paused', remainingMs: remainingOf(t, now), endsAt: null, updatedAt: now } })
  },
  reset() {
    const t = state.timer
    const total = phaseMs(state.settings, t.phase)
    commit({ timer: { ...t, status: 'idle', endsAt: null, remainingMs: total, totalMs: total, updatedAt: Date.now() } })
  },
  skip() {
    const s = state.settings
    const t = state.timer
    const now = Date.now()
    commit({ timer: enter(s, t, nextOf(s, t, false), now, s.autoStart) })
  },
  setSettings(patch: Partial<Settings>) {
    const settings = { ...state.settings, ...patch, updatedAt: Date.now() }
    let timer = state.timer
    if (timer.status === 'idle') {
      const total = phaseMs(settings, timer.phase)
      timer = { ...timer, remainingMs: total, totalMs: total, updatedAt: Date.now() }
    }
    commit({ settings, timer })
  },
}
