// Life In Ink: menu, scroll reveal, table-of-contents highlight and live stats. No tracking, no cookies.
(function () {
  // mobile menu
  var btn = document.querySelector(".menu-btn"), menu = document.getElementById("menu");
  if (btn && menu) {
    var set = function (open) { menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
    btn.addEventListener("click", function () { set(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (e) { io.observe(e); });

  // highlight the nav link of the section on screen
  var links = {}; document.querySelectorAll('.nav nav a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var nav = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var a = links[en.target.id]; if (!a) return;
      if (en.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].classList.remove("on"); }); a.classList.add("on"); }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) nav.observe(s); });

  var toc = document.querySelectorAll(".toc a");
  if (toc.length) {
    var map = {}; toc.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) { toc.forEach(function (a) { a.classList.remove("on"); }); map[en.target.id].classList.add("on"); }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".doc h2[id]").forEach(function (h) { spy.observe(h); });
  }
})();

// Live stories + view counts: stats.json is rewritten by the Raspberry Pi every few hours (public stories, YouTube + Instagram
// views, nothing private). The newest public story goes on the hero phone, the 5 newest become the cards, and the series cards
// count their episodes. The HTML stays as the fallback, so until it loads nothing changes and no numbers are ever made up.
(function () {
  if (!window.fetch) return;
  var SHOW = 5;
  function short(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n < 1e7 ? 1 : 0).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(n < 1e4 ? 1 : 0).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function ago(iso) {
    var h = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
    if (!(h >= 0)) return "";
    return h < 1 ? "less than an hour ago" : h < 24 ? h + (h === 1 ? " hour ago" : " hours ago") : Math.round(h / 24) + (h < 36 ? " day ago" : " days ago");
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  var eye = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
            '<path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var play = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>';

  function card(key, s, i) {
    var a = el("a", "story reveal in"); a.setAttribute("data-story", key); a.style.setProperty("--d", (i * 0.06).toFixed(2) + "s");
    a.href = s.youtube || s.instagram;
    var img = el("img"); img.src = s.image; img.alt = s.title + " cover"; img.loading = "lazy"; img.width = 480; img.height = 853; a.appendChild(img);
    var p = el("span", "play"); p.innerHTML = play; a.appendChild(p);
    var v = el("span", "views"); v.hidden = true; a.appendChild(v);
    var cap = el("span", "cap"); cap.appendChild(el("small", "", s.series)); cap.appendChild(el("b", "", s.title));
    if (s.no) cap.appendChild(el("em", "", "Ep " + s.no)); a.appendChild(cap);
    return a;
  }

  fetch("stats.json?t=" + Math.floor(Date.now() / 6e5), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.stories) return;
      var all = Object.keys(d.stories).filter(function (k) { var s = d.stories[k]; return s.image && s.title && (s.youtube || s.instagram); })
        .sort(function (x, y) { var a = d.stories[x], b = d.stories[y]; return (b.posted + b.no).localeCompare(a.posted + a.no); });
      var keys = all.slice(0, SHOW);

      var grid = document.querySelector(".stories");
      var now = Array.prototype.map.call(grid ? grid.querySelectorAll(".story") : [], function (a) { return a.getAttribute("data-story"); });
      if (grid && keys.length >= Math.min(SHOW, now.length) && keys.join() !== now.join()) {
        grid.textContent = ""; keys.forEach(function (k, i) { grid.appendChild(card(k, d.stories[k], i)); });
      }
      document.querySelectorAll(".story[data-story]").forEach(function (a) {
        var s = d.stories[a.getAttribute("data-story")]; if (!s) return;
        if (s.youtube && /\/shorts\/?$/.test(a.getAttribute("href"))) a.href = s.youtube;
        var b = a.querySelector(".views");
        if (b && s.views > 0) { b.innerHTML = eye + short(s.views) + " views"; b.hidden = false; }
      });

      // hero phone: newest episode, the two before it behind
      var ph = document.getElementById("latest");
      if (ph && keys.length) {
        var L = d.stories[keys[0]]; ph.href = L.youtube || L.instagram;
        var im = ph.querySelector("img"); im.src = L.image; im.alt = L.title + " cover";
        ph.querySelector(".ph-cap small").textContent = L.series; ph.querySelector(".ph-cap b").textContent = L.title;
        var backs = document.querySelectorAll(".hero-visual .back");
        if (keys.length >= 3 && backs.length === 2) { backs[0].src = d.stories[keys[1]].image; backs[1].src = d.stories[keys[2]].image; }
      }

      // episodes per series
      document.querySelectorAll(".serie[data-series]").forEach(function (c) {
        var names = c.getAttribute("data-series").split("|"), n = all.filter(function (k) { return names.indexOf(d.stories[k].series) >= 0; }).length;
        c.querySelector(".count").textContent = n ? n + (n === 1 ? " episode" : " episodes") : "First episode coming soon";
      });

      var v = document.getElementById("stat-views");
      if (v && d.views > 0) { v.querySelector("dd").textContent = short(d.views) + "+"; v.hidden = false; }
      var n = document.getElementById("stat-count");
      if (n && all.length) { n.querySelector("dd").textContent = all.length; n.hidden = false; }
      var u = document.getElementById("stat-updated"), t = d.updated && ago(d.updated);
      if (u && t) { u.textContent = "Live views from YouTube + Instagram, updated " + t; u.hidden = false; }
    })
    .catch(function () {});
})();
