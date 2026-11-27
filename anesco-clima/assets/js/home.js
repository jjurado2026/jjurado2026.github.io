/* Anesco Clima & Renovables — home (v2). JavaScript puro, sin dependencias. */
(function () {
  'use strict';
  window.ANESCO = true;
  var d = document, html = d.documentElement;
  var quieto = html.classList.contains('quieto');
  var tactil = window.matchMedia && matchMedia('(hover: none)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var IO = 'IntersectionObserver' in window;

  /* ---------- Botón «Brote»: cara invertida y punto de entrada del cursor ---------- */
  $$('.zonas__lista a').forEach(function (a, i) { a.classList.add('boton'); a.setAttribute('data-boton', ''); a.parentNode.style.setProperty('--i', i); });
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
    b.addEventListener('pointerdown', punto);
  });

  /* ---------- Titulares que se revelan desde el eje ---------- */
  function partir(el, lineal) {
    var palabras = [];
    (function recorre(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (h) {
        if (h.nodeType === 3) {
          var frag = d.createDocumentFragment();
          h.textContent.split(/(\s+)/).forEach(function (t) {
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
  $$('[data-eje]').forEach(function (t) { partir(t, t.classList.contains('titulo--izq') || t.classList.contains('intro__h1')); });

  /* ---------- Revelados que se repiten: se encienden al asomar y se rearman al salir entero ---------- */
  var revelables = $$('[data-revela], [data-eje]:not(.diapo__t), [data-giros], [data-pasos]');
  if (quieto || !IO) revelables.forEach(function (el) { el.classList.add('visto'); });
  else {
    var enciende = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !e.target.classList.contains('visto')) { e.target.classList.add('visto'); e.target.dispatchEvent(new CustomEvent('visto')); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    var rearma = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting && e.target.classList.contains('visto')) { e.target.classList.remove('visto'); e.target.dispatchEvent(new CustomEvent('fuera')); } });
    }, { threshold: 0 });
    revelables.forEach(function (el) { enciende.observe(el); rearma.observe(el); });
  }

  /* ---------- En táctil, lo del cursor se dispara al cruzar el centro de la pantalla ---------- */
  if (tactil && !quieto && IO) {
    var centro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('toque', e.isIntersecting); });
    }, { rootMargin: '-40% 0px -40% 0px' });
    $$('.tesela, .tarjeta, .giro').forEach(function (el) { centro.observe(el); });
  }

  /* ---------- Cabecera: la franja del teléfono se recoge al bajar; desplegables con foto ---------- */
  var cab = $('[data-cab]');
  var alBajar = function () { cab.classList.toggle('baja', window.scrollY > 30); };
  alBajar();
  window.addEventListener('scroll', alBajar, { passive: true });

  var grupos = $$('[data-grupo]');
  function cerrarGrupos(excepto) {
    grupos.forEach(function (g) {
      if (g === excepto) return;
      $('button', g).setAttribute('aria-expanded', 'false'); $('.dd', g).classList.remove('abierto');
    });
  }
  function abrirGrupo(g) {
    var dd = $('.dd', g);
    $$('img[data-src]', dd).forEach(function (i) { i.src = i.getAttribute('data-src'); i.removeAttribute('data-src'); });
    cerrarGrupos(g);
    $('button', g).setAttribute('aria-expanded', 'true'); dd.classList.add('abierto');
  }
  grupos.forEach(function (g) {
    var b = $('button', g), t;
    b.addEventListener('click', function () { if (b.getAttribute('aria-expanded') === 'true') cerrarGrupos(); else abrirGrupo(g); });
    if (!tactil) {
      g.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { clearTimeout(t); abrirGrupo(g); } });
      g.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { t = setTimeout(function () { cerrarGrupos(); }, 220); } });
    }
    g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) { b.setAttribute('aria-expanded', 'false'); $('.dd', g).classList.remove('abierto'); } });
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('[data-grupo]')) cerrarGrupos(); });

  var abrir = $('[data-abrir]'), movil = $('[data-movil]');
  function cerrarMovil() {
    movil.hidden = true; abrir.setAttribute('aria-expanded', 'false'); abrir.setAttribute('aria-label', 'Abrir el menú');
    $('use', abrir).setAttribute('href', '#i-menu'); html.style.overflow = '';
  }
  abrir.addEventListener('click', function () {
    if (movil.hidden) {
      movil.style.top = Math.round(cab.getBoundingClientRect().bottom) + 'px';
      movil.hidden = false; abrir.setAttribute('aria-expanded', 'true'); abrir.setAttribute('aria-label', 'Cerrar el menú');
      $('use', abrir).setAttribute('href', '#i-cerrar'); html.style.overflow = 'hidden';
    } else cerrarMovil();
  });
  $$('a', movil).forEach(function (a) { a.addEventListener('click', cerrarMovil); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && !movil.hidden) cerrarMovil(); });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var abierto = grupos.filter(function (g) { return $('button', g).getAttribute('aria-expanded') === 'true'; })[0];
    cerrarGrupos();
    if (abierto) $('button', abierto).focus();
    if (!movil.hidden) { cerrarMovil(); abrir.focus(); }
  });

  /* ---------- HERO: su slider. El vídeo siguiente se abre en círculo desde el centro ---------- */
  var hero = $('[data-hero]'), fondos = $$('[data-fondo]', hero), diapos = $$('[data-diapo]', hero);
  var pestanas = $$('[data-pestana]', hero), pausa = $('[data-pausa]', hero), circulo = $('.circulo', hero);
  var videos = fondos.map(function (f) { return $('video', f); });
  var TURNO = 7000, activa = 0, reloj = null, parado = quieto, heroVisible = true, abriendo = false;
  hero.style.setProperty('--turno', TURNO + 'ms');

  function reproducir() { videos.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }); }
  function abrirCirculo(entra, sale) {
    if (quieto) { sale.classList.remove('es-activo'); entra.classList.add('es-activo'); return; }
    var hr = hero.getBoundingClientRect(), cr = circulo.getBoundingClientRect();
    var cx = cr.left - hr.left + cr.width / 2, cy = cr.top - hr.top + cr.height / 2;
    var max = Math.hypot(Math.max(cx, hr.width - cx), Math.max(cy, hr.height - cy)) + 4;
    var r0 = cr.width * 0.18, t0 = null, D = 1500;
    abriendo = true;
    entra.style.clipPath = 'circle(' + r0 + 'px at ' + cx + 'px ' + cy + 'px)';
    entra.classList.add('entra');
    requestAnimationFrame(function paso(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      entra.style.clipPath = 'circle(' + (r0 + (max - r0) * e).toFixed(1) + 'px at ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px)';
      if (k < 1) requestAnimationFrame(paso);
      else {
        sale.classList.remove('es-activo'); entra.classList.add('es-activo'); entra.classList.remove('entra');
        entra.style.clipPath = ''; abriendo = false;
      }
    });
  }
  function activar(i, enfocar) {
    if (i === activa || abriendo) return;
    var antes = activa; activa = i;
    hero.setAttribute('data-activa', i);
    diapos.forEach(function (dp, k) {
      dp.classList.toggle('es-activa', k === i);
      if (k === i) dp.removeAttribute('aria-hidden'); else dp.setAttribute('aria-hidden', 'true');
      var t = $('.diapo__t', dp);
      if (k === i) { t.classList.remove('visto'); void t.offsetWidth; requestAnimationFrame(function () { t.classList.add('visto'); }); }
    });
    pestanas.forEach(function (p, k) {
      p.classList.toggle('es-activa', k === i);
      p.setAttribute('aria-selected', k === i ? 'true' : 'false');
      p.setAttribute('tabindex', k === i ? '0' : '-1');
      var barra = $('.pestana__tiempo i', p);
      if (k === i) { barra.style.animation = 'none'; void barra.offsetWidth; barra.style.animation = ''; }
    });
    if (enfocar) pestanas[i].focus();
    abrirCirculo(fondos[i], fondos[antes]);
  }
  function programar() {
    clearTimeout(reloj);
    if (parado || !heroVisible) return;
    reloj = setTimeout(function () { activar(1 - activa); programar(); }, TURNO);
  }
  pestanas.forEach(function (p, i) {
    p.addEventListener('click', function () { activar(i); programar(); });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); activar(1 - activa, true); programar(); }
    });
  });
  function ponerPausa(p) {
    parado = p;
    pausa.setAttribute('aria-pressed', p ? 'true' : 'false');
    pausa.setAttribute('aria-label', p ? 'Reproducir los vídeos' : 'Pausar los vídeos');
    hero.classList.toggle('parado', p);
    if (p) { videos.forEach(function (v) { v.pause(); }); clearTimeout(reloj); }
    else {
      reproducir(); programar();
      var b = $('.pestana.es-activa .pestana__tiempo i', hero);
      if (b) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
    }
  }
  pausa.addEventListener('click', function () { ponerPausa(!parado); });
  // Deslizar con el dedo cambia de diapositiva
  var x0 = null;
  hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { activar(1 - activa); programar(); }
  }, { passive: true });
  if (quieto) ponerPausa(true); else { reproducir(); programar(); }
  $$('.diapo.es-activa .diapo__t', hero).forEach(function (t) { t.classList.add('visto'); });

  // Al salir el hero se reinicia; al volver, entra de nuevo
  if (!quieto && IO) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        heroVisible = e.isIntersecting;
        if (e.isIntersecting) {
          if (hero.classList.contains('fuera')) {
            hero.classList.remove('fuera', 'listo');
            var t = $('.diapo.es-activa .diapo__t', hero); t.classList.remove('visto');
            requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('listo'); t.classList.add('visto'); }); });
          }
          if (!parado) { reproducir(); programar(); }
        } else {
          hero.classList.add('fuera'); hero.classList.remove('listo');
          videos.forEach(function (v) { v.pause(); }); clearTimeout(reloj);
        }
      });
    }, { threshold: 0 }).observe(hero);
  }

  /* ---------- «Leer más» de los textos largos ---------- */
  $$('[data-recorte]').forEach(function (r) {
    var b = $('[data-recorte-boton]', r), txt = $('.recorte__txt', r);
    b.addEventListener('click', function () {
      var ab = r.classList.toggle('abierto');
      b.setAttribute('aria-expanded', ab ? 'true' : 'false');
      $('span', b).textContent = ab ? 'Leer menos' : 'Leer más';
    });
    // si el texto cabe entero, el botón sobra
    var comprobar = function () { b.hidden = !r.classList.contains('abierto') && txt.scrollHeight <= txt.clientHeight + 2; };
    comprobar(); window.addEventListener('resize', comprobar);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(comprobar);
  });

  /* ---------- Ventajas de la aerotermia: tarjetas que giran ---------- */
  var giros = $('[data-giros]');
  if (giros) {
    $$('[data-giro]', giros).forEach(function (g) {
      g.addEventListener('click', function (e) {
        // el clic fija el giro solo en táctil o con teclado (con ratón gira al pasar)
        if (tactil || e.detail === 0) g.setAttribute('aria-pressed', g.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    });
    // Al aparecer, giran una a una para enseñar que tienen dorso
    var demo = [];
    giros.addEventListener('visto', function () {
      if (quieto || tactil) return;
      $$('.giro', giros).forEach(function (g, i) {
        demo.push(setTimeout(function () { if (!g.matches(':hover')) g.classList.add('auto'); }, 900 + i * 420));
        demo.push(setTimeout(function () { g.classList.remove('auto'); }, 2700 + i * 420));
      });
    });
    giros.addEventListener('fuera', function () { demo.forEach(clearTimeout); demo = []; $$('.giro', giros).forEach(function (g) { g.classList.remove('auto'); }); });
  }

  /* ---------- Teselas de servicios: la línea «Ideal para» sube al pasar ---------- */
  function medirTeselas() {
    $$('.tesela').forEach(function (t) {
      var i = $('.tesela__ideal', t);
      t.style.setProperty('--h', i ? i.offsetHeight + 'px' : '0px');
    });
  }

  /* ---------- Filas desplegables de las dos tarjetas (una abierta por tarjeta) ---------- */
  $$('[data-filas]').forEach(function (grupo) {
    var botones = $$('.fila button', grupo);
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var abierta = b.getAttribute('aria-expanded') === 'true';
        botones.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); d.getElementById(o.getAttribute('aria-controls')).hidden = true; });
        if (!abierta) { b.setAttribute('aria-expanded', 'true'); d.getElementById(b.getAttribute('aria-controls')).hidden = false; }
      });
    });
  });

  /* ---------- Pasos: avanzan solos, se eligen con un clic ---------- */
  var pasos = $('[data-pasos]');
  if (pasos) {
    var bots = $$('[data-paso]', pasos), panelitos = $$('.panelito', pasos), linea = $('.pasos__linea i', pasos);
    var TP = 6000, pa = 0, rp = null, pasosVisibles = false, encima = false;
    pasos.style.setProperty('--turno-pasos', TP + 'ms');
    var elegir = function (i, enfocar) {
      pa = i;
      bots.forEach(function (b, k) {
        b.classList.toggle('es-activo', k === i); b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.setAttribute('tabindex', k === i ? '0' : '-1');
        var t = $('.paso__t', b); if (k === i) { t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
      });
      panelitos.forEach(function (p, k) { p.classList.toggle('es-activo', k === i); if (k === i) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true'); });
      linea.style.setProperty('--p', i / (bots.length - 1));
      if (enfocar) bots[i].focus();
    };
    var sigue = function () {
      clearTimeout(rp);
      pasos.classList.toggle('parado', encima);
      if (quieto || !pasosVisibles || encima) return;
      rp = setTimeout(function () { elegir((pa + 1) % bots.length); sigue(); }, TP);
    };
    bots.forEach(function (b, i) {
      b.addEventListener('click', function () { elegir(i); sigue(); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); elegir((pa + 1) % bots.length, true); sigue(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); elegir((pa + bots.length - 1) % bots.length, true); sigue(); }
      });
    });
    var panel = $('.pasos__panel', pasos);
    panel.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { encima = true; sigue(); } });
    panel.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { encima = false; sigue(); } });
    pasos.addEventListener('visto', function () { pasosVisibles = true; elegir(0); sigue(); });
    pasos.addEventListener('fuera', function () { pasosVisibles = false; clearTimeout(rp); });
    elegir(0);
  }

  /* ---------- Preguntas frecuentes: lista + panel; acordeón en el móvil ---------- */
  var faq = $('[data-faq]');
  if (faq) {
    var pfs = $$('.pf', faq), estrecho = window.matchMedia('(max-width: 899px)');
    pfs.forEach(function (pf) {
      var b = $('.pf__q button', pf);
      b.addEventListener('click', function () {
        var abierta = pf.classList.contains('es-abierta');
        if (abierta && !estrecho.matches) return;
        pfs.forEach(function (o) { o.classList.remove('es-abierta'); $('.pf__q button', o).setAttribute('aria-expanded', 'false'); $('.pf__r', o).setAttribute('aria-hidden', 'true'); });
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
      ok.hidden = false; ok.focus();
    });
  }

  /* ---------- Cookies (su aviso) ---------- */
  var cookies = $('[data-cookies]'), guardada = null;
  try { guardada = localStorage.getItem('anesco-cookies'); } catch (e) {}
  if (!guardada && !html.classList.contains('captura')) cookies.hidden = false;
  $$('[data-cookie]', cookies).forEach(function (b) {
    b.addEventListener('click', function () {
      try { localStorage.setItem('anesco-cookies', b.getAttribute('data-cookie')); } catch (e) {}
      cookies.classList.add('se-va');
      setTimeout(function () { cookies.hidden = true; }, quieto ? 0 : 450);
    });
  });

  /* ---------- Medidas tras cargar las fuentes ---------- */
  medirTeselas();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(medirTeselas);
  var anchoPrevio = window.innerWidth;
  window.addEventListener('resize', function () { if (window.innerWidth !== anchoPrevio) { anchoPrevio = window.innerWidth; medirTeselas(); } });

  requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('listo'); }); });
})();
