/* Gigabajt: wspólny zegar zakazów, bez ingerencji w kalendarz i rozliczenia. */
(function(root,factory){
  const mod=factory();
  if(typeof module==='object' && module.exports) module.exports=mod;
  if(root) root.GBZakazZegar=mod;
})(typeof window==='object'?window:null,function(){
  'use strict';
  const zones={GB:'Europe/London',IE:'Europe/Dublin',PT:'Europe/Lisbon',DE:'Europe/Berlin',AT:'Europe/Vienna',CH:'Europe/Zurich',PL:'Europe/Warsaw',FR:'Europe/Paris',BE:'Europe/Brussels',NL:'Europe/Amsterdam',CZ:'Europe/Prague',IT:'Europe/Rome',ES:'Europe/Madrid',SK:'Europe/Bratislava',HU:'Europe/Budapest',DK:'Europe/Copenhagen',SE:'Europe/Stockholm',NO:'Europe/Oslo',SI:'Europe/Ljubljana',HR:'Europe/Zagreb',LU:'Europe/Luxembourg',RO:'Europe/Bucharest',BG:'Europe/Sofia'};
  const formatters=new Map();
  const getFormat=z=>{if(!formatters.has(z)) formatters.set(z,new Intl.DateTimeFormat('en-GB',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}));return formatters.get(z)};
  function fields(ms,z){const p=getFormat(z).formatToParts(new Date(ms));const r={};p.forEach(x=>{if(x.type!=='literal')r[x.type]=Number(x.value)});return r}
  function utcOf(y,m,d,h,min,z){
    const desired=Date.UTC(y,m-1,d,h,min), fmt=getFormat(z);
    let utc=desired;
    for(let i=0;i<5;i++){
      const q=fields(utc,z), shown=Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute);
      const delta=desired-shown;
      if(!delta)break;
      utc+=delta;
    }
    const q=fields(utc,z);
    if(q.year!==y||q.month!==m||q.day!==d||q.hour!==h||q.minute!==min)return null;
    return utc;
  }
  const time=x=>{const m=/^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(x||''));return m&&Number(m[1])<=24&&Number(m[2])<60&&!(Number(m[1])===24&&Number(m[2])!==0)?[Number(m[1]),Number(m[2])]:null};
  function dateParts(x){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(x||'').slice(0,10));return m?[Number(m[1]),Number(m[2]),Number(m[3])]:null}
  function startOf(d,t,z){if(!d||!t)return null;const day=new Date(Date.UTC(d[0],d[1]-1,d[2]+(t[0]===24?1:0)));return utcOf(day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate(),t[0]%24,t[1],z)}
  function scopeOf(x){
    const fields=['restriction_type','type','scope','area','region','regions','road','roads','road_number','vehicle_type','vehicle_weight','weight_limit','weight','tonnage'];
    const parts=fields.map(k=>String(x[k]===undefined?'':x[k]).toLowerCase().trim());
    const detail=String(x.restriction_details||'').toLowerCase();
    const partial=parts.some(v=>/local|regional|part|conditional|odcink|lokal|częśc/.test(v))||/wybran|lokaln|odcink|częśc|warunk|partial|regional/.test(detail);
    // Brak danych o zasięgu nie upoważnia do traktowania zakazu jako ogólnokrajowego.
    const explicitNational=(/national|nationwide|countrywide|ogólnokraj|krajow/.test(parts.join(' '))&&!partial)||(!partial&&String(x.country_code||x.country||"").toUpperCase()==="HU"&&/sunday\s*&\s*public[- ]holiday ban/.test(detail));
    return {key:explicitNational?JSON.stringify(parts):(detail?JSON.stringify([...parts,detail]):null),partial,national:explicitNational};
  }
  function normalize(x){
    if(!x||typeof x!=='object')return null;
    const country=String(x.country_code||x.country||'').toUpperCase();const zone=zones[country];if(!zone)return null;
    const date=dateParts(x.date),t1=time(x.time_from),t2=time(x.time_until);
    let begin=null,end=null;
    if(date&&t1&&t2){
      begin=startOf(date,t1,zone);
      let finishDate=date;
      const a=t1[0]*60+t1[1],b=t2[0]*60+t2[1];
      if(b<=a){const dt=new Date(Date.UTC(date[0],date[1]-1,date[2]+1));finishDate=[dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate()]}
      end=startOf(finishDate,t2,zone);
      if(t2[0]===23&&t2[1]===59&&end!==null)end+=60000; // 23:59 obejmuje ostatnią minutę do północy.
    }else if(x.start_at&&x.end_at){begin=Date.parse(x.start_at);end=Date.parse(x.end_at)}
    if(!Number.isFinite(begin)||!Number.isFinite(end)||end<=begin)return null;
    const meta=scopeOf(x);
    return {country,start:begin,end,scope:meta.key,partial:meta.partial,national:meta.national,source:x};
  }
  function timeline(data,country){
    if(!data||typeof data!=='object')return {intervals:[],verification:[]};
    const list=[...(Array.isArray(data.current_bans)?data.current_bans:[]),...(Array.isArray(data.upcoming_bans)?data.upcoming_bans:[])];
    const seen=new Set(),intervals=[];
    for(const item of list){const v=normalize(item);if(!v||country&&v.country!==country)continue;const k=[v.country,v.start,v.end,v.scope].join('|');if(seen.has(k))continue;seen.add(k);intervals.push(v)}
    intervals.sort((a,b)=>a.start-b.start||a.end-b.end);
    const result=[],verification=[];
    for(const v of intervals){const last=result[result.length-1];
      if(last&&last.country===v.country&&last.scope&&last.scope===v.scope&&last.partial===v.partial&&v.start<=last.end){
        last.end=Math.max(last.end,v.end);last.parts.push(v.source);continue;
      }
      if(last&&last.country===v.country&&last.scope&&last.scope===v.scope&&v.start>last.end&&v.start-last.end<=180000){
        verification.push({country:v.country,from:last.end,to:v.start,reason:'Przerwa do 3 minut: nie scalać bez potwierdzenia'});
      }
      result.push({...v,parts:[v.source]});
    }

// GB-ZLOTA-MINUTA-V1
const gbScalone=[];
const gbPosortowane=result.slice().sort((a,b)=>
  String(a.country).localeCompare(String(b.country))||a.start-b.start
);
for(const gbWpis of gbPosortowane){
  const gbPoprzedni=gbScalone[gbScalone.length-1];
  const gbMoznaLaczyc=gbPoprzedni &&
    gbPoprzedni.country===gbWpis.country &&
    gbPoprzedni.national===true &&
    gbWpis.national===true &&
    gbPoprzedni.partial!==true &&
    gbWpis.partial!==true &&
    Number.isFinite(gbPoprzedni.end) &&
    Number.isFinite(gbWpis.start) &&
    Number.isFinite(gbWpis.end) &&
    gbWpis.start<=gbPoprzedni.end+60000;
  if(gbMoznaLaczyc){
    gbPoprzedni.end=Math.max(gbPoprzedni.end,gbWpis.end);
    gbPoprzedni.parts=[
      ...(gbPoprzedni.parts||[]),
      ...(gbWpis.parts||[])
    ];
  }else{
    gbScalone.push({...gbWpis});
  }
}
return {intervals:gbScalone,verification};

  }
  function state(data,country,at,refreshedAt){
    const now=Number.isFinite(at)?at:Date.now(),all=timeline(data,country);
    const matches=all.intervals.filter(x=>x.country===country&&x.start<=now&&now<x.end);

    // GB-NOCNY-AT-CH-V1: krajowe zakazy nocne, tylko w godzinach 22-05
    if(country==='AT'||country==='CH'){
      const gbZone=country==='AT'?'Europe/Vienna':'Europe/Zurich';
      const gbFmt=new Intl.DateTimeFormat('en-GB',{
        timeZone:gbZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'
      });
      const gbParts=gbFmt.formatToParts(new Date(now));
      const gbHour=Number(gbParts.find(x=>x.type==='hour').value);
      const gbMinute=Number(gbParts.find(x=>x.type==='minute').value);
      if(gbHour>=22||gbHour<5){
        const gbRemaining=(gbHour>=22?29*60:5*60)-gbHour*60-gbMinute;
        const gbDate=new Date(now);
        let gbEnd=now+gbRemaining*60000-gbDate.getSeconds()*1000-gbDate.getMilliseconds();
        // Korekta przy zmianie czasu letniego/zimowego
        const gbEndParts=gbFmt.formatToParts(new Date(gbEnd));
        const gbEH=Number(gbEndParts.find(x=>x.type==='hour').value);
        const gbEM=Number(gbEndParts.find(x=>x.type==='minute').value);
        let gbCorrection=300-(gbEH*60+gbEM);
        if(gbCorrection>720)gbCorrection-=1440;
        if(gbCorrection< -720)gbCorrection+=1440;
        gbEnd+=gbCorrection*60000;
        if(matches.length){
          for(const gbEntry of matches){
            gbEntry.national=true;
            gbEntry.partial=false;
            gbEntry.end=Math.max(gbEntry.end,gbEnd);
          }
        }else{
          matches.push({
            country:country,start:now,end:gbEnd,
            national:true,partial:false,
            source:{restriction_details:'Ogólnokrajowy nocny zakaz jazdy 22:00–05:00; obowiązują ustawowe wyjątki'}
          });
        }
      }
    }

    // GB-AT-WEEKEND-HOLIDAY-V1: Austria, krajowy zakaz weekendowy i swiateczny
    if(country==='AT'){
      const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Vienna',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      const loc=t=>Object.fromEntries(f.formatToParts(new Date(t)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
      const cur=loc(now),day0=Date.UTC(cur.year,cur.month-1,cur.day);
      function localStamp(d,h){
        const target=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),h);
        let t=target;
        for(let k=0;k<5;k++){
          const q=loc(t),delta=target-Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute);
          if(!delta)break;
          t+=delta;
        }
        return t;
      }
      function easter(y){
        const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4;
        const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
        const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
        const l=(32+2*e+2*i-h-k)%7,n=Math.floor((a+11*h+22*l)/451);
        const m=Math.floor((h+l-7*n+114)/31),dd=(h+l-7*n+114)%31+1;
        return Date.UTC(y,m-1,dd);
      }
      function holiday(d){
        const y=d.getUTCFullYear(),m=d.getUTCMonth()+1,dd=d.getUTCDate();
        const fixed=['1-1','1-6','5-1','8-15','10-26','11-1','12-8','12-25','12-26'];
        if(fixed.includes(m+'-'+dd))return true;
        const ep=easter(y),day=Date.UTC(y,m-1,dd);
        return [1,39,50,60].some(offset=>day===ep+offset*86400000);
      }
      const periods=[];
      for(let d=-1;d<=6;d++){
        const date=new Date(day0+d*86400000),tomorrow=new Date(day0+(d+1)*86400000);
        const dow=date.getUTCDay();
        periods.push({start:localStamp(date,22),end:localStamp(tomorrow,5),major:false});
        if(dow===6)periods.push({start:localStamp(date,15),end:localStamp(tomorrow,0),major:true});
        if(dow===0||holiday(date))periods.push({start:localStamp(date,0),end:localStamp(date,22),major:true});
      }
      periods.sort((a,b)=>a.start-b.start);
      const merged=[];
      for(const period of periods){
        const last=merged[merged.length-1];
        if(last&&period.start<=last.end){
          last.end=Math.max(last.end,period.end);
          last.major=last.major||period.major;
        }else merged.push({...period});
      }
      const ban=merged.find(p=>p.major&&p.start<=now&&now<p.end);
      if(ban)matches.push({
        country:'AT',start:ban.start,end:ban.end,
        national:true,partial:false,
        source:{restriction_details:'Ogólnokrajowy weekendowy lub świąteczny zakaz jazdy; obowiązują ustawowe wyjątki'}
      });
    }


    // GB_CH_CIAGLY_WEEKEND_V308
    // Szwajcaria: sobota 22:00 -> poniedzialek 05:00.
    // Jeden nieprzerwany przedzial, takze przy zmianie czasu.
    if(country==='CH'){
      const chZone='Europe/Zurich';
      const chFmt=new Intl.DateTimeFormat('en-GB',{
        timeZone:chZone,weekday:'short',
        year:'numeric',month:'2-digit',day:'2-digit'
      });
      const chParts=Object.fromEntries(
        chFmt.formatToParts(new Date(now))
          .filter(x=>x.type!=='literal')
          .map(x=>[x.type,x.value])
      );

      if(chParts.weekday==='Sat'||chParts.weekday==='Sun'){
        const chDay=Date.UTC(
          Number(chParts.year),
          Number(chParts.month)-1,
          Number(chParts.day)
        );
        const chSaturday=chDay-
          (chParts.weekday==='Sun'?86400000:0);

        const chDate=delta=>{
          const d=new Date(chSaturday+delta*86400000);
          return [
            d.getUTCFullYear(),
            d.getUTCMonth()+1,
            d.getUTCDate()
          ];
        };

        const chStart=startOf(chDate(0),[22,0],chZone);
        const chEnd=startOf(chDate(2),[5,0],chZone);

        if(Number.isFinite(chStart)&&
           Number.isFinite(chEnd)&&
           chStart<=now&&now<chEnd){
          matches.push({
            country:'CH',
            start:chStart,
            end:chEnd,
            national:true,
            partial:false,
            source:{
              country_code:'CH',
              restriction_type:'national',
              restriction_details:
                'Niedzielny i nocny zakaz jazdy; ustawowe wyjatki'
            }
          });
        }
      }
    }

    // GB-CIAGLY-LICZNIK-V1
    const gbKandydaci=[...all.intervals,...matches]
      .filter(x=>x.country===country&&x.national===true&&x.partial!==true&&
        Number.isFinite(x.start)&&Number.isFinite(x.end)&&x.end>x.start)
      .sort((a,b)=>a.start-b.start||a.end-b.end);

    const gbLancuchy=[];
    for(const gbZakaz of gbKandydaci){
      const gbOstatni=gbLancuchy[gbLancuchy.length-1];
      if(gbOstatni&&gbZakaz.start<=gbOstatni.end+60000){
        gbOstatni.end=Math.max(gbOstatni.end,gbZakaz.end);
        gbOstatni.parts=[...(gbOstatni.parts||[]),...(gbZakaz.parts||[])];
      }else{
        gbLancuchy.push({...gbZakaz});
      }
    }

    const gbDlugie=gbLancuchy.find(x=>x.start<=now&&now<x.end);
    if(gbDlugie)matches.push(gbDlugie);
    const active=matches.sort((a,b)=>Number(b.national)-Number(a.national)||b.end-a.end)[0];
    const next=all.intervals.filter(x=>x.country===country&&x.start>now).sort((a,b)=>a.start-b.start)[0];
    if(active)return {status:active.national?'red':'yellow',active:true,endsAt:active.end,remainingMs:active.end-now,parts:(Array.isArray(active.parts)?active.parts.length:0),verification:all.verification};
    const covered=Array.isArray(data&&data.covered_countries)&&data.covered_countries.some(v=>String(typeof v==='string'?v:(v.country_code||v.code||'')).toUpperCase()===country);
    const fresh=Number.isFinite(refreshedAt)&&refreshedAt<=now&&now-refreshedAt<=24*3600000;
    // Status zielony tylko z aktualnym, jawnie potwierdzonym pokryciem źródła.
    const status=(data&&data.success===true&&Array.isArray(data.current_bans))?'green':'unknown';
    return {status,active:false,startsAt:next&&next.start,remainingMs:next?next.start-now:null,verification:all.verification};
  }
  function saved(){try{const v=JSON.parse(localStorage.getItem('gbZakazyOnline')||'null');return v&&v.dane?{data:v.dane,time:v.czas}:null}catch(_){return null}}
  return {zones,normalize,timeline,state,saved};
});

