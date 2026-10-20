import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { remainingOf, type TimerState } from '../store'
import { Roll } from './Roll'

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

const WAVE = 'M0 10 Q 50 0 100 10 T 200 10 T 300 10 T 400 10 V 40 H 0 Z'

/* Carta di vetro: il tempo che resta è il livello del liquido che scende. */
export const Dial = memo(function Dial({ timer, footer }: { timer: TimerState; footer?: ReactNode }) {
  const liquid = useRef<HTMLDivElement>(null)
  const [secs, setSecs] = useState(() => Math.ceil(remainingOf(timer) / 1000))

  useEffect(() => {
    let raf = 0
    const frame = () => {
      const rem = remainingOf(timer)
      const f = timer.totalMs > 0 ? Math.min(1, rem / timer.totalMs) : 0
      if (liquid.current) {
        liquid.current.style.transform = `translateY(${(1 - f) * 100}%)`
        liquid.current.style.opacity = f < 0.004 ? '0' : '1'
      }
      setSecs(Math.ceil(rem / 1000))
      if (timer.status === 'running') raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [timer])

  const mm = pad(Math.floor(secs / 60))
  const ss = pad(secs % 60)
  const caption =
    timer.status === 'running' && timer.endsAt
      ? `fine alle ${hhmm(timer.endsAt)}`
      : timer.status === 'paused'
        ? 'in pausa'
        : `${Math.round(timer.totalMs / 60000)} min`

  return (
    <div className={`card glass ${timer.status}`}>
      <div className="liquid" ref={liquid}>
        <svg className="wave w1" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
          <path d={WAVE} />
        </svg>
        <svg className="wave w2" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
          <path d={WAVE} />
        </svg>
        <div className="body" />
      </div>
      <div className="sheen" />

      <div className="read">
        <div className="time" role="timer" aria-label={`${mm} minuti e ${ss} secondi`}>
          {mm.split('').map((d, i) => (
            <Roll key={`m${i}`} value={d} />
          ))}
          <span className="colon">:</span>
          {ss.split('').map((d, i) => (
            <Roll key={`s${i}`} value={d} />
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={caption}
            className="caption"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {caption}
          </motion.div>
        </AnimatePresence>
      </div>
      {footer && <div className="cardfoot">{footer}</div>}
    </div>
  )
})
