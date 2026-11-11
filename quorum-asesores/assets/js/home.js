/* Quorum Asesores JA · propuesta de home · ronda 5 */
(function () {
  'use strict';
  window.QUORUM = true;
  var raiz = document.documentElement;
  var quieto = raiz.classList.contains('quieto');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var tactil = window.matchMedia && matchMedia('(hover: none)').matches;

  /* Observador de entrada: añade .visto una vez */
  function alVer(els, fn, umbral, margen) {
    els = els.filter(Boolean);
    if (!('IntersectionObserver' in window) || quieto) { els.forEach(function (e) { e.classList.add('visto'); fn && fn(e); }); return; }
    var io = new IntersectionObserver(function (ent) {
      ent.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('visto'); fn && fn(x.target); io.unobserve(x.target); } });
    }, { threshold: umbral || 0.2, rootMargin: margen || '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  /* Visibilidad continua (para pausar bucles fuera de pantalla) */
  function enVista(el, fn) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (ent) { fn(ent[0].isIntersecting); }, { threshold: 0.05 }).observe(el);
  }
  /* Letras dentro de palabras (las palabras no se parten al saltar de línea) */
  function partirLetras(el) {
    var texto = el.textContent.replace(/\s+/g, ' ').trim(), i = 0;
    el.setAttribute('aria-label', texto);
    el.textContent = '';
    texto.split(' ').forEach(function (w, n, todas) {
      var pal = document.createElement('span'); pal.className = 'pal'; pal.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(w, function (c) {
        var l = document.createElement('span'); l.className = 'l'; l.style.setProperty('--i', i++); l.textContent = c; pal.appendChild(l);
      });
      el.appendChild(pal); if (n < todas.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return i;
  }
  function partirPalabras(el) {
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    texto.split(' ').forEach(function (w, n, todas) {
      var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', Math.min(n, 40)); s.textContent = w;
      el.appendChild(s); if (n < todas.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  function hora() { var d = new Date(); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  /* ─── Botones «asientos»: el relleno nace del tercer asiento y cubre el botón ─── */
  $$('.boton').forEach(function (b) {
    var fondo = document.createElement('span'); fondo.className = 'boton__fondo'; fondo.setAttribute('aria-hidden', 'true');
    var capa = document.createElement('span'); capa.className = 'boton__capa'; capa.setAttribute('aria-hidden', 'true');
    $$('.boton__asientos, .boton__txt, .boton__ico', b).forEach(function (n) { capa.appendChild(n.cloneNode(true)); });
    b.insertBefore(fondo, b.firstChild); b.appendChild(capa);
    function medir() {
      var r = b.getBoundingClientRect(), a = $('.boton__asientos i:last-child', b);
      if (!r.width || !a) return;
      var ra = a.getBoundingClientRect(), x = ra.left + ra.width / 2 - r.left, y = r.height / 2;
      fondo.style.left = x + 'px';
      b.style.setProperty('--b-escala', ((Math.hypot(Math.max(x, r.width - x), y) + 4) * 2 / 10).toFixed(2));
    }
    b.addEventListener('pointerenter', medir); b.addEventListener('focus', medir);
  });
  /* El icono del teléfono suena de vez en cuando */
  if (!quieto) {
    var tels = $$('[data-suena]');
    setInterval(function () {
      tels.filter(function (t) { var r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width && !t.matches(':hover'); })
        .forEach(function (t) { t.classList.remove('suena'); void t.offsetWidth; t.classList.add('suena'); setTimeout(function () { t.classList.remove('suena'); }, 1000); });
    }, 6500);
  }

  /* ─── Menú del móvil ─── */
  var abrir = $('.cab__abrir'), menuMovil = $('#menu-movil');
  if (abrir && menuMovil) {
    abrir.addEventListener('click', function () { var a = abrir.getAttribute('aria-expanded') === 'true'; abrir.setAttribute('aria-expanded', String(!a)); menuMovil.hidden = a; });
    $$('a', menuMovil).forEach(function (l) { l.addEventListener('click', function () { abrir.setAttribute('aria-expanded', 'false'); menuMovil.hidden = true; }); });
  }

  /* ─── Títulos: las letras suben de su renglón; ola al pasar el cursor ─── */
  var titulos = $$('.titulo');
  titulos.forEach(function (t) {
    var n = partirLetras(t); t.setAttribute('data-letras', '');
    t.addEventListener('pointerenter', function (e) {
      if (quieto || e.pointerType !== 'mouse' || !t.classList.contains('visto') || t.classList.contains('ola')) return;
      t.classList.add('ola'); setTimeout(function () { t.classList.remove('ola'); }, n * 26 + 800);
    });
  });
  alVer(titulos, null, 0.35);
  /* Subtítulos: palabras en cadena */
  var subtitulos = $$('.cabecera__txt').filter(function (p) { return p.tagName === 'P' && !p.children.length; });
  subtitulos.forEach(function (p) { partirPalabras(p); p.setAttribute('data-palabras', ''); });
  alVer(subtitulos, null, 0.3);

  /* ─── Hero «el grabado»: un medallón de guilloché (el grabado de billetes, cheques y escrituras) dibujado en cuatro lienzos.
         Las capas giran muy despacio en sentidos contrarios y el dibujo cambia al cruzarse; con el cursor encima se paran
         y el dibujo sigue al cursor; con cada frase de su slider dan un giro. Solo se anima transform. ─── */
  var hero = $('[data-hero]'), grabado = $('[data-grabado]');
  var lemasCaja = $('[data-lemas]'), lemas = $$('[data-lemas] .lema'), selectores = $$('[data-ir]'), pausaBtn = $('[data-pausa]');
  var actual = -1, pausadoAMano = false, encima = false, foco = false, heroVisible = true;
  var TAU = Math.PI * 2;
  /* vel: grados por segundo en reposo · cursor: grados de lado a lado del hero · salto: giro con cada frase */
  var AJUSTE = { marco: { vel: .22, cursor: 2, salto: 8 }, a: { vel: .5, cursor: 7, salto: 30 }, b: { vel: -.5, cursor: -7, salto: -30 }, centro: { vel: -.7, cursor: 5, salto: 22 } };
  var capas = grabado ? $$('[data-capa]', grabado).map(function (el, i) {
    var tipo = el.getAttribute('data-capa'), aj = AJUSTE[tipo];
    el.style.setProperty('--n', { centro: 0, a: 1, b: 1, marco: 2 }[tipo]);
    return { tipo: tipo, lienzo: $('canvas', el), vel: aj.vel, cursor: aj.cursor, salto: aj.salto, reposo: 0, giro: 0, desde: 0, hasta: 0, t0: 0, dur: 1 };
  }) : [];
  lemas.forEach(partirLetras);
  if (lemasCaja) lemasCaja.classList.add('vivo');

  /* Dibujo: cada capa es un haz de curvas cerradas r(θ) desplazadas en fase, con un brillo cónico de sus azules */
  function trazo(x, R, f, pasos) {
    x.beginPath();
    for (var s = 0; s <= pasos; s++) {
      var t = s / pasos * TAU, r = f(t) * R;
      if (s) x.lineTo(r * Math.cos(t), r * Math.sin(t)); else x.moveTo(r * Math.cos(t), r * Math.sin(t));
    }
    x.closePath(); x.stroke();
  }
  function aro(x, r) { x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); }
  function brillo(x, colores) {
    if (!x.createConicGradient) return colores[1];
    var g = x.createConicGradient(-Math.PI / 2, 0, 0);
    colores.forEach(function (c, i) { g.addColorStop(i / (colores.length - 1), c); });
    return g;
  }
  var BLANCO = ['rgba(255,255,255,.5)', 'rgba(255,255,255,.92)', 'rgba(201,214,255,.6)', 'rgba(255,255,255,.92)', 'rgba(255,255,255,.5)'];
  var AZUL = ['rgba(98,132,255,.95)', 'rgba(169,185,255,.75)', 'rgba(98,132,255,.95)', 'rgba(169,185,255,.75)', 'rgba(98,132,255,.95)'];
  var dibujado = 0;
  function dibujar() {
    if (!grabado) return;
    var lado = grabado.clientWidth;
    if (!lado) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), px = Math.round(lado * dpr);
    if (Math.abs(px - dibujado) < 6) return;
    dibujado = px;
    var R = px / 2 * .985, n = lado < 300 ? 10 : lado < 460 ? 13 : 16, k = lado < 300 ? 10 : 12;
    var pasos = Math.round(Math.min(3600, Math.max(1400, lado * 5))), g = .8 * dpr;
    capas.forEach(function (c) {
      var lz = c.lienzo; lz.width = lz.height = px;
      var x = lz.getContext('2d'); x.translate(px / 2, px / 2); x.lineWidth = g; x.lineJoin = 'round';
      var i, f;
      if (c.tipo === 'marco') {
        x.strokeStyle = brillo(x, BLANCO);
        var ondas = lado < 300 ? 72 : 100;
        for (i = 0; i < 5; i++) (function (f) { trazo(x, R, function (t) { return .952 + .026 * Math.sin(ondas * t + f); }, pasos * 2); })(TAU * i / 5);
        x.lineWidth = g * 1.4; aro(x, .905 * R); aro(x, .998 * R);
      } else if (c.tipo === 'a' || c.tipo === 'b') {
        x.strokeStyle = brillo(x, c.tipo === 'a' ? BLANCO : AZUL);
        for (i = 0; i < n; i++) {
          f = TAU * (i + (c.tipo === 'b' ? .5 : 0)) / n;
          (function (f) { trazo(x, R, function (t) { return .645 + .15 * Math.sin(k * t + f) + .05 * Math.sin(3 * k * t - 3 * f); }, pasos); })(f);
        }
      } else {
        x.strokeStyle = brillo(x, BLANCO);
        var m = lado < 300 ? 8 : 12;
        for (i = 0; i < m; i++) (function (f) { trazo(x, R, function (t) { return .335 + .07 * Math.sin(8 * t + f) * Math.cos(16 * t); }, pasos); })(TAU * i / m);
        x.lineWidth = g * 1.2; aro(x, .23 * R);
      }
    });
  }

  /* Movimiento: reposo (se para con el cursor, el foco, fuera de pantalla y con la pausa) + cursor + giro de cada frase */
  function parar() { if (hero) hero.classList.toggle('parado', pausadoAMano || encima || foco || !heroVisible); }
  function curva(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  var pCursor = 0, pObjetivo = 0, marcha = 1, ultimo = 0, enBucle = false;
  function pintar() {
    capas.forEach(function (c) { c.lienzo.style.transform = 'rotate(' + (c.reposo + c.giro + c.cursor * pCursor).toFixed(3) + 'deg)'; });
  }
  function bucle(t) {
    var dt = ultimo ? Math.min(.05, (t - ultimo) / 1000) : 0; ultimo = t;
    var quiere = pausadoAMano || encima || foco ? 0 : 1;
    marcha += (quiere - marcha) * Math.min(1, dt * 2.5);
    pCursor += (pObjetivo - pCursor) * Math.min(1, dt * 3.2);
    capas.forEach(function (c) {
      c.reposo += c.vel * marcha * dt;
      var q = Math.max(0, Math.min(1, (t - c.t0) / c.dur));
      c.giro = c.desde + (c.hasta - c.desde) * curva(q);
    });
    pintar();
    if (heroVisible) requestAnimationFrame(bucle); else { enBucle = false; ultimo = 0; }
  }
  function arrancar() { if (!quieto && !enBucle && capas.length) { enBucle = true; requestAnimationFrame(bucle); } }
  function girar(veces, dur) {
    var ahora = performance.now();
    capas.forEach(function (c) { c.desde = c.giro; c.hasta = c.giro + c.salto * veces; c.t0 = ahora; c.dur = dur; });
  }

  /* Frases: la raya de la frase activa se llena en 7 s y pasa a la siguiente */
  function correr(n) {
    selectores.forEach(function (s) { s.classList.remove('corre'); });
    if (quieto || !selectores[n]) return;
    void selectores[n].offsetWidth;
    selectores[n].classList.add('corre');
  }
  function cambiarLema(n, primera) {
    lemas.forEach(function (l, i) {
      if (i === n) {
        if (primera || quieto) l.classList.add('esta');
        else setTimeout(function () { l.classList.add('esta'); }, 380);
      } else if (l.classList.contains('esta')) {
        l.classList.remove('esta');
        if (!quieto) { l.classList.add('sale'); setTimeout(function () { l.classList.remove('sale'); }, 800); }
      }
    });
  }
  function ir(n) {
    if (!hero || !lemas[n] || n === actual) return;
    var primera = actual < 0;
    selectores.forEach(function (s, i) { s.setAttribute('aria-current', i === n ? 'true' : 'false'); });
    cambiarLema(n, primera);
    if (!primera && !quieto) girar(1, 2200);
    actual = n; correr(n);
  }

  if (hero && lemas.length) {
    dibujar();
    var tRedibujo;
    window.addEventListener('resize', function () { clearTimeout(tRedibujo); tRedibujo = setTimeout(dibujar, 160); });
    selectores.forEach(function (s, i) {
      s.addEventListener('click', function () { ir(i); });
      var raya = $('.selector__raya i', s);
      if (raya) raya.addEventListener('animationend', function () { if (s.classList.contains('corre')) ir((i + 1) % lemas.length); });
    });
    if (!tactil) {
      hero.addEventListener('mouseenter', function () { encima = true; parar(); });
      hero.addEventListener('mouseleave', function () { encima = false; parar(); });
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = hero.getBoundingClientRect();
        pObjetivo = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2));
      });
    }
    hero.addEventListener('focusin', function (e) { var t = e.target; foco = !!(t.matches && t.matches(':focus-visible')); parar(); });
    hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { foco = false; parar(); } });
    enVista(hero, function (v) { heroVisible = v; parar(); if (v) arrancar(); });
    if (pausaBtn) pausaBtn.addEventListener('click', function () {
      pausadoAMano = !pausadoAMano;
      pausaBtn.setAttribute('aria-pressed', String(pausadoAMano));
      pausaBtn.setAttribute('aria-label', pausadoAMano ? 'Reanudar las frases y el grabado' : 'Pausar las frases y el grabado');
      parar();
    });
    if (quieto) { hero.classList.add('listo'); ir(0); }
    else {
      /* Entrada: las capas llegan giradas y se encajan mientras aparecen de dentro afuera */
      capas.forEach(function (c) { c.giro = -c.salto * 1.6; });
      pintar();
      var t0 = performance.now() + 120;
      capas.forEach(function (c) { c.desde = c.giro; c.hasta = 0; c.dur = 2400; c.t0 = t0; });
      requestAnimationFrame(function () { hero.classList.add('listo'); ir(0); arrancar(); });
    }
  }

  /* ─── Valores ─── */
  $$('.valor').forEach(function (v, i) { v.style.setProperty('--n', i); });
  alVer([$('.valores')], null, 0.01, '0px');

  /* ─── Servicios: las cuatro fichas entran al verse ─── */
  alVer([$('[data-servicios]')], null, 0.12);

  /* «Consultar»: deja escrito el interés en el mensaje */
  var mensaje = $('[data-mensaje]');
  $$('[data-consulta]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!mensaje) return;
      var linea = 'Me interesa: ' + b.getAttribute('data-consulta') + '. ';
      if (!mensaje.value.trim() || /^Me interesa:[^.]*\.\s*$/.test(mensaje.value)) mensaje.value = linea;
      mensaje.dispatchEvent(new Event('input'));
      setTimeout(function () { mensaje.focus({ preventScroll: true }); var l = mensaje.value.length; mensaje.setSelectionRange(l, l); }, 900);
    });
  });

  /* ─── Le podemos ayudar: el tambor de servicios y las luces ─── */
  var ayudaSec = $('.ayuda'), tambor = $('[data-tambor]');
  alVer([ayudaSec], null, 0.25);
  enVista(ayudaSec, function (v) { ayudaSec.classList.toggle('en-vista', v); });
  if (tambor) (function () {
    var caras = $$('.tambor__cara', tambor), i = 0, visible = false;
    caras[0].classList.add('esta');
    enVista(tambor, function (v) { visible = v; });
    if (!quieto) setInterval(function () {
      if (!visible || document.hidden) return;
      var a = caras[i]; i = (i + 1) % caras.length; var b = caras[i];
      a.classList.remove('esta'); a.classList.add('sale'); setTimeout(function () { a.classList.remove('sale'); }, 800);
      b.classList.add('esta');
      tambor.classList.remove('cambio'); void tambor.offsetWidth; tambor.classList.add('cambio');
    }, 2600);
  })();

  /* ─── Quorum Asesores JA: la lámina que gira y la declaración con marcador ─── */
  var volteo = $('[data-volteo]');
  if (volteo) (function () {
    var boton = $('.volteo__boton', volteo), leyendas = $$('.volteo__leyenda', volteo), puntos = $$('.volteo__puntos i', volteo);
    var girada = false, visible = false, encima = false;
    function girar() {
      girada = !girada; volteo.classList.toggle('girada', girada);
      leyendas.forEach(function (l, k) { l.classList.toggle('esta', k === (girada ? 1 : 0)); });
      puntos.forEach(function (p, k) { p.classList.toggle('esta', k === (girada ? 1 : 0)); });
    }
    var t = null;
    function programar() { clearInterval(t); if (!quieto) t = setInterval(function () { if (visible && !encima && !document.hidden) girar(); }, 6000); }
    boton.addEventListener('click', function () { girar(); programar(); });
    volteo.addEventListener('pointerenter', function () { encima = true; });
    volteo.addEventListener('pointerleave', function () { encima = false; });
    enVista(volteo, function (v) { visible = v; volteo.classList.toggle('en-vista', v); });
    programar();
  })();
  var declaracion = $('[data-declaracion]');
  if (declaracion) {
    var k = 0;
    $$('.marca', declaracion).forEach(function (m) {
      var palabras = m.textContent.split(/\s+/); m.textContent = '';
      palabras.forEach(function (w, j) {
        var s = document.createElement('span'); s.className = 'm'; s.style.setProperty('--i', k++); s.textContent = w; m.appendChild(s);
        if (j < palabras.length - 1) m.appendChild(document.createTextNode(' '));
      });
    });
    alVer([declaracion], null, 0.5);
  }
  alVer([$('.despacho__cuerpo'), $('[data-portada]')], null, 0.2);

  /* ─── Preguntas frecuentes: la conversación tiene su propio scroll ─── */
  var consulta = $('[data-conversacion]'), chat = $('[data-chat]');
  if (consulta && chat) (function () {
    var preguntas = $$('.pregunta', consulta), ocupado = false, usada = false;
    $$('.pregunta__boton', consulta).forEach(function (b, i) { b.style.setProperty('--n', i % 4); });
    alVer([consulta], function () { setTimeout(function () { consulta.classList.add('lista'); }, 1400); }, 0.2);
    var VISTO = '<svg class="ico visto"><use href="#i-visto"/></svg><svg class="ico visto visto--b"><use href="#i-visto"/></svg>';
    function bajar(suave) { chat.scrollTo({ top: chat.scrollHeight, behavior: suave && !quieto ? 'smooth' : 'instant' }); }
    function burbuja(clase, html) {
      var b = document.createElement('div'); b.className = 'burbuja ' + clase + (quieto ? '' : ' entra'); b.innerHTML = html;
      chat.appendChild(b); return b;
    }
    function preguntar(i, auto) {
      if (ocupado) return; ocupado = true;
      var li = preguntas[i], boton = $('.pregunta__boton', li), texto = $('.pregunta__txt', li).textContent;
      li.classList.add('leida'); if (!auto) usada = true;
      var mv = $('[data-movil]'), mr = mv.getBoundingClientRect();
      if (!auto && (mr.top < 60 || mr.bottom > innerHeight - 70)) mv.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'center' });
      var yo = burbuja('burbuja--yo', '<p></p><span class="burbuja__hora">' + hora() + ' ' + VISTO + '</span>');
      $('p', yo).textContent = texto;
      bajar(false);
      if (!quieto && !auto && boton.animate) {
        var a = boton.getBoundingClientRect(), b = yo.getBoundingClientRect();
        yo.classList.remove('entra');
        yo.animate([
          { transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')', opacity: .4 },
          { transform: 'none', opacity: 1 }
        ], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      }
      var escribe = null;
      setTimeout(function () { escribe = burbuja('burbuja--ellos burbuja--escribe', '<i></i><i></i><i></i>'); bajar(true); }, quieto ? 0 : 650);
      setTimeout(function () {
        if (escribe) escribe.remove();
        var r = $('.pregunta__r', li).cloneNode(true);
        var ellos = burbuja('burbuja--ellos', r.innerHTML + '<span class="burbuja__hora">' + hora() + '</span>');
        yo.classList.add('leido'); ocupado = false;
        // Que se vea el principio de la respuesta (la pregunta anterior queda arriba, a un gesto de distancia)
        var arriba = ellos.offsetTop - yo.offsetHeight - 22;
        chat.scrollTo({ top: Math.min(arriba, chat.scrollHeight), behavior: quieto ? 'instant' : 'smooth' });
      }, quieto ? 0 : 1700);
    }
    preguntas.forEach(function (li, i) { $('.pregunta__boton', li).addEventListener('click', function () { preguntar(i, false); }); });
    if (!quieto && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { io.disconnect(); setTimeout(function () { if (!usada) preguntar(0, true); }, 1300); }
      }, { threshold: 0.45 });
      io.observe(consulta);
      var vis = false; enVista(consulta, function (v) { vis = v; });
      setInterval(function () {
        if (!vis || document.hidden) return;
        var sig = preguntas.filter(function (p) { return !p.classList.contains('leida') && !p.matches(':hover'); })[0];
        if (!sig) return; sig.classList.remove('llama'); void sig.offsetWidth; sig.classList.add('llama');
      }, 2600);
    }
  })();

  /* ─── Formulario: barra de avance, aviso del mínimo y confirmación ─── */
  var cont = $('[data-formulario]'), form = $('[data-form]');
  var contactoSec = $('.contacto');
  alVer([contactoSec], null, 0.15);
  enVista(contactoSec, function (v) { contactoSec.classList.toggle('en-vista', v); });
  if (cont && form) (function () {
    var f = form.elements, aviso = $('[data-aviso]', form), avance = $('[data-avance]', cont), cuenta = $('[data-cuenta]', form);
    var hecho = $('[data-hecho]', cont), minimo = $('[data-minimo]', form), minimoTxt = $('[data-minimo-txt]', form);
    var REGLAS = {
      name: function (v) { return v.trim().length > 1; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      phone: function (v) { return v.replace(/\D/g, '').length >= 9; },
      message: function (v) { return v.trim().length >= 20; }
    };
    function caja(c) { return c.closest('.campo') || c.closest('.casilla'); }
    function estado() {
      var n = 0;
      Object.keys(REGLAS).forEach(function (k) { var ok = REGLAS[k](f[k].value); caja(f[k]).classList.toggle('bien', ok); if (ok) n++; });
      if (f.verificacion.checked) n++;
      avance.style.setProperty('--p', (n / 5).toFixed(2)); cuenta.textContent = n;
      var largo = f.message.value.trim().length;
      minimo.style.setProperty('--m', Math.min(largo / 20, 1).toFixed(2));
      minimoTxt.textContent = largo >= 20 ? 'Mínimo cumplido' : largo ? 'Faltan ' + (20 - largo) + ' caracteres' : 'Mínimo 20 caracteres';
      return n;
    }
    $$('input, textarea', form).forEach(function (c) {
      c.addEventListener('input', function () { caja(c).classList.remove('mal'); estado(); });
      c.addEventListener('change', function () { caja(c).classList.remove('mal'); estado(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var primero = null;
      Object.keys(REGLAS).forEach(function (k) { var ok = REGLAS[k](f[k].value); caja(f[k]).classList.toggle('mal', !ok); if (!ok && !primero) primero = f[k]; });
      caja(f.verificacion).classList.toggle('mal', !f.verificacion.checked); if (!f.verificacion.checked && !primero) primero = f.verificacion;
      if (primero) { aviso.textContent = 'Revise los campos marcados.'; primero.focus(); return; }
      aviso.textContent = '';
      hecho.hidden = false; void hecho.offsetWidth; cont.classList.add('enviado');
      setTimeout(function () { form.reset(); estado(); $('[data-otra]', hecho).focus({ preventScroll: true }); }, quieto ? 0 : 700);
    });
    $('[data-otra]', hecho).addEventListener('click', function () {
      cont.classList.remove('enviado');
      setTimeout(function () { hecho.hidden = true; f.name.focus({ preventScroll: true }); }, quieto ? 0 : 700);
    });
    estado();
  })();

  /* ─── Plano: las ondas del despacho solo laten cuando se ve ─── */
  var plano = $('.plano');
  enVista(plano, function (v) { plano.classList.toggle('en-vista', v); });
})();