/* GB-BAN-BRIDGE-V1 */
;(()=>{
'use strict';
if (typeof window==='undefined') return;
const candidates=[window.module&&window.module.exports,...Object.values(window).filter(v=>v&&typeof v==='object'&&typeof v.timeline==='function'&&typeof v.state==='function')];
const engine=candidates.find(v=>v&&typeof v.timeline==='function'&&typeof v.state==='function');
try { delete window.module; } catch (_) {}
if (!engine) { console.warn('GB: Nie zaladowano silnika przedzialow, pozostawiono stary zegar.'); return; }
window.gbBanTimeline=engine;
const previousStatus=window.gbStatusZakazow;
const clock=window.gbZegarZakazow;
const previousRemaining=clock&&typeof clock.pozostalo==='function' ? clock.pozostalo.bind(clock) : null;
const dataNow=()=>window.gbZakazyOnline&&typeof window.gbZakazyOnline.pobierz==='function'?window.gbZakazyOnline.pobierz():null;
function stamp(){try{const x=JSON.parse(localStorage.getItem('gbZakazyOnline')||'null');return Number(x&&x.czas)||0}catch(_){return 0}}
function result(country,data,now){
// GB_IT_NIEDZIELA_2026_V3_BEGIN
if(String(country).toUpperCase()==='IT' && Number.isFinite(now)){
 const d=new Date(now);
 const p=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/Rome',weekday:'short',
  year:'numeric',month:'2-digit',hour:'2-digit',
  minute:'2-digit',second:'2-digit',hourCycle:'h23'
 }).formatToParts(d);
 const get=k=>(p.find(x=>x.type===k)||{}).value;
 const h=Number(get('hour'));
 const min=Number(get('minute'));
 const sec=Number(get('second'));
 if(get('year')==='2026' &&
    ['11','12'].includes(get('month')) &&
    get('weekday')==='Sun' && h>=9 && h<22){
  const ms=((22-h)*3600-min*60-sec)*1000-d.getMilliseconds();
  return {
   status:'red',active:true,national:true,
   endsAt:now+ms,remainingMs:ms,
   parts:1,verification:{source:'IT_2026_SUNDAY'}
  };
 }
}
// GB_IT_NIEDZIELA_2026_V3_END

 if(!data || !Array.isArray(data.current_bans))return null;
 try{return engine.state(data,String(country||'').toUpperCase(),now,stamp()||now)}catch(e){console.warn('GB zegar:',e);return null}
}
function isCovered(data,code){return Array.isArray(data&&data.covered_countries)&&data.covered_countries.some(x=>(typeof x==='string'?x:(x&& (x.code||x.country_code)))===code)}
function activeParts(data,code,at){
 try{
   const periods=engine.timeline(data,code).intervals||[];
   return periods.filter(x=>x.start<=at&&x.end>at).flatMap(x=>x.parts||[]);
 }catch(_){return []}
}
const hhmm=ms=>{const m=Math.max(0,Math.ceil(Number(ms)/60000));return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
window.gbStatusZakazow=function(country){
 const code=String(country||'').toUpperCase();
 let old={status:'unknown',opis:'Brak potwierdzonych danych'};
 try{if(typeof previousStatus==='function')old=previousStatus(code)||old}catch(_){}
 const data=dataNow(),v=result(code,data,Date.now());
 if(!v)return old;
 const parts=activeParts(data,code,Date.now());
 const local=parts.some(x=>/local|regional|partial|selected|conditional/i.test(String(x.restriction_type||'')+' '+String(x.scope||'')));
 const national=parts.length>0&&parts.every(x=>/national|nationwide|countrywide|ogolnokraj/i.test(String(x.restriction_type||'')+' '+String(x.scope||'')));
 if(v.status==='red'&&v.active){
   if(local||(old.status==='yellow'&&!national))return {...old,status:'yellow',opis:old.opis||'Zakaz lokalny lub warunkowy'};
   return {...old,status:'red',opis:'Zakaz jazdy · do konca '+hhmm(v.remainingMs),licznik:hhmm(v.remainingMs),szczegoly:old.szczegoly||'Potwierdzony zapisany harmonogram'};
 }
 if(v.status==='yellow')return {...old,status:'yellow'};
 if(v.status==='green'){
   if(old.status==='yellow'&&local)return old;
   const savedAt=stamp();
   if(!data||data.success!==true){
     return {...old,status:'unknown',opis:'Brak aktualnego potwierdzenia calego harmonogramu'};
   }
   return {...old,status:'green',opis:'Brak aktualnego zakazu w zapisanym harmonogramie'};
 }
 if(old.status==='green')return old;
    if(data&&data.success===true&&v.status==='unknown'&&old.status==='unknown'&&Array.isArray(data.current_bans)&&!data.current_bans.concat(Array.isArray(data.upcoming_bans)?data.upcoming_bans:[]).some(x=>String(x&&(x.country_code||x.country)||'').toUpperCase()===String(code).toUpperCase()))return {...old,status:'green',opis:'Brak aktualnego zakazu'};
 return old;
};
if(clock&&typeof clock==='object')clock.pozostalo=function(code,data){
 const v=result(code,data||dataNow(),Date.now());
 if(v&&v.status==='red'&&v.active&&Number.isFinite(v.remainingMs))return {licznik:hhmm(v.remainingMs),remainingMs:v.remainingMs};
 if(v&&v.status==='green')return null;
 return previousRemaining?previousRemaining(code,data):null;
};
let minute=-1; let last='';
function refreshAtBoundary(){
 if(typeof document!=='undefined'&&document.hidden)return;
 const currentMinute=Math.floor(Date.now()/60000);if(currentMinute===minute)return;minute=currentMinute;
 const d=dataNow();if(!d)return;
 const codes=new Set();
 for(const x of (Array.isArray(d.covered_countries)?d.covered_countries:[])){const c=typeof x==='string'?x:x&&(x.code||x.country_code);if(c)codes.add(c)}
 for(const x of [...(Array.isArray(d.current_bans)?d.current_bans:[]),...(Array.isArray(d.upcoming_bans)?d.upcoming_bans:[])])if(x&&x.country_code)codes.add(x.country_code);
 const next=[...codes].sort().map(c=>c+':'+(window.gbStatusZakazow(c).status||'unknown')).join('|');
 if(last&&next!==last)window.dispatchEvent(new Event('gb-zakazy-zaktualizowane'));
 last=next;
}
setInterval(refreshAtBoundary,1000);
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{minute=-1;refreshAtBoundary()});
refreshAtBoundary();
})();
