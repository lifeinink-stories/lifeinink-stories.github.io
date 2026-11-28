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

// Live view counts: stats.json is rewritten by the Raspberry Pi every few hours (YouTube + Instagram views, nothing private).
// Until it loads, nothing is shown, so no numbers are ever made up.
(function () {
  if (!window.fetch) return;
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
  var eye = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
            '<path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  fetch("stats.json?t=" + Math.floor(Date.now() / 6e5), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.stories) return;
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

