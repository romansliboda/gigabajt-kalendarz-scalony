/* Test dzwoneczki -> 10s ciszy -> jeden podmuch; tylko strona sekwencji. */
(()=>{'use strict';
  const AC=window.AudioContext||window.webkitAudioContext;
  const ui=document.createElement('div');
  ui.style.cssText='position:fixed;z-index:30000;bottom:10px;left:5%;width:90%;max-width:520px;padding:12px;border-radius:14px;background:#12324af0;color:white;font:14px system-ui;box-shadow:0 5px 16px #0008;';
  const label=document.createElement('div');
  label.textContent='Test: ustaw GRUDZIEŃ 2026, potem uruchom grafikę powitalną i dźwięki.';
  const button=document.createElement('button');
  button.textContent='▶ START TESTU: powitanie → dzwonki → wiatr';
  button.style.cssText='display:block;width:100%;margin-top:8px;padding:12px;background:#96d9ff;color:#12324a;border:0;border-radius:9px;font-size:14px;font-weight:800;';
  ui.append(label,button);document.body.appendChild(ui);
  let started=false;
  const note=t=>label.textContent=t;
  button.addEventListener('click',async()=>{
    if(started)return;
    if(!AC){note('Przegladarka nie obsluguje Web Audio');return;}
    started=true;button.disabled=true;
    note('Laduje dzwoneczki i podmuch...');
    try{
      const context=new AC();
      await context.resume();
      const load=async(path)=>{
        const response=await fetch(path,{cache:'no-store'});
        if(!response.ok)throw Error('Brak '+path);
        return context.decodeAudioData(await response.arrayBuffer());
      };
      const [bells,wind]=await Promise.all([load('gb-grudzien-dzwoneczki.mp3'),load('gb-grudzien-wiatr.mp3')]);
      const play=buffer=>{const sound=context.createBufferSource();sound.buffer=buffer;sound.connect(context.destination);sound.start();return sound;};
      note('Grafika powitalna — czekamy na kalendarz...');
      button.remove();
      const splashScript=document.createElement('script');
      splashScript.src='gb-start.js';
      splashScript.onload=()=>{window.gbDecemberPreviewReady=true;};
      splashScript.onerror=()=>note('Nie znaleziono grafiki startowej.');
      document.body.appendChild(splashScript);
      let attempts=0;
      const poll=setInterval(()=>{
        attempts++;
        if(attempts>240){clearInterval(poll);note('Ustaw GRUDZIEN 2026 w kalendarzu, potem odswiez test.');return;}
        if(document.hidden||!window.GBDecember?.status?.().active)return;
        clearInterval(poll);
        note('🔔 Dzwoneczki 4–2–4 MAGIA — 10 sekund');
        play(bells);
        setTimeout(()=>note('🔔 Dzwoneczki zakonczone — 10 sekund przerwy...'),bells.duration*1000);
        setTimeout(()=>{
          if(document.hidden||!window.GBDecember?.status?.().active){note('Podmuch pominiety: kalendarz nieaktywny');return;}
          note('🌬️ PODMUCH! Jeden raz w tej probie.');
          play(wind);
          window.GBDecember.testGust?.();
          setTimeout(()=>{ui.remove();},12000);
        },bells.duration*1000+10000);
      },100);
    }catch(e){note('BLAD: '+e.message);button.disabled=false;started=false;}
  });
})();