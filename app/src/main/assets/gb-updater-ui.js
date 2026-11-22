(()=>{
'use strict';
const endpoint='https://api.github.com/repos/romansliboda/gigabajt-kalendarz-scalony/releases/latest';
const css=`
.gb-version .gb-up-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;flex-wrap:wrap}
.gb-version .gb-up-box{display:flex;flex-direction:column;align-items:flex-end;gap:5px;margin-left:auto}
.gb-version .gb-up-note{font-size:11px;color:#26814c;min-height:14px;text-align:right}
.gb-version .gb-up-btn{background:#216398;border:1px solid #194b79;border-radius:9px;box-shadow:0 4px 0 #143f60;color:white;font-weight:600;font-size:12px;min-width:128px;height:39px;position:relative;overflow:hidden;touch-action:manipulation;transition:transform .08s,box-shadow .08s;cursor:pointer}
.gb-version .gb-up-btn:active,#gbClose:active{transform:translateY(3px)!important;box-shadow:0 1px 0 #143f60!important}
.gb-version .gb-up-btn.gb-downloading{background:transparent;color:#163b60;box-shadow:none}
.gb-version .gb-up-progress{position:absolute;left:0;bottom:0;height:5px;width:0;background:#22aa58;transition:width .15s}
#gbClose.gb-up-close{background:#216398!important;box-shadow:0 4px 0 #143f60!important;transition:transform .08s,box-shadow .08s}
.gb-up-restart{font-size:11px;text-align:center;color:#64748b;padding-top:10px}
`;
if(!document.getElementById('gb-updater-style')){
 const style=document.createElement('style');style.id='gb-updater-style';style.textContent=css;document.head.appendChild(style);
}
function parse(v){const m=String(v).match(/v?(\d+)\.(\d+)\.(\d+)/);return m?m.slice(1).map(Number):null}
function newer(a,b){const x=parse(a),y=parse(b);if(!x||!y)return false;for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]}return /-(test|rc|beta)/i.test(b)&&!(/-(test|rc|beta)/i.test(a))}
function decorate(){
 const card=document.querySelector('.gb-version');if(!card||card.querySelector('.gb-up-btn'))return;
 const versionEl=card.querySelector('strong');if(!versionEl)return;
 const version=versionEl.textContent.trim();
 const row=document.createElement('div');row.className='gb-up-row';versionEl.replaceWith(row);row.appendChild(versionEl);
 const controls=document.createElement('div');controls.className='gb-up-box';
 const note=document.createElement('div');note.className='gb-up-note';
 const btn=document.createElement('button');btn.className='gb-up-btn';btn.type='button';btn.textContent='↧ Aktualizuj';
 const bar=document.createElement('span');bar.className='gb-up-progress';btn.appendChild(bar);
 controls.append(note,btn);row.appendChild(controls);
 const close=document.getElementById('gbClose');if(close){close.textContent='Zamknij';close.classList.add('gb-up-close')}
 let release=null,busy=false;
 function info(t){note.textContent=t}
 async function check(pressed){
  if(busy)return;busy=true;if(pressed)btn.firstChild.textContent='Sprawdzam…';
  try{
   const r=await fetch(endpoint,{headers:{'Accept':'application/vnd.github+json'},cache:'no-store'});
   if(r.status===404){release=null;info(pressed?'Brak opublikowanej aktualizacji':'');return}
   if(!r.ok)throw new Error('HTTP '+r.status);
   const data=await r.json();const asset=(data.assets||[]).find(a=>/\.apk$/i.test(a.name||''));
   if(newer(data.tag_name,version)&&asset&&asset.browser_download_url){
    release={version:data.tag_name,url:asset.browser_download_url};info('Aktualizacja dostępna');
   }else{release=null;info(pressed?'Aplikacja jest aktualna':'')}
  }catch(e){info(pressed?'Nie udało się sprawdzić aktualizacji':'')}
  finally{busy=false;btn.firstChild.textContent='↧ Aktualizuj'}
 }
 btn.addEventListener('click',()=>{
  if(busy)return;
  if(!release){check(true);return}
  if(window.GBUpdater&&typeof window.GBUpdater.start==='function'){
   window.GBUpdater.start(release.url,release.version);
  }else info('Instalator Androida jeszcze niepodłączony');
 });
 check(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate);
else decorate();
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});
})();
