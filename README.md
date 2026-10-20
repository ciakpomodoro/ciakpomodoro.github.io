# Ciak Pomodoro

Timer Pomodoro installabile (PWA). Take di lavoro, stacchi di pausa.
Funziona anche offline e salva le impostazioni sul dispositivo.

## Pubblicarla su GitHub Pages
1. Su github.com crea una **nuova repository** (pubblica).
2. Scegli **uploading an existing file**, seleziona tutto il contenuto di questa cartella e trascinalo nella pagina. Poi **Commit changes**.
3. Apri **Settings → Pages**. In *Build and deployment* scegli **Deploy from a branch**, ramo **main**, cartella **/docs**, e salva.
4. Dopo un paio di minuti l'app è su `https://TUO-NOME.github.io/NOME-REPOSITORY/`.

La cartella `docs` contiene l'app già pronta: è quella che GitHub pubblica.

## Installarla
- **iPhone:** apri l'indirizzo in Safari → Condividi → *Aggiungi alla schermata Home*.
- **Mac (Chrome):** icona di installazione nella barra dell'indirizzo.

## Per chi modifica il codice
Prima volta: `npm install`. Poi:
- `npm run dev` — apre l'app in sviluppo (modifiche in tempo reale)
- `npm run build` — ricrea la cartella `docs` con l'app pronta da pubblicare
- `node scripts/make-icons.mjs` — rigenera favicon e icone dal logo

Dopo ogni modifica va ricaricata su GitHub la cartella `docs` aggiornata (e i file toccati).

## Dove sta cosa
- `src/store.ts` — dati e logica del timer (salvati in locale, pronti per il cloud)
- `src/audio.ts` — i suoni, generati dal codice
- `src/components/` — logo, quadrante, impostazioni, animazioni
- `src/styles.css` — palette e stile (grafite + arancio #DA5512)
- `docs/` — l'app compilata, da pubblicare

## Da fare
- Account e sincronizzazione tra dispositivi (Firebase)
- Notifiche a schermo bloccato (servizio gratuito)
