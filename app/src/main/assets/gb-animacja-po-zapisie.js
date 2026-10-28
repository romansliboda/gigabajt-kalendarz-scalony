/* GB-ANIMACJA-RYSUNEK-V2 — zmiana pojazdu i efektow, bez zmian w kalendarzu */
(()=>{
 'use strict';
 if(window.gbAnimacjaPoZapisie)return;
 const IMAGE='gb-ciezarowka-rysunek.webp';
 let clicked=null,origin=null,running=false;
 document.addEventListener('click',e=>{clicked=e.target},true);
 window.gbZapamietajKafelek=d=>{
  origin=null;
  for(let el=clicked,i=0;el&&i<9;el=el.parentElement,i++){
   const r=el.getBoundingClientRect();
   if(r.width>=28&&r.width<=150&&r.height>=38&&r.height<=150){
    origin={day:String(d),rect:{x:r.left+r.width*.60-54.5,y:r.top+r.height*.75-19,left:r.left,top:r.top,w:r.width,h:r.height}};
    break;
   }
  }
 };
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const wheelSpecs=[[10.4,70.27,6.6],[17.8,69.97,6.6],[25.3,69.67,6.6],[59,69.07,6.8],[83.8,69.07,6.8]];
 const smokeShape=['M3 13Q0 9 5 7Q5 2 11 4Q15 0 20 5Q26 3 28 9Q34 9 33 15Q30 19 24 18Q19 22 13 18Q6 21 3 13Z',
                    'M4 15Q1 12 5 9Q7 5 12 6Q14 1 20 4Q24 4 25 9Q33 9 32 15Q28 19 23 18Q15 21 10 18Q5 20 4 15Z'];
 const easeOut=u=>1-Math.pow(1-u,2.5);
 window.gbAnimacjaPoZapisie=async(d,kind)=>{
  if(running||!origin||origin.day!==String(d)||!['start','end'].includes(kind))return;
  running=true;
  const {x,y,left,top,w,h}=origin.rect;
  let icon=null,old='';
  const point=document.elementFromPoint(Math.min(innerWidth-2,Math.max(2,left+w*.55)),Math.min(innerHeight-2,Math.max(2,top+h*.78)));
  for(let el=point,i=0;el&&i<8;el=el.parentElement,i++){
   const r=el.getBoundingClientRect();
   if(r.width>=28&&r.width<=150&&r.height>=38&&r.height<=150){
    const q=el.querySelector('.truck,.truck-icon,[class*="truck"]');
    if(q&&q.getBoundingClientRect().width<=50){icon=q;old=q.style.visibility;q.style.visibility='hidden'}
    break;
   }
  }
  const layer=document.createElement('div');
  Object.assign(layer.style,{position:'fixed',inset:'0',overflow:'hidden',zIndex:'2147483000',pointerEvents:'none'});
  const car=document.createElement('div');
  Object.assign(car.style,{position:'absolute',left:0,top:0,width:'109px',height:'37px',opacity:'0',transformOrigin:'50% 65%',willChange:'transform,opacity',mixBlendMode:'normal',filter:'drop-shadow(0 2px 1px #14266044)'});
  const img=document.createElement('img');
  img.src=IMAGE;img.alt='';
  Object.assign(img.style,{width:'100%',height:'auto',display:'block',position:'relative'});
  car.appendChild(img);
  const wheels=[];
  for(const [leftPct,topPct,wPct] of wheelSpecs){
   const wheel=document.createElement('div');
   const hPct=wPct*1000/333;
   const posX=leftPct/(100-wPct)*100;
   const posY=topPct/(100-hPct)*100;
   Object.assign(wheel.style,{position:'absolute',left:leftPct+'%',top:topPct+'%',width:wPct+'%',aspectRatio:'1',borderRadius:'50%',backgroundImage:`url("${IMAGE}")`,backgroundRepeat:'no-repeat',backgroundSize:(10000/wPct)+'% auto',backgroundPosition:posX+'% '+posY+'%',willChange:'transform'});
   car.appendChild(wheel);wheels.push(wheel);
  }
  layer.appendChild(car);document.body.appendChild(layer);
  let particles=new Set(),lastSmoke=0,lastDust=0;
  function particle(xp,yp,isDust){
   const p=document.createElement('div');
   if(isDust){
    const sz=5+Math.random()*7;
    Object.assign(p.style,{width:sz+'px',height:sz*.75+'px',borderRadius:'50%',background:'radial-gradient(ellipse,#fbf6eb 10%,#dbc5a2 57%,#bbb1a488 79%,transparent)',border:'1px solid #c9ba9a55'});
   }else{
    p.innerHTML=`<svg viewBox="0 0 36 23" width="100%" height="100%"><path d="${smokeShape[Math.random()>.5?1:0]}" fill="#fbfcff" stroke="#29377e" stroke-width="2" stroke-linejoin="round"/></svg>`;
    Object.assign(p.style,{width:(12+Math.random()*8)+'px',height:'17px'});
   }
   Object.assign(p.style,{position:'absolute',left:xp+'px',top:yp+'px',opacity:'0',zIndex:isDust?'3':'1',pointerEvents:'none'});
   layer.appendChild(p);particles.add(p);
   const anim=p.animate([
    {offset:0,opacity:0,transform:'translate(0,0) scale(.55)'},
    {offset:.23,opacity:isDust?.65:.85,transform:'translate(-4px,-3px) scale(1)'},
    {offset:1,opacity:0,transform:`translate(${-18-Math.random()*15}px,${-11-Math.random()*10}px) scale(1.6)`}
   ],{duration:isDust?950+Math.random()*350:1350+Math.random()*450,fill:'forwards',easing:'ease-out'});
   anim.finished.catch(()=>{}).then(()=>{p.remove();particles.delete(p)});
  }
  function emitSmoke(px,now,scale){
   if(now-lastSmoke<240||scale<.65||px<0||px>innerWidth-8)return;
   lastSmoke=now;particle(px-5,y+27,false);
  }
  function emitDust(px,now,scale){
   if(now-lastDust<190||scale<.8)return;
   lastDust=now;
   for(const xp of [px+14,px+29,px+69,px+94]){
    if(xp>5&&xp<innerWidth-5)particle(xp+(Math.random()-.5)*7,y+31,true);
   }
  }
  function rotateWheels(elapsed,braking){
   const spin=(elapsed/(braking?1300:650))*360;
   for(const wheel of wheels)wheel.style.transform=`rotate(${spin}deg)`;
  }
  const ride=(from,to,braking)=>new Promise(resolve=>{
   const started=performance.now(),duration=7000;
   const tick=now=>{
    const t=Math.min(1,(now-started)/duration);
    // Przy powrocie hamowanie zaczyna sie przed kafelkiem.
    const progress=braking&&t>.68 ? .7+.3*easeOut((t-.68)/.32) : braking?t/.68*.7:t;
    const px=from+(to-from)*progress;
    const scale=t<.12?.18+.82*t/.12:t>.95?Math.max(.1,1-.9*(t-.95)/.05):1;
    car.style.transform=`translate3d(${px}px,${y}px,0) scale(${scale})`;
    car.style.opacity=String(Math.max(0,Math.min(1,t*14,(1-t)*20)));
    rotateWheels(now-started,braking&&t>.68);
    if(t>.05&&t<.94)emitSmoke(px,now,scale);
    if(braking&&t>.70&&t<.94)emitDust(px,now,scale);
    if(t<1)requestAnimationFrame(tick);else resolve();
   };
   requestAnimationFrame(tick);
  });
  try{

   if(kind==='start'){
    const cut='polygon(0 0,77.126% 0,77.126% 67.361%,58.161% 67.361%,58.161% 100%,0 100%)';
    img.style.clipPath=cut;
    const cab=document.createElement('div');
    Object.assign(cab.style,{position:'absolute',inset:'0',willChange:'transform'});
    const cabImg=img.cloneNode();
    cabImg.style.clipPath='polygon(77.126% 0,100% 0,100% 100%,58.161% 100%,58.161% 67.361%,77.126% 67.361%)';
    cab.appendChild(cabImg);car.appendChild(cab);
    const loc=[[11.3207,71.6166,5.9311],[19.1368,71.6166,5.9311],[26.3782,71.6166,5.9311],[59.8091,72.0236,6.1287],[83.7172,72.3708,6.1287]];
    const rim='<svg viewBox="0 0 64 64" style="display:block;width:100%;height:100%"><circle cx="32" cy="32" r="30" fill="#142278" stroke="#202e91" stroke-width="2"/><circle cx="32" cy="32" r="24" fill="#242f8d" stroke="#b9c5f3" stroke-width="2"/><g class="gb-rim" style="transform-box:view-box;transform-origin:32px 32px"><circle cx="32" cy="32" r="19" fill="#f1f3ff" stroke="#243080" stroke-width="2"/><path d="M32 16V23M32 41V48M16 32H23M41 32H48M21 21L26 26M38 38L43 43M43 21L38 26M26 38L21 43" stroke="#20328b" stroke-width="3.5" stroke-linecap="round"/><circle cx="32" cy="32" r="10" fill="#c0c8f3" stroke="#253382" stroke-width="2"/></g><circle cx="32" cy="32" r="4.4" fill="#1c277d" stroke="#f1f3ff" stroke-width="1"/></svg>';
    wheels.forEach((w,i)=>{const [left,top,width]=loc[i];Object.assign(w.style,{left:left+'%',top:top+'%',width:width+'%',background:'none',transform:'none'});w.innerHTML=rim;if(i>2)cab.appendChild(w)});
    const startX=Math.max(3,Math.min(x,innerWidth-109-43));
    const gap=Math.min(39,Math.max(23,innerWidth-startX-109-7));
    const at=(px,sc=1)=>`translate3d(${px}px,${y}px,0) scale(${sc})`;
    const move=(el,frames,duration)=>el.animate(frames,{duration,fill:'forwards',easing:'ease-in-out'}).finished;
    const spin=(w,reverse=false)=>w.querySelector('.gb-rim').animate([{transform:'rotate(0deg)'},{transform:`rotate(${reverse?-360:360}deg)`}],{duration:1300,iterations:Infinity});
    cab.style.transform=`translateX(${gap}px)`;
    await move(car,[{opacity:0,transform:at(startX,.2)},{opacity:1,transform:at(startX)}],800);
    await delay(700);
    const backing=wheels.slice(3).map(w=>spin(w,true));
    await move(cab,[{transform:`translateX(${gap}px)`},{offset:.85,transform:'translateX(4px)'},{transform:'translateX(0px)'}],3800);
    backing.forEach(a=>a.cancel());cab.style.transform='translateX(0px)';
    const flash=document.createElement('div');
    Object.assign(flash.style,{position:'absolute',left:'73.5%',top:'19%',width:'10px',height:'10px',border:'2px solid #f8c85d',borderRadius:'50%'});
    car.appendChild(flash);
    await move(flash,[{opacity:0,transform:'scale(.2)'},{offset:.4,opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.8)'}],650);
    flash.remove();await delay(400);
    wheels.map(w=>spin(w));
    const puff=(px,py)=>{
      const p=document.createElement('div');
      const sz=8+Math.random()*7;
      Object.assign(p.style,{position:'absolute',pointerEvents:'none',borderRadius:'44% 53% 53% 47%',zIndex:'18',border:'2px solid #7186a4',background:'#f5f8fa',opacity:'0',left:px+'px',top:py+'px',width:sz+'px',height:(sz*.75)+'px'});
      layer.appendChild(p);
      p.animate([
        {opacity:0,transform:'translate(0,0) scale(.6)'},
        {offset:.2,opacity:.8,transform:'translate(-4px,-2px) scale(1)'},
        {opacity:0,transform:'translate(-18px,-12px) scale(1.5)'}
      ],{duration:1200,easing:'ease-out'}).finished.catch(()=>{}).then(()=>p.remove());
    };
    let smokeTimer=setInterval(()=>{
      const r=car.getBoundingClientRect();
      if(r.left>-109 && r.left<innerWidth+20)puff(r.left+2,r.top+r.height*.78);
    },650);
    try{
      await move(car,[{transform:at(startX)},{offset:.08,transform:at(startX+7)},{transform:at(innerWidth+109)}],7000);
    } finally {
      clearInterval(smokeTimer);
    }
   }else{
    await ride(x,innerWidth+120,false);
    await delay(260);
    await ride(-120,x,kind==='end');
   }

  }finally{
   car.remove();
   if(icon&&icon.isConnected)icon.style.visibility=old;
   await delay(1400);
   for(const p of particles){p.getAnimations().forEach(a=>a.cancel());p.remove()}
   particles.clear();layer.remove();running=false;
  }
 };
})();
