(function () {
  'use strict';

  const URL = 'https://nakordoni.eu/api/truckban_json.php';
  const ODSTEP = 10 * 60 * 1000;
  const KLUCZ = 'gbZakazyOnlineV2';

  let dane = null;

  try {
    const zapis = JSON.parse(localStorage.getItem(KLUCZ) || 'null');
    if (zapis && zapis.dane) dane = zapis.dane;
  } catch (_) {}


  // GB_ZEGAR_OFFLINE_V2710
  function gbSprawdzGodziny() {
    if (!dane || !Array.isArray(dane.current_bans) ||
        !Array.isArray(dane.upcoming_bans)) return false;

    const lista = [...dane.current_bans, ...dane.upcoming_bans];
    const przed = dane.current_bans.map(
      w => w.country_code + w.start_at + w.end_at
    ).sort().join('|');

    const aktywne = [], przyszle = [];
    const teraz = new Date();
    const strefy = new Map();

    for (const w of lista) {
      if (!w.start_at || !w.end_at) continue;
      const tz = w.timezone || 'Europe/Warsaw';

      if (!strefy.has(tz)) {
        const p = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, year: 'numeric', month: '2-digit',
          day: '2-digit', hour: '2-digit', minute: '2-digit',
          second: '2-digit', hourCycle: 'h23'
        }).formatToParts(teraz);
        const g = k => p.find(x => x.type === k).value;
        strefy.set(tz, g('year')+g('month')+g('day')+'T'+
          g('hour')+g('minute')+g('second'));
      }

      const czas = strefy.get(tz);
      if (w.start_at <= czas && czas < w.end_at) aktywne.push(w);
      else if (czas < w.start_at) przyszle.push(w);
    }

    dane.current_bans = aktywne;
    dane.upcoming_bans = przyszle;

    return przed !== aktywne.map(
      w => w.country_code + w.start_at + w.end_at
    ).sort().join('|');
  }

  let gbOstatniaMinuta = -1;
  setInterval(function () {
    const minuta = Math.floor(Date.now() / 60000);
    if (minuta === gbOstatniaMinuta) return;
    gbOstatniaMinuta = minuta;
    if (gbSprawdzGodziny()) {
      window.dispatchEvent(new Event('gb-zakazy-zaktualizowane'));
    }
  }, 1000);

  window.gbZakazyOnline = {
    pobierz: function () { gbSprawdzGodziny(); return dane; },
    odswiez: odswiez
  };

function przetworzTruckBans(ics) { return window.gbTruckBansParser(ics); }
async function pobierzDaneTruckBans() { const ics = window.GBTruckBans ? window.GBTruckBans.pobierz() : await (await fetch("gb-truckbans.ics")).text(); if (!ics || !ics.includes("BEGIN:VEVENT")) throw Error("Brak danych ICS"); const wpisy = window.gbTruckBansParser(ics); return window.gbPrzygotujZakazy(wpisy); }
  let gbPobieranieTrwa = false;
async function odswiez() {
    if (gbPobieranieTrwa) return dane;
    gbPobieranieTrwa = true;
    try {
        return await gbWykonajOdswiezanie();
    } finally {
        gbPobieranieTrwa = false;
    }
}
async function gbWykonajOdswiezanie() {
    window.gbLastRefreshCheck = Date.now();
    try {
      const zapis = JSON.parse(localStorage.getItem(KLUCZ) || 'null');

      if (zapis && Date.now() - zapis.czas < ODSTEP) {
        dane = zapis.dane;
        return dane;
      }

      const kraje = 'AT CH CZ DE FR HU IT LI LU SI SK BG PL RO HR ES GR BE BY ME MK PT SE'.split(' ');
      const wynik = await pobierzDaneTruckBans();
        dane = wynik;
    localStorage.setItem(KLUCZ, JSON.stringify({
        czas: Date.now(),
        dane: wynik
      }));

      window.dispatchEvent(new Event('gb-zakazy-zaktualizowane'));
      return wynik;
    } catch (blad) {
      console.warn('GB zakazy online:', blad);
      if (!localStorage.getItem(KLUCZ)) {
        setTimeout(function () {
          odswiez();
        }, 10000);
      }
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
window.gbPrzygotujZakazy = function gbPrzygotujZakazy(wpisy) {
  const kraje = {Austria:"AT",Switzerland:"CH",Germany:"DE",Poland:"PL",France:"FR",Italy:"IT",Czechia:"CZ","Czech Republic":"CZ",Liechtenstein:"LI","United Kingdom":"GB","Great Britain":"GB",Britain:"GB",UK:"GB",Slovakia:"SK",Hungary:"HU",Slovenia:"SI",Croatia:"HR",Romania:"RO",Belgium:"BE",Luxembourg:"LU",Spain:"ES",Portugal:"PT",Greece:"GR",Bulgaria:"BG",Sweden:"SE"};
  const teraz = new Date();
  const aktywne = [], przyszle = [];
  for (const x of wpisy) {
    const nazwa = Object.keys(kraje).find(k => x.summary.includes(k));
    if (!nazwa) continue;
    const p = new Intl.DateTimeFormat("en-GB",{timeZone:x.timezone||"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(teraz);
    const g = k => p.find(z=>z.type===k).value;
    const czas = g("year")+g("month")+g("day")+"T"+g("hour")+g("minute")+g("second");
    const w = {start_at:x.start,end_at:x.end,country_code:kraje[nazwa],timezone:x.timezone||"Europe/Warsaw",date:x.start.slice(0,4)+"-"+x.start.slice(4,6)+"-"+x.start.slice(6,8),time_from:x.start.slice(9,11)+":"+x.start.slice(11,13),time_until:x.end.slice(9,11)+":"+x.end.slice(11,13),restriction_details:x.description,details_url:"https://truckbans.com/"+nazwa.toLowerCase()};
    if (x.start<=czas && x.end>czas) aktywne.push(w);
    else if (x.start>czas) przyszle.push(w);
  }
  return {current_bans:aktywne,upcoming_bans:przyszle,covered_countries:[...new Set([...aktywne,...przyszle].map(x=>x.country_code))],truncated:false,returned:aktywne.length+przyszle.length};
}
