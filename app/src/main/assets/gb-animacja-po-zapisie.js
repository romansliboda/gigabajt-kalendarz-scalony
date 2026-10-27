/* GB-ANIMACJA-SAVE-V1 */
(()=>{
 if(window.gbAnimacjaPoZapisie)return;
 let clicked=null,origin=null,running=false;
 document.addEventListener('click',e=>clicked=e.target,true);
 window.gbZapamietajKafelek=d=>{
  origin=null;
  for(let e=clicked,i=0;e&&i<9;e=e.parentElement,i++){
   const r=e.getBoundingClientRect();
   if(r.width>=28&&r.width<=150&&r.height>=38&&r.height<=150){
    origin={day:String(d),rect:{x:r.left+r.width*.60-28,y:r.top+r.height*.75-20,left:r.left,top:r.top,w:r.width,h:r.height}};break;
   }
  }
 };
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const truck=`<svg xmlns="http://www.w3.org/2000/svg" width="55" height="40" viewBox="0 0 120 78"><defs><linearGradient id="gbaBlue" x2="1" y2="1"><stop stop-color="#5acfff"/><stop offset=".6" stop-color="#168fe2"/><stop offset="1" stop-color="#0863ab"/></linearGradient></defs><path d="M7 13Q7 8 14 8H72Q77 8 77 15V54H7Z" fill="#f5fbff" stroke="#1386d1" stroke-width="6"/><path d="M77 23H92Q99 23 104 33L116 45V56H77Z" fill="url(#gbaBlue)" stroke="#075a9f" stroke-width="3"/><path d="M87 27H93Q98 27 101 35L106 42H86Z" fill="#e7f8ff"/><path d="M7 55H116L107 64H20Z" fill="#273c4d"/><circle cx="32" cy="61" r="12" fill="#273542"/><circle cx="95" cy="61" r="12" fill="#273542"/><circle cx="32" cy="61" r="6" fill="#c4d4df"/><circle cx="95" cy="61" r="6" fill="#c4d4df"/><ellipse cx="114" cy="44" rx="4" ry="7" fill="#ffe477"/></svg>`;
 window.gbAnimacjaPoZapisie=async(d,kind)=>{
  if(running||!origin||origin.day!==String(d)||!['start','end'].includes(kind))return;
  running=true;
  const {x,y,left,top,w,h}=origin.rect;
  let icon=null,old='';
  const point=document.elementFromPoint(Math.min(innerWidth-2,Math.max(2,left+w*.55)),Math.min(innerHeight-2,Math.max(2,top+h*.78)));
  for(let e=point,i=0;e&&i<8;e=e.parentElement,i++){
   const r=e.getBoundingClientRect();
   if(r.width>=28&&r.width<=150&&r.height>=38&&r.height<=150){
    const q=e.querySelector('.truck,.truck-icon,[class*="truck"]');
    if(q&&q.getBoundingClientRect().width<=50){icon=q;old=q.style.visibility;q.style.visibility='hidden';}
    break;
   }
  }
  const layer=document.createElement('div');
  Object.assign(layer.style,{position:'fixed',inset:0,overflow:'hidden',zIndex:2147483000,pointerEvents:'none'});
  const car=document.createElement('div');
  Object.assign(car.style,{position:'absolute',top:0,left:0,width:'55px',height:'40px',filter:'drop-shadow(0 3px 3px #1237)'});
  car.innerHTML=truck;layer.appendChild(car);document.body.appendChild(layer);
  let smoke=[],tracks=[],lastPuff=0,lastTrack=0,dark=false;
  const puff=(px,py,now)=>{
   for(let i=0;i<2;i++){
    const p=document.createElement('i'),sz=9+Math.random()*11;
    Object.assign(p.style,{position:'absolute',width:sz+'px',height:sz+'px',borderRadius:'50%',background:(dark=!dark)?'radial-gradient(circle,#666,#222 67%,transparent)':'radial-gradient(circle,#fff,#c4cdd3 67%,transparent)'});
    layer.appendChild(p);smoke.push({p,x:px-i*6,y:py+i*3,time:now,life:850+Math.random()*450});
   }
  };
  const paint=now=>{
   for(let i=smoke.length-1;i>=0;i--){const s=smoke[i],t=(now-s.time)/s.life;
    if(t>=1){s.p.remove();smoke.splice(i,1);}else{
     s.p.style.transform=`translate(${s.x-t*25}px,${s.y-t*12}px) scale(${.4+t*1.8})`;
     s.p.style.opacity=Math.min(t*12,1)*(1-t);
    }
   }
  };
  const skid=(px,py)=>{
   for(let k=0;k<2;k++){
    const m=document.createElement('i');
    Object.assign(m.style,{position:'absolute',left:(px-18)+'px',top:(py+30+6*k)+'px',width:'18px',height:'3px',borderRadius:'3px',background:k?'#676767':'#242424',opacity:'.8'});
    layer.appendChild(m);tracks.push(m);
   }
  };
  const ride=(from,to,duration,brake)=>new Promise(resolve=>{
   const t0=performance.now();
   const frame=now=>{
    const t=Math.min(1,(now-t0)/duration);
    const progress=brake&&t>.7?.7+.3*(1-Math.pow(1-(t-.7)/.3,2.4)):t;
    const px=from+(to-from)*progress;
    const scale=t<.10?.25+.75*t/.10:t>.94?1-.75*(t-.94)/.06:1;
    car.style.transform=`translate(${px}px,${y}px) scale(${scale})`;
    car.style.opacity=Math.max(0,Math.min(1,t*12,(1-t)*17));
    if(t>.04&&t<.95&&now-lastPuff>110){lastPuff=now;puff(px-8,y+23,now);}
    if(brake&&progress>.52&&px>0&&t<.96&&now-lastTrack>120){lastTrack=now;skid(px,y);}
    paint(now);
    if(t<1)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);
  });
  try{
   await ride(x,innerWidth+65,3050,false);
   await wait(170);
   await ride(-65,x,kind==='end'?3500:3050,kind==='end');
  }finally{
   car.remove();if(icon&&icon.isConnected)icon.style.visibility=old;
   for(const m of tracks){m.animate([{opacity:.8},{opacity:0}],{duration:900,fill:'forwards'}).finished.then(()=>m.remove()).catch(()=>m.remove());}
   await wait(1100);for(const s of smoke)s.p.remove();layer.remove();running=false;
  }
 };
})();
