let isWatching = false;
let currentLang = 'en';

const translations = {
  en: {
    title: 'Remove CSS Classes',
    intro: 'Enter the classes you want to remove from page elements, separated by commas.',
    infoBtn: 'Syntax & options info',
    selectorsTitle: 'CSS Selectors',
    syntax: 'Syntax',
    options: 'Options',
    ex1: 'removes class1 from elements that have it',
    ex2: 'removes class2 from elements inside class1',
    ex3: 'removes class1 and class2 from elements with both',
    ex4: 'removes ONLY class2 from class1 elements',
    ex5: 'removes ONLY class2 and class3 from class1 elements',
    apply: 'Apply',
    update: 'Update',
    stop: 'Stop',
    reset: 'Reset',
    save: 'Save',
    applyDesc: 'Removes classes and activates surveillance',
    stopDesc: 'Stops surveillance (already removed classes stay removed)',
    resetDesc: 'Reloads the page, everything returns as before',
    saveDesc: 'Saves current selectors for next session',
    surveillanceNote: '<strong>Surveillance</strong> automatically re-removes classes if something adds them back (e.g. site scripts).',
    openPlugin: 'open plugin',
    surveillanceActive: 'Surveillance active',
    removed: 'Removed',
    classes: 'classes',
    selectors: 'selectors',
    enterClass: 'Enter at least one class',
    noSelector: 'No valid selector',
    error: 'Application error',
    surveillanceStopped: 'Surveillance stopped',
    shortcut: 'Shortcuts',
    savedOk: 'Saved!'
  },
  it: {
    title: 'Rimuovi Classi CSS',
    intro: 'Inserisci le classi che vuoi rimuovere dagli elementi della pagina, separate dalla virgola.',
    infoBtn: 'Info sintassi e opzioni',
    selectorsTitle: 'Selettori CSS',
    syntax: 'Sintassi',
    options: 'Opzioni',
    ex1: 'rimuove class1 dagli elementi che la hanno',
    ex2: 'rimuove class2 dagli elementi dentro class1',
    ex3: 'rimuove class1 e class2 dagli elementi con entrambe',
    ex4: 'rimuove SOLO class2 dagli elementi class1',
    ex5: 'rimuove SOLO class2 e class3 dagli elementi class1',
    apply: 'Applica',
    update: 'Aggiorna',
    stop: 'Ferma',
    reset: 'Resetta',
    save: 'Salva',
    applyDesc: 'Rimuove le classi e attiva la sorveglianza',
    stopDesc: 'Arresta la sorveglianza (classi già rimosse restano rimosse)',
    resetDesc: 'Ricarica la pagina, tutto torna come prima',
    saveDesc: 'Salva i selettori per la prossima sessione',
    surveillanceNote: 'La <strong>sorveglianza</strong> reimmette automaticamente le classi rimosse se qualcosa le riaggiunge (es. script del sito).',
    openPlugin: 'apri plugin',
    surveillanceActive: 'Sorveglianza attiva',
    removed: 'Rimosse',
    classes: 'classi',
    selectors: 'selettori',
    enterClass: 'Inserisci almeno una classe',
    noSelector: 'Nessun selettore valido',
    error: 'Errore applicazione',
    surveillanceStopped: 'Sorveglianza arrestata',
    shortcut: 'Scorciatoie',
    savedOk: 'Salvato!'
  }
};

