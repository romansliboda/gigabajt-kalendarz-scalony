(function () {
  'use strict';

  function data(czas, kraj) {
// GB_CZAS_LOKALNY_V306
// GB_CZAS_WSZYSTKIE_KRAJE_V307
const gbZone={
 AL:"Europe/Tirane",
 AT:"Europe/Vienna",
 BA:"Europe/Sarajevo",
 BE:"Europe/Brussels",
 BG:"Europe/Sofia",
 BY:"Europe/Minsk",
 CH:"Europe/Zurich",
 CY:"Asia/Nicosia",
 CZ:"Europe/Prague",
 DE:"Europe/Berlin",
 DK:"Europe/Copenhagen",
 EE:"Europe/Tallinn",
 ES:"Europe/Madrid",
 FI:"Europe/Helsinki",
 FR:"Europe/Paris",
 GB:"Europe/London",
 GR:"Europe/Athens",
 HR:"Europe/Zagreb",
 HU:"Europe/Budapest",
 IE:"Europe/Dublin",
 IS:"Atlantic/Reykjavik",
 IT:"Europe/Rome",
 LI:"Europe/Vaduz",
 LT:"Europe/Vilnius",
 LU:"Europe/Luxembourg",
 LV:"Europe/Riga",
 MD:"Europe/Chisinau",
 ME:"Europe/Podgorica",
 MK:"Europe/Skopje",
 MT:"Europe/Malta",
 NL:"Europe/Amsterdam",
 NO:"Europe/Oslo",
 PL:"Europe/Warsaw",
 PT:"Europe/Lisbon",
 RO:"Europe/Bucharest",
 RS:"Europe/Belgrade",
 SE:"Europe/Stockholm",
 SI:"Europe/Ljubljana",
 SK:"Europe/Bratislava",
 TR:"Europe/Istanbul",
 UA:"Europe/Kyiv",
 XK:"Europe/Belgrade"
}[String(kraj||"").toUpperCase()];

const gbMatch=typeof czas==="string"
 ?czas.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
 :null;

if(gbZone && gbMatch){
 const n=gbMatch.slice(1).map(Number);
 const desired=Date.UTC(
  n[0],n[1]-1,n[2],n[3],n[4],n[5]
 );
 let guess=desired;
 const fmt=new Intl.DateTimeFormat("en-GB",{
  timeZone:gbZone,year:"numeric",
  month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",
  second:"2-digit",hourCycle:"h23"
 });

 for(let i=0;i<5;i++){
  const parts={};
  for(const item of fmt.formatToParts(new Date(guess)))
   parts[item.type]=item.value;

  const shown=Date.UTC(
   Number(parts.year),Number(parts.month)-1,
   Number(parts.day),Number(parts.hour),
   Number(parts.minute),Number(parts.second)
  );
  const delta=desired-shown;
  guess+=delta;
  if(delta===0)break;
 }
 return guess;
}

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
       start: data(w.start_at, kraj),
       end: data(w.end_at, kraj),
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
