
(function(){
  if(window.__gbXmasPreviewLoaded) return;
  window.__gbXmasPreviewLoaded = true;

  document.body.classList.add('gb-xmas-preview');

  const overlay = document.createElement('div');
  overlay.id = 'gb-xmas-overlay';
  overlay.innerHTML = `
    <div id="gb-xmas-top">
      <div id="gbx-wire">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 0 18 Q 120 95 250 55 T 500 58 T 750 54 T 1000 24"
                fill="none" stroke="#111" stroke-width="8" stroke-linecap="round"/>
          <path d="M 0 18 Q 120 95 250 55 T 500 58 T 750 54 T 1000 24"
                fill="none" stroke="rgba(255,255,255,.10)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
    <div class="gb-corner left"></div>
    <div class="gb-corner right"></div>
  `;
  document.body.appendChild(overlay);

  const bulbs = [
    {x:90,y:42,c:'gb-red',a:'0'},
    {x:200,y:55,c:'gb-yellow',a:'1'},
    {x:310,y:65,c:'gb-blue',a:'2'},
    {x:430,y:73,c:'gb-green',a:'3'},
    {x:515,y:77,c:'gb-red',a:'0'},
    {x:605,y:74,c:'gb-yellow',a:'1'},
    {x:700,y:67,c:'gb-blue',a:'2'},
    {x:790,y:56,c:'gb-green',a:'3'},
    {x:890,y:43,c:'gb-red',a:'0'},
    {x:980,y:30,c:'gb-yellow',a:'1'},
  ];

  const top = overlay.querySelector('#gb-xmas-top');
  bulbs.forEach(b=>{
    const d=document.createElement('div');
    d.className='gb-bulb '+b.c;
    d.dataset.a=b.a;
    d.style.left = `calc(${b.x/10}% - 8px)`;
    d.style.top = `${b.y}px`;
    top.appendChild(d);
  });

  function makeCorner(el){
    const branch1 = document.createElement('div');
    branch1.className='gb-branch';
    branch1.style.left='12px';
    branch1.style.bottom='55px';
    branch1.style.transform='rotate(12deg)';
    el.appendChild(branch1);

    const branch2 = document.createElement('div');
    branch2.className='gb-branch';
    branch2.style.left='42px';
    branch2.style.bottom='28px';
    branch2.style.transform='rotate(-8deg)';
    el.appendChild(branch2);

    const branch3 = document.createElement('div');
    branch3.className='gb-branch';
    branch3.style.left='90px';
    branch3.style.bottom='44px';
    branch3.style.width='100px';
    branch3.style.transform='rotate(6deg)';
    el.appendChild(branch3);

    const star = document.createElement('div');
    star.className='gb-star';
    el.appendChild(star);

    const bow = document.createElement('div');
    bow.className='gb-bow';
    bow.innerHTML='<i></i>';
    el.appendChild(bow);

    const ball = document.createElement('div');
    ball.className='gb-bauble';
    el.appendChild(ball);

    const berry1 = document.createElement('div');
    berry1.className='gb-berry';
    berry1.style.left='112px';
    berry1.style.bottom='42px';
    el.appendChild(berry1);

    [[18,92],[38,76],[86,100],[120,70],[140,92],[168,58]].forEach((p,i)=>{
      const s=document.createElement('div');
      s.className='gb-spark';
      s.style.left=p[0]+'px';
      s.style.bottom=p[1]+'px';
      s.style.animationDelay=(i*0.35)+'s';
      el.appendChild(s);
    });
  }

  makeCorner(overlay.querySelector('.gb-corner.left'));
  makeCorner(overlay.querySelector('.gb-corner.right'));
})();
