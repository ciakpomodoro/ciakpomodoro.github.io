import { AnimatePresence, motion } from 'framer-motion'

/* Un carattere che scorre via e ne arriva uno nuovo (cifre del timer, valori dei campi). */
export function Roll({ value, className = '' }: { value: string | number; className?: string }) {
  return (
    <span className={`roll ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          className="roll-i"
          initial={{ y: '55%', opacity: 0, filter: 'blur(5px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-55%', opacity: 0, filter: 'blur(5px)' }}
          transition={{ duration: 0.38, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function RollText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <Roll key={i} value={ch} />
      ))}
    </span>
  )
}
