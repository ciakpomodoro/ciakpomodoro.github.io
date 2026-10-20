// Genera favicon e icone dell'app (PNG) dal logo. Uso: node scripts/make-icons.mjs
// Il disegno è lo stesso di src/components/Logo.tsx (a riposo).
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const BG = '#16171A'
const CREAM = '#F2EFEA'
const DARK = '#16171A'
const BODY = 'M60 36 C92 30 114 50 112 76 C110 100 88 114 60 114 C32 114 10 100 8 76 C6 50 28 30 60 36 Z'

// Logo su griglia 120x120; il disegno occupa circa x 8..112, y 10..114
const mark = `
  <defs>
    <radialGradient id="tom" cx="0.36" cy="0.32" r="0.9"><stop offset="0" stop-color="#ff9a5c"/><stop offset="0.5" stop-color="#e0591a"/><stop offset="1" stop-color="#8f300a"/></radialGradient>
    <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.26"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.07"/><stop offset="1" stop-color="#fff" stop-opacity="0.12"/></linearGradient>
    <filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    <clipPath id="cp"><rect x="24" y="16" width="72" height="18" rx="5"/></clipPath>
  </defs>
  <ellipse cx="60" cy="80" rx="50" ry="40" fill="#da5512" opacity="0.35" filter="url(#bl)"/>
  <path d="${BODY}" fill="url(#tom)"/>
  <path d="${BODY}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.4"/>
  <ellipse cx="38" cy="58" rx="15" ry="8" transform="rotate(-32 38 58)" fill="#fff" opacity="0.38"/>
  <path d="M60 52 A26 26 0 1 1 34 78" fill="none" stroke="${CREAM}" stroke-opacity="0.75" stroke-width="5" stroke-linecap="round" pathLength="1" stroke-dasharray="0.75 1"/>
  <g transform="rotate(-8 24 34)">
    <rect x="24" y="18" width="72" height="18" rx="5" fill="rgba(0,0,0,0.28)"/>
    <rect x="24" y="16" width="72" height="18" rx="5" fill="${CREAM}"/>
    <g clip-path="url(#cp)" fill="${DARK}"><polygon points="24,16 48.3,16 38.4,34 14.1,34"/><polygon points="72.6,16 96.9,16 87,34 62.7,34"/></g>
    <rect x="24" y="16" width="72" height="8" rx="5" fill="url(#gl)"/>
    <rect x="24" y="16" width="72" height="18" rx="5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
  </g>`

// "round" = angoli arrotondati (icona normale); altrimenti a tutto campo (iOS e maschera Android)
const svg = (round, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${round ? 'rx="112"' : ''} fill="${BG}"/>
  <g transform="translate(256 262) scale(${scale}) translate(-60 -63)">${mark}</g></svg>`

writeFileSync('public/icon.svg', svg(true, 4.0))

const png = (name, size, round, scale) =>
  sharp(Buffer.from(svg(round, scale))).resize(size, size).png().toFile(`public/${name}`)

await png('pwa-192.png', 192, true, 4.0)
await png('pwa-512.png', 512, true, 4.0)
await png('pwa-maskable-512.png', 512, false, 3.2)
await png('apple-touch-icon.png', 180, false, 3.6)
console.log('Icone create in public/')
