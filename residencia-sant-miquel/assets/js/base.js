/* Sant Miquel Arcàngel — base: texto grande, cabecera, menú del móvil,
   entradas al llegar y bucles en pausa fuera de pantalla. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var quieto = html.classList.contains('quieto');
  var SM = window.SM = { quieto: quieto };

  function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- Texto grande ---------- */
  function aplicaText(gran) {
    html.classList.toggle('text-gran', gran);
    d.querySelectorAll('[data-text-gran]').forEach(function (b) { b.setAttribute('aria-pressed', String(gran)); });
  }
  aplicaText(html.classList.contains('text-gran'));
  d.querySelectorAll('[data-text-gran]').forEach(function (b) {
    b.addEventListener('click', function () {
      var gran = !html.classList.contains('text-gran');
      aplicaText(gran);
      guarda('sm-text', gran ? 'gran' : 'normal');
    });
  });

  /* ---------- Cabecera: sombra al bajar ---------- */
  var cab = d.querySelector('[data-cab]');
  function ombra() { cab.classList.toggle('amb-ombra', window.scrollY > 8); }
  addEventListener('scroll', ombra, { passive: true });
  ombra();

  /* ---------- Menú del móvil ---------- */
  var boto = d.querySelector('[data-obre-menu]');
  var menu = d.querySelector('[data-menu]');
  menu.querySelectorAll('li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  function obre(si) {
    boto.setAttribute('aria-expanded', String(si));
    boto.querySelector('use').setAttribute('href', si ? '#i-tanca' : '#i-menu');
    if (si) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('obert'); });
      d.body.classList.add('menu-obert');
      var primer = menu.querySelector('a');
      if (primer) primer.focus({ preventScroll: true });
    } else {
      menu.classList.remove('obert');
      menu.hidden = true;
      d.body.classList.remove('menu-obert');
    }
  }
  boto.addEventListener('click', function () { obre(boto.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) obre(false); });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && boto.getAttribute('aria-expanded') === 'true') { obre(false); boto.focus(); }
  });
  var ample = matchMedia('(min-width: 1200px)');
  (ample.addEventListener ? ample.addEventListener.bind(ample, 'change') : ample.addListener.bind(ample))(function (e) { if (e.matches) obre(false); });

  /* ---------- Títulos: cada palabra en su caja, para levantarse una a una ---------- */
  d.querySelectorAll('[data-paraules]').forEach(function (h) {
    var n = 0;
    (function parteix(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (fill) {
        if (fill.nodeType === 3) {
          var trossos = fill.textContent.split(/(\s+)/);
          var frag = d.createDocumentFragment();
          trossos.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(t)); return; }
            var s = d.createElement('span');
            s.className = 'p'; s.style.setProperty('--w', n++); s.textContent = t;
            frag.appendChild(s);
          });
          node.replaceChild(frag, fill);
        } else if (fill.nodeType === 1) {
          parteix(fill);
        }
      });
    })(h);
  });

  /* ---------- Entradas al llegar ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }) : null;
  SM.observa = function (el) {
    if (quieto || !io) { el.classList.add('visto'); return; }
    io.observe(el);
  };
  d.querySelectorAll('[data-revela], [data-paraules]').forEach(SM.observa);

  /* ---------- Bucles en pausa cuando no se ven ---------- */
  SM.enPantalla = function (el, f) {
    if (!('IntersectionObserver' in window)) { f(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { f(e.isIntersecting); }); }, { rootMargin: '80px 0px' }).observe(el);
  };
  d.querySelectorAll('[data-bucle]').forEach(function (el) {
    SM.enPantalla(el, function (si) { el.classList.toggle('pausa', !si); });
  });
  d.addEventListener('visibilitychange', function () { html.classList.toggle('oculta', d.hidden); });
})();
