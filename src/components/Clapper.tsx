import { motion } from 'framer-motion'

/* Il ciak piccolo accanto a "Take N": la barra superiore scatta a ogni avvio. */
export function Clapper({ trigger }: { trigger: number }) {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden="true">
      <rect x="1.5" y="8" width="19" height="10.5" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 8 L8 18.5 M10.5 8 L13.5 18.5 M16 8 L19 18.5" stroke="currentColor" strokeWidth="1.2" opacity=".45" />
      <motion.g
        key={trigger}
        initial={{ rotate: -24 }}
        animate={{ rotate: 0 }}
        transition={{ type: 'spring', stiffness: 800, damping: 16 }}
        style={{ originX: 0, originY: 1 }}
      >
        <rect x="1.5" y="3" width="19" height="4.2" rx="1.2" fill="currentColor" />
      </motion.g>
    </svg>
  )
}
