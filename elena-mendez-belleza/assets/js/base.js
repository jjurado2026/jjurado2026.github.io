/* Elena Méndez — base: enlaces de WhatsApp con el mensaje escrito, cabecera, menú del móvil,
   entradas al llegar y bucles en pausa fuera de pantalla. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var quieto = html.classList.contains('quieto');
  var TEL_WA = '34682937011';

  function wa(texto) { return 'https://wa.me/' + TEL_WA + (texto ? '?text=' + encodeURIComponent(texto) : ''); }
  var EM = window.EM = { quieto: quieto, wa: wa };

  // Cada enlace de WhatsApp lleva su propio mensaje
  d.querySelectorAll('[data-wa]').forEach(function (a) {
    var t = a.getAttribute('data-wa');
    if (t) a.href = wa(t);
  });

  // Cabecera: una sombra suave en cuanto se baja
  var cab = d.querySelector('[data-cab]');
  function sombra() { cab.classList.toggle('con-sombra', window.scrollY > 8); }
  addEventListener('scroll', sombra, { passive: true });
  sombra();

  // Menú del móvil
  var boton = d.querySelector('[data-abre-menu]');
  var menu = d.querySelector('[data-menu]');
  menu.querySelectorAll('.menu-movil__lista li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  function abrir(si) {
    boton.setAttribute('aria-expanded', String(si));
    if (si) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('abierto'); });
      d.body.classList.add('menu-abierto');
      var primero = menu.querySelector('a');
      if (primero) primero.focus({ preventScroll: true });
    } else {
      menu.classList.remove('abierto');
      menu.hidden = true;
      d.body.classList.remove('menu-abierto');
    }
  }
  boton.addEventListener('click', function () { abrir(boton.getAttribute('aria-expanded') !== 'true'); });
  // Un enlace a otra parte de esta misma página (p. ej. «Pedir cita») cierra el menú
  menu.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]')) abrir(false); });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') { abrir(false); boton.focus(); }
  });
  var ancho = matchMedia('(min-width: 1100px)');
  (ancho.addEventListener ? ancho.addEventListener.bind(ancho, 'change') : ancho.addListener.bind(ancho))(function (e) { if (e.matches) abrir(false); });

  // Entradas al llegar: los bloques reciben .visto cuando asoman
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }) : null;
  EM.observar = function (el) {
    if (quieto || !io) { el.classList.add('visto'); return; }
    io.observe(el);
  };
  d.querySelectorAll('[data-revela]').forEach(EM.observar);

  // Bucles (cinta de marcas, tira del centro, sello) en pausa cuando no se ven
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('pausa', !e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    d.querySelectorAll('[data-bucle]').forEach(function (el) { io2.observe(el); });
  }

  // Si la pestaña no se ve, todo en pausa
  d.addEventListener('visibilitychange', function () { html.classList.toggle('oculta', d.hidden); });
})();
