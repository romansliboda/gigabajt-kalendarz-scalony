(function () {
  'use strict';

  const URL = 'https://nakordoni.eu/api/truckban_json.php';
  const ODSTEP = 6 * 60 * 60 * 1000;
  const KLUCZ = 'gbZakazyOnline';

  let dane = null;

  try {
    const zapis = JSON.parse(localStorage.getItem(KLUCZ) || 'null');
    if (zapis && zapis.dane) dane = zapis.dane;
  } catch (_) {}

  window.gbZakazyOnline = {
    pobierz: function () { return dane; },
    odswiez: odswiez
  };

  async function odswiez() {
    window.gbLastRefreshCheck = Date.now();
    try {
      const zapis = JSON.parse(localStorage.getItem(KLUCZ) || 'null');

      if (zapis && Date.now() - zapis.czas < ODSTEP) {
        dane = zapis.dane;
        return dane;
      }

      const odpowiedz = await fetch(URL, {cache: 'no-store'});
      if (!odpowiedz.ok) throw new Error('HTTP ' + odpowiedz.status);

      const wynik = await odpowiedz.json();
      if (!wynik || wynik.success !== true ||
          !Array.isArray(wynik.current_bans)) {
        throw new Error('Nieprawidłowe dane');
      }

      dane = wynik;
      localStorage.setItem(KLUCZ, JSON.stringify({
        czas: Date.now(),
        dane: wynik
      }));

      window.dispatchEvent(new Event('gb-zakazy-zaktualizowane'));
      return dane;
    } catch (blad) {
      console.warn('GB zakazy online:', blad);
      return dane;
    }
  }

  odswiez();

  setInterval(function () {
    if (document.hidden) return;
    const min = Number(localStorage.getItem('gbRefreshMinutes') || '10');
    if (![5,10,15].includes(min)) return;
    if (!window.gbLastRefreshCheck) window.gbLastRefreshCheck = Date.now();
    if (Date.now() - window.gbLastRefreshCheck >= min * 60000) {
      window.gbLastRefreshCheck = Date.now();
      odswiez();
    }
  }, 30000);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) odswiez();
  });
})();
