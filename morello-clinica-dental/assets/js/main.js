/* =====================================================================
   Morelló Clínica Dental · home, ronda 2
   ===================================================================== */
(function () {
  'use strict';
  window.MORELLO = true;

  var html = document.documentElement;
  var quieto = html.classList.contains('quieto');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var finoPuntero = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // Observa la entrada en pantalla: .en-vista mientras se ve y .visto la primera vez
  function vigilar(el, alEntrar, margen, umbral) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('en-vista', 'visto'); if (alEntrar) alEntrar(); return; }
    var primera = true;
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        el.classList.toggle('en-vista', e.isIntersecting);
        if (e.isIntersecting && primera) { primera = false; el.classList.add('visto'); if (alEntrar) alEntrar(); }
      });
    }, { rootMargin: margen || '0px 0px -12% 0px', threshold: umbral || 0 }).observe(el);
  }
  // Parte un titular en palabras (.pal) sin cambiar su texto
  function enPalabras(el) {
    if (!el || el.querySelector('.pal')) return;
    var palabras = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    palabras.forEach(function (p, i) {
      var s = document.createElement('span'); s.className = 'pal'; s.style.setProperty('--i', i); s.textContent = p;
      el.appendChild(s);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- cabecera: sombra al bajar y menú del móvil ---------- */
  var cab = $('.cabecera');
  var alBajar = function () { cab.classList.toggle('con-sombra', window.scrollY > 8); };
  window.addEventListener('scroll', alBajar, { passive: true }); alBajar();
  var menu = $('#menu-movil'), botonMenu = $('.cabecera__menu');
  function abrirMenu(abrir) {
    menu.hidden = !abrir;
    botonMenu.setAttribute('aria-expanded', String(abrir));
    document.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) { $$('nav li', menu).forEach(function (li, i) { li.style.setProperty('--n', i); }); $('.menu-movil__cerrar').focus(); }
    else botonMenu.focus();
  }
  botonMenu.addEventListener('click', function () { abrirMenu(true); });
  $('.menu-movil__cerrar').addEventListener('click', function () { abrirMenu(false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.hidden = true; botonMenu.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) abrirMenu(false); });

  /* ---------- titulares de sección: suben palabra a palabra al entrar ---------- */
  function alinear(el) {
    var palabras = el.textContent.trim().split(/\s+/), n = 0;
    var envoltura = document.createElement('span'); envoltura.className = 'alinea__texto';
    palabras.forEach(function (p, pi) {
      var w = document.createElement('span'); w.className = 'alinea__palabra';
      Array.prototype.forEach.call(p, function (ch) {
        var l = document.createElement('span'); l.className = 'alinea__letra'; l.textContent = ch;
        var a = function (s) { var x = Math.sin((n + 1) * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
        l.style.setProperty('--lg', ((a(1) - .5) * 26).toFixed(1) + 'deg');
        l.style.setProperty('--ly', ((a(2) - .5) * .3).toFixed(3) + 'em');
        l.style.setProperty('--lx', ((a(3) - .5) * .1).toFixed(3) + 'em');
        l.style.setProperty('--li', n);
        w.appendChild(l); n++;
      });
      envoltura.appendChild(w);
      if (pi < palabras.length - 1) envoltura.appendChild(document.createTextNode(' '));
    });
    var alambre = document.createElement('span'); alambre.className = 'alinea__alambre'; alambre.setAttribute('aria-hidden', 'true');
    envoltura.appendChild(alambre);
    el.textContent = ''; el.appendChild(envoltura);
    el.setAttribute('data-alinea', '');
    // cada letra se endereza cuando el alambre pasa por ella
    var total = Math.max(n - 1, 1);
    $$('.alinea__letra', el).forEach(function (l, k) { l.style.setProperty('--ld', (.12 + k / total * .75).toFixed(2) + 's'); });
    vigilar(el, null, '0px 0px -10% 0px');
  }
  $$('main h2').forEach(function (h) { if (h.closest('.panel') || h.classList.contains('servicio__titulo')) return; alinear(h); });
  // bandas cian: se subrayan al entrar
  $$('.banda').forEach(function (b) {
    var t = document.createElement('span'); t.className = 'banda__txt';
    while (b.firstChild) t.appendChild(b.firstChild);
    b.appendChild(t);
    if (b.closest('.panel') || b.closest('.hero')) return;
    b.setAttribute('data-subraya', ''); vigilar(b, null, '0px 0px -8% 0px');
  });
  $$('.cab-sec__texto, .contacto, .cita__texto, .tarjeta__campos, .sobre__texto').forEach(function (el) { el.setAttribute('data-entra', ''); vigilar(el, null, '0px 0px -8% 0px'); });

  /* ---------- horario en vivo (hora de Madrid; ?ahora=d-h.mm para probar) ---------- */
  var HORARIO = { 1: [[600, 840], [960, 1200]], 2: [[600, 840]], 3: [[540, 840], [960, 1200]], 4: [[960, 1200]], 5: [[600, 840]] };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function ahoraMadrid() {
    var m = location.search.match(/[?&]ahora=(\d)-(\d{1,2})(?:\.(\d{2}))?/);
    if (m) return { d: +m[1], min: +m[2] * 60 + (+m[3] || 0) };
    try {
      var p = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { var x = p.find(function (q) { return q.type === t; }); return x ? x.value : ''; };
      var dias = { dom: 0, lun: 1, mar: 2, mié: 3, mie: 3, jue: 4, vie: 5, sáb: 6, sab: 6 };
      return { d: dias[get('weekday').replace('.', '').toLowerCase()], min: +get('hour') * 60 + +get('minute') };
    } catch (e) { var n = new Date(); return { d: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
  }
  var hora = function (min) { var h = Math.floor(min / 60), m = min % 60; return h + ':' + String(m).padStart(2, '0'); };
  var falta = function (min) { var h = Math.floor(min / 60), m = min % 60; return (h ? h + ' h' + (m ? ' ' : '') : '') + (m ? m + ' min' : ''); };
  function estado() {
    var a = ahoraMadrid(), hoy = HORARIO[a.d] || [];
    for (var i = 0; i < hoy.length; i++) if (a.min >= hoy[i][0] && a.min < hoy[i][1]) return { a: a, abierto: true, corto: 'Abierto ahora, hasta las ' + hora(hoy[i][1]), largo: 'Abierto ahora · cierra en ' + falta(hoy[i][1] - a.min) };
    for (var j = 0; j < hoy.length; j++) if (a.min < hoy[j][0]) return { a: a, abierto: false, corto: 'Cerrado. Abrimos hoy a las ' + hora(hoy[j][0]), largo: 'Cerrado · abrimos en ' + falta(hoy[j][0] - a.min) };
    for (var k = 1; k <= 7; k++) {
      var dd = (a.d + k) % 7;
      if (HORARIO[dd]) { var t = 'Cerrado. Abrimos ' + (k === 1 ? 'mañana' : 'el ' + DIAS[dd]) + ' a las ' + hora(HORARIO[dd][0][0]); return { a: a, abierto: false, corto: t, largo: t.replace('. ', ' · ') }; }
    }
  }
  var agenda = $('[data-agenda]');
  function pintarEstado() {
    var e = estado(); if (!e) return;
    $$('[data-estado-texto]').forEach(function (el) { el.textContent = e.corto; });
    $$('[data-horario-estado]').forEach(function (el) { el.textContent = e.largo; });
    $$('[data-estado], [data-horario-estado]').forEach(function (el) { el.setAttribute('data-abierto', e.abierto ? 'si' : 'no'); });
    var wa = $('[data-wa-estado]'); if (wa && !wa.classList.contains('escribe')) wa.textContent = e.abierto ? 'en línea' : 'responde en horario de consulta';
    if (agenda) {
      $$('.agenda__fila[data-dia]', agenda).forEach(function (f) { f.classList.toggle('es-hoy', +f.getAttribute('data-dia') === e.a.d); });
      var dentro = HORARIO[e.a.d] && e.a.min >= 540 && e.a.min <= 1200;
      agenda.classList.toggle('con-ahora', !!dentro);
      if (dentro) {
        agenda.style.setProperty('--ahora', ((e.a.min / 60 - 9) / 11 * 100).toFixed(2));
        var linea = $('[data-ahora] span', agenda); if (linea) linea.textContent = 'Ahora · ' + hora(e.a.min);
      }
    }
  }
  pintarEstado(); setInterval(pintarEstado, 30000);
  if (agenda) vigilar(agenda, pintarEstado);

  /* ---------- hero: la lámpara del gabinete alumbra a los doctores y escribe el titular ---------- */
  var hero = $('.hero'), fig = $('[data-gabinete]'), h1 = $('.hero__titulo');
  enPalabras(h1);
  (function lampara() {
    var svg = $('.lampara svg', fig), cabeza = $('.lampara__cabeza', fig);
    var palabrasH1 = $$('.pal', h1), bandaHero = $('.hero .banda');
    var titular = function () { palabrasH1.forEach(function (p) { p.classList.add('encendida'); }); h1.classList.add('visto'); hero.classList.add('titulado'); if (bandaHero) { bandaHero.setAttribute('data-subraya', ''); bandaHero.classList.add('visto'); } };
    if (!svg || !cabeza) { titular(); return; }
    if (quieto) { hero.classList.add('encendida'); titular(); return; }
    if (bandaHero) bandaHero.setAttribute('data-subraya', '');
    setTimeout(titular, 4000); // por si algo falla, el titular nunca se queda apagado
    var cur = null, dest = null, raf = 0, manual = false, ultimo = 0, gira = null, paso = 0, enVista = true, rapidez = .085;
    var apoyado = function () { return getComputedStyle($('.hero__texto')).position === 'absolute'; };
    // dónde quedan sus caras en la foto, en % de su ancho y su alto
    var CARAS = { joan: [18.6, 24], carmen: [36.1, 39] };
    function objetivo(nombre) {
      var r = fig.getBoundingClientRect();
      if (nombre === 'titulo') { var t = h1.getBoundingClientRect(); return { x: t.left - r.left + t.width * .42, y: t.top - r.top + t.height * .5 }; }
      return { x: r.width * CARAS[nombre][0] / 100, y: r.height * CARAS[nombre][1] / 100 };
    }
    function pivote() {
      var p = svg.createSVGPoint(); p.x = 110; p.y = 100;
      var q = p.matrixTransform(svg.getScreenCTM()), r = fig.getBoundingClientRect();
      return { x: q.x - r.left, y: q.y - r.top };
    }
    function pintar() {
      var pv = pivote(), ang = Math.atan2(cur.y - pv.y, cur.x - pv.x) * 180 / Math.PI - 90;
      ang = Math.max(-32, Math.min(32, ang * .55));
      cabeza.style.transform = 'rotate(' + ang.toFixed(1) + 'deg)';
    }
    function bucle() {
      raf = 0;
      if (!cur || !dest) return;
      cur.x += (dest.x - cur.x) * rapidez; cur.y += (dest.y - cur.y) * rapidez;
      pintar();
      if (Math.hypot(dest.x - cur.x, dest.y - cur.y) > .4) raf = requestAnimationFrame(bucle);
    }
    function ir(p) { dest = p; if (!cur) cur = { x: p.x, y: p.y - 40 }; if (!raf) raf = requestAnimationFrame(bucle); }
    var RECORRIDO = ['joan', 'carmen', 'titulo'];
    function recorrer() {
      clearTimeout(gira);
      if (manual || !enVista) return;
      var lista = apoyado() ? RECORRIDO : RECORRIDO.slice(0, 2);
      ir(objetivo(lista[paso % lista.length]));
      paso++;
      gira = setTimeout(recorrer, paso <= lista.length ? 2600 : 4200);
    }
    // se enciende: parpadeo del led y la luz escribe el titular palabra a palabra; luego alumbra a los doctores
    function escribir(fin) {
      var i = 0, f = fig.getBoundingClientRect(), ap = apoyado();
      rapidez = .22;
      (function siguiente() {
        if (i >= palabrasH1.length) { rapidez = .085; titular(); setTimeout(fin, 700); return; }
        var w = palabrasH1[i];
        if (ap) { var r = w.getBoundingClientRect(); ir({ x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height * .55 }); }
        setTimeout(function () { w.classList.add('encendida'); }, ap ? 140 : 0);
        i++; setTimeout(siguiente, ap ? 190 : 120);
      })();
    }
    setTimeout(function () {
      hero.classList.add('encendiendo', 'encendida');
      if (!apoyado()) ir(objetivo('joan'));
      setTimeout(function () { escribir(recorrer); }, 450);
    }, 350);
    // con el ratón, la lámpara sigue al cursor
    if (finoPuntero) {
      $('.hero__escena').addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = fig.getBoundingClientRect();
        manual = true; ultimo = Date.now(); clearTimeout(gira);
        ir({ x: e.clientX - r.left, y: e.clientY - r.top });
        setTimeout(function () { if (Date.now() - ultimo >= 3400) { manual = false; recorrer(); } }, 3500);
      });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      enVista = e[0].isIntersecting; hero.classList.toggle('fuera', !enVista);
      if (enVista && !manual) recorrer(); else clearTimeout(gira);
    }).observe(hero);
    window.addEventListener('resize', function () { if (dest) { cur = null; ir(objetivo(apoyado() ? 'titulo' : 'joan')); } });
  })();

  /* ---------- cualquier «Pedir cita de…» deja el tratamiento escrito en la tarjeta ---------- */
  var msg = $('#f-msg');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-tratamiento]');
    if (!a || !msg) return;
    var t = a.getAttribute('data-tratamiento');
    var resto = msg.value.replace(/^Me interesa: [^\n]*\n?/, '');
    msg.value = t ? 'Me interesa: ' + t + '.' + (resto ? '\n' + resto : '') : resto;
  });

  /* ---------- valores bajo el hero ---------- */
  vigilar($('.valores'), null, '0px');

  /* ---------- servicios: en el móvil, cada grupo es una fila que se desliza con flechas y barra ---------- */
  var marcoServ = $('[data-servicios]');
  if (marcoServ) {
    vigilar(marcoServ, null, '0px 0px -10% 0px');
    var pintores = $$('[data-pista]', marcoServ).map(function (pista) {
      var mando = pista.nextElementSibling, barra = $('[data-barra]', mando), mandos = $$('.mando', mando);
      var pintar = function () {
        var total = pista.scrollWidth, ancho = pista.clientWidth, x = pista.scrollLeft;
        barra.style.setProperty('--p', total > ancho ? ((x + ancho) / total).toFixed(3) : 1);
        mandos[0].disabled = x < 4; mandos[1].disabled = x + ancho > total - 4;
      };
      mandos.forEach(function (m) {
        m.addEventListener('click', function () {
          var paso = $('.servicio', pista).getBoundingClientRect().width + 14;
          pista.scrollBy({ left: +m.getAttribute('data-paso') * paso, behavior: quieto ? 'auto' : 'smooth' });
        });
      });
      pista.addEventListener('scroll', pintar, { passive: true });
      pintar();
      return pintar;
    });
    var pintarPistas = function () { pintores.forEach(function (p) { p(); }); };
    window.addEventListener('resize', pintarPistas);

    // «Ver más servicios»: las siete fichas salen del botón como cartas que se reparten, y vuelven a él al cerrar
    var verOtros = $('[data-ver-otros]'), otros = $('[data-otros]'), txtOtros = $('[data-ver-otros-txt]');
    var repartiendo = 0;
    var desdeBoton = function (f, i) {
      var b = $('.ver-otros__ico', verOtros).getBoundingClientRect(), r = f.getBoundingClientRect();
      var dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height / 2 - (r.top + r.height / 2);
      return 'translate(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px) scale(.16) rotate(' + ((i % 2 ? 1 : -1) * (10 + i * 3)) + 'deg)';
    };
    var marcar = function (abierto) {
      verOtros.setAttribute('aria-expanded', String(abierto));
      txtOtros.textContent = abierto ? 'Ver menos servicios' : 'Ver más servicios';
    };
    var abrirOtros = function () {
      otros.removeAttribute('hidden'); marcar(true); pintarPistas();
      // si el botón está en la mitad de abajo, la página sube un poco para ver el reparto
      var bv = verOtros.getBoundingClientRect();
      if (bv.top > innerHeight * .45) window.scrollBy({ top: bv.top - 110, behavior: quieto ? 'auto' : 'smooth' });
      if (quieto) return;
      var fichas = $$('.servicio', otros);
      clearTimeout(repartiendo);
      fichas.forEach(function (f) { f.style.transition = 'none'; f.style.transform = ''; });
      var salidas = fichas.map(desdeBoton);
      fichas.forEach(function (f, i) { f.style.transform = salidas[i]; f.style.opacity = '0'; });
      void otros.offsetWidth;
      fichas.forEach(function (f, i) {
        var d = 80 + i * 75;
        f.style.transition = 'transform 1s cubic-bezier(.22, 1.18, .36, 1) ' + d + 'ms, opacity .45s ease ' + d + 'ms';
        f.style.transform = ''; f.style.opacity = '';
      });
      clearTimeout(repartiendo);
      repartiendo = setTimeout(function () { fichas.forEach(function (f) { f.style.transition = ''; }); }, 1700);
    };
    var cerrarOtros = function () {
      marcar(false);
      var fichas = $$('.servicio', otros), n = fichas.length;
      var fin = function () { otros.setAttribute('hidden', 'until-found'); fichas.forEach(function (f) { f.style.transition = ''; f.style.transform = ''; f.style.opacity = ''; }); };
      clearTimeout(repartiendo);
      if (quieto) { fin(); return; }
      fichas.forEach(function (f, i) {
        var d = (n - 1 - i) * 45;
        f.style.transition = 'transform .6s cubic-bezier(.55, 0, .7, .3) ' + d + 'ms, opacity .35s ease ' + (d + 250) + 'ms';
        f.style.transform = desdeBoton(f, i); f.style.opacity = '0';
      });
      repartiendo = setTimeout(fin, (n - 1) * 45 + 650);
    };
    verOtros.addEventListener('click', function () { if (otros.hasAttribute('hidden')) abrirOtros(); else cerrarOtros(); });
    // si el buscador del navegador encuentra algo dentro, se abre sin animación
    otros.addEventListener('beforematch', function () { marcar(true); setTimeout(pintarPistas, 0); });
  }

  /* ---------- sobre nosotros: las salas de la clínica pasan solas (pausa con el cursor encima) ---------- */
  var visita = $('[data-visita]');
  if (visita) {
    var fotosSala = $$('.sobre__foto', visita), salas = $$('.sala', visita), salaActual = 0;
    var verSala = function (i) {
      salaActual = (i + salas.length) % salas.length;
      fotosSala.forEach(function (f, k) { f.classList.toggle('activa', k === salaActual); });
      salas.forEach(function (s, k) { s.setAttribute('aria-pressed', String(k === salaActual)); });
      // reinicia la barra de tiempo de la sala nueva
      visita.classList.remove('corre'); void visita.offsetWidth; if (!quieto) visita.classList.add('corre');
    };
    salas.forEach(function (s, k) { s.addEventListener('click', function () { verSala(k); }); });
    // cuando se llena la barra, pasa a la siguiente sala
    visita.addEventListener('animationend', function (e) { if (e.animationName === 'tiempo-sala') verSala(salaActual + 1); });
    visita.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') visita.classList.add('pausa'); });
    visita.addEventListener('pointerleave', function () { visita.classList.remove('pausa'); });
    visita.addEventListener('focusin', function (e) { if (e.target.matches(':focus-visible')) visita.classList.add('pausa'); });
    visita.addEventListener('focusout', function () { visita.classList.remove('pausa'); });
    if (!quieto && 'IntersectionObserver' in window) new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { if (!visita.classList.contains('corre')) visita.classList.add('corre'); visita.classList.remove('fuera'); }
      else visita.classList.add('fuera');
    }, { threshold: .35 }).observe(visita);
  }

  /* ---------- preguntas: una tablet con la conversación de WhatsApp ---------- */
  var tableta = $('[data-tableta]'), secPreguntas = $('#preguntas');
  if (tableta) {
    vigilar(secPreguntas, null, '0px 0px -10% 0px');
    var items = $$('.wa-item', tableta), chat = $('[data-chat]', tableta), waEstado = $('[data-wa-estado]');
    var ahoraTxt = function () { try { return new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()); } catch (e) { var n = new Date(); return n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0'); } };
    $$('[data-hora]', tableta).forEach(function (h) { h.textContent = ahoraTxt(); });
    var VISTOS = '<svg class="burbuja__vistos" viewBox="0 0 16 10" aria-hidden="true"><path d="m1 5.5 3 3L10 1.5M6.5 8.5l1 .5L14.5 1.5"/></svg>';
    var ocupado = false, tocado = false;
    // la conversación no tiene scroll: lo último queda abajo y lo viejo sale por arriba, como en el móvil
    var alFinal = function () { while (chat.children.length > 9) chat.removeChild(chat.firstElementChild); };
    var decir = function (quien, contenido) {
      var p = document.createElement('p');
      p.className = 'burbuja burbuja--' + quien + ' nueva';
      p.innerHTML = contenido + '<span class="burbuja__hora">' + ahoraTxt() + (quien === 'yo' ? VISTOS : '') + '</span>';
      chat.appendChild(p); alFinal(); return p;
    };
    var escribiendo = function () { var d = document.createElement('div'); d.className = 'escribiendo'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<span></span><span></span><span></span>'; chat.appendChild(d); alFinal(); return d; };
    var siguiente = function () {
      items.forEach(function (it) { it.classList.remove('siguiente'); });
      var s = items.find(function (it) { return !it.classList.contains('leida'); });
      if (s) s.classList.add('siguiente');
    };
    // la flecha de «Toque una pregunta» apunta a la lista: abajo en el móvil, a la izquierda con la tablet en horizontal
    var ayudaWa = $('.wa-lista__ayuda', tableta), textoAyuda = $('[data-ayuda-texto]', tableta);
    var orientar = function () {
      var horizontal = window.innerWidth >= 760;
      ayudaWa.style.setProperty('--hacia', '90deg'); ayudaWa.style.setProperty('--empuje-x', '0px'); ayudaWa.style.setProperty('--empuje-y', '3px');
      textoAyuda.textContent = 'Toque una pregunta y le respondemos';
      return horizontal;
    };
    var horizontal = orientar(); window.addEventListener('resize', function () { horizontal = orientar(); });
    async function preguntar(i) {
      var it = items[i];
      if (ocupado || !it) return;
      ocupado = true;
      items.forEach(function (o) { o.classList.toggle('activo', o === it); });
      it.classList.add('leida'); siguiente();
      var previa = $('.wa-item__previa', it), resp = $('.wa-item__respuesta', it);
      previa.textContent = resp.textContent.trim();
      var mia = decir('yo', $('.wa-item__pregunta', it).textContent);
      if (!quieto) {
        await espera(550); var v = $('.burbuja__vistos', mia); if (v) v.classList.add('leido');
        waEstado.classList.add('escribe'); var antes = waEstado.textContent; waEstado.textContent = 'escribiendo…';
        var t = escribiendo(); await espera(1100); t.remove();
        waEstado.classList.remove('escribe'); waEstado.textContent = antes;
      }
      decir('clinica', resp.innerHTML);
      ocupado = false;
    }
    chat.innerHTML = '<span class="wa__fecha">Hoy</span>';
    decir('clinica', 'Hola, somos Morelló Clínica Dental. Toque una de las preguntas ' + (horizontal ? 'de la izquierda' : 'de arriba') + ' y le respondemos aquí.');
    siguiente();
    items.forEach(function (it, i) { it.addEventListener('click', function () { tocado = true; preguntar(i); }); });
    if (quieto) preguntar(0);
    else if ('IntersectionObserver' in window) {
      var ioChat = new IntersectionObserver(function (e) { if (!e[0].isIntersecting) return; ioChat.disconnect(); setTimeout(function () { if (!tocado) preguntar(0); }, 1400); }, { threshold: .45 });
      ioChat.observe(tableta);
    }
  }

  /* ---------- la tarjeta de cita: turnos según el horario, sello y correo ya escrito ---------- */
  var form = $('#formulario');
  if (form) {
    var fecha = $('#f-fecha', form), aviso = $('[data-turnos-aviso]', form);
    var manana = $('input[value="Por la mañana"]', form), tarde = $('input[value="Por la tarde"]', form);
    var hoyISO = (function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
    fecha.min = hoyISO;
    fecha.addEventListener('change', function () {
      manana.disabled = false; tarde.disabled = false; aviso.textContent = '';
      if (!fecha.value) return;
      var p = fecha.value.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]).getDay(), tr = HORARIO[d];
      if (!tr) { aviso.textContent = 'La clínica no abre los ' + DIAS[d] + 's: elija otro día.'; manana.disabled = tarde.disabled = true; manana.checked = tarde.checked = false; return; }
      var hayM = tr.some(function (t) { return t[0] < 900; }), hayT = tr.some(function (t) { return t[0] >= 900; });
      manana.disabled = !hayM; tarde.disabled = !hayT;
      if (!hayM) manana.checked = false; if (!hayT) tarde.checked = false;
      aviso.textContent = 'Los ' + DIAS[d] + ' atendemos ' + tr.map(function (t) { return 'de ' + hora(t[0]) + ' a ' + hora(t[1]); }).join(' y ') + '.';
    });
    var nota = $('[data-form-nota]', form), notaBase = nota.textContent;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mal1 = null;
      $$('input[required]', form).forEach(function (i) {
        var mal = i.type === 'checkbox' ? !i.checked : !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
        i.setAttribute('aria-invalid', String(mal));
        if (mal && !mal1) mal1 = i;
      });
      if (mal1) {
        nota.classList.add('es-error');
        nota.textContent = mal1.type === 'checkbox' ? 'Para enviar la solicitud, acepte las políticas de privacidad.' : 'Revise el campo «' + (form.querySelector('label[for="' + mal1.id + '"]') || {}).textContent.replace('*', '').trim() + '».';
        mal1.focus(); return;
      }
      nota.classList.remove('es-error'); nota.textContent = notaBase;
      var v = function (n) { var el = form.elements[n]; return el ? (el.value || '').trim() : ''; };
      var turno = (form.querySelector('input[name="turno"]:checked') || {}).value || '';
      var trat = (v('mensaje').match(/^Me interesa: ([^.\n]+)/) || [])[1];
      var cuerpo = ['Nombre: ' + v('nombre'), 'Teléfono: ' + v('telefono'), 'Correo: ' + v('correo')];
      if (v('fecha')) cuerpo.push('Fecha deseada: ' + v('fecha').split('-').reverse().join('/'));
      if (turno) cuerpo.push('Horario deseado: ' + turno.toLowerCase());
      if (v('mensaje')) cuerpo.push('', v('mensaje'));
      var url = 'mailto:info@morelloclinicadental.com?subject=' + encodeURIComponent('Cita Online' + (trat ? ': ' + trat : '')) + '&body=' + encodeURIComponent(cuerpo.join('\n'));
      form.classList.remove('sellada'); void form.offsetWidth; form.classList.add('sellada');
      setTimeout(function () { location.href = url; }, quieto ? 0 : 850);
    });
    $$('input[required]', form).forEach(function (i) { i.addEventListener('input', function () { i.removeAttribute('aria-invalid'); }); });
  }
})();
