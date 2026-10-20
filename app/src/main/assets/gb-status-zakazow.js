(function () {
  'use strict';

  function niemcy() {
    const teraz = new Date();
    const czesci = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(teraz);

    const get = k => czesci.find(x => x.type === k)?.value;
    const dzien = get('weekday');
    const miesiac = Number(get('month'));
    const godzina = Number(get('hour'));
    const data = get('day') + '.' + get('month') + '.' + get('year');

    if (dzien === 'Sun' && godzina < 22) {
      return {
        status: 'red',
        opis: 'Niedziela, ' + data + ' · 00:00–22:00',
        szczegoly: 'Zakaz ogólnokrajowy. Obowiązują wyjątki.'
      };
    }

    if (dzien === 'Sat' && (miesiac === 7 || miesiac === 8)
        && godzina >= 7 && godzina < 20) {
      return {
        status: 'yellow',
        opis: 'Sobota, ' + data + ' · 07:00–20:00',
        szczegoly: 'Zakaz na wybranych odcinkach dróg.'
      };
    }

    return {
      status: 'unknown',
      opis: 'Sprawdź święta, wyjątki i lokalne ograniczenia'
    };
  }


  function austria() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Vienna',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    const get = k => parts.find(x => x.type === k)?.value;
    const day = get('weekday');
    const hour = Number(get('hour'));
    const date = get('day') + '.' + get('month') + '.' + get('year');

    if (day === 'Sun') {
      return {
        status: 'red',
        opis: 'Niedziela, ' + date + ' · 00:00–22:00',
        szczegoly: 'Zakaz weekendowy. Obowiązują wyjątki.'
      };
    }

    if (day === 'Sat' && hour >= 15) {
      return {
        status: 'red',
        opis: 'Sobota, ' + date + ' · 15:00–24:00',
        szczegoly: 'Zakaz weekendowy. Obowiązują wyjątki.'
      };
    }

    if (hour >= 22 || hour < 5) {
      return {
        status: 'yellow',
        opis: 'Zakaz nocny · 22:00–05:00',
        szczegoly: 'Możliwe wyjątki, m.in. dla pojazdów niskoszumowych.'
      };
    }

    return {
      status: 'unknown',
      opis: 'Sprawdź święta i ograniczenia regionalne'
    };
  }


  function polska() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Warsaw',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    const get = k => parts.find(x => x.type === k)?.value;
    const day = get('weekday');
    const hour = Number(get('hour'));
    const year = Number(get('year'));
    const date = get('year') + '-' + get('month') + '-' + get('day');
    const display = get('day') + '.' + get('month') + '.' + get('year');

    const wakacje2026 = year === 2026 &&
      date >= '2026-06-26' && date <= '2026-08-30';

    let godziny = null;

    if (wakacje2026) {
      if (day === 'Fri' && hour >= 18 && hour < 22)
        godziny = '18:00–22:00';
      if (day === 'Sat' && hour >= 8 && hour < 14)
        godziny = '08:00–14:00';
      if (day === 'Sun' && hour >= 8 && hour < 22)
        godziny = '08:00–22:00';
    }

    if (godziny) {
      return {
        status: 'red',
        opis: display + ' · ' + godziny + ' · powyżej 12 t',
        szczegoly: 'Zakaz wakacyjny; obowiązują wyjątki.'
      };
    }

    return {
      status: 'unknown',
      opis: 'Sprawdź święta i ograniczenia dla pojazdów powyżej 12 t'
    };
  }


  window.gbStatusZakazow = function(kraj) {
    const api = window.gbZakazyOnline;
    const d = api && api.pobierz();
    if (!d || !Array.isArray(d.current_bans))
      return {status:'unknown',opis:'Oczekiwanie na dane internetowe'};
    const wpisy = d.current_bans.filter(x => x.country_code === kraj);
    if (!wpisy.length) {
      const objete = Array.isArray(d.covered_countries)
        ? d.covered_countries : [];

      const krajObjety = objete.some(x =>
        (typeof x === 'string' ? x :
        (x.code || x.country_code || '')) === kraj
      );

      if (krajObjety) {
        return {
          status:'green',
          opis:'Brak zgłoszonego aktualnego zakazu — sprawdź lokalne wyjątki'
        };
      }

      return {
        status:'unknown',
        opis:'Brak potwierdzonych danych o zakazach'
      };
    }
    const x = wpisy[0];
    const okresy = wpisy.map(w =>
      (w.date || '')+' · '+(w.time_from || '')+'–'+(w.time_until || '')
    );
    return {
      status:'yellow',
      opis:(x.date || '')+' · '+(x.time_from || '')+'–'+(x.time_until || ''),
      szczegoly:okresy.join(' | ')+' | '+(x.restriction_details || ''),
      url:x.details_url || ''
    };
  };
})();
