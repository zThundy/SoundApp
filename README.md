# SoundApp

[![Build and Release](https://github.com/zThundy/SoundApp/actions/workflows/build.yml/badge.svg)](https://github.com/zThundy/SoundApp/actions/workflows/build.yml)
[![Echo Version - v0.0.0](https://img.shields.io/badge/Echo_Version-v-2ea44f)](https://github.com/zThundy/SoundApp/releases)

Applicazione Electron per gestire gli alert (e suoni) di uno stream Twitch.

## Pagina Alerts per OBS

All'avvio dell'applicazione parte automaticamente un piccolo webserver locale che espone una pagina bianca pensata per essere catturata da OBS.

URL locale (di default):

```
http://localhost:3137/
```

### Come usarla in OBS
1. Apri OBS.
2. Aggiungi una nuova sorgente: Browser Source.
3. Inserisci l'URL `http://localhost:3137/`.
4. Imposta la larghezza/altezza desiderata (es. 1920x1080) e conferma.
5. La pagina è inizialmente bianca. Gli alert verranno mostrati al centro quando inviati dall'app.

### Test rapido
All'avvio l'app invia un alert di test dopo ~5 secondi: dovresti vedere il testo "Test Alert" al centro che poi svanisce.

### Integrazione futura con Twitch
La funzione globale `alertBroadcast` (registrata nel main process) può essere usata per inviare alert:

```ts
(globalThis as any).alertBroadcast({ type: 'alert', text: 'Nuovo redeem!' })
```

### Sicurezza / Ambito
Il server ascolta solo su `127.0.0.1` ed è quindi accessibile solo in locale.

### Personalizzazione stile
Modifica il file `electron/main/alertServer.ts` per cambiare CSS o animazioni degli alert.

---

Per problemi o idee: apri una issue nel repository.

## Creazione Alert dal Frontend

Dal menu (pagina `alert`) puoi creare due tipi di alert:

1. Custom HTML/CSS/JS
	- Inserisci HTML (i tag `<script>` vengono rimossi automaticamente).
	- Puoi aggiungere CSS e JS separati. Il JS viene eseguito con `new Function()`, quindi NON usare codice non fidato.
	- Specifica la durata in millisecondi (default 10000) dopo la quale l'alert sparisce.
	- Premi "Invia Alert Custom" per mandarlo alla pagina OBS.

2. Template Immagine
	- Seleziona un file immagine.
	- Imposta il testo (caption) mostrato sotto.
	- Durata (ms) indica quanto resta visibile (default 6000).
	- Premi "Invia Template Immagine" per inviare.

### Payloads
Esempi di payload inviati via IPC:

```js
// HTML custom
{ type: 'raw', html: '<div>Hey!</div>', css: 'div{color:red}', js: 'console.log("alert")', duration: 8000 }

// Template immagine
{ type: 'imageTemplate', imageDataUrl: 'data:image/png;base64,...', text: 'Nuovo redeem!', duration: 6000 }
```

### Sicurezza
- Evita di incollare codice JS di origine sconosciuta.
- I tag `<script>` nel campo HTML vengono rimossi, ma il campo JS viene eseguito.
- Il server è solo locale (127.0.0.1).