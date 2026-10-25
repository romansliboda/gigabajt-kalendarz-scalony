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
    // GB_AT_NOCNY_STATUS_V6
    if (kraj === 'AT') {
      const godzinaAT = Number(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Vienna', hour: '2-digit', hourCycle: 'h23'
      }).format(new Date()));
      if (godzinaAT >= 22 || godzinaAT < 5) {
        return {
          status: 'red',
          opis: 'Austria: nocny zakaz jazdy 22:00–05:00 dla pojazdów ciężarowych powyżej 7,5 t. Obowiązują ustawowe wyjątki.'
        };
      }
    }
    const wpisy = d.current_bans.filter(x => x.country_code === kraj);
    if (!wpisy.length) {
      return {status:'green',opis:'Brak aktywnego zakazu'};
    }

    // GB: zolty tylko dla zakazow czesciowych.
    function gbTylkoCzesciowy(w) {
      const typ = String(w.restriction_type || '').trim();
      const opis = String(w.restriction_details || '');
      if (/\b(nationwide|countrywide|all roads|entire country|whole country|throughout the country|bundesweit|territoire national|ogólnokrajowy)\b/i.test(opis)) return false;
      if (/\b(local|regional|selected|specific|certain|particular|only on|only in|limited to|restricted to|road sections?|sections? of|selected routes?|selected roads?)\b/i.test(opis)) return true;
      if (/\b(?:A|AP|DN|RN|N|D)\s?-?\d{1,4}[A-Z]?\b/i.test(opis)) return true;
      return /^(local|regional)$/i.test(typ);
    }
    const x = wpisy[0];

    // Polska informacja tylko dla austriackiego zakazu nocnego.
    const nocnyAT = kraj === 'AT' && wpisy.some(w => {
      const od = String(w.time_from || '').slice(0, 5);
      const doGodz = String(w.time_until || '').slice(0, 5);
      return od === '22:00' && doGodz === '05:00';
    });

    const opisNocnyAT = nocnyAT
      ? ' | AUSTRIA — NOCNY ZAKAZ JAZDY 22:00–05:00. ' +
        'Dotyczy pojazdów ciężarowych o DMC powyżej 7,5 t. ' +
        'Wyjątek: pojazdy niskohalasowe z oznaczeniem L i wymaganym zaświadczeniem. ' +
        'Obowiązuje zasadniczo ograniczenie prędkości do 60 km/h; ' +
        'na niektórych drogach mogą obowiązywać dodatkowe ograniczenia. ' +
        'Istnieją również inne wyjątki przewidziane przepisami.'
      : '';
    const okresy = wpisy.map(w =>
      (w.date || '')+' · '+(w.time_from || '')+'–'+(w.time_until || '')
    );
    return {
      status: wpisy.some(w => !gbTylkoCzesciowy(w)) ? 'red' : 'yellow',
      opis:(x.date || '')+' · '+(x.time_from || '')+'–'+(x.time_until || ''),
      szczegoly:okresy.join(' | ')+' | '+(x.restriction_details || '')+opisNocnyAT,
      url:x.details_url || ''
    };
  };
})();
