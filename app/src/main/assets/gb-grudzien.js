/* Gigabajt — grudzień co roku (od 1 do 31), niezależny od rozliczeń/zakazów.
   Test tylko na /assets/gb-grudzien-test.html; w aplikacji zawsze rzeczywista data.
*/
(() => {
  'use strict';
  const MARK = 'GB_DECEMBER_V290';
  if (window[MARK]) return;
  window[MARK] = true;

  const TEST = /\/gb-grudzien-test\.html$/.test(location.pathname) &&
    !/\/assets\/index\.html$/.test(location.pathname);
  const clock = () => TEST ? new Date(2026, 11, 6, 12, 0) : new Date();
  const currentYear = () => clock().getFullYear();
  const isDecember = () => clock().getMonth() === 11;
  const hatDays = new Set([6,24,25,26]);
  const dayCount = () => new Date(currentYear(), 12, 0).getDate();
  const bells = new Audio('gb-grudzien-dzwoneczki.mp3');
  const gustAudio = new Audio('gb-grudzien-wiatr.mp3');
  bells.preload='auto'; gustAudio.preload='auto';
  bells.volume=1; // MP3 już ma zaakceptowane 8% głośności
  gustAudio.volume=1; // MP3 już ma zaakceptowane 70% głośności

  const svg = `<svg viewBox="0 0 120 92" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="gbRed" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff5a55"/><stop offset=".30" stop-color="#e71924"/><stop offset=".7" stop-color="#c50815"/><stop offset="1" stop-color="#8d0919"/></linearGradient><radialGradient id="gbPom" cx=".3" cy=".25" r=".82"><stop stop-color="#fff"/><stop offset=".45" stop-color="#f9fcff"/><stop offset=".85" stop-color="#d8dde2"/><stop offset="1" stop-color="#aeb7bd"/></radialGradient><linearGradient id="gbBrim" x1=".25" y1="0" x2=".55" y2="1"><stop stop-color="#fff"/><stop offset=".48" stop-color="#f6f8f9"/><stop offset="1" stop-color="#cdd4da"/></linearGradient></defs>
<path d="M18 67 C25 42 34 22 47 16 C61 7 79 15 88 29 C99 45 100 54 111 57 C109 62 99 64 94 61 C84 55 79 52 73 61 L68 70 C51 63 35 64 18 67Z" fill="url(#gbRed)" stroke="#a80a19" stroke-width="1.2"/>
<path d="M36 37 C49 15 61 15 71 23 C55 21 50 31 43 51Z" fill="#ff7c77" opacity=".38"/>
<path d="M82 29 C89 37 92 46 96 50" fill="none" stroke="#8b0b1b" stroke-width="3.8" stroke-linecap="round" opacity=".25"/>
<ellipse cx="106" cy="64" rx="13.3" ry="12.9" fill="url(#gbPom)" stroke="#d4dce1" stroke-width="1"/>
<path d="M97 61 Q104 53 112 57 M94 67 Q107 59 117 64 M98 73 Q108 69 115 72" stroke="#fff" stroke-width="1.5" opacity=".6" fill="none"/>
<path d="M15 63 Q40 54 74 60 Q81 62 79 70 L77 81 Q47 73 18 83 Q10 80 11 72 Q11 66 15 63Z" fill="url(#gbBrim)" stroke="#cbd2d7" stroke-width="1.1"/>
<path d="M14 69 Q36 59 77 68" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/>
<path d="M15 76 Q37 67 76 75" fill="none" stroke="#d5dde2" stroke-width="2" opacity=".75"/>
</svg>`;

  function visible(el) {
    const r=el.getBoundingClientRect();
    const st=getComputedStyle(el);
    return r.width>0 && r.height>0 && st.display!=='none' && st.visibility!=='hidden';
  }
  function seasonHeaderIsDisplayed() {
    if (!isDecember()) return false;
    if (TEST) return true;
    const year=String(currentYear());
    const monthWord=/grudzie[nń]|december/i;
    const labelled=document.querySelectorAll(
      'h1,h2,h3,h4,header,[id*=month],[id*=Month],[id*=mies],'+
      '[class*=month],[class*=Month],[class*=mies],[class*=calendar-title],[class*=calendar-header]');
    for(const el of labelled) {
      if(!visible(el)) continue;
      let text=(el.innerText||'').trim();
      if(text.length>110) continue;
      if(monthWord.test(text) && text.includes(year)) return true;
      if(monthWord.test(text) && text.length<30) {
        const nearby=el.parentElement?.innerText?.slice(0,100)||'';
        if(nearby.includes(year)) return true;
      }
    }
    const selectMonth=Array.from(document.querySelectorAll('select')).find(s=>
      /month|mies/i.test((s.id||'')+' '+(s.name||'')));
    const selectYear=Array.from(document.querySelectorAll('select')).find(s=>
      /year|rok/i.test((s.id||'')+' '+(s.name||'')));
    if(selectMonth && selectYear && visible(selectMonth) && visible(selectYear)) {
      const v=String(selectMonth.value).toLowerCase();
      const text=selectMonth.selectedOptions[0]?.textContent||'';
      return (v==='11'||v==='12'||monthWord.test(text)) && String(selectYear.value)===year;
    }
    return false; // w razie niejasnego nagłówka nie uruchamiaj efektów w złym miesiącu
  }
  function dayNumber(el) {
    const attr=el.getAttribute('data-day');
    if(attr && /^\d{1,2}$/.test(attr)) return Number(attr);
    const label=el.querySelector('.day-number,.date-number,.day-num,[data-day-number]');
    if(label) {
      const val=(label.textContent||'').trim();
      if(/^\d{1,2}$/.test(val)) return Number(val);
    }
    const first=Array.from(el.childNodes).find(n=>n.nodeType===Node.TEXT_NODE && /\d/.test(n.nodeValue));
    const text=((first && first.nodeValue)||el.innerText||'').trim();
    const match=text.match(/^(\d{1,2})(?=\D|$)/);
    return match? Number(match[1]):null;
  }
  function findTiles() {
    const groups=[];
    const holders=document.querySelectorAll('div,section,main,tbody,[role=grid]');
    for(const parent of holders) {
      let ch=Array.from(parent.children);
      if(parent.tagName==='TBODY' && ch.length<28) ch=Array.from(parent.querySelectorAll('td'));
      if(ch.length<28 || ch.length>50) continue;
      const candidates=ch.map(el=>{
        if(!visible(el)||el.id==='gb-december-snow'||el.classList.contains('gb-december-ghost'))return null;
        const r=el.getBoundingClientRect();
        if(r.width<20||r.width>170||r.height<22||r.height>170) return null;
        const day=dayNumber(el);
        return day>=1 && day<=31 ? {el,day,r} : null;
      }).filter(Boolean);
      const uniques=new Set(candidates.map(x=>x.day));
      if(uniques.size>=Math.min(28,dayCount()) && !groups.some(g=>g.parent===parent)) {
        groups.push({parent,candidates,score:uniques.size});
      }
    }
    if(!groups.length) return [];
    groups.sort((a,b)=>b.score-a.score);
    // Preferuj prawdziwe dni bieżącego miesiąca 1..31 w kolejności.
    // Chroni przed pomyleniem np. 24 listopada w szarych dniach poprzedniego miesiąca.
    for(const group of groups){
      const c=group.candidates;
      for(let i=0;i<=c.length-31;i++){
        const seq=c.slice(i,i+31);
        if(seq.every((x,j)=>x.day===j+1)) return seq;
      }
    }
    return []; // jeśli kalendarz jest nietypowy, niczego nie animujemy na ślepo
  }
  let hats=[], canvas=null,ctx=null, snowList=[], active=false, startedBells=false;
  let windTimer=0,frameId=0,lastFrame=0,windStrength=0, gust=null;
  let dayEls=[];
  function placeHats(tiles){
    const current=tiles.map(t=>t.el);
    if(hats.length && hats.every(h=>current.includes(h.el))) return;
    clearHats(); dayEls=tiles;
    const sorted=[6,24,25,26];
    for(const day of sorted){
      const tile=tiles.find(t=>t.day===day);
      if(!tile)continue;
      const el=tile.el;
      const hat=document.createElement('span');
      hat.className='gb-december-hat';hat.innerHTML=svg;
      const f=Math.max(.62,Math.min(1.12,tile.r.width/56));
      hat.style.cssText=`top:${-5.676*f}px;right:${-1.135*f}px;width:${21.946*f}px;height:${17.784*f}px;transform:translate(${8.324*f}px,${5.297*f}px) rotate(45deg) scale(1.65);`;
      const previous={position:el.style.position,overflow:el.style.overflow,zIndex:el.style.zIndex};
      if(getComputedStyle(el).position==='static') el.style.position='relative';
      el.style.overflow='visible';
      el.style.zIndex=String(day===24?112:day===25?111:day===26?110:110);
      el.classList.add('gb-december-day');el.appendChild(hat);
      hats.push({el,hat,previous});
    }
  }
  function clearHats(){
    for(const h of hats){h.hat.remove();h.el.style.position=h.previous.position;h.el.style.overflow=h.previous.overflow;h.el.style.zIndex=h.previous.zIndex;h.el.classList.remove('gb-december-day')}
    hats=[];
  }
  function initSnow(){
    if(canvas)return;
    canvas=document.createElement('canvas');
    canvas.id='gb-december-snow';canvas.setAttribute('aria-hidden','true');
    document.body.appendChild(canvas);
    ctx=canvas.getContext('2d');
    function resize(){const scale=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(scale,0,0,scale,0,0)}
    window.addEventListener('resize',resize,{passive:true});resize();
    for(let i=0;i<28;i++)snowList.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:2+Math.random()*4,s:20+Math.random()*40,w:-6+Math.random()*13,seed:Math.random()*6});
  }
  function paint(t){
    if(!active){frameId=0;return;}
    const dt=Math.min(.06,(t-lastFrame)/1000||.016);lastFrame=t;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    windStrength=gust?Math.max(0,Math.min(1,(t-gust.start)/650))*.95:Math.max(0,windStrength-dt*1.8);
    for(const f of snowList){
      f.y+=dt*f.s*(1+.3*windStrength);
      f.x+=dt*(f.w+windStrength*135)+Math.sin(t*.0012+f.seed)*dt*5;
      if(f.y>innerHeight+15){f.y=-15;f.x=Math.random()*innerWidth}
      if(f.x>innerWidth+20)f.x=-15;
      ctx.beginPath();ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=1.4;ctx.shadowColor='#6b8392';ctx.shadowBlur=1.6;
      const n=6;
      for(let j=0;j<n;j++){let a=j*Math.PI*2/n;ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+Math.cos(a)*f.r,f.y+Math.sin(a)*f.r)}
      ctx.stroke();
    }
    ctx.shadowBlur=0;
    if(gust)animateGust(t);
    frameId=requestAnimationFrame(paint);
  }
  function randomWait(){return (5+Math.random()*10)*60*1000}
  function scheduleWind(){clearTimeout(windTimer);windTimer=0;if(!active||document.hidden)return;windTimer=setTimeout(()=>{windTimer=0;if(active&&!document.hidden)beginGust();scheduleWind()},randomWait())}
  function finishGust(){
    if(!gust)return;
    for(const e of gust.originals){e.el.style.opacity=e.opacity;e.el.style.pointerEvents=e.pointerEvents}
    gust.overlay.remove();gust=null;windStrength=0;
  }
  function beginGust(){
    if(!active||document.hidden||gust)return;
    const tiles=findTiles(); if(tiles.length<28)return;
    placeHats(tiles);
    const overlay=document.createElement('div');overlay.className='gb-december-flight';document.body.appendChild(overlay);
    const clones=[];
    const originals=[];
    for(const t of tiles){
      const r=t.el.getBoundingClientRect();
      const clone=t.el.cloneNode(true);
      clone.classList.add('gb-december-ghost');clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
      clone.style.cssText+=`;position:fixed!important;left:${r.left}px!important;top:${r.top}px!important;width:${r.width}px!important;height:${r.height}px!important;margin:0!important;pointer-events:none!important;box-sizing:border-box!important;opacity:1!important;z-index:1;`;
      overlay.appendChild(clone);
      clones.push({el:clone,delay:.08+Math.random()*.40,duration:1.35+Math.random()*.72,dx:innerWidth+70+Math.random()*200,dy:-120+Math.random()*240,rot:(Math.random()<.5?-1:1)*(60+Math.random()*150)});
      originals.push({el:t.el,opacity:t.el.style.opacity,pointerEvents:t.el.style.pointerEvents});
      t.el.style.opacity='0';t.el.style.pointerEvents='none';
    }
    const order=originals.map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
    const light=new Array(originals.length); let after=0;
    for(const i of order){light[i]=after;after+=.15+Math.random()*.085}
    gust={start:performance.now(),overlay,clones,originals,light,until:4.9+after+.3};
    gustAudio.currentTime=0;gustAudio.play().catch(()=>{});
  }
  function animateGust(now){
    const g=gust;if(!g)return;
    const time=(now-g.start)/1000;
    const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
    if(time<2.9){
      for(const f of g.clones){
        const u=Math.max(0,Math.min(1,(time-f.delay)/f.duration));
        const q=ease(u);
        f.el.style.transform=`translate(${f.dx*q}px,${f.dy*q-Math.sin(Math.PI*u)*20}px) rotate(${f.rot*q}deg)`;
        f.el.style.opacity=u>.8?String(Math.max(0,(1-u)/.2)):'1';
      }
    } else if(time<4.9){g.overlay.style.display='none'}
    else {
      const age=time-4.9;
      for(let i=0;i<g.originals.length;i++){
        const o=g.originals[i];
        const a=ease((age-g.light[i])/.26);
        o.el.style.opacity=String(a);
      }
      if(time>=g.until)finishGust();
    }
  }
  function start(){
    if(active)return;
    active=true;initSnow();lastFrame=performance.now();frameId=requestAnimationFrame(paint);
    if(!startedBells){startedBells=true;bells.currentTime=0;bells.play().catch(()=>{/* Brak zgody przeglądarki na autoplay — bez wymuszenia */})}
    scheduleWind();
  }
  function stop(){
    active=false;clearTimeout(windTimer);windTimer=0;
    if(frameId){cancelAnimationFrame(frameId);frameId=0}
    if(ctx)ctx.clearRect(0,0,innerWidth,innerHeight);
    bells.pause();gustAudio.pause();finishGust();clearHats();
  }
  function splashGone(){const e=document.getElementById('gb-splash');return !e||!e.isConnected}
  function sync(){
    if(!isDecember()||document.hidden||!splashGone()||!seasonHeaderIsDisplayed()) {if(active)stop();return;}
    const tiles=findTiles();
    if(tiles.length<28){if(active)stop();return;}
    if(!active)start();
    if(!gust)placeHats(tiles);
  }
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('focus',sync);
  window.addEventListener('pageshow',sync);
  setInterval(sync,2000); // wykrywa też północ 1 grudnia/1 stycznia oraz przełączenie miesiąca
  setTimeout(sync,150);
  window.GBDecember={
    status:()=>({active,month:isDecember(),header:seasonHeaderIsDisplayed(),splashGone:splashGone(),tiles:findTiles().length,hats:hats.length,playedBells:startedBells,windScheduled:!!windTimer,test:TEST}),
    testGust:()=>{if(TEST)beginGust()}
  };
})();
