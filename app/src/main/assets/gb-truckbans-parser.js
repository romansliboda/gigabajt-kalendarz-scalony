(function () {
  'use strict';

  window.gbTruckBansParser = function (ics) {
    const wydarzenia = [];
    const tekst = String(ics || '').replace(/\r\n[ \t]/g, '');
    const bloki = tekst.split('BEGIN:VEVENT');

    function pole(blok, nazwa) {
      const linia = blok.split(/\r?\n/).find(x =>
        x.startsWith(nazwa + ':') || x.startsWith(nazwa + ';')
      );
      return linia ? linia.slice(linia.indexOf(':') + 1).trim() : '';
    }

    for (const blok of bloki.slice(1)) {
      const summary = pole(blok, 'SUMMARY');
      const description = pole(blok, 'DESCRIPTION');
      const start = pole(blok, 'DTSTART');
      const end = pole(blok, 'DTEND');

      if (summary && start && end) {
        wydarzenia.push({ summary, description, start, end });
      }
    }
    return wydarzenia;
  };
})();
