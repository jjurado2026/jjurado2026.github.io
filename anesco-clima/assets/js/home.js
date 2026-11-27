/* Anesco Clima & Renovables — home. JavaScript puro, sin dependencias. */
(function () {
  'use strict';
  window.ANESCO = true;
  var d = document, html = d.documentElement;
  var quieto = html.classList.contains('quieto');
  var tactil = window.matchMedia && matchMedia('(hover: none)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- Botón «Brote»: cara invertida y punto de entrada del cursor ---------- */
  $$('[data-boton]').forEach(function (b) {
    var cara = d.createElement('span');
    cara.className = 'boton__cara';
    while (b.firstChild) cara.appendChild(b.firstChild);
    b.appendChild(cara);
    var inv = cara.cloneNode(true);
    inv.className = 'boton__cara boton__cara--inv';
    inv.setAttribute('aria-hidden', 'true');
    b.appendChild(inv);
    var punto = function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX - r.left) + 'px');
      b.style.setProperty('--y', (e.clientY - r.top) + 'px');
      b.style.setProperty('--d', Math.ceil(Math.hypot(r.width, r.height) * 2.1) + 'px');
    };
    b.addEventListener('pointerenter', punto);
    b.addEventListener('pointerleave', punto);
  });
  $$('.zonas__lista a').forEach(function (a) { a.classList.add('boton'); });

  /* ---------- Titulares que se revelan desde el eje ---------- */
  function partir(el, lineal) {
    var palabras = [];
    (function recorre(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (h) {
        if (h.nodeType === 3) {
          var trozos = h.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          trozos.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(t)); return; }
            var s = d.createElement('span'); s.className = 'p'; s.textContent = t;
            palabras.push(s); frag.appendChild(s);
          });
          n.replaceChild(frag, h);
        } else if (h.nodeType === 1) recorre(h);
      });
    })(el);
    var c = (palabras.length - 1) / 2;
    palabras.forEach(function (s, i) { s.style.setProperty('--d', lineal ? i : Math.round(Math.abs(i - c) * 10) / 10); });
  }
  $$('[data-eje]').forEach(function (t) { partir(t, t.classList.contains('titulo--izq')); });

  // «Aerotermia»: letras desde el centro de la palabra (para lectores de pantalla, la palabra entera)
  $$('[data-letras]').forEach(function (el) {
    var txt = el.textContent.trim(), c = (txt.length - 1) / 2;
    el.textContent = '';
    var sr = d.createElement('span'); sr.className = 'sr'; sr.textContent = txt; el.appendChild(sr);
    var vis = d.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    txt.split('').forEach(function (ch, i) {
      var l = d.createElement('span'); l.className = 'l'; l.textContent = ch;
      l.style.setProperty('--d', Math.abs(i - c)); vis.appendChild(l);
    });
    el.appendChild(vis);
  });

  /* ---------- Revelados que se repiten: se encienden al asomar y se rearman al salir entero ---------- */
  var revelables = $$('[data-revela], [data-eje]');
  if (quieto || !('IntersectionObserver' in window)) {
    revelables.forEach(function (el) { el.classList.add('visto'); });
  } else {
    var enciende = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visto'); });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    var rearma = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) e.target.classList.remove('visto'); });
    }, { threshold: 0 });
    revelables.forEach(function (el) { enciende.observe(el); rearma.observe(el); });
  }

  /* ---------- En táctil, lo del cursor se dispara al cruzar el centro de la pantalla ---------- */
  if (tactil && !quieto && 'IntersectionObserver' in window) {
    var centro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('toque', e.isIntersecting); });
    }, { rootMargin: '-38% 0px -38% 0px' });
    $$('.ficha, .tarjeta').forEach(function (el) { centro.observe(el); });
  }

  /* ---------- Cabecera: sombra al bajar, desplegables con foto y menú del móvil ---------- */
  var cab = $('[data-cab]');
  var alBajar = function () { cab.classList.toggle('baja', window.scrollY > 8); };
  alBajar();
  window.addEventListener('scroll', alBajar, { passive: true });

  var grupos = $$('[data-grupo]');
  function cerrarGrupos(excepto) {
    grupos.forEach(function (g) {
      if (g === excepto) return;
      var b = $('button', g), dd = $('.dd', g);
      b.setAttribute('aria-expanded', 'false'); dd.classList.remove('abierto');
    });
  }
  function abrirGrupo(g) {
    var b = $('button', g), dd = $('.dd', g);
    $$('img[data-src]', dd).forEach(function (i) { i.src = i.getAttribute('data-src'); i.removeAttribute('data-src'); });
    cerrarGrupos(g);
    b.setAttribute('aria-expanded', 'true'); dd.classList.add('abierto');
  }
  grupos.forEach(function (g) {
    var b = $('button', g), t;
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-expanded') === 'true') cerrarGrupos(); else abrirGrupo(g);
    });
    if (!tactil) {
      g.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { clearTimeout(t); abrirGrupo(g); } });
      g.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { t = setTimeout(function () { cerrarGrupos(); }, 220); } });
    }
    g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) { b.setAttribute('aria-expanded', 'false'); $('.dd', g).classList.remove('abierto'); } });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var abierto = grupos.filter(function (g) { return $('button', g).getAttribute('aria-expanded') === 'true'; })[0];
      cerrarGrupos();
      if (abierto) $('button', abierto).focus();
      if (!movil.hidden) { cerrarMovil(); abrir.focus(); }
    }
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('[data-grupo]')) cerrarGrupos(); });

  var abrir = $('[data-abrir]'), movil = $('[data-movil]');
  function cerrarMovil() {
    movil.hidden = true; abrir.setAttribute('aria-expanded', 'false'); abrir.setAttribute('aria-label', 'Abrir el menú');
    $('use', abrir).setAttribute('href', '#i-menu'); html.style.overflow = ''; flotante();
  }
  abrir.addEventListener('click', function () {
    if (movil.hidden) {
      movil.hidden = false; abrir.setAttribute('aria-expanded', 'true'); abrir.setAttribute('aria-label', 'Cerrar el menú');
      $('use', abrir).setAttribute('href', '#i-cerrar'); html.style.overflow = 'hidden'; flotante();
    } else cerrarMovil();
  });
  $$('a', movil).forEach(function (a) { a.addEventListener('click', cerrarMovil); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && !movil.hidden) cerrarMovil(); });

  /* ---------- HERO: el díptico calor | frío ---------- */
  var hero = $('[data-hero]'), dip = $('[data-diptico]'), paneles = $$('[data-panel]', dip);
  var videos = paneles.map(function (p) { return $('video', p); });
  var pausa = $('[data-pausa]');
  var TURNO = 7000, activo = 0, reloj = null, sobre = false, parado = quieto, heroVisible = true;
  dip.style.setProperty('--turno', TURNO + 'ms');

  // La parte que se esconde de cada panel mide lo que mide «más»
  function medirMas() {
    paneles.forEach(function (p) {
      var m = $('.panel__mas', p), t = $('.panel__tiempo', p);
      var h = m.offsetHeight + (t ? t.offsetHeight + parseFloat(getComputedStyle(t).marginTop) : 0);
      p.style.setProperty('--mas', h + 'px');
    });
  }
  function activar(i) {
    activo = i;
    paneles.forEach(function (p, k) {
      p.classList.toggle('es-activo', k === i);
      var m = $('.panel__mas', p); if (k === i) m.removeAttribute('aria-hidden'); else m.setAttribute('aria-hidden', 'true');
      var t = $('.panel__tiempo i', p);
      if (t && k === i) { t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
    });
  }
  function programar() {
    clearTimeout(reloj);
    if (parado || sobre || !heroVisible) return;
    reloj = setTimeout(function () { activar(1 - activo); programar(); }, TURNO);
  }
  function reproducir() {
    videos.forEach(function (v) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); });
  }
  function ponerPausa(p) {
    parado = p;
    pausa.setAttribute('aria-pressed', p ? 'true' : 'false');
    pausa.setAttribute('aria-label', p ? 'Reproducir los vídeos' : 'Pausar los vídeos');
    dip.classList.toggle('parado', p);
    if (p) { videos.forEach(function (v) { v.pause(); }); clearTimeout(reloj); }
    else { reproducir(); activar(activo); programar(); }
  }
  pausa.addEventListener('click', function () { ponerPausa(!parado); });
  if (quieto) { ponerPausa(true); }
  else { reproducir(); programar(); }

  // Con el ratón, el panel bajo el cursor se activa (solo con movimiento real del ratón)
  paneles.forEach(function (p, i) {
    p.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      sobre = true; clearTimeout(reloj);
      if (activo !== i) activar(i);
    });
    p.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      sobre = false; programar();
    });
    // En táctil, tocar un panel lo activa (si ya lo está, el enlace funciona normal)
    p.addEventListener('click', function (e) {
      if (activo !== i && !e.target.closest('a')) { activar(i); programar(); }
    });
  });

  // El hero se repite al volver: al salir entero se reinicia; al volver, entra de nuevo
  if (!quieto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        heroVisible = e.isIntersecting;
        if (e.isIntersecting) {
          if (hero.classList.contains('fuera')) {
            hero.classList.remove('fuera', 'listo');
            requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('listo'); }); });
          }
          if (!parado) { reproducir(); programar(); }
        } else {
          hero.classList.add('fuera'); hero.classList.remove('listo');
          videos.forEach(function (v) { v.pause(); }); clearTimeout(reloj);
        }
      });
    }, { threshold: 0 }).observe(hero);
  }

  /* ---------- Preguntas frecuentes: lista + panel; acordeón en el móvil ---------- */
  var faq = $('[data-faq]');
  if (faq) {
    var pfs = $$('.pf', faq), estrecho = window.matchMedia('(max-width: 899px)');
    pfs.forEach(function (pf) {
      var b = $('button', pf);
      b.addEventListener('click', function () {
        var abierta = pf.classList.contains('es-abierta');
        if (abierta && !estrecho.matches) return; // en el panel siempre hay una
        pfs.forEach(function (o) { o.classList.remove('es-abierta'); $('button', o).setAttribute('aria-expanded', 'false'); $('.pf__r', o).setAttribute('aria-hidden', 'true'); });
        if (!abierta) { pf.classList.add('es-abierta'); b.setAttribute('aria-expanded', 'true'); $('.pf__r', pf).removeAttribute('aria-hidden'); }
      });
    });
  }

  /* ---------- Formulario: solo sus campos (nombre, teléfono, privacidad) ---------- */
  var form = $('[data-form]');
  if (form) {
    var err = $('[data-error]', form), ok = $('[data-ok]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = form.nombre, t = form.telefono, p = form.privacidad, fallos = [];
      $$('.mal', form).forEach(function (x) { x.classList.remove('mal'); });
      if (!n.value.trim()) { fallos.push('tu nombre'); n.parentNode.classList.add('mal'); }
      if (!/^[0-9 +()-]{9,}$/.test(t.value.trim())) { fallos.push('un teléfono válido'); t.parentNode.classList.add('mal'); }
      if (!p.checked) { fallos.push('aceptar la política de privacidad'); p.closest('.casilla').classList.add('mal'); }
      if (fallos.length) {
        err.textContent = 'Falta ' + fallos.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
        var primero = $('.mal input', form); if (primero) primero.focus();
        return;
      }
      err.textContent = '';
      $('[data-ok-nombre]', ok).textContent = n.value.trim().split(/\s+/)[0];
      $('[data-ok-tel]', ok).textContent = t.value.trim();
      ok.hidden = false; ok.focus();
    });
  }

  /* ---------- Llamada flotante: tras el hero; se aparta en el formulario, el pie, el menú y las cookies ---------- */
  var flota = $('[data-flota]'), cookies = $('[data-cookies]');
  var tapan = { hero: true, contacto: false, pie: false };
  function flotante() {
    var ve = !tapan.hero && !tapan.contacto && !tapan.pie && movil.hidden && (cookies.hidden || cookies.classList.contains('se-va'));
    flota.classList.toggle('ve', ve);
    flota.setAttribute('aria-hidden', ve ? 'false' : 'true');
    $$('a', flota).forEach(function (a) { if (ve) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
  }
  if ('IntersectionObserver' in window) {
    var mira = function (el, clave, margen) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { tapan[clave] = e.isIntersecting; flotante(); }); }, { rootMargin: margen || '0px' }).observe(el);
    };
    mira(hero, 'hero', '0px 0px -35% 0px');
    mira($('#contacto'), 'contacto');
    mira($('.pie'), 'pie');
  }

  /* ---------- Cookies ---------- */
  var guardada = null;
  try { guardada = localStorage.getItem('anesco-cookies'); } catch (e) {}
  if (!guardada && !html.classList.contains('captura')) cookies.hidden = false;
  $$('[data-cookie]', cookies).forEach(function (b) {
    b.addEventListener('click', function () {
      try { localStorage.setItem('anesco-cookies', b.getAttribute('data-cookie')); } catch (e) {}
      cookies.classList.add('se-va'); flotante();
      setTimeout(function () { cookies.hidden = true; }, quieto ? 0 : 450);
    });
  });
  flotante();

  /* ---------- Medidas tras cargar las fuentes ---------- */
  function medir() { medirMas(); }
  medir();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(medir);
  var anchoPrevio = window.innerWidth;
  window.addEventListener('resize', function () { if (window.innerWidth !== anchoPrevio) { anchoPrevio = window.innerWidth; medir(); } });

  /* Entrada del hero tras el primer pintado */
  requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('listo'); }); });
})();
