/* GB: rzeczywisty postep zdarzen GBUpdaterNative, bez sztucznej animacji. */
(() => {
  'use strict';
  if (window.__gbUpdaterProgressLoaded) return;
  window.__gbUpdaterProgressLoaded = true;
  const style = document.createElement('style');
  style.id = 'gb-native-progress-css';
  style.textContent = `
    .gb-n-progress {position:relative!important;overflow:hidden!important;
      background:transparent!important;color:transparent!important;font-size:0!important;}
    .gb-n-progress > * {visibility:hidden!important;}
    .gb-n-progress::before {content:attr(data-gb-native-label);position:absolute;
      inset:0;display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:#1b577e;white-space:nowrap;
      pointer-events:none;z-index:2;}
    .gb-n-progress::after {content:'';position:absolute;left:0;bottom:0;height:5px;
      width:var(--gb-n-progress,0%);background:#19a451;z-index:3;
      transition:width .17s linear;pointer-events:none;}
    .gb-n-progress.gb-n-indeterminate::after {width:34%;animation:gb-n-scan 1.2s linear infinite;}
    @keyframes gb-n-scan {from{left:-34%}to{left:100%}}
  `;
  (document.head || document.documentElement).appendChild(style);
  let activeButton = null;
  function button() {
    if (activeButton && activeButton.isConnected) return activeButton;
    activeButton = Array.from(document.querySelectorAll('button'))
      .find(b => /aktualizuj/i.test(b.textContent || '') || b.hasAttribute('data-gb-native-label')) || null;
    return activeButton;
  }
  function clear(b) {
    if (!b) return;
    b.classList.remove('gb-n-progress', 'gb-n-indeterminate');
    b.style.removeProperty('--gb-n-progress');
    b.removeAttribute('data-gb-native-label');
  }
  window.addEventListener('gb-updater-native', event => {
    const d = event.detail || {};
    const state = String(d.state || '');
    if (!['downloading','downloaded','installing','error'].includes(state)) return;
    const b = button();
    if (!b) return;
    if (state === 'error') {
      b.classList.add('gb-n-progress');
      b.classList.remove('gb-n-indeterminate');
      b.style.setProperty('--gb-n-progress', '0%');
      b.setAttribute('data-gb-native-label', 'Błąd aktualizacji');
      b.title = String(d.message || 'Aktualizacja przerwana');
      setTimeout(() => clear(b), 4500);
      return;
    }
    const raw = Number(d.percent);
    const known = Number.isFinite(raw) && raw >= 0;
    const pct = known ? Math.max(0, Math.min(100, Math.round(raw))) : 0;
    b.classList.add('gb-n-progress');
    b.classList.toggle('gb-n-indeterminate', !known && state === 'downloading');
    b.style.setProperty('--gb-n-progress', pct + '%');
    if (state === 'downloading') b.setAttribute('data-gb-native-label', known ? 'Pobieranie ' + pct + '%' : 'Pobieranie...');
    if (state === 'downloaded') b.setAttribute('data-gb-native-label', 'Pobrano 100%');
    if (state === 'installing') b.setAttribute('data-gb-native-label', 'Potwierdź instalację');
    b.title = String(d.message || '');
  });
})();
