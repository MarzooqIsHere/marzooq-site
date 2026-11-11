(function () {
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Light / dark
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next; save("theme", next);
  });

  // English / Welsh
  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) langBtn.addEventListener("click", function () {
    var next = root.dataset.lang === "cy" ? "en" : "cy";
    root.dataset.lang = next; root.lang = next; save("lang", next);
  });

  // Photography tabs
  var tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    });
  });

  // Lightbox
  var lb = document.getElementById("lightbox");
  if (lb && lb.showModal) {
    var img = lb.querySelector("img"), cap = lb.querySelector(".label");
    document.querySelectorAll(".shot").forEach(function (b) {
      b.addEventListener("click", function () {
        img.src = b.dataset.full; img.alt = b.dataset.caption || "";
        cap.textContent = b.dataset.caption || "";
        lb.showModal();
      });
    });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  // CV sections
  document.querySelectorAll(".cv-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      document.getElementById(btn.getAttribute("aria-controls")).hidden = open;
      btn.querySelector(".sign").textContent = open ? "+" : "–";
    });
  });
})();
