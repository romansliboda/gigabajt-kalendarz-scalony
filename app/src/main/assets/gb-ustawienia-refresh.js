
(function () {
  'use strict';
  const ID = 'gb-reczne-odswiezanie-ustawienia';

  function dodaj() {
    if (document.getElementById(ID)) return;

    const tytul = [...document.querySelectorAll(
      'h2,h3,h4,h5,div,span,strong,b,p'
    )].filter(el =>
      /Aktualizacja zakazów jazdy/i.test(el.textContent || '') &&
      (el.textContent || '').trim().length < 65
    ).sort((a,b) =>
      a.textContent.length - b.textContent.length
    )[0];

    if (!tytul) return;

    const btn = document.createElement('button');
    btn.id = ID;
    btn.type = 'button';
    btn.textContent = '🔄 Aktualizuj teraz';
    btn.style.cssText =
      'display:block;width:100%;margin:12px 0;' +
      'padding:13px;background:#205a89;color:white;' +
      'border:0;border-radius:10px;font-size:17px;' +
      'cursor:pointer';

    tytul.insertAdjacentElement('afterend', btn);

    async function odswiez() {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = '⏳ Aktualizuję zakazy i GPS…';

      try {
        if (!window.gbZakazyOnline?.odswiezRecznieGB)
          throw new Error('Brak modułu zakazów');

        await window.gbZakazyOnline.odswiezRecznieGB();

        if (typeof window.gbZakazyGPS === 'function')
          window.gbZakazyGPS();

        window.dispatchEvent(
          new Event('gb-zakazy-zaktualizowane')
        );

        btn.textContent = '✅ Zakazy odświeżone';
      } catch (e) {
        console.error('GB odświeżanie:', e);
        btn.textContent = '⚠️ Błąd — spróbuj ponownie';
      } finally {
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', odswiez);
    tytul.style.cursor = 'pointer';
    tytul.addEventListener('click', odswiez);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', dodaj);
  else dodaj();

  setInterval(dodaj, 1300);
})();
