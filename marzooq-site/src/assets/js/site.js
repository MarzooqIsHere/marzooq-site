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
  var openPhoto = function () {};
  if (lb && lb.showModal) {
    var img = lb.querySelector("img"), cap = lb.querySelector(".label"), mapBtn = lb.querySelector(".lb-map");
    var current = null;
    openPhoto = function (src, caption, mappable) {
      img.src = src; img.alt = caption || "";
      cap.textContent = caption || "";
      current = src;
      if (mapBtn) mapBtn.hidden = !mappable;
      if (!lb.open) lb.showModal();
    };
    document.querySelectorAll(".shot").forEach(function (b) {
      b.addEventListener("click", function () { openPhoto(b.dataset.full, b.dataset.caption, b.dataset.mappable === "true"); });
    });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    if (mapBtn) mapBtn.addEventListener("click", function () {
      lb.close();
      showMapAt(current);
    });
  }

  // Photo map (Leaflet loads only when the map is first opened)
  var mapEl = document.getElementById("photo-map");
  var mapData = [];
  try { mapData = JSON.parse((document.getElementById("map-data") || {}).textContent || "[]"); } catch (e) {}
  var map = null, markers = {}, pending = null;

  function loadLeaflet(cb) {
    if (window.L) return cb();
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = cb; document.head.appendChild(s);
  }

  function buildMap() {
    if (map || !mapEl || !window.L) return;
    map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true });
    // OpenStreetMap tiles need no key; the dark/warm look is a CSS filter (see site.css)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Group photos taken at the same spot into one pin
    var groups = {};
    mapData.forEach(function (p) {
      var k = p.lat.toFixed(4) + "," + p.lng.toFixed(4);
      (groups[k] = groups[k] || { lat: p.lat, lng: p.lng, caption: p.caption, photos: [] }).photos.push(p);
    });
    var bounds = [];
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      var icon = L.divIcon({ className: "", html: '<div class="pin">' + (g.photos.length > 1 ? "<span>" + g.photos.length + "</span>" : "") + "</div>", iconSize: [16, 16], iconAnchor: [8, 8] });
      var box = document.createElement("div");
      var t = document.createElement("p"); t.className = "map-pop-title"; t.textContent = g.caption; box.appendChild(t);
      var grid = document.createElement("div"); grid.className = "map-pop-grid";
      g.photos.forEach(function (p) {
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Open photo: " + p.caption);
        var im = document.createElement("img"); im.src = p.image; im.alt = ""; im.loading = "lazy";
        b.appendChild(im);
        b.addEventListener("click", function () { openPhoto(p.image, p.caption, true); });
        grid.appendChild(b);
        markers[p.image] = null;
      });
      box.appendChild(grid);
      var m = L.marker([g.lat, g.lng], { icon: icon, title: g.caption }).addTo(map).bindPopup(box, { maxWidth: 260 });
      g.photos.forEach(function (p) { markers[p.image] = m; });
      bounds.push([g.lat, g.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });
  }

  function openMapTab() {
    var tab = document.getElementById("tab-map");
    if (tab) tab.click();
  }

  function showMapAt(src) {
    pending = src;
    openMapTab();
  }

  var mapTab = document.getElementById("tab-map");
  if (mapTab && mapEl) mapTab.addEventListener("click", function () {
    loadLeaflet(function () {
      buildMap();
      setTimeout(function () {
        map.invalidateSize();
        if (pending && markers[pending]) {
          var m = markers[pending];
          map.setView(m.getLatLng(), 13);
          m.openPopup();
          mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        pending = null;
      }, 60);
    });
  });

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
