(function(){
'use strict';
if(window.__GB_HOURLY_V1__)return;
window.__GB_HOURLY_V1__=true;
let audio;
function clickSound(){
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return;
      audio = audio || new Ctx();
      if(audio.state === 'suspended') audio.resume();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(720, audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(390, audio.currentTime + 0.035);
      g.gain.setValueAtTime(0.065, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.035);
      o.connect(g);
      g.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + 0.035);
    } catch(e) {}
  }
const STORE='gb_hourly_entries_v1', PREFS='gb_hourly_prefs_v1';
let items={}, prefs={rate:'35',base:'0',start:'06:00',end:'14:00',breaks:'0',holidayHours:'8'};
try{items=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(e){items={};}
try{Object.assign(prefs,JSON.parse(localStorage.getItem(PREFS)||'{}')||{});}catch(e){}
let selected='',year=2026,month=9,type='work',mounted=false;
const pln=x=>(Number(x)||0).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' zł';
const num=x=>{const v=Number(String(x||'0').replace(',','.'));return Number.isFinite(v)&&v>=0?v:NaN;};
const hm=x=>{const m=/^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(x));return m?Number(m[1])*60+Number(m[2]):NaN;};
const pad=x=>String(x).padStart(2,'0');
const dayKey=d=>year+'-'+pad(month+1)+'-'+pad(d);
const el=id=>document.getElementById(id);
const css=`
#gbh-layer{position:fixed;inset:0;z-index:2147483000;background:#071525a8;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box}
#gbh-panel{background:#fff;color:#17334d;width:min(570px,100%);max-height:94dvh;overflow:auto;border-radius:19px;padding:17px;box-sizing:border-box;font-family:system-ui,-apple-system,Arial,sans-serif;font-size:15px}
#gbh-panel *{box-sizing:border-box}#gbh-panel button{cursor:pointer;touch-action:manipulation}
#gbh-panel .gbh-row{display:flex;align-items:center;gap:8px;justify-content:space-between}
#gbh-panel .gbh-link{border:1px solid #cbd7e2;border-radius:9px;background:#f4f8fd;color:#17436a;padding:9px 13px}
#gbh-panel .gbh-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:10px 0}
#gbh-panel .gbh-week{text-align:center;font-size:11px;color:#66788b;padding:4px 0}
#gbh-panel .gbh-day{border:1px solid #cfdae7;background:white;border-radius:9px;height:50px;color:#17334d;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;font-size:13px}
#gbh-panel .gbh-day[data-type=work]{background:#e6f2ff}#gbh-panel .gbh-day[data-type=off]{background:#e4f6ea}#gbh-panel .gbh-day[data-type=holiday]{background:#fff0d6}
#gbh-panel .gbh-day[data-selected=true]{outline:2px solid #146ed1;outline-offset:-2px}
#gbh-panel .gbh-types{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0}
#gbh-panel .gbh-type{padding:11px 2px;border:1px solid #cfdae7;border-radius:10px;background:white;color:#223850;font-size:13px}
#gbh-panel .gbh-type[data-on=true]{border:2px solid #2277d0;background:#eaf4ff;font-weight:700}
#gbh-panel .gbh-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#gbh-panel label{display:block;color:#44566b;font-size:12px;font-weight:600}
#gbh-panel input{width:100%;border:1px solid #bbcbdc;border-radius:8px;font:inherit;padding:9px;margin-top:4px;background:#fff;color:#18334b}
#gbh-panel .gbh-summary{background:#eaf5ed;border-radius:10px;padding:11px;margin:10px 0;color:#146d44;font-weight:700}
#gbh-panel .gbh-save{width:100%;border:0;background:#157b50;border-radius:11px;padding:13px;color:#fff;font:inherit;font-weight:700}
#gbHourlyKey{display:block!important;transition:transform 65ms ease-out,box-shadow 65ms ease-out!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#gbHourlyKey:active,#gbHourlyKey.gbh-pressed{transform:translateY(4px)!important;box-shadow:0 1px 2px #071b3340!important}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
function savePrefs(){try{localStorage.setItem(PREFS,JSON.stringify(prefs));return true;}catch(e){alert('Nie mozna zapisac ustawien Godzinowki.');return false;}}
function saveItems(){try{localStorage.setItem(STORE,JSON.stringify(items));return true;}catch(e){alert('Brak miejsca na zapis. Nie zmieniono danych kierowcy.');return false;}}
function getHours(){let a=hm(el('gbh-start').value),b=hm(el('gbh-end').value),br=num(el('gbh-breaks').value);if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(br))return NaN;let mins=(b-a+1440)%1440;return br<=mins?(mins-br)/60:NaN;}
function estimate(){if(type==='off')return 0;let rate=num(el('gbh-rate').value);if(!Number.isFinite(rate))return NaN;if(type==='holiday')return rate*num(el('gbh-holiday-hours').value);return rate*getHours();}
function updateSum(){const sum=estimate(),base=num(el('gbh-base').value);el('gbh-day-total').textContent=Number.isFinite(sum)?pln(sum):'Sprawdź godziny';let total=Number.isFinite(base)?base:0;for(const [d,v] of Object.entries(items)){if(d.startsWith(year+'-'+pad(month+1)+'-'))total+=Number(v.amount)||0;}el('gbh-month-total').textContent=pln(total);}
function setType(t){type=t;for(const b of document.querySelectorAll('.gbh-type'))b.dataset.on=String(b.dataset.type===t);el('gbh-work-fields').style.display=t==='work'?'grid':'none';el('gbh-holiday-row').style.display=t==='holiday'?'block':'none';updateSum();}
function setSelected(d){selected=dayKey(d);const v=items[selected];for(const b of document.querySelectorAll('.gbh-day'))b.dataset.selected=String(b.dataset.date===selected);el('gbh-date').textContent=d+' '+['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'][month];setType(v?.type||'work');if(v){for(const k of ['rate','start','end','breaks','holidayHours']){if(v[k]!==undefined){let inp=el('gbh-'+(k==='holidayHours'?'holiday-hours':k));if(inp)inp.value=v[k];}}}updateSum();}
function monthDraw(){const grid=el('gbh-calendar');grid.textContent='';const dname=['Pn','Wt','Śr','Cz','Pt','So','Nd'];for(let w of dname){const t=document.createElement('div');t.className='gbh-week';t.textContent=w;grid.appendChild(t);}const first=(new Date(year,month,1).getDay()+6)%7;const total=new Date(year,month+1,0).getDate();for(let i=0;i<first;i++)grid.appendChild(document.createElement('div'));for(let d=1;d<=total;d++){const b=document.createElement('button');b.type='button';b.className='gbh-day';b.dataset.date=dayKey(d);const v=items[b.dataset.date];if(v)b.dataset.type=v.type;b.textContent=d;const small=document.createElement('span');small.style.cssText='font-size:17px;line-height:1';small.textContent=v?(v.type==='work'?'◷':v.type==='off'?'⌂':'☂'):'';b.appendChild(small);b.addEventListener('click',()=>setSelected(d));grid.appendChild(b);}el('gbh-month').textContent=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'][month]+' '+year;const desired=Number(selected.slice(-2));setSelected(Math.min(Math.max(1,desired||new Date().getDate()),total));}
function open(){const dt=new Date();year=dt.getFullYear();month=dt.getMonth();selected=dayKey(dt.getDate());el('gbh-layer').style.display='flex';monthDraw();}
function close(){el('gbh-layer').style.display='none';}
function build(){const ov=document.createElement('div');ov.id='gbh-layer';ov.innerHTML=`<div id="gbh-panel" role="dialog" aria-modal="true" aria-label="Godzinówka"><div class="gbh-row"><b style="font-size:21px">Godzinówka · Kalendarz</b><button class="gbh-link" id="gbh-close">✕ Zamknij</button></div><p style="font-size:12px;color:#607487;margin:5px 0">Osobne dni godzinowe — rozliczenia kierowcy bez zmian.</p><div class="gbh-row" style="margin:12px 0"><button class="gbh-link" id="gbh-prev">❮</button><b id="gbh-month"></b><button class="gbh-link" id="gbh-next">❯</button></div><div id="gbh-calendar" class="gbh-cal"></div><b id="gbh-date"></b><div class="gbh-types"><button class="gbh-type" data-type="work">🕒 Praca</button><button class="gbh-type" data-type="off">🏠 Dzień wolny</button><button class="gbh-type" data-type="holiday">☂️ Urlop płatny</button></div><div class="gbh-fields"><label>Stawka netto (zł/h)<input id="gbh-rate" inputmode="decimal"></label><label>Podstawa miesięczna (zł)<input id="gbh-base" inputmode="decimal"></label></div><div class="gbh-fields" id="gbh-work-fields" style="margin-top:8px"><label>Od godziny<input id="gbh-start" inputmode="numeric" placeholder="06:00"></label><label>Do godziny<input id="gbh-end" inputmode="numeric" placeholder="14:00"></label><label>Przerwa, minuty<input id="gbh-breaks" inputmode="numeric"></label></div><div id="gbh-holiday-row" style="display:none;margin-top:8px"><label>Godziny płatnego urlopu (szacunkowo)<input id="gbh-holiday-hours" inputmode="decimal"></label><small>Rzeczywiste wynagrodzenie urlopowe może być liczone inaczej.</small></div><div class="gbh-summary">Za dzień: <span id="gbh-day-total">0,00 zł</span><div style="font-size:14px;margin-top:4px">Miesiąc z podstawą: <span id="gbh-month-total">0,00 zł</span></div></div><button class="gbh-save" id="gbh-save">✓ Zatwierdź dzień</button><p style="font-size:11px;color:#657789">Dane godzinowe zapisują się wyłącznie w tym telefonie. Kopia bezpieczeństwa jest zalecana.</p></div>`;document.body.appendChild(ov);ov.addEventListener('click',e=>{if(e.target===ov)close();});el('gbh-close').addEventListener('click',close);el('gbh-prev').addEventListener('click',()=>{month--;if(month<0){month=11;year--;}selected=dayKey(1);monthDraw();});el('gbh-next').addEventListener('click',()=>{month++;if(month>11){month=0;year++;}selected=dayKey(1);monthDraw();});for(const b of ov.querySelectorAll('.gbh-type'))b.addEventListener('click',()=>setType(b.dataset.type));for(const k of ['rate','base','start','end','breaks','holiday-hours']){const inp=el('gbh-'+k);const pref=k==='holiday-hours'?'holidayHours':k;inp.value=prefs[pref]||'0';inp.addEventListener('input',()=>{prefs[pref]=inp.value;savePrefs();updateSum();});}el('gbh-save').addEventListener('click',()=>{const amount=estimate();if(!Number.isFinite(amount)){alert('Popraw stawkę, godziny albo przerwę.');return;}const v={type,amount,rate:el('gbh-rate').value,start:el('gbh-start').value,end:el('gbh-end').value,breaks:el('gbh-breaks').value,holidayHours:el('gbh-holiday-hours').value};const before=items[selected];items[selected]=v;if(!saveItems()){if(before)items[selected]=before;else delete items[selected];return;}monthDraw();alert('Zapisano dzień '+selected+' w Godzinówce.');});}
function mount(){if(mounted)return;const daily=el('gbDailyKey'),km=el('gbKmKey');if(!daily||!km||!daily.parentElement||!km.parentElement)return;const btn=km.cloneNode(false);btn.id='gbHourlyKey';btn.removeAttribute('onclick');btn.removeAttribute('onmousedown');btn.removeAttribute('ontouchstart');btn.textContent='Godzinówka';btn.type='button';const cs=getComputedStyle(km);for(const p of ['color','background-color','background-image','border','border-radius','box-shadow','font','font-weight','padding','min-height']){try{btn.style.setProperty(p,cs.getPropertyValue(p));}catch(e){}}btn.style.width='100%';const row=document.createElement('div');row.style.cssText='margin-top:9px;width:100%;';row.appendChild(btn);const parent=daily.parentElement===km.parentElement?daily.parentElement:km.parentElement;parent.insertAdjacentElement('afterend',row);btn.addEventListener('pointerdown',()=>{btn.classList.add('gbh-pressed');clickSound();});for(const e of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(e,()=>btn.classList.remove('gbh-pressed'));btn.addEventListener('click',open);build();mounted=true;}
function decorateHoliday(){if(!document.body)return;const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(!n.nodeValue||!n.nodeValue.includes('Urlop płatny'))continue;const base=n.parentElement;if(!base||base.closest('#gbh-layer,script,style'))continue;const label=base.closest('label')||base.parentElement;if(!label||label.dataset.gbUmbrella==='1')continue;label.dataset.gbUmbrella='1';for(const svg of label.querySelectorAll('svg,i')){if(svg.closest('button'))continue;svg.style.display='none';}n.nodeValue=n.nodeValue.replace(/🏠|⌂/g,'');const umbrella=document.createElement('span');umbrella.textContent='☂ ';umbrella.style.cssText='color:#d18a16;font-size:22px;vertical-align:middle;margin-right:4px;';n.parentNode.insertBefore(umbrella,n);}}
function init(){mount();decorateHoliday();if(!mounted){const o=new MutationObserver(()=>{if(!mounted)mount();decorateHoliday();});o.observe(document.body,{childList:true,subtree:true});}else{const o=new MutationObserver(decorateHoliday);o.observe(document.body,{childList:true,subtree:true});}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();