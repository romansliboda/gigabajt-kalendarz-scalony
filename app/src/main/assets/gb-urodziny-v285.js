/* GB_BIRTHDAY_ROCKET_V285 — tylko animacja urodzin, bez zmian danych kalendarza. */
(() => {
  'use strict';
  if (window.__gbBirthdayRocketV285) return;
  window.__gbBirthdayRocketV285 = true;

  const audio = new Audio('gb-urodziny-v285.mp3');
  audio.preload = 'auto';
  audio.volume = 0.05;
  const R = 'gb-r285-';
  const palette = ['#d82235','#1c54ce','#049a46','#f1a000','#8730bc','#de3888','#138fa9','#f56b1c'];
  let layer = null, rocket = null, raf = 0, startAt = 0, frameOn = false, fired = false,
      greeted = false, smokeIndex = 0, cleanupTimer = null;
  const smokeAt = [.16,.205,.25,.295,.34,.385,.43,.475,.52,.565,.61,.655];

  const style = document.createElement('style');
  style.id = 'GB_BIRTHDAY_ROCKET_V285';
  style.textContent = `
  .${R}layer{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:2147483000;background:transparent}
  .${R}rocket{position:absolute;left:50%;top:calc(100% - 108px);width:41px;height:92px;transform:translateX(-50%);opacity:0;z-index:2;filter:drop-shadow(0 2px 4px #9b633055);will-change:top,transform}
  .${R}rocket svg{display:block;width:100%;height:100%}
  .${R}rocket .${R}lont{transform-box:view-box;transform-origin:29px 136px;animation:${R}fuse .16s ease-in-out infinite alternate}
  .${R}rocket .${R}jet{opacity:0;transform-box:view-box;transform-origin:41px 122px}
  .${R}rocket.${R}flying .${R}jet{opacity:1;animation:${R}jet .15s ease-in-out infinite alternate}
  .${R}smoke{position:absolute;z-index:1;left:var(--sx);top:var(--sy);width:var(--sz);height:var(--sz);border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,rgba(252,253,250,.94) 0%,rgba(218,224,225,.85) 32%,rgba(163,171,178,.42) 62%,rgba(134,144,153,0) 77%);filter:blur(1.8px);animation:${R}smoke var(--life) ease-out forwards}
  .${R}flash{position:absolute;left:50%;top:-108px;width:310px;height:310px;border-radius:50%;transform:translateX(-50%);background:radial-gradient(circle,#fff9ab 0%,#ffe861 14%,#f9b321 29%,#ff9a2b83 49%,transparent 73%);animation:${R}flash 1.3s ease-out forwards}
  .${R}ring{position:absolute;left:50%;top:0;width:15px;height:15px;border:4px solid #f1a716;border-radius:50%;animation:${R}ring .85s ease-out forwards}
  .${R}spark{position:absolute;left:var(--x);top:var(--y);width:5px;height:5px;background:var(--c);border-radius:50%;box-shadow:0 0 6px 2px var(--c);animation:${R}burst var(--dur) ease-out forwards}
  .${R}confetti{position:absolute;top:-18px;left:var(--x);width:var(--w);height:var(--h);background:var(--c);border-radius:2px;animation:${R}fall var(--dur) var(--delay) linear forwards}
  .${R}message{position:absolute;top:42%;left:3%;right:3%;text-align:center;animation:${R}message 3.1s ease-out forwards;font-family:system-ui,-apple-system,sans-serif}
  .${R}message strong{display:block;font-weight:900;font-size:clamp(21px,5.5vw,27px);line-height:1.3;color:#ac6500;text-shadow:0 0 10px #f8ca72}
  .${R}message span{display:block;margin-top:8px;color:#c42c49;font-weight:850;font-size:clamp(17px,4.3vw,21px)}
  @keyframes ${R}fuse{from{transform:scale(.90);opacity:.9}to{transform:scale(1.08);opacity:1}}
  @keyframes ${R}jet{from{transform:scale(1,.90);opacity:.96}to{transform:scale(1.025,1.07);opacity:1}}
  @keyframes ${R}smoke{0%{opacity:0;transform:translate(-50%,-50%) scale(.35)}16%{opacity:.82}55%{opacity:.52}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.6)}}
  @keyframes ${R}flash{0%{opacity:0;transform:translateX(-50%) scale(.05)}15%{opacity:1}45%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(1.5)}}
  @keyframes ${R}ring{0%{opacity:1;transform:translate(-50%,-50%) scale(.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(24)}}
  @keyframes ${R}burst{0%{opacity:1;transform:translate(-50%,-50%) scale(1.6)}75%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.1)}}
  @keyframes ${R}fall{0%{opacity:1;transform:translateY(-10px) rotate(0)}90%{opacity:1}100%{opacity:0;transform:translate(var(--sway),110vh) rotate(var(--spin))}}
  @keyframes ${R}message{0%{opacity:0;transform:scale(.65)}18%{opacity:1;transform:scale(1.07)}35%{transform:scale(1)}80%{opacity:1}100%{opacity:0}}
  `;
  document.head.appendChild(style);

  const svg = `<svg viewBox="0 0 81 183" xmlns="http://www.w3.org/2000/svg"><defs>
    <clipPath id="gb-r285-shell"><path d="M23 40H58V119Q40 130 23 119Z"/></clipPath>
    <linearGradient id="gb-r285-red"><stop stop-color="#a12027"/><stop offset=".45" stop-color="#f34c56"/><stop offset="1" stop-color="#9b1b25"/></linearGradient>
    <linearGradient id="gb-r285-white"><stop stop-color="#a4a4a4"/><stop offset=".43" stop-color="#fff"/><stop offset="1" stop-color="#a7a7a7"/></linearGradient>
  </defs><path d="M39 116V182H44V116Z" fill="#dbac5c" stroke="#8b5e2a"/>
  <g class="${R}jet">
    <path d="M33 120 C31 133 26 143 28 155 C30 166 37 177 41 182 C47 174 53 160 54 148 C55 136 49 124 49 120 Z" fill="#ff7e15" opacity=".85"/>
    <path d="M36 121 C35 133 30 144 34 157 C36 166 40 171 41 175 C45 166 49 157 49 145 C49 134 46 126 46 121 Z" fill="#ffcf3a"/>
    <path d="M39 122 C38 133 36 141 39 153 C40 157 41 160 42 163 C44 152 46 141 44 131 L43 122 Z" fill="#fff5c9"/>
    <path d="M35 123 C35 135 32 143 31 147 M47 123 C49 135 51 141 51 148" fill="none" stroke="#ffae25" stroke-width="1.8" opacity=".7"/>
  </g><path d="M23 40H58V119Q40 130 23 119Z" fill="url(#gb-r285-white)" stroke="#888"/>
  <g clip-path="url(#gb-r285-shell)"><path d="M10 49L72 16V32L10 65Z M10 82L72 49V65L10 98Z M10 115L72 82V98L10 131Z M10 148L72 115V131L10 164Z" fill="url(#gb-r285-red)"/></g>
  <path d="M20 41L40 4Q43 1 46 5L61 41Z" fill="url(#gb-r285-red)" stroke="#911924" stroke-width="1.5"/>
  <path d="M28 32L42 9" stroke="#ffc4bf" stroke-width="2" opacity=".6"/>
  <path d="M26 121Q22 132 29 136" stroke="#c49f36" stroke-width="2" fill="none"/>
  <g class="${R}lont"><path d="M29 136Q19 126 27 116Q24 127 33 130Q40 135 29 144Q31 138 29 136Z" fill="#ffdc27"/>
    <path d="M29 139Q23 131 28 127Q29 134 33 134Q35 139 29 142Z" fill="#ff7020"/></g></svg>`;

  const relations = [
    ['przyjaciółka','przyjaciółko'],['przyjaciel','przyjacielu'],
    ['siostra','siostro'],['brat','bracie'],['syn','synu'],['córka','córko'],
    ['żona','żono'],['mąż','mężu'],['mama','mamo'],['matka','mamo'],
    ['tata','tato'],['ojciec','tato'],['babcia','babciu'],['dziadek','dziadku'],
    ['ciocia','ciociu'],['cioci','ciociu'],['wujek','wujku'],['wuj','wujku']
  ];
  function greeting(raw) {
    const clean = String(raw || '').replace(/^\s*urodziny\s*[:\-]?\s*/i,'').trim();
    const parts = clean.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean);
    if (!parts.length) return ['Wszystkiego najlepszego!', 'Sto lat!'];
    if (parts.length > 1) {
      const names = parts.map(v => {
        for(const [relation] of relations) v = v.replace(new RegExp('^'+relation+'\\s+','i'),'');
        return v.trim();
      }).filter(Boolean);
      return ['Wszystkiego najlepszego!', names.length ? '100 lat, '+names.join(' i ')+'!' : 'Sto lat!'];
    }
    let name = parts[0], salutation = '';
    for(const [relation, vocative] of relations) {
      const re = new RegExp('^'+relation+'(?:\\s+|$)','i');
      if (re.test(name)) {
        name = name.replace(re,'').trim();
        salutation = vocative;
        break;
      }
    }
    const first = salutation ? 'Wszystkiego najlepszego, '+salutation+'!' : 'Wszystkiego najlepszego!';
    return [first, name ? '100 lat, '+name+'!' : 'Sto lat!'];
  }
  function digit(n) { return String(n).padStart(2,'0'); }
  function birthday(day) {
    if (typeof month === 'undefined') return '';
    try { return localStorage.getItem('gb-birthday-v1:'+digit(Number(month)+1)+'-'+digit(day)) || ''; }
    catch (_) { return ''; }
  }
  function element(className, parent) {
    const e = document.createElement('div'); e.className = R+className;
    parent.appendChild(e); return e;
  }
  function smoke() {
    if (!layer || !rocket) return;
    const top = Number.parseFloat(rocket.style.top) || window.innerHeight-108;
    for (let j=0; j<4; j++) {
      const e = element('smoke',layer), side=j-1.5, spread=(Math.random()-.5)*14;
      e.style.setProperty('--sx',(50+side*2.4+spread/3.6)+'%');
      e.style.setProperty('--sy',(top+71+Math.random()*8)+'px');
      e.style.setProperty('--sz',(18+Math.random()*14)+'px');
      e.style.setProperty('--dx',(side*28+(Math.random()-.5)*38)+'px');
      e.style.setProperty('--dy',(-15-Math.random()*30)+'px');
      e.style.setProperty('--life',(.72+Math.random()*.45)+'s');
      e.addEventListener('animationend',()=>e.remove(),{once:true});
    }
  }
  function burst(count, radius, x, y) {
    for(let i=0;i<count;i++) {
      const p=element('spark',layer),ang=i*Math.PI*2/count,dist=radius*(.5+Math.random()*.5);
      p.style.setProperty('--x',x+'%');p.style.setProperty('--y',y+'%');
      p.style.setProperty('--dx',Math.cos(ang)*dist+'px');p.style.setProperty('--dy',Math.sin(ang)*dist+'px');
      p.style.setProperty('--dur',(.75+Math.random()*.65)+'s');p.style.setProperty('--c',palette[i%palette.length]);
    }
  }
  function boom() {
    fired=true;
    element('flash',layer);element('ring',layer);burst(82,138,50,0);
    setTimeout(()=>{if(layer){burst(35,80,28,8);burst(35,80,72,8)}},180);
  }
  function party(words) {
    greeted=true;
    const msg=element('message',layer),a=document.createElement('strong'),b=document.createElement('span');
    a.textContent='🎉 '+words[0];b.textContent='🎂 '+words[1]+' 🎆';msg.append(a,b);
    for(let i=0;i<110;i++) {
      const c=element('confetti',layer);
      c.style.setProperty('--x',Math.random()*100+'%');
      c.style.setProperty('--w',(4+Math.random()*6)+'px');c.style.setProperty('--h',(6+Math.random()*8)+'px');
      c.style.setProperty('--c',palette[i%palette.length]);
      c.style.setProperty('--sway',(Math.random()*165-82)+'px');
      c.style.setProperty('--spin',(Math.random()*1600-800)+'deg');
      c.style.setProperty('--delay',Math.random()*.65+'s');
      c.style.setProperty('--dur',(2.5+Math.random()*1.2)+'s');
    }
  }
  function stop() {
    cancelAnimationFrame(raf);frameOn=false;
    clearTimeout(cleanupTimer);cleanupTimer=null;
    audio.pause();try{audio.currentTime=0}catch(_){/* nic */}
    if(layer)layer.remove(); layer=null;rocket=null;
  }
  function play(raw) {
    stop();
    const words=greeting(raw);
    layer=element('layer',document.body);rocket=element('rocket',layer);rocket.innerHTML=svg;
    audio.volume=.05;
    startAt=performance.now();fired=greeted=false;smokeIndex=0;frameOn=true;
    // Odtwarzanie bezpośrednio po dotknięciu dnia (wymóg Android WebView).
    const playPromise=audio.play();
    if(playPromise&&playPromise.catch)playPromise.catch(()=>{});
    function frame(now) {
      if(!frameOn||!layer) return;
      const t=(now-startAt)/1000;
      const h=window.innerHeight;
      if(t<.24) {
        rocket.style.opacity='1';rocket.style.top=(h-108)+'px';
        rocket.style.transform='translateX(-50%) rotate('+(Math.sin(t*35)*2)+'deg)';
      } else if(t<1.67) {
        const p=Math.min(1,(t-.24)/1.43),ease=p*p*(.65+.35*p);
        rocket.classList.add(R+'flying');rocket.style.opacity='1';
        rocket.style.top=((h-108)-(h+20)*ease)+'px';rocket.style.transform='translateX(-50%)';
      } else rocket.style.opacity='0';
      while(smokeIndex<smokeAt.length&&t>=smokeAt[smokeIndex]){smoke();smokeIndex++}
      if(t>=2.57&&!fired) boom();
      if(t>=2.8&&!greeted) party(words);
      if(t<6.5)raf=requestAnimationFrame(frame);
      else stop();
    }
    raf=requestAnimationFrame(frame);
    cleanupTimer=setTimeout(()=>{if(layer)stop()},7500);
  }


  // GB_BIRTHDAY_AUTO_V286
  // Dwa automatyczne pokazy w dniu urodzin.
  // Reczne odtwarzanie pozostaje bez ograniczen.
  function gbBirthdayAutoV286() {
    try {
      const now = new Date();
      const date = digit(now.getMonth()+1)+'-'+digit(now.getDate());
      const raw = localStorage.getItem('gb-birthday-v1:'+date);
      if (!raw || !raw.trim()) return;

      const key = 'gb-birthday-auto-v286:'+
                  now.getFullYear()+'-'+date;
      const count = Number(localStorage.getItem(key) || '0');
      if (count >= 2) return;

      localStorage.setItem(key,String(count+1));
      play(raw);
    } catch (_) {}
  }

  function gbBirthdayAutoStartV286() {
    setTimeout(gbBirthdayAutoV286,20000);
  }

  if (document.readyState === 'complete') {
    gbBirthdayAutoStartV286();
  } else {
    window.addEventListener(
      'load',gbBirthdayAutoStartV286,{once:true}
    );
  }

  document.addEventListener('click',e=>{
    const button=e.target&&e.target.closest&&e.target.closest('#calendar button[data-day]');
    if(!button)return;
    const raw=birthday(Number(button.dataset.day));
    if(raw.trim())play(raw);
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
})();
