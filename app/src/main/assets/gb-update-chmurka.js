
(() => {
  "use strict";
  if (window.gbChmurkaWersji) return;

  const api = "https://api.github.com/repos/romansliboda/gigabajt-kalendarz-scalony/releases/latest";
  let box = null, title = null, list = null, button = null, timer = null, seq = 0;

  const css = document.createElement("style");
  css.textContent = `
  .gb-chmurka-akt {
    position:fixed; z-index:2147483000;
    width:min(360px,calc(100vw - 24px));
    box-sizing:border-box; padding:12px 13px;
    background:white; color:#213d59;
    border:1px solid #b8cfe3; border-radius:13px;
    box-shadow:0 5px 15px #173e6923;
    font-family:system-ui,sans-serif;
  }
  .gb-chmurka-akt:after {
    content:""; position:absolute; right:32px; bottom:-9px;
    width:16px; height:16px; background:white;
    border-right:1px solid #b8cfe3;
    border-bottom:1px solid #b8cfe3;
    transform:rotate(45deg);
  }
  .gb-chmurka-tyt {
    font-size:15px; font-weight:750;
    color:#1b5684; margin-bottom:7px;
  }
  .gb-chmurka-lista {
    max-height:107px; overflow-y:auto;
    font-size:12px; line-height:1.6;
  }
  .gb-chmurka-lista p {margin:0 0 5px}
  `;
  document.head.appendChild(css);

  function position() {
    if (!box || !button) return;
    const r = button.getBoundingClientRect();
    const w = box.offsetWidth, h = box.offsetHeight;
    box.style.left = Math.max(12,Math.min(innerWidth-w-12,r.right-w))+"px";
    box.style.top = Math.max(8,r.top-h-15)+"px";
  }

  function showLines(arr) {
    if (!list) return;
    list.replaceChildren();
    arr.forEach(s => {
      const p = document.createElement("p");
      p.textContent = "✓ " + s;
      list.appendChild(p);
    });
    position();
  }

  function isUpdate(el) {
    return (el?.textContent || "")
      .replace(/[^a-z]/gi,"").toLowerCase() === "aktualizuj";
  }

  function findButton() {
    return [...document.querySelectorAll("button,a,[role=button]")]
      .find(isUpdate) || null;
  }

  async function load(n) {
    try {
      const r = await fetch(api,{cache:"no-store"});
      if (!r.ok) throw Error("GitHub");
      const d = await r.json();
      if (n !== seq || !box) return;
      title.textContent = "☁ Co nowego w " + (d.tag_name || "aktualizacji") + "?";
      const changes = String(d.body || "").split(/\r?\n/)
        .map(x => x.trim())
        .filter(x => /^[-*]\s+\S/.test(x))
        .map(x => x.replace(/^[-*]\s+/,"").replace(/\*\*|__/g,""))
        .slice(0,12);
      showLines(changes.length ? changes : [(title && /v2\.5\.10\b/.test(title.textContent || "") ? "Naprawiono chmurkę: bez nowej aktualizacji znika po 4 sekundach. Zielony pasek pobierania działa bez zmian." : "Brak szczegółowego opisu zmian.") /* GB-NOTATKA-v2510 */]);
    } catch(e) {
      if (n === seq && box)
        showLines(["Opis zmian niedostępny. Aktualizacja działa normalnie."]);
    }
  }

  function show(el) {
    if (box) return;
    clearTimeout(timer);
    button = el || findButton();
    if (!button) return;

    box = document.createElement("div");
    box.className = "gb-chmurka-akt";
    box.setAttribute("role","status");

    title = document.createElement("div");
    title.className = "gb-chmurka-tyt";
    title.textContent = "☁ Co nowego w aktualizacji?";

    list = document.createElement("div");
    list.className = "gb-chmurka-lista";

    box.append(title,list);
    document.body.appendChild(box);
    showLines(["Pobieranie informacji o zmianach..."]);
    load(++seq);
    // GB-CHMURKA-AUTOCLOSE-4S
    clearTimeout(timer);
    if (!gbChmurkaPobiera) timer = setTimeout(close, 4000);
  }

  let gbChmurkaPobiera = false;
  function close() {
    clearTimeout(timer);
    seq++;
    if (box) box.remove();
    box = title = list = button = null;
  }

  document.addEventListener("click", e => {
    const el = e.target.closest?.("button,a,[role=button]");
    if (isUpdate(el)) show(el);
  },true);


  window.addEventListener('gb-updater-native', event => {
    const state = String(event.detail?.state || '').toLowerCase();
    if (state === 'downloading' || state === 'installing') {
      gbChmurkaPobiera = true;
      clearTimeout(timer);
    } else if (state === 'downloaded' || state === 'error') {
      gbChmurkaPobiera = false;
    }
  });
  window.addEventListener("gb-updater-native", e => {
    const state = String(e.detail?.state || "").toLowerCase();
    if (state === "downloading") show(findButton());
    if (state === "downloaded" || state === "error") {
      clearTimeout(timer);
      timer = setTimeout(close,5000);
    }
  });

  addEventListener("resize",position);
  addEventListener("scroll",position,true);
  window.gbChmurkaWersji = {pokaz:show,schowaj:close};
})();
