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
