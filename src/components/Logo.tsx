import { useId } from 'react'
import { motion } from 'framer-motion'

const CREAM = '#F2EFEA'
const DARK = '#16171A'

const BODY = 'M60 36 C92 30 114 50 112 76 C110 100 88 114 60 114 C32 114 10 100 8 76 C6 50 28 30 60 36 Z'

const ease = [0.2, 0.7, 0.2, 1] as const
const easeInOut = [0.6, 0, 0.2, 1] as const

/*
  Il marchio: un pomodoro lucido con la battaglia del ciak al posto del picciolo
  e un arco di timer sul corpo. Con `assemble` si compone pezzo per pezzo;
  con `layoutId` lo stesso logo può "viaggiare" da una posizione all'altra.
*/
export function Logo({ size, assemble = false }: { size: number; assemble?: boolean }) {
  const id = useId().replace(/:/g, '')
  const a = assemble
  const ref = (n: string) => `url(#${n}${id})`

  return (
    <div style={{ width: size, height: size, flex: 'none' }} role="img" aria-label="Ciak Pomodoro">
      <svg viewBox="0 0 120 120" width="100%" height="100%" overflow="visible" fill="none">
        <defs>
          <radialGradient id={`tom${id}`} cx="0.36" cy="0.32" r="0.9">
            <stop offset="0" stopColor="#ff9a5c" />
            <stop offset="0.5" stopColor="#e0591a" />
            <stop offset="1" stopColor="#8f300a" />
          </radialGradient>
          <linearGradient id={`gl${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
          </linearGradient>
          <filter id={`bl${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <clipPath id={`cp${id}`}>
            <rect x="24" y="16" width="72" height="18" rx="5" />
          </clipPath>
        </defs>

        <motion.ellipse
          cx="60"
          cy="80"
          rx="50"
          ry="40"
          fill="#da5512"
          filter={ref('bl')}
          initial={a ? { opacity: 0 } : false}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 1.4, delay: 0.3 }}
        />

        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          initial={a ? { scale: 0.5, opacity: 0 } : false}
          animate={a ? { scale: [0.5, 1.06, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={
            a
              ? {
                  scale: { duration: 0.95, delay: 0.15, times: [0, 0.7, 1], ease },
                  opacity: { duration: 0.3, delay: 0.15, ease: 'linear' },
                }
              : { duration: 0 }
          }
        >
          <path d={BODY} fill={ref('tom')} />
          <path d={BODY} stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" />
          <ellipse cx="38" cy="58" rx="15" ry="8" transform="rotate(-32 38 58)" fill="#fff" opacity="0.38" />
        </motion.g>

        <motion.path
          d="M60 52 A26 26 0 1 1 34 78"
          stroke={CREAM}
          strokeOpacity="0.75"
          strokeWidth="5"
          strokeLinecap="round"
          initial={a ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 0.75, opacity: 1 }}
          transition={{
            pathLength: { duration: 0.8, delay: 0.9, ease: easeInOut },
            opacity: { duration: 0.3, delay: 1, ease: 'linear' },
          }}
        />

        <motion.g
          style={{ originX: 0, originY: 1 }}
          initial={a ? { rotate: -62, y: -18, opacity: 0 } : false}
          animate={a ? { rotate: [-62, 3, -8], y: [-18, 0, 0], opacity: 1 } : { rotate: -8, y: 0, opacity: 1 }}
          transition={
            a
              ? {
                  rotate: { duration: 0.8, delay: 1, times: [0, 0.5, 1], ease: 'easeOut' },
                  y: { duration: 0.8, delay: 1, times: [0, 0.5, 1], ease: 'easeOut' },
                  opacity: { duration: 0.12, delay: 1, ease: 'linear' },
                }
              : { duration: 0 }
          }
        >
          <rect x="24" y="18" width="72" height="18" rx="5" fill="rgba(0,0,0,0.28)" />
          <rect x="24" y="16" width="72" height="18" rx="5" fill={CREAM} />
          <g clipPath={ref('cp')} fill={DARK}>
            <polygon points="24,16 48.3,16 38.4,34 14.1,34" />
            <polygon points="72.6,16 96.9,16 87,34 62.7,34" />
          </g>
          <rect x="24" y="16" width="72" height="8" rx="5" fill={ref('gl')} />
          <rect x="24" y="16" width="72" height="18" rx="5" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        </motion.g>
      </svg>
    </div>
  )
}
