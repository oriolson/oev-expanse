// Marks the contents entry for the section currently in view. Pure enhancement:
// the page reads the same without it.
(function () {
  var links = document.querySelectorAll('.contents a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var current = null;
  function set(id) {
    if (current) current.removeAttribute('aria-current');
    current = byId[id];
    if (current) current.setAttribute('aria-current', 'true');
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) set(e.target.id); });
  }, { rootMargin: '-20% 0px -70% 0px' });
  Object.keys(byId).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) io.observe(el);
  });
})();
