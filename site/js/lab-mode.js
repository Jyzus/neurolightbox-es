/* Rendering preference shared by the Lab controls and renderer. */
(() => {
  'use strict';
  const key = 'neurolightbox.lab-mode';
  const lightScale = 0.85;
  let selected = 'light';
  try {
    if (window.localStorage.getItem(key) === 'full') selected = 'full';
  } catch {
    // Storage can be disabled in embedded or private contexts.
  }

  window.NeuroLabMode = {
    get light(){ return selected === 'light'; },
    set(value){
      if (value !== 'light' && value !== 'full') return;
      selected = value;
      try { window.localStorage.setItem(key, value); } catch { /* Keep the session choice. */ }
    },
    scale(requested, inLab){
      return inLab && selected === 'light' ? Math.min(requested, lightScale) : requested;
    }
  };
})();
