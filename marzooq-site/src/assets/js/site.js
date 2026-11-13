(function () {
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Light / dark
  var themeBtn = document.getElementById("theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncTheme() {
    var light = root.dataset.theme === "light";
    if (themeMeta) themeMeta.content = light ? "#EEE5D8" : "#16110E";
    if (themeBtn) themeBtn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
  }
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next; save("theme", next); syncTheme();
  });
  syncTheme();

  // English / Welsh
  var langBtn = document.getElementById("lang-toggle");
  function syncLang() {
    if (langBtn) langBtn.setAttribute("aria-label", root.dataset.lang === "cy"
      ? "EN / CY: switch to English (Newid i'r Saesneg)" : "EN / CY: Newid i'r Gymraeg (switch to Welsh)");
  }
  if (langBtn) langBtn.addEventListener("click", function () {
    var next = root.dataset.lang === "cy" ? "en" : "cy";
    root.dataset.lang = next; root.lang = next; save("lang", next); syncLang();
  });
  syncLang();

  // Hover notes: nudge the note left if it would run off the right edge of the screen
  var tips = [];
  document.querySelectorAll(".tip").forEach(function (tip) {
    function place() {
      var pop = tip.querySelector(".pop");
      tip.style.setProperty("--shift", "0px");
      var over = pop.getBoundingClientRect().right - (document.documentElement.clientWidth - 16);
      if (over > 0) tip.style.setProperty("--shift", -over + "px");
    }
    tip.addEventListener("mouseenter", place);
    tip.addEventListener("focus", place);
    tips.push(place);
  });
  // Also place them up front (and on resize), so hidden notes never widen the page
  function placeAll() { tips.forEach(function (f) { f(); }); }
  placeAll();
  window.addEventListener("resize", placeAll);
  root.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#lang-toggle")) setTimeout(placeAll, 0); });

  // Photography tabs: arrow keys move between them, and the open tab is kept in the URL (#map etc.)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function tabName(t) { return t.id.replace(/^tab-/, ""); }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      var hash = i === 0 ? location.pathname : "#" + tabName(tab);
      if (history.replaceState) history.replaceState(null, "", hash);
    });
    tab.addEventListener("keydown", function (e) {
      var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      var next = tabs[(j + tabs.length) % tabs.length];
      next.focus(); next.click();
    });
  });

  // Lightbox: previous/next through the gallery the photo came from
  var lb = document.getElementById("lightbox");
  var openPhoto = function () {};
  if (lb && lb.showModal) {
    var img = lb.querySelector("img"), cap = lb.querySelector(".label"), mapBtn = lb.querySelector(".lb-map");
    var count = lb.querySelector(".lb-count"), prevBtn = lb.querySelector(".lb-prev"), nextBtn = lb.querySelector(".lb-next");
    var current = null, list = [], idx = 0;
    function show(i) {
      idx = (i + list.length) % list.length;
      var b = list[idx];
      current = b.dataset.full;
      img.src = current; var t = b.querySelector("img"); img.alt = (t && t.alt) || b.dataset.caption || "";
      cap.textContent = b.dataset.caption || "";
      if (mapBtn) mapBtn.hidden = b.dataset.mappable !== "true";
      var many = list.length > 1;
      count.textContent = many ? (idx + 1) + " / " + list.length : "";
      prevBtn.hidden = nextBtn.hidden = !many;
    }
    openPhoto = function (src) {
      var from = document.querySelector('.shot[data-full="' + src + '"]');
      if (!from) return;
      list = Array.prototype.slice.call(from.closest(".gallery").querySelectorAll(".shot"));
      show(list.indexOf(from));
      if (!lb.open) lb.showModal();
    };
    document.querySelectorAll(".shot").forEach(function (b) {
      b.addEventListener("click", function () { openPhoto(b.dataset.full); });
    });
    prevBtn.addEventListener("click", function () { show(idx - 1); });
    nextBtn.addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
    });
    var startX = null;
    lb.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 50 && list.length > 1) show(dx < 0 ? idx + 1 : idx - 1);
    });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    if (mapBtn) mapBtn.addEventListener("click", function () {
      lb.close();
      showMapAt(current);
    });
  }

  // Photo map: MapLibre + MapTiler vector tiles, loaded only when the map is first opened.
  // The key is public by design; MapTiler only accepts it from marzooq.co.uk.
  var MAPTILER_KEY = "QB7XBzuwBZU9kgcvFowu";
  var MAPLIBRE = "https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl";
  var mapEl = document.getElementById("photo-map");
  var mapData = [];
  try { mapData = JSON.parse((document.getElementById("map-data") || {}).textContent || "[]"); } catch (e) {}
  var map = null, markers = {}, pending = null;

  function loadMapLibre(cb) {
    if (window.maplibregl) return cb();
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = MAPLIBRE + ".css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = MAPLIBRE + ".js";
    s.onload = cb; document.head.appendChild(s);
  }

  // Darkroom map style, built on MapTiler's OpenMapTiles vector data
  var PALETTES = {
    dark:  { bg: "#211A15", water: "#0E0D0C", wood: "#251D17", park: "#251E17", urban: "#271F19", building: "#30261F",
             minor: "#352B24", major: "#46382D", motorway: "#5A4434", rail: "#3A2F27", border: "#5A4A3E",
             label: "#BCAE9E", city: "#EFE4D6", waterLabel: "#6F6A63", halo: "#16110E" },
    light: { bg: "#EEE5D8", water: "#CDD1CB", wood: "#E3DAC8", park: "#E2DCC6", urban: "#E8DECF", building: "#DDD1C0",
             minor: "#F8F2E9", major: "#F3E4CC", motorway: "#E8C9A4", rail: "#CFC1AE", border: "#A8968A",
             label: "#5E4B47", city: "#2B1A1C", waterLabel: "#7C8580", halo: "#EEE5D8" }
  };
  function mapStyle(theme) {
    var c = PALETTES[theme] || PALETTES.dark;
    var k = "?key=" + MAPTILER_KEY;
    var font = ["Noto Sans Regular"], fontB = ["Noto Sans Bold"], fontI = ["Noto Sans Italic"];
    var road = function (id, classes, color, w) {
      return { id: id, type: "line", source: "omt", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", classes]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": color, "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 6, w[0], 12, w[1], 18, w[2]] } };
    };
    return {
      version: 8,
      glyphs: "https://api.maptiler.com/fonts/{fontstack}/{range}.pbf" + k,
      sources: { omt: { type: "vector", url: "https://api.maptiler.com/tiles/v3/tiles.json" + k } },
      layers: [
        { id: "bg", type: "background", paint: { "background-color": c.bg } },
        { id: "urban", type: "fill", source: "omt", "source-layer": "landuse",
          filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood", "commercial", "retail", "industrial"]]],
          paint: { "fill-color": c.urban } },
        { id: "wood", type: "fill", source: "omt", "source-layer": "landcover",
          filter: ["in", ["get", "class"], ["literal", ["wood", "forest"]]], paint: { "fill-color": c.wood } },
        { id: "park", type: "fill", source: "omt", "source-layer": "park", paint: { "fill-color": c.park } },
        { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": c.water } },
        { id: "waterway", type: "line", source: "omt", "source-layer": "waterway",
          paint: { "line-color": c.water, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 16, 3] } },
        { id: "building", type: "fill", source: "omt", "source-layer": "building", minzoom: 14, paint: { "fill-color": c.building } },
        { id: "border", type: "line", source: "omt", "source-layer": "boundary",
          filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],  // country borders only
          paint: { "line-color": c.border, "line-dasharray": [3, 2], "line-width": 0.8 } },
        road("road-minor", ["minor", "service", "track"], c.minor, [0, 0.6, 8]),
        road("road-mid", ["tertiary", "secondary"], c.major, [0.2, 1, 12]),
        road("road-major", ["primary", "trunk"], c.major, [0.4, 1.6, 16]),
        road("road-motorway", ["motorway"], c.motorway, [0.6, 2, 18]),
        { id: "rail", type: "line", source: "omt", "source-layer": "transportation", minzoom: 10,
          filter: ["==", ["get", "class"], "rail"], paint: { "line-color": c.rail, "line-width": 1, "line-dasharray": [2, 2] } },
        { id: "water-name", type: "symbol", source: "omt", "source-layer": "water_name",
          layout: { "text-field": ["get", "name:latin"], "text-font": fontI, "text-size": 12, "text-letter-spacing": 0.1 },
          paint: { "text-color": c.waterLabel, "text-halo-color": c.halo, "text-halo-width": 1 } },
        { id: "road-name", type: "symbol", source: "omt", "source-layer": "transportation_name", minzoom: 14,
          layout: { "symbol-placement": "line", "text-field": ["get", "name:latin"], "text-font": font, "text-size": 11 },
          paint: { "text-color": c.label, "text-halo-color": c.halo, "text-halo-width": 1.2 } },
        { id: "place-small", type: "symbol", source: "omt", "source-layer": "place",
          filter: ["in", ["get", "class"], ["literal", ["village", "hamlet", "suburb", "neighbourhood"]]],
          layout: { "text-field": ["get", "name:latin"], "text-font": font, "text-size": 12 },
          paint: { "text-color": c.label, "text-halo-color": c.halo, "text-halo-width": 1.4 } },
        { id: "place-big", type: "symbol", source: "omt", "source-layer": "place",
          filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
          layout: { "text-field": ["get", "name:latin"], "text-font": fontB,
            "text-size": ["interpolate", ["linear"], ["zoom"], 6, 12, 12, 17], "text-letter-spacing": 0.04 },
          paint: { "text-color": c.city, "text-halo-color": c.halo, "text-halo-width": 1.6 } }
      ]
    };
  }
  function theme() { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }

  function buildMap() {
    if (map || !mapEl || !window.maplibregl) return;
    map = new maplibregl.Map({
      container: mapEl, style: mapStyle(theme()), center: [-3.2, 51.6], zoom: 7,
      scrollZoom: false, dragRotate: false, pitchWithRotate: false, attributionControl: false
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    // Credits come from MapTiler's tile data; the free plan also needs their logo shown
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl({
      onAdd: function () {
        var a = document.createElement("a");
        a.className = "maplibregl-ctrl maptiler-logo"; a.href = "https://www.maptiler.com"; a.target = "_blank"; a.rel = "noopener";
        a.innerHTML = '<img src="https://api.maptiler.com/resources/logo.svg" alt="MapTiler" width="67" height="20">';
        return a;
      },
      onRemove: function () {}
    }, "bottom-left");

    // Swap colours when the site theme changes
    new MutationObserver(function () { map.setStyle(mapStyle(theme())); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // Group photos taken at the same spot into one pin
    var groups = {};
    mapData.forEach(function (p) {
      var k = p.lat.toFixed(5) + "," + p.lng.toFixed(5);
      (groups[k] = groups[k] || { lat: p.lat, lng: p.lng, caption: p.caption, photos: [] }).photos.push(p);
    });
    var bounds = new maplibregl.LngLatBounds();
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      var el = document.createElement("button");
      el.type = "button"; el.className = "pin"; el.setAttribute("aria-label", "Photos: " + g.caption);
      if (g.photos.length > 1) { var n = document.createElement("span"); n.textContent = g.photos.length; el.appendChild(n); }
      var box = document.createElement("div");
      var t = document.createElement("p"); t.className = "map-pop-title"; t.textContent = g.caption; box.appendChild(t);
      var grid = document.createElement("div"); grid.className = "map-pop-grid";
      g.photos.forEach(function (p) {
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Open photo: " + p.caption);
        var im = document.createElement("img"); im.src = p.image; im.alt = ""; im.loading = "lazy";
        b.appendChild(im);
        b.addEventListener("click", function () { openPhoto(p.image, p.caption, true); });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      var popup = new maplibregl.Popup({ offset: 14, maxWidth: "260px", className: "map-pop" }).setDOMContent(box);
      var m = new maplibregl.Marker({ element: el }).setLngLat([g.lng, g.lat]).setPopup(popup).addTo(map);
      g.photos.forEach(function (p) { markers[p.image] = m; });
      bounds.extend([g.lng, g.lat]);
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50, maxZoom: 13, duration: 0 });
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
    loadMapLibre(function () {
      buildMap();
      setTimeout(function () {
        map.resize();
        if (pending && markers[pending]) {
          var m = markers[pending];
          map.jumpTo({ center: m.getLngLat(), zoom: 14 });
          if (!m.getPopup().isOpen()) m.togglePopup();
          mapEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        pending = null;
      }, 60);
    });
  });

  // Open the tab named in the URL, e.g. /photography/#map
  var fromHash = document.getElementById("tab-" + location.hash.slice(1));
  if (fromHash && fromHash.getAttribute("role") === "tab") fromHash.click();

  // Shelf: click a spine to pick the book up (a pop-up); click the cover to turn it over
  var bookDlg = document.getElementById("book");
  if (bookDlg && bookDlg.showModal) {
    var lastSpine = null;
    document.querySelectorAll(".spine").forEach(function (sp) {
      sp.addEventListener("click", function () {
        lastSpine = sp;
        sp.classList.add("out");
        bookDlg.querySelectorAll(".pulled-book").forEach(function (b) {
          var on = b.dataset.book === sp.dataset.book;
          b.hidden = !on;
          if (on) b.querySelector(".flip").setAttribute("aria-pressed", "false");
        });
        bookDlg.showModal();
      });
    });
    bookDlg.querySelectorAll(".flip").forEach(function (f) {
      f.addEventListener("click", function () {
        f.setAttribute("aria-pressed", f.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
    });
    function putBack() { bookDlg.close(); }
    bookDlg.querySelectorAll(".put-back, .book-close").forEach(function (b) { b.addEventListener("click", putBack); });
    bookDlg.addEventListener("click", function (e) { if (e.target === bookDlg) putBack(); });
    bookDlg.addEventListener("close", function () {
      if (lastSpine) { lastSpine.classList.remove("out"); lastSpine.focus(); }
    });
  }

  // Email is put together here rather than written into the HTML, so address-scraping bots don't find it.
  var mail = ["me", "marzooq.co.uk"].join("@");
  document.querySelectorAll("[data-mail]").forEach(function (a) {
    var sub = a.getAttribute("data-subject");
    a.href = "mailto:" + mail + (sub ? "?subject=" + encodeURIComponent(sub) : "");
  });
  document.querySelectorAll("[data-mail-text]").forEach(function (el) { el.textContent = mail; });

  // Photos "develop" as they load: fade up from a warm dark tone, then drop the effect
  function develop(im) {
    function go() {
      requestAnimationFrame(function () { im.classList.add("in"); });
      setTimeout(function () { im.classList.remove("dev", "in"); }, 2000);
    }
    if (im.complete && im.naturalWidth) go();
    else { im.addEventListener("load", go, { once: true }); im.addEventListener("error", go, { once: true }); }
  }
  document.querySelectorAll("img.dev").forEach(develop);

  // 404: show a random frame from the roll, and let people develop another
  var lostImg = document.getElementById("lost-img"), lostData = document.getElementById("lost-data");
  if (lostImg && lostData) {
    var roll = []; try { roll = JSON.parse(lostData.textContent); } catch (e) {}
    var last = -1;
    var pick = function () {
      if (!roll.length) return;
      var i; do { i = Math.floor(Math.random() * roll.length); } while (roll.length > 1 && i === last);
      last = i;
      lostImg.classList.add("dev"); lostImg.classList.remove("in");
      lostImg.alt = roll[i].alt || "";
      lostImg.src = roll[i].image;
      develop(lostImg);
    };
    pick();
    var again = document.getElementById("lost-again");
    if (again) again.addEventListener("click", pick);
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
