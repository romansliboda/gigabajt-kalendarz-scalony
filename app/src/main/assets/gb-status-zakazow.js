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

    // GB_CH_NIGHT_V287 — ciagly zakaz przez polnoc.
    if (kraj === 'CH') {
      const p = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Zurich',
        weekday: 'short',
        hour: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(new Date());

      const get = k => p.find(x => x.type === k)?.value;
      const hour = Number(get('hour'));
      const night = hour >= 22 || hour < 5;

      if (night || get('weekday') === 'Sun') {
        return {
          status: 'red',
          opis: night
            ? 'Szwajcaria: nocny zakaz jazdy 22:00–05:00 dla pojazdów ciężarowych powyżej 3,5 t. Obowiązują ustawowe wyjątki.'
            : 'Szwajcaria: ogólnokrajowy niedzielny zakaz jazdy. Obowiązują ustawowe wyjątki.'
        };
      }
    }

    const wpisy = d.current_bans.filter(x => x.country_code === kraj);
    if (!wpisy.length) {
      return {status:'green',opis:'Brak aktywnego zakazu'};
    }

    // GB_SCOPE_CLASSIFIER_V2714
    function gbRodzajZakazu(w) {
      const tekst = String(w.restriction_type || '') + ' ' +
                    String(w.restriction_details || '');
      const lokalny = /\b(local|regional|partial|selected|specific|certain|particular|only on|only in|limited to|restricted to|road sections?|selected routes?|selected roads?|routes? only)\b/i.test(tekst);
      const droga = /\b(?:AP|DN|RN|N|A|D|E)\s?-?\d{1,4}[A-Z]?\b|\bVCI\b|Via de Cintura Interna/i.test(tekst);
      const tylkoADR = /\b(?:only|solely|exclusively|tylko|nur|solo|seulement)\b.{0,60}\b(?:ADR|dangerous goods|Gefahrgut)\b/i.test(tekst);
      const warunkowy = /vehicles?\s+without\b|\b(?:without|bez)\b.{0,50}\b(?:certificate|certyfikat|L[aä]rmarm|noise)\b|L[aä]rmarmzertifikat/i.test(tekst);
      const adr = /\bADR\b|dangerous goods|hazardous goods|hazmat|Gefahrgut|mercanc[ií]as peligrosas|mati[eè]res dangereuses/i.test(tekst);
      const krajowy = /\b(nationwide|countrywide|national|all roads|entire country|whole country|throughout the country|bundesweit|territoire national|og[oó]lnokrajowy)\b/i.test(tekst);
      const weekend = /\b(saturday|sunday|weekend|public.holiday)\b/i.test(tekst) &&
                      /\b(ban|prohibition|restriction)\b/i.test(tekst) &&
                      /\b(year.round|trucks?|vehicles?|7[.,]5\s*t)\b/i.test(tekst);

      // GB_ROAD_SCOPE_FIX_V2714
      if (/\b(?:roads?|routes?|motorways?|highways?|drogi|drogach)\b/i.test(tekst) &&
          /\b[A-Z]{1,3}\s?-?\d{1,4}[A-Z]?\b/i.test(tekst)) return 'yellow';
      if (/\bNat\.?\s*route\s*\d+\b/i.test(tekst)) return 'yellow';
      if (lokalny || droga || tylkoADR || warunkowy) return 'yellow';
      if (krajowy) return 'red';
      if (adr) return 'yellow';
      if (weekend) return 'red';
      return 'unknown';
    }

    function gbWynikZakazow(wpisy) {
      const wyniki = wpisy.map(gbRodzajZakazu);
      if (wyniki.includes('red')) return 'red';
      if (wyniki.includes('unknown')) return 'yellow';
      return 'yellow';
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
      status: gbWynikZakazow(wpisy),
      opis:(x.date || '')+' · '+(x.time_from || '')+'–'+(x.time_until || ''),
      szczegoly:okresy.join(' | ')+' | '+(x.restriction_details || '')+opisNocnyAT,
      url:x.details_url || ''
    };
  };
})();
