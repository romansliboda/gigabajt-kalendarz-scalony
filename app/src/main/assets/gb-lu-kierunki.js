/* GB_LU_KIERUNKI_V1 — wyłącznie kierunki ograniczeń tranzytowych Luksemburga. */
(function () {
  'use strict';
  if (window.gbLuKierunkiV1) return;
  window.gbLuKierunkiV1 = true;

  const LU_TZ = 'Europe/Luxembourg';

  function easter(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k + 7) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(year, month - 1, day);
  }

  function dayKey(utcMs) {
    return new Date(utcMs).toISOString().slice(5, 10);
  }

  function holidayDirections(year, month, day) {
    const key = String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const common = new Set(['01-01','05-01','11-01','12-25']);
    const fr = new Set(['05-08','07-14','08-15','11-11']);
    const de = new Set(['10-03','12-26']);
    const easterMs = easter(year);
    const moving = [
      [-2, 'D'], [1, 'DF'], [39, 'DF'], [50, 'DF'], [60, 'D']
    ];
    for (const [diff, dir] of moving) {
      if (key === dayKey(easterMs + diff * 86400000)) return dir;
    }
    if (common.has(key)) return 'DF';
    if (fr.has(key)) return 'F';
    if (de.has(key)) return 'D';
    return '';
  }

  function getLocal(date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: LU_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date);
    const v = k => Number(parts.find(p => p.type === k).value);
    return {year:v('year'), month:v('month'), day:v('day'), mins:v('hour')*60+v('minute')};
  }

  function directionsForDay(year, month, day) {
    const sunday = new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
    return sunday ? 'DF' : holidayDirections(year, month, day);
  }

  // Reguły Policji Luksemburga: do F od 21:30, do D od 23:30,
  // do 21:45 w niedzielę / właściwe święto dla danego kierunku.
  function directionAt(date) {
    const p = getLocal(date);
    const tomorrow = new Date(Date.UTC(p.year, p.month-1, p.day+1));
    const cur = directionsForDay(p.year,p.month,p.day);
    const nxt = directionsForDay(tomorrow.getUTCFullYear(),tomorrow.getUTCMonth()+1,tomorrow.getUTCDate());
    const fr = (cur.includes('F') && p.mins < 21*60+45) ||
               (nxt.includes('F') && p.mins >= 21*60+30);
    const de = (cur.includes('D') && p.mins < 21*60+45) ||
               (nxt.includes('D') && p.mins >= 23*60+30);
    return de && fr ? 'DF' : de ? 'D' : fr ? 'F' : '';
  }

  function badge(letter, x) {
    let stars = '';
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6 - Math.PI / 2;
      const px = x + Math.cos(angle)*12.9;
      const py = 20 + Math.sin(angle)*12.9;
      const r1 = 1.85, r2 = .75;
      const points = [];
      for (let k=0;k<10;k++) {
        const a = -Math.PI/2 + k*Math.PI/5;
        const r = k%2 ? r2 : r1;
        points.push((px+Math.cos(a)*r).toFixed(2)+','+(py+Math.sin(a)*r).toFixed(2));
      }
      stars += '<polygon fill="#ffe23b" points="'+points.join(' ')+'"/>';
    }
    return '<circle cx="'+x+'" cy="20" r="18" fill="#0645b7" stroke="#8ec8ff" stroke-width="1.6"/>'+
           stars+'<text x="'+x+'" y="25" text-anchor="middle" font-size="16" font-weight="800" fill="white">'+letter+'</text>';
  }

  function svg(direction) {
    const parts = [];
    if (direction.includes('D')) parts.push(badge('D',20));
    if (direction.includes('F')) parts.push(badge('F',80));
    if (direction === 'D') {
      parts.push('<path d="M66 20 H45 M45 20 L53 13 M45 20 L53 27" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    } else if (direction === 'F') {
      parts.push('<path d="M34 20 H55 M55 20 L47 13 M55 20 L47 27" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    } else if (direction === 'DF') {
      parts.push('<path d="M43 14 H58 M58 14 L52 9 M58 14 L52 19 M57 26 H42 M42 26 L48 21 M42 26 L48 31" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40" aria-hidden="true">'+parts.join('')+'</svg>';
  }

  function activeDirection() {
    try {
      const b = window.gbZakazyOnline && window.gbZakazyOnline.pobierz();
      if (!b || !Array.isArray(b.current_bans) || !b.current_bans.some(x => x.country_code === 'LU')) return '';
      const status = window.gbStatusZakazow && window.gbStatusZakazow('LU');
      if (!status || (status.status !== 'red' && status.status !== 'yellow')) return '';
      return directionAt(new Date());
    } catch (_) { return ''; }
  }

  const labels = {D:'Zakaz w kierunku Niemiec',F:'Zakaz w kierunku Francji',DF:'Zakaz w kierunkach Niemiec i Francji'};
  function update() {
    const overlay = document.querySelector('[data-gb-zakazy-okno="1"]');
    if (!overlay) return;
    const strong = Array.from(overlay.querySelectorAll('strong')).find(el =>
      /\b(?:Luksemburg|Luxembourg)\b/i.test(el.textContent || '')
    );
    if (!strong) return;
    const container = strong.parentElement;
    if (!container) return;
    let icon = container.querySelector('[data-gb-lu-kierunek]');
    const dir = activeDirection();
    if (!dir) { if (icon) icon.remove(); return; }
    if (icon && icon.getAttribute('data-gb-lu-kierunek') === dir) return;
    if (!icon) {
      icon = document.createElement('span');
      icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:100px;height:40px;vertical-align:middle;margin:2px 4px;max-width:100%;';
      strong.insertAdjacentElement('afterend', icon);
    }
    icon.setAttribute('data-gb-lu-kierunek',dir);
    icon.setAttribute('aria-label',labels[dir]);
    icon.title = labels[dir];
    icon.innerHTML = svg(dir);
  }

  // Funkcja dostępna do testów bez zmiany zegara telefonu.
  window.gbLuKierunekTest = function (isoDate) { return directionAt(new Date(isoDate)); };
  window.gbLuIkonaTest = svg;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',update);
  else update();
  const mo = new MutationObserver(update);
  mo.observe(document.documentElement, {childList:true,subtree:true});
  setInterval(update, 30000);
  document.addEventListener('visibilitychange', function(){if (!document.hidden) update();});
  window.addEventListener('gb-zakazy-zaktualizowane',update);
})();
