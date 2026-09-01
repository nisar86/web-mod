console.log('WebMod Edit: content script caricato');

async function restoreWatching() {
  try {
    const result = await chrome.storage.local.get(['isWatching', 'lastSelectors']);
    if (result.isWatching && result.lastSelectors && result.lastSelectors.length > 0) {
      startWatching(result.lastSelectors);
      console.log('WebMod Edit: sorveglianza ripristinata');
    }
  } catch (e) {
    console.log('WebMod Edit: restore skipped', e);
  }
}

let observer = null;

function startWatching(parsedSelectors) {
  if (observer) {
    observer.disconnect();
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
    if (totalRemoved > 0) {
      console.log(`WebMod Edit: rimosse ${totalRemoved} classi`);
    }
  }

  removeClasses();

  observer = new MutationObserver((mutations) => {
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

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  window._wmeObserver = observer;
}

function stopWatching() {
  if (window._wmeObserver) {
    window._wmeObserver.disconnect();
    window._wmeObserver = null;
  }
}

restoreWatching();
