import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Logo } from './components/Logo'
import { actions, getState, remainingOf, tick, todayStat, useStore, type FinishEvent, type Phase } from './store'
import { configure, sfx, unlock } from './audio'
import { showNotification } from './notify'
import { Dial } from './components/Dial'
import { Clapper } from './components/Clapper'
import { SettingsSheet } from './components/Settings'

const ease = [0.2, 0.7, 0.2, 1] as const
const LOGO = 150 // lato del logo durante l'apertura, in px

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

const PHASE_NAME: Record<Phase, string> = { focus: 'Take', short: 'Stacco', long: 'Stacco lungo' }
const SKIP_LABEL: Record<Phase, string> = { focus: 'Salta take', short: 'Salta stacco', long: 'Salta stacco' }

function onFinish(ev: FinishEvent) {
  const { settings } = getState()
  if (ev.kind === 'focusEnd') sfx.focusEnd()
  else sfx.breakEnd()
  if (settings.notify && document.hidden) {
    if (ev.kind === 'focusEnd') showNotification('Stacco!', 'Take finito. Respira un attimo.')
    else showNotification('Ciak!', 'Si torna al lavoro.')
  }
}

export default function App() {
  const { settings, timer, stats } = useStore()
  const [sheet, setSheet] = useState(false)
  const [clap, setClap] = useState(0)
  const reduced = useReducedMotion()
  const slot = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<'splash' | 'fly' | 'app'>(reduced ? 'app' : 'splash')
  const [pos, setPos] = useState({ cx: 0, cy: 0, tx: 0, ty: 0, s: 1 })

  // Apertura in tre tempi: il logo si compone al centro, vola in alto a sinistra, poi compare l'app
  useLayoutEffect(() => {
    const measure = () => {
      const r = slot.current?.getBoundingClientRect()
      setPos({
        cx: window.innerWidth / 2 - LOGO / 2,
        cy: window.innerHeight / 2 - LOGO / 2,
        tx: r?.left ?? 16,
        ty: r?.top ?? 12,
        s: (r?.width ?? 40) / LOGO,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (stage === 'app') return
    const id = setTimeout(() => setStage(stage === 'splash' ? 'fly' : 'app'), stage === 'splash' ? 2500 : 1100)
    return () => clearTimeout(id)
  }, [stage])

  const running = timer.status === 'running'
  const today = todayStat(stats)

  useEffect(() => configure(settings.soundOn, settings.volume), [settings.soundOn, settings.volume])

  // Sblocca l'audio al primo tocco (richiesto da iPhone/Safari)
  useEffect(() => {
    const h = () => void unlock()
    window.addEventListener('pointerdown', h, { once: true })
    return () => window.removeEventListener('pointerdown', h)
  }, [])

  // Motore: controlla la scadenza di continuo; recupera le fasi perse se l'app era in secondo piano
  useEffect(() => {
    const run = () => {
      const ev = tick()
      const last = ev[ev.length - 1]
      if (last && Date.now() - last.at < 10_000) onFinish(last)
    }
    run()
    const id = setInterval(run, 250)
    document.addEventListener('visibilitychange', run)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', run)
    }
  }, [])

  useEffect(() => {
    if (running && timer.phase === 'focus') setClap((c) => c + 1)
  }, [running, timer.phase])

  // Titolo scheda con il tempo che resta
  useEffect(() => {
    if (!running) {
      document.title = 'Ciak Pomodoro'
      return
    }
    const set = () => {
      const s = Math.ceil(remainingOf(getState().timer) / 1000)
      document.title = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')} · ${PHASE_NAME[getState().timer.phase]}`
    }
    set()
    const id = setInterval(set, 1000)
    return () => clearInterval(id)
  }, [running, timer.phase])

  // Schermo acceso mentre gira (se il dispositivo lo permette)
  useEffect(() => {
    if (!running || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const get = () => navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {})
    get()
    const vis = () => document.visibilityState === 'visible' && get()
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      lock?.release().catch(() => {})
    }
  }, [running])

  const onMain = () => {
    const t = getState().timer
    if (t.status === 'running') {
      actions.pause()
      sfx.pause()
    } else if (t.status === 'paused') {
      actions.start()
      sfx.resume()
    } else {
      actions.start()
      t.phase === 'focus' ? sfx.ciak() : sfx.resume()
    }
  }

  const onSkip = () => {
    actions.skip()
    sfx.skip()
  }

  const onReset = () => {
    actions.reset()
    sfx.tick()
  }

  const takeNo = today.focusSessions + 1
  const chip = timer.phase === 'focus' ? `Take ${takeNo}` : PHASE_NAME[timer.phase]
  const filled = Math.min(timer.cycle, settings.longEvery)

  return (
    <div className={`app ${running ? 'running' : ''} ${timer.status} ${sheet ? 'sheet-open' : ''}`} data-phase={timer.phase}>
      <div className="orbs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="grain" />

      <AnimatePresence>
        {stage === 'splash' && (
          <motion.div key="splash" className="splash" exit={{ opacity: 0 }} transition={{ duration: 0.9, ease }}>
            <motion.div
              className="splash-name"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6, ease }}
            >
              Ciak Pomodoro
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Un solo logo, che dal centro viaggia fino al suo posto: niente doppioni, niente sfarfallio */}
      <motion.div
        className={`logo-fly${stage === 'app' ? ' docked' : ''}`}
        style={{ originX: 0, originY: 0 }}
        initial={false}
        animate={stage === 'splash' ? { x: pos.cx, y: pos.cy, scale: 1 } : { x: pos.tx, y: pos.ty, scale: pos.s }}
        transition={stage === 'fly' ? { duration: 1.05, ease: [0.7, 0, 0.2, 1] } : { duration: 0 }}
      >
        <Logo size={LOGO} assemble={!reduced} />
      </motion.div>

      {/* L'app compare solo quando il logo è arrivato */}
      <motion.main className="stage" initial="hidden" animate={stage === 'app' ? 'show' : 'hidden'} transition={{ staggerChildren: 0.09 }}>
        <div className="logo-slot" ref={slot} />
        <motion.header className="top" variants={rise}>
          <div className="logo-space" />
          <div className="topr">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={today.focusSessions}
                className="today"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                oggi · {today.focusSessions} {today.focusSessions === 1 ? 'take' : 'take'}
              </motion.div>
            </AnimatePresence>
            <motion.button
              className="icon-btn"
              whileHover={{ rotate: 45 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                setSheet(true)
                sfx.open()
              }}
              aria-label="Impostazioni"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2.2" />
                <circle cx="8" cy="17" r="2.2" />
              </svg>
            </motion.button>
          </div>
        </motion.header>

        <motion.div className="phase" variants={rise}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={chip}
              className="chip"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.3, ease }}
            >
              {timer.phase === 'focus' ? <Clapper trigger={clap} /> : <span className="breath" />}
              <span>{chip}</span>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div className="dialwrap" variants={{ hidden: { opacity: 0, scale: 0.92, y: 24 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease } } }}>
          <Dial
            timer={timer}
            footer={
              <div className="segs" aria-hidden="true">
                {settings.longEnabled ? (
                  Array.from({ length: settings.longEvery }, (_, i) => (
                    <i key={i} className={i < filled ? 'on' : i === filled && timer.phase === 'focus' ? 'now' : ''} />
                  ))
                ) : (
                  <span className="today-solo">{PHASE_NAME[timer.phase].toLowerCase()}</span>
                )}
              </div>
            }
          />
        </motion.div>

        <motion.div className="controls" variants={rise}>
          <div className="side">
            <motion.button className="round" whileHover={{ y: -2 }} whileTap={{ scale: 0.88, rotate: -40 }} onClick={onReset} aria-label="Ricomincia">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                <path d="M4 4v4.5h4.5" />
              </svg>
            </motion.button>
            <span>Ricomincia</span>
          </div>

          <motion.button className="main-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} onClick={onMain} aria-label={running ? 'Pausa' : timer.status === 'paused' ? 'Riprendi' : 'Avvia'}>
            <AnimatePresence mode="wait" initial={false}>
              {running ? (
                <motion.svg key="pause" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" initial={{ scale: 0.4, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.4, rotate: 45, opacity: 0 }} transition={{ duration: 0.22, ease }}>
                  <rect x="6" y="5" width="4" height="14" rx="1.4" />
                  <rect x="14" y="5" width="4" height="14" rx="1.4" />
                </motion.svg>
              ) : (
                <motion.svg key="play" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" initial={{ scale: 0.4, rotate: 45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.4, rotate: -45, opacity: 0 }} transition={{ duration: 0.22, ease }}>
                  <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.4-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="side">
            <motion.button className="round" whileHover={{ y: -2 }} whileTap={{ scale: 0.88, x: 6 }} onClick={onSkip} aria-label={SKIP_LABEL[timer.phase]}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 6.2v11.6a.9.9 0 0 0 1.4.75l8.2-5.8a.9.9 0 0 0 0-1.5L6.4 5.45A.9.9 0 0 0 5 6.2Z" />
                <rect x="17" y="5.5" width="2.4" height="13" rx="1.2" />
              </svg>
            </motion.button>
            <span>{SKIP_LABEL[timer.phase]}</span>
          </div>
        </motion.div>
      </motion.main>

      <SettingsSheet open={sheet} onClose={() => setSheet(false)} s={settings} />
    </div>
  )
}
