(function () {
  'use strict';

  function data(czas) {
    if (typeof czas !== 'string') return NaN;
    const m = czas.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
    if (!m) return NaN;
    return Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
  }

  function scal(kraj, dane) {
    const wpisy = [
      ...(dane.current_bans || []),
      ...(dane.upcoming_bans || [])
    ].filter(w => w.country_code === kraj)
     .map(w => ({
       start: data(w.start_at),
       end: data(w.end_at),
       details: w.restriction_details || ''
     }))
     .filter(w => Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start)
     .sort((a,b) => a.start-b.start);

    const wynik = [];
    for (const w of wpisy) {
      const ostatni = wynik[wynik.length-1];
      if (ostatni && w.start <= ostatni.end + 60000 && w.details === ostatni.details) {
        ostatni.end = Math.max(ostatni.end, w.end);
      } else {
        wynik.push({...w});
      }
    }
    return wynik;
  }

  
  function pozostalo(kraj, dane, teraz = Date.now()) {
    const okresy = scal(kraj, dane);
    const aktywny = okresy.find(w => w.start <= teraz && teraz < w.end);

    if (!aktywny) return null;

    const minuty = Math.ceil((aktywny.end - teraz) / 60000);
    const godziny = Math.floor(minuty / 60);
    const reszta = minuty % 60;

    return {
      minuty,
      koniec: aktywny.end,
      licznik: String(godziny).padStart(2, '0') + ':' +
               String(reszta).padStart(2, '0')
    };
  }

  window.gbZegarZakazow = {scal, pozostalo};

})();
