/* Gigabajt PDF UI: style and demonstration-approved key sound; no change to PDF handler. */
(() => {
  'use strict';
  const button = document.getElementById('pdf');
  if (!button || button.dataset.gbPdfV251 === '1') return;
  button.dataset.gbPdfV251 = '1';
  const style = document.createElement('style');
  style.textContent = `
    #pdf.gb-pdf-v251{display:flex!important;align-items:center;justify-content:center;gap:9px;
      width:94%!important;margin:10px auto 6px!important;height:46px!important;
      border-radius:9px!important;border:1px solid #1a6940!important;background:#258650!important;
      color:#fff!important;font-size:15px!important;font-weight:700!important;padding:0 12px!important;
      box-shadow:0 4px 0 #12542f,0 6px 7px #103e271c!important;
      touch-action:manipulation;user-select:none;-webkit-tap-highlight-color:transparent;
      transition:transform .07s,box-shadow .07s,background .07s}
    #pdf.gb-pdf-v251.gb-pdf-pressed,#pdf.gb-pdf-v251:active{
      transform:translateY(4px)!important;
      box-shadow:inset 0 2px 4px #0b422b70!important;background:#1d7645!important}
    @media print{#pdf.gb-pdf-v251{display:none!important}}
  `;
  document.head.appendChild(style);
  button.classList.add('gb-pdf-v251');
  const icon = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6"/></svg>';
  const translations = {pl:'Pobierz PDF',en:'Download PDF',cs:'Stáhnout PDF',de:'PDF herunterladen',pt:'Baixar PDF',fr:'Télécharger le PDF'};
  const word = document.createElement('span');
  button.replaceChildren();
  button.insertAdjacentHTML('afterbegin',icon);
  button.appendChild(word);
  function refresh(){
    let lang='pl';
    try { lang=JSON.parse(localStorage.getItem('gb-rozliczenia-wyglad-v2')||'{}').lang||'pl'; }catch(_e){}
    const text=translations[String(lang).toLowerCase()]||translations.pl;
    if(word.textContent!==text)word.textContent=text;
    button.setAttribute('aria-label',text);
  }
  refresh();
  const settings = document.getElementById('gbAppSettings');
  if (settings) new MutationObserver(refresh).observe(settings,{childList:true,subtree:true,attributes:true});
  document.addEventListener('change',()=>setTimeout(refresh,0),true);
  let audio=null,pressed=false;
  function tick(high){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!audio)audio=new AC();
      if(audio.state==='suspended')audio.resume();
      const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
      osc.type='triangle';
      osc.frequency.setValueAtTime(high?1350:950,t);
      osc.frequency.exponentialRampToValueAtTime(high?700:430,t+.025);
      gain.gain.setValueAtTime(.025,t);
      gain.gain.exponentialRampToValueAtTime(.0001,t+.034);
      osc.connect(gain);gain.connect(audio.destination);
      osc.start(t);osc.stop(t+.04);
    }catch(_e){}
  }
  function release(){if(!pressed)return;pressed=false;button.classList.remove('gb-pdf-pressed');tick(false)}
  button.addEventListener('pointerdown',()=>{if(pressed)return;pressed=true;button.classList.add('gb-pdf-pressed');tick(true);});
  ['pointerup','pointercancel','pointerleave'].forEach(name=>button.addEventListener(name,release));
  button.addEventListener('click',event=>{
    if(event.detail===0){tick(true);setTimeout(()=>tick(false),65)}
  });
})();
