(function () {
  "use strict";

  if (!window.GBBarometr ||
      typeof window.GBBarometr.available !== "function") {
    return;
  }

  try {
    if (!window.GBBarometr.available()) return;
  } catch (e) {
    return;
  }

  var readout = null;

  function findSubtitle() {
    if (!document.body) return null;

    var walker = document.createTreeWalker(
      document.body, NodeFilter.SHOW_TEXT, null
    );

    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() ===
          "Kalendarz rozliczeń") {
        return node.parentElement;
      }
    }
    return null;
  }

  function placeReadout() {
    if (readout && readout.isConnected) return readout;

    var label = findSubtitle();
    if (!label || !label.parentElement) return null;

    readout = document.createElement("div");
    readout.id = "gb-barometr-odczyt";
    readout.setAttribute(
      "aria-label","Ciśnienie atmosferyczne"
    );
    readout.style.cssText =
      "display:none;color:#eef7ff;" +
      "font-size:14px;line-height:1.2;" +
      "font-weight:500;margin-top:3px;" +
      "white-space:nowrap;";

    label.insertAdjacentElement("afterend",readout);
    return readout;
  }

  function refresh() {
    if (document.hidden) return;

    var text = "";
    try {
      text = String(window.GBBarometr.pressure() || "");
    } catch (e) {
      return;
    }

    var value = Number(text);
    var element = placeReadout();

    if (!element) return;

    if (!text || !Number.isFinite(value) ||
        value < 300 || value > 1200) {
      element.style.display = "none";
      return;
    }

    element.textContent =
      "\u25f4  " + value.toFixed(1).replace(".",",") +
      " hPa";

    element.style.display = "block";
  }

  function start() {
    refresh();
    window.setInterval(refresh,4000);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",start,{once:true}
    );
  } else {
    start();
  }
})();
