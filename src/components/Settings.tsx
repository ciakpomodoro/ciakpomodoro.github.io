import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { actions, type Settings as S } from '../store'
import { sfx } from '../audio'
import { askPermission, permission, showNotification, type Permission } from '../notify'
import { Roll } from './Roll'

const spring = { type: 'spring', stiffness: 600, damping: 34 } as const

function Item({ i, children }: { i: number; children: ReactNode }) {
  return (
    <motion.div
      className="item"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + i * 0.035, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Stepper({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (n: number) => void }) {
  const set = (n: number) => {
    const v = Math.max(min, Math.min(max, n))
    if (v !== value) {
      onChange(v)
      sfx.tick()
    }
  }
  return (
    <div className="stepper">
      <motion.button whileTap={{ scale: 0.85 }} aria-label="Meno" onClick={() => set(value - 1)} disabled={value <= min}>
        –
      </motion.button>
      <span className="val">
        {String(value)
          .split('')
          .map((c, i, a) => (
            <Roll key={a.length - i} value={c} />
          ))}
        <small>{unit}</small>
      </span>
      <motion.button whileTap={{ scale: 0.85 }} aria-label="Più" onClick={() => set(value + 1)} disabled={value >= max}>
        +
      </motion.button>
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={`tg${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
      <motion.span layout transition={spring} className="knob" />
    </button>
  )
}

function Row({ title, hint, warn, children }: { title: string; hint?: string; warn?: boolean; children: ReactNode }) {
  return (
    <div className="srow">
      <div className="stxt">
        <b>{title}</b>
        {hint && <span className={warn ? 'warn' : ''}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function SettingsSheet({ open, onClose, s }: { open: boolean; onClose: () => void; s: S }) {
  const controls = useDragControls()
  const set = (p: Partial<S>) => actions.setSettings(p)

  const toggle = (key: 'longEnabled' | 'autoStart' | 'soundOn') => (v: boolean) => {
    set({ [key]: v })
    if (key === 'soundOn') {
      if (v) setTimeout(sfx.on, 30)
    } else v ? sfx.on() : sfx.off()
  }

  const [perm, setPerm] = useState<Permission>(permission)

  useEffect(() => {
    if (open) setPerm(permission())
  }, [open])

  const toggleNotify = async (v: boolean) => {
    if (!v) return set({ notify: false })
    const ok = await askPermission()
    setPerm(permission())
    set({ notify: ok })
    if (ok) showNotification('Ciak', 'Notifiche attive.')
  }

  const notifyHint =
    perm === 'unsupported'
      ? "Non disponibili qui. Su iPhone installa prima l'app in Home."
      : perm === 'denied'
        ? 'Bloccate dal browser: sbloccale dalle impostazioni del sito, poi riprova.'
        : "avviso a fine fase se l'app è in secondo piano"

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="sheet"
            role="dialog"
            aria-label="Impostazioni"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => {
              if (i.offset.y > 110 || i.velocity.y > 600) onClose()
            }}
          >
            <div className="grab" onPointerDown={(e) => controls.start(e)}>
              <i />
            </div>
            <div className="shead">
              <h2>Impostazioni</h2>
              <motion.button className="close" whileTap={{ scale: 0.85 }} onClick={onClose} aria-label="Chiudi">
                ✕
              </motion.button>
            </div>

            <div className="sbody">
              <Item i={0}>
                <h3>Tempi</h3>
                <Row title="Take" hint="durata del lavoro">
                  <Stepper value={s.focusMin} min={1} max={180} unit="min" onChange={(n) => set({ focusMin: n })} />
                </Row>
                <Row title="Stacco" hint="pausa breve">
                  <Stepper value={s.shortMin} min={1} max={60} unit="min" onChange={(n) => set({ shortMin: n })} />
                </Row>
              </Item>

              <Item i={1}>
                <Row title="Stacco lungo" hint="ogni tot take">
                  <Toggle on={s.longEnabled} onChange={toggle('longEnabled')} label="Pausa lunga" />
                </Row>
                <AnimatePresence initial={false}>
                  {s.longEnabled && (
                    <motion.div
                      key="long"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Row title="Durata" hint="pausa lunga">
                        <Stepper value={s.longMin} min={1} max={90} unit="min" onChange={(n) => set({ longMin: n })} />
                      </Row>
                      <Row title="Ogni" hint="take completati">
                        <Stepper value={s.longEvery} min={2} max={8} unit="take" onChange={(n) => set({ longEvery: n })} />
                      </Row>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Item>

              <Item i={2}>
                <h3>Flusso</h3>
                <Row title="Avvio automatico" hint="passa da solo a take e stacco">
                  <Toggle on={s.autoStart} onChange={toggle('autoStart')} label="Avvio automatico" />
                </Row>
                <Row title="Notifiche" hint={notifyHint} warn={perm === 'denied' || perm === 'unsupported'}>
                  <Toggle on={s.notify} onChange={toggleNotify} label="Notifiche" />
                </Row>
              </Item>

              <Item i={3}>
                <h3>Suoni</h3>
                <Row title="Suoni attivi">
                  <Toggle on={s.soundOn} onChange={toggle('soundOn')} label="Suoni" />
                </Row>
                <Row title="Volume">
                  <input
                    className="range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={s.volume}
                    aria-label="Volume"
                    style={{ ['--v' as string]: `${s.volume * 100}%` }}
                    onChange={(e) => set({ volume: Number(e.target.value) })}
                    onPointerUp={() => sfx.tick()}
                  />
                </Row>
                <div className="try">
                  {(
                    [
                      ['Ciak', sfx.ciak],
                      ['Fine take', sfx.focusEnd],
                      ['Fine stacco', sfx.breakEnd],
                    ] as const
                  ).map(([name, fn]) => (
                    <motion.button key={name} whileHover={{ y: -2 }} whileTap={{ scale: 0.93 }} onClick={fn}>
                      ▸ {name}
                    </motion.button>
                  ))}
                </div>
              </Item>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
