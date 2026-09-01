# WebMod - Specifica Estensione Chrome

## Introduzione
Questo file contiene le specifiche tecniche del progetto per lo sviluppo con agenti AI (Opencode o Claude Code). L'agente AI, prima di eseguire modifiche, deve leggere questo file per comprendere il contesto del progetto.

## Panoramica
**Tipo**: Estensione Chrome (Manifest v3)
**Scopo**: Modificare il contenuto delle pagine web in tempo reale
**Lingua codice**: Inglese (tradotto in italiano, potenzialmente estendibile ad altre lingue)
**Cartella**: /web-mod/

## Struttura File
```
web-mod/
├── manifest.json    # Manifest estensione v3
├── popup.html       # Struttura UI principale
├── popup.css        # Tutti gli stili
├── popup.js         # Logica UI, traduzioni, gestione comandi
├── content.js       # Script contenuto: funzionalità modulo corrente
├── README.md        # Documentazione in inglese
├── LEGGIMI.md       # Documentazione in italiano
├── LICENSE.txt      # Licenza
└── AGENTS.md        # Specifiche tecniche per agenti AI
```

## Funzionalità Attuali

### 1. Rimuovi Classi CSS
- **Input**: Textarea che accetta selettori separati da virgola
- **Sintassi Supportata**:
  - `.class1` - rimuove class1 dagli elementi che la hanno
  - `.class1 .class2` - rimuove class2 dagli elementi dentro class1
  - `.class1.class2` - rimuove class1 E class2 dagli elementi con entrambe
  - `.class1:-.class2` - rimuove SOLO class2 dagli elementi che hanno anche class1
  - `.class1:-.class2,.class3` - rimuove SOLO class2 e class3 dagli elementi class1
- **Implementazione**: `content.js` analizza i selettori e usa `element.classList.remove()`

### 2. Modalità Sorveglianza (MutationObserver)
- **Scopo**: Mantiene le modifiche attive se gli script del sito le ripristinano
- **Implementazione**: `content.js` usa MutationObserver su `childList` e `subtree`
- **Comportamento**: Quando vengono rilevate modifiche DOM, riapplica gli ultimi selettori usati
- **Toggle**: Pulsante Applica attiva, Pulsante Ferma disattiva, Pulsante Resetta ricarica la pagina

### 3. UI Multilingua (EN/IT)
- **Default**: Inglese
- **Storage**: Preferenza lingua salvata in `chrome.storage.local`
- **Implementazione**: `popup.js` ha un oggetto `translations` con tutte le stringhe
- **Funzione**: `applyTranslations(lang)` applica gli attributi `data-i18n` agli elementi DOM
- **Elementi**: Tutte le stringhe visibili all'utente usano l'attributo `data-i18n="chiave"`

### 4. Scorciatoia da Tastiera
- **Scorciatoia**: `Alt+Shift+W` apre il popup dell'estensione
- **Configurazione**: Impostata in `manifest.json` sotto `commands`

## Architettura

### Flusso di Comunicazione
```
Azione Utente (popup.js)
    → chrome.tabs.sendMessage(tabId, {action, selectors})
        → content.js riceve il messaggio
            → esegue la funzionalità del modulo corrente
            → imposta MutationObserver se necessario
```

### Comandi
- `remove`: Analizza selettori e rimuove classi, avvia watch
- `stop`: Ferma MutationObserver (classi rimangono rimosse)
- `reset`: Ricarica la tab corrente

### Funzioni Chiave popup.js
- `applyTranslations(lang)` - applica le stringhe i18n al DOM
- `saveLanguage(lang)` - persiste la lingua in chrome.storage
- `updateStatus(message)` - aggiorna il testo di stato
- Gestori pulsanti: `applyBtn`, `stopBtn`, `resetBtn`

### Funzioni Chiave content.js
- `parseAndRemoveClasses(selectors, isSelective)` - analizza sintassi, rimuove classi
- `watchForChanges()` - avvia MutationObserver
- `restoreWatching()` - riapplica la rimozione quando il DOM cambia

## Struttura UI
- **Header**: Titolo "WebMod", versione "v1.0", link Credits, selettore lingua
- **Sezione Principale**: Titolo, testo introduttivo, pulsante Info (apre/chiude pannello), etichetta "Selettori CSS", textarea, pulsanti (Applica/Ferma/Salva/Resetta), stato
- **Pannello Info** (collassabile): Info Sintassi, Info Opzioni, Info Scorciatoie

## Dettagli Importanti
- Link Credits: https://www.nisar.it (apre in nuova tab)
- Notifiche toast per feedback utente
- Nota sorveglianza nel pannello info che spiega il comportamento del MutationObserver

## Linee Guida di Sviluppo
- Seguire lo stile del codice esistente e le convenzioni di naming
- Aggiungere nuove traduzioni per EN e IT quando si modifica la UI
- Testare accuratamente la sintassi di rimozione classi prima di implementare nuovi pattern di selettori
- Ricordare: la sorveglianza è per-tab, reset ricarica la pagina e cancella lo stato
- Il modulo corrente è in `content.js` - per aggiungere nuove funzionalità, creare nuovi moduli e integrare in `content.js`

## UI Dettagli Tecnici

### Toast Notifications
- **Funzione**: `showToast(message)` in popup.js
- **Comportamento**: Appare in alto a destra, scompare dopo 2 secondi
- **Stile**: Sfondo azzurro `#00d4ff`, testo scuro

### Info Panel Toggle
- **Pulsante**: `#infoBtn` con freccia `▲`
- **Pannello**: `#infoPanel` con classe `.hidden` per show/hide
- **Animazione**: Transizione CSS `max-height` e `opacity`

### Textarea Placeholder
- **Valore**: `.class1 , .class1 .class2`
- **Scopo**: Ricordare all'utente la sintassi supportata

### Textarea Label
- **Chiave i18n**: `selectorsTitle`
- **EN**: "CSS Selectors"
- **IT**: "Selettori CSS"
