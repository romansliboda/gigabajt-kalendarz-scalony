/* Gigabajt v8: inside Data i godzina, one header clock slot. */
(()=>{
'use strict';
if(window.__gbV8Fixed) return;
window.__gbV8Fixed=true;
const clockBox=document.getElementById('gbClock');
const timeEl=document.getElementById('gbTime');
const dateEl=document.getElementById('gbDate');
if(!clockBox||!timeEl||!dateEl){console.warn('GB v8: brak elementow zegara');return;}
const KEY='gb-test-clock';
let current=null;
try{const obj=JSON.parse(localStorage.getItem(KEY)||'null');if(obj&&typeof obj==='object')current=obj;}catch(e){}
const css=document.createElement('style');
css.id='gb-v8-safe-style';
css.textContent=`
#gbClock.gb-v8-analog{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;overflow:hidden!important;box-sizing:border-box!important;padding:3px!important;min-width:0!important}
#gbClock.gb-v8-analog #gbTime{display:none!important}
#gbClock .gb-v8-dial{width:50px;height:50px;flex:0 0 50px;border:2px solid white;border-radius:50%;position:relative;box-sizing:border-box;box-shadow:0 1px 3px #0004;overflow:hidden}
#gbClock .gb-v8-num{position:absolute;transform:translate(-50%,-50%);font-size:8px;font-weight:700;line-height:1}
#gbClock .gb-v8-hand{position:absolute;left:50%;top:50%;transform-origin:50% 100%;border-radius:5px}
#gbClock .gb-v8-centre{position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:100%;background:#ff6262;transform:translate(-50%,-50%)}
#gbClock.gb-v8-analog #gbDate{font-size:9px!important;line-height:10px!important;white-space:nowrap!important;margin:0!important}
#gb-v8-shade{position:fixed;inset:0;background:rgba(12,23,37,.7);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box}
#gb-v8-window{background:#fff;border-radius:15px;width:min(100%,480px);height:min(85dvh,850px);overflow:hidden;box-shadow:0 16px 60px #0006;display:flex;flex-direction:column}
#gb-v8-top{display:flex;align-items:center;justify-content:space-between;background:#12375b;color:white;padding:10px 13px;font:700 17px Arial,sans-serif}
#gb-v8-close{background:#edf1f6;color:#173b5a;border:0;border-radius:8px;width:38px;height:36px;font-size:25px;cursor:pointer}
#gb-v8-iframe{border:0;width:100%;flex:1;min-height:0;background:#f4f7fb}
`;
document.head.appendChild(css);
let popup=null;
function close(){if(popup){popup.remove();popup=null;}}
function open(){
 if(popup)return;
 popup=document.createElement('div');popup.id='gb-v8-shade';
 const w=document.createElement('div');w.id='gb-v8-window';
 const top=document.createElement('div');top.id='gb-v8-top';
 const title=document.createElement('span');title.textContent='Data i godzina';
 const btn=document.createElement('button');btn.id='gb-v8-close';btn.textContent='×';btn.setAttribute('aria-label','Zamknij');btn.addEventListener('click',close);
 top.append(title,btn);
 const frame=document.createElement('iframe');frame.id='gb-v8-iframe';frame.title='Ustawienia zegara v8';frame.src='gb-zegar-v8-panel.html';
 w.append(top,frame);popup.appendChild(w);
 popup.addEventListener('click',e=>{if(e.target===popup)close();});
 document.body.appendChild(popup);
}
// Przechwyc tylko pierwsza opcje "Data i godzina". Stare menu pozostaje bez zmian.
document.addEventListener('click',e=>{
 const t=e.target.closest&&e.target.closest('[data-section="clock"]');
 if(!t)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 open();
},true);
window.addEventListener('message',e=>{
 if(!popup)return;
 const frame=popup.querySelector('#gb-v8-iframe');
 if(!frame||e.source!==frame.contentWindow||!e.data||typeof e.data!=='object')return;
 if(e.data.type==='gb-v8-close'){close();return;}
 if(e.data.type==='gb-v8-save'){
  try{const s=e.data.settings;if(s&&typeof s==='object'&&!Array.isArray(s)){current=s;localStorage.setItem(KEY,JSON.stringify(s));}}catch(err){if(e.data.settings&&typeof e.data.settings==='object')current=e.data.settings;}
  paint();tick();
 }
});
function dial(s){
 const c=document.createElement('div');c.className='gb-v8-dial';
 const color=typeof s.color==='string'&&/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#287D4A';
 c.style.background=color;
 const pale=['#E9BD36','#E8E9EC'].includes(color);
 const ink=pale?'#182536':'white';
 for(let n=1;n<=12;n++){
  const label=document.createElement('span');label.className='gb-v8-num';
  const a=n*Math.PI/6;
  label.style.left=(50+38*Math.sin(a))+'%';label.style.top=(50-38*Math.cos(a))+'%';label.style.color=ink;
  label.textContent=(s.numbers===false||s.style==='Minimalistyczny')?'•':String(n);
  c.appendChild(label);
 }
 for(const [name,width,height,bg] of [['hour',4,12,ink],['minute',2.5,17,ink],['second',1,20,'#ff5252']]){
  if(name==='second'&&s.seconds===false)continue;
  const hand=document.createElement('div');hand.className='gb-v8-hand gb-v8-'+name;
  hand.style.width=width+'px';hand.style.height=height+'px';
  hand.style.marginLeft=(-width/2)+'px';hand.style.marginTop=(-height)+'px';hand.style.background=bg;
  c.appendChild(hand);
 }
 const ctr=document.createElement('div');ctr.className='gb-v8-centre';c.appendChild(ctr);
 return c;
}
function paint(){
 if(!current)return;
 const s=current;
 const analog=s.kind==='analog'&&s.showTime!==false;
 clockBox.classList.toggle('gb-v8-analog',analog);
 let face=clockBox.querySelector('.gb-v8-dial');
 if(analog){
  if(!face){face=dial(s);clockBox.insertBefore(face,timeEl);}else{face.replaceWith(dial(s));}
  timeEl.style.display='none';
 }else{
  if(face)face.remove();timeEl.style.removeProperty('display');
  if(s.kind==='digital'){
   const fonts={'Techniczny':'monospace','Elegancki':'Georgia,serif'};
   timeEl.style.fontFamily=fonts[s.style]||'';
   timeEl.style.fontWeight=['Pogrubiony','Sportowy'].includes(s.style)?'900':'';
   timeEl.style.fontStyle=s.style==='Sportowy'?'italic':'';
  }
 }
}
function tick(){
 if(!current)return;
 const s=current;
 const d=(!s.auto&&/^\d{4}-\d\d-\d\d$/.test(s.manualDate||'')&&/^\d\d:\d\d$/.test(s.manualTime||''))?new Date(s.manualDate+'T'+s.manualTime+':00'):new Date();
 if(Number.isNaN(d.getTime()))return;
 clockBox.hidden=(s.showTime===false&&s.showDate===false);
 dateEl.style.display=s.showDate===false?'none':'';
 if(s.showTime===false) timeEl.style.display='none';
 if(s.showDate!==false){const label=d.toLocaleDateString('pl-PL');/* GB: date ustawia gb-dodatki.js */}
 if(s.kind==='analog'&&s.showTime!==false){
  timeEl.style.display='none';
  const h=clockBox.querySelector('.gb-v8-hour'),m=clockBox.querySelector('.gb-v8-minute'),sec=clockBox.querySelector('.gb-v8-second');
  if(h)h.style.transform=`rotate(${(d.getHours()%12)*30+d.getMinutes()*.5}deg)`;
  if(m)m.style.transform=`rotate(${d.getMinutes()*6+d.getSeconds()*.1}deg)`;
  if(sec)sec.style.transform=`rotate(${d.getSeconds()*6}deg)`;
 }else if(s.kind==='digital'&&s.showTime!==false){
  const value=d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
  if(timeEl.textContent!==value)timeEl.textContent=value;
  timeEl.style.display='';
 }
}
paint();tick();setInterval(tick,1000);
})();
