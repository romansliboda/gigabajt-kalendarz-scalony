/* GB v2.6 — ruchomy pasek 0–100% przez 5,5 s; bez zmian kalendarza */
(()=>{
 const splash=document.createElement('div');splash.id='gb-splash';splash.setAttribute('role','dialog');splash.setAttribute('aria-label','Ekran powitalny GB Kalendarz rozliczeń');
 const picture=document.createElement('img');picture.src='gb-ekran-startowy.png?v=2.6.0';picture.alt='GB Kalendarz rozliczeń — ekran powitalny';
 const footer=document.createElement('div');footer.id='gb-splash-progress';
 const track=document.createElement('div');track.className='gb-progress-track';
 const fill=document.createElement('div');fill.className='gb-progress-fill';track.appendChild(fill);
 const label=document.createElement('div');label.className='gb-progress-label';label.textContent='Ładowanie aplikacji... 0%';
 footer.append(track,label);
 const skip=document.createElement('button');skip.id='gb-splash-skip';skip.type='button';skip.textContent='Pomiń ›';
 splash.append(picture,footer,skip);document.body.appendChild(splash);
 let done=false,frame=0,fadeTimer=0;const duration=5500;const started=performance.now();
 function close(){if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(fadeTimer);splash.classList.add('gb-splash-out');fadeTimer=setTimeout(()=>splash.remove(),420)}
 function animate(now){if(done)return;const percent=Math.min(100,Math.floor((now-started)/duration*100));fill.style.width=percent+'%';label.textContent='Ładowanie aplikacji... '+percent+'%';if(percent>=100){fadeTimer=setTimeout(close,260)}else{frame=requestAnimationFrame(animate)}}
 skip.addEventListener('click',close);picture.addEventListener('error',close);frame=requestAnimationFrame(animate);
})();
