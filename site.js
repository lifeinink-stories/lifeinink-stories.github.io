// Life In Ink: scroll reveal + table-of-contents highlight. No tracking, no cookies.
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (e) { io.observe(e); });

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
// views, nothing private). The 5 newest public stories become the cards; the cards in index.html stay as the fallback.
// Until it loads nothing changes, so no numbers are ever made up.
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
    var a = el("a", "story reveal in"); a.setAttribute("data-story", key); a.style.setProperty("--d", (i * 0.08).toFixed(2) + "s");
    a.href = s.youtube || s.instagram;
    var img = el("img"); img.src = s.image; img.alt = s.title + " cover"; img.loading = "lazy"; a.appendChild(img);
    var p = el("span", "play"); p.innerHTML = play; a.appendChild(p);
    var v = el("span", "views"); v.hidden = true; a.appendChild(v);
    var cap = el("span", "cap"); cap.appendChild(el("small", "", s.series)); cap.appendChild(el("b", "", s.title)); a.appendChild(cap);
    return a;
  }

  fetch("stats.json?t=" + Math.floor(Date.now() / 6e5), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.stories) return;
      var grid = document.querySelector(".stories");
      var keys = Object.keys(d.stories).filter(function (k) { var s = d.stories[k]; return s.image && s.title && (s.youtube || s.instagram); })
        .sort(function (x, y) { var a = d.stories[x], b = d.stories[y]; return (b.posted + b.no).localeCompare(a.posted + a.no); }).slice(0, SHOW);
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
      var v = document.getElementById("stat-views");
      if (v && d.views > 0) { v.querySelector("b").textContent = short(d.views) + "+"; v.hidden = false; }
      var u = document.getElementById("stat-updated"), t = d.updated && ago(d.updated);
      if (u && t) { u.textContent = "Live views from YouTube + Instagram, updated " + t; u.hidden = false; }
    })
    .catch(function () {});
})();