function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[lang][key];
      } else {
        el.innerHTML = translations[lang][key];
      }
    }
  });
  
  if (isWatching) {
    statusText.textContent = translations[lang].surveillanceActive;
    applyBtn.textContent = translations[lang].update;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const classesInput = document.getElementById('classesInput');
  const applyBtn = document.getElementById('applyBtn');
  const resetBtn = document.getElementById('resetBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusText = document.getElementById('statusText');
  const infoBtn = document.getElementById('infoBtn');
  const infoPanel = document.getElementById('infoPanel');
  const langSelect = document.getElementById('langSelect');

  const savedLang = await chrome.storage.local.get('language');
  currentLang = savedLang.language || 'en';
  langSelect.value = currentLang;
  applyTranslations(currentLang);

  langSelect.addEventListener('change', async () => {
    currentLang = langSelect.value;
    await chrome.storage.local.set({ language: currentLang });
    applyTranslations(currentLang);
  });

  let infoVisible = false;

  infoBtn.addEventListener('click', () => {
    infoVisible = !infoVisible;
    infoPanel.classList.toggle('hidden');
    infoBtn.classList.toggle('collapsed');
  });

  const saved = await chrome.storage.local.get('savedSelectors');
  if (saved.savedSelectors) {
    classesInput.value = saved.savedSelectors;
  }

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ savedSelectors: classesInput.value });
    showToast(translations[currentLang].savedOk || 'Saved!');
  });

  const watchStatus = await chrome.storage.local.get('isWatching');
  if (watchStatus.isWatching) {
    isWatching = true;
    statusText.textContent = translations[currentLang].surveillanceActive;
    applyBtn.textContent = translations[currentLang].update;
  }

  applyBtn.addEventListener('click', async () => {
    const classesText = classesInput.value.trim();
    
    if (!classesText) {
      showToast(translations[currentLang].enterClass);
      return;
    }

    const selectors = classesText.split(',').map(s => s.trim()).filter(s => s);

    if (selectors.length === 0) {
      showToast(translations[currentLang].noSelector);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (isWatching) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: stopWatching
        });
      }

      const parsedSelectors = selectors.map(parseSelector);

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startWatching,
        args: [parsedSelectors]
      });

      isWatching = true;
      await chrome.storage.local.set({ isWatching: true, lastSelectors: parsedSelectors });
      statusText.textContent = translations[currentLang].surveillanceActive;
      applyBtn.textContent = translations[currentLang].update;
      showToast(`${translations[currentLang].removed} ${selectors.length} ${translations[currentLang].selectors}`);
    } catch (error) {
      console.error('Errore:', error);
      showToast(translations[currentLang].error);
    }
  });

  stopBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: stopWatching
      });

      isWatching = false;
      await chrome.storage.local.set({ isWatching: false });
      statusText.textContent = '';
      applyBtn.textContent = translations[currentLang].apply;
      showToast(translations[currentLang].surveillanceStopped);
    } catch (error) {
      console.error('Errore:', error);
    }
  });

  resetBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: stopWatching
      });

      await chrome.storage.local.set({ isWatching: false });
      chrome.tabs.reload(tab.id);
    } catch (error) {
      console.error('Errore:', error);
    }
  });
});

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function parseSelector(selector) {
  const idx = selector.indexOf(':-');
  if (idx !== -1) {
    const sel = selector.substring(0, idx).trim();
    const classesToRemove = selector.substring(idx + 2).split(',').map(c => c.trim().replace(/^\./, ''));
    return { selector: sel, removeOnly: classesToRemove };
  }
  return { selector: selector, removeOnly: null };
}

function startWatching(parsedSelectors) {
  if (window._wmeObserver) {
    window._wmeObserver.disconnect();
  }

  function removeClasses() {
    let totalRemoved = 0;
    parsedSelectors.forEach(({ selector, removeOnly }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (removeOnly) {
          removeOnly.forEach(className => {
            if (el.classList.contains(className)) {
              el.classList.remove(className);
              totalRemoved++;
            }
          });
        } else {
          const classesToRemove = selector.match(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g) || [];
          const cleanClasses = classesToRemove.map(c => c.substring(1));
          cleanClasses.forEach(className => {
            if (el.classList.contains(className)) {
              el.classList.remove(className);
              totalRemoved++;
            }
          });
        }
        if (el.classList.length === 0) {
          el.removeAttribute('class');
        }
      });
    });
  }

  removeClasses();

  window._wmeObserver = new MutationObserver((mutations) => {
    let shouldRemove = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        shouldRemove = true;
      }
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldRemove = true;
      }
    });
    if (shouldRemove) {
      removeClasses();
    }
  });

  window._wmeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}

function stopWatching() {
  if (window._wmeObserver) {
    window._wmeObserver.disconnect();
    window._wmeObserver = null;
  }
}
