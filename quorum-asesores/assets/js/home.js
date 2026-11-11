/* Quorum Asesores JA · propuesta de home · ronda 6 */
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

  /* ─── Hero «tres frases, tres azules»: las tres frases de su slider a tamaño de cartel, cada una tan grande como cabe.
         Con cada frase, su azul (el del logo, el marino de sus botones y uno vivo) se abre en círculo desde el centro
         y las letras llegan girando una a una. La frase se para con el cursor encima de ella, de los botones o de las rayas.
         Solo se anima transform y opacity. ─── */
  var hero = $('[data-hero]');
  var lemasCaja = $('[data-lemas]'), lemas = $$('[data-lemas] .lema'), selectores = $$('[data-ir]'), pausaBtn = $('[data-pausa]');
  var tonos = $$('[data-tono]'), BASE = ['#2042C0', '#000066', '#3D5FE6'];
  var actual = -1, pausadoAMano = false, encima = false, foco = false, heroVisible = true;
  lemas.forEach(partirLetras);
  if (lemasCaja) lemasCaja.classList.add('vivo');

  /* Cada frase, tan grande como quepa en su caja sin partir palabras */
  var cajaW = 0, cajaH = 0;
  function encajar(forzar) {
    if (!lemasCaja) return;
    var W = lemasCaja.clientWidth, H = lemasCaja.clientHeight;
    if (!W || !H || (!forzar && Math.abs(W - cajaW) < 1 && Math.abs(H - cajaH) < 1)) return;
    cajaW = W; cajaH = H;
    var tope = Math.min(260, Math.max(64, innerWidth * .16));
    lemas.forEach(function (l) {
      var antes = l.style.display; l.style.display = 'block';
      var lo = 20, hi = tope;
      for (var k = 0; k < 12; k++) {
        var m = (lo + hi) / 2; l.style.fontSize = m + 'px';
        if (l.scrollWidth <= W + 1 && l.offsetHeight <= H) lo = m; else hi = m;
      }
      l.style.fontSize = Math.floor(lo * 10) / 10 + 'px';
      l.style.display = antes;
    });
  }
  /* El círculo de cada azul llega justo a las esquinas del hero */
  function medir() {
    if (!hero) return;
    var r = hero.getBoundingClientRect();
    hero.style.setProperty('--diametro', Math.ceil(Math.hypot(r.width, r.height) + 4) + 'px');
    encajar();
  }

  /* Los azules: el de la frase nueva se abre desde el centro encima del anterior */
  var zTono = 2, tTono;
  function ponerTono(n, ya) {
    var t = tonos[n]; if (!t || !hero) return;
    clearTimeout(tTono);
    hero.classList.add('con-tonos');
    if (ya || quieto) {
      tonos.forEach(function (o, i) { o.classList.toggle('esta', i === n); o.classList.remove('abre', 'va'); o.style.zIndex = ''; });
      hero.style.backgroundColor = BASE[n];
      return;
    }
    t.classList.remove('esta', 'va'); t.classList.add('abre'); t.style.zIndex = ++zTono;
    void t.offsetWidth;
    t.classList.add('va');
    tTono = setTimeout(function () { ponerTono(n, true); }, 1700);
  }

  /* Frases: la raya de la frase activa se llena en 7 s y pasa a la siguiente */
  function parar() { if (hero) hero.classList.toggle('parado', pausadoAMano || encima || foco || !heroVisible); }
  function correr(n) {
    selectores.forEach(function (s) { s.classList.remove('corre'); });
    if (quieto || !selectores[n]) return;
    void selectores[n].offsetWidth;
    selectores[n].classList.add('corre');
  }
  function cambiarLema(n, primera) {
    lemas.forEach(function (l, i) {
      if (i === n) {
        if (quieto) l.classList.add('esta');
        else setTimeout(function () { if (actual === n) { l.classList.remove('sale'); l.classList.add('esta'); } }, primera ? 260 : 420);
      } else if (l.classList.contains('esta')) {
        l.classList.remove('esta');
        if (!quieto) { l.classList.add('sale'); setTimeout(function () { l.classList.remove('sale'); }, 900); }
      }
    });
  }
  function ir(n) {
    if (!hero || !lemas[n] || n === actual) return;
    selectores.forEach(function (s, i) { s.setAttribute('aria-current', i === n ? 'true' : 'false'); });
    var primera = actual < 0;
    actual = n;
    cambiarLema(n, primera);
    ponerTono(n);
    correr(n);
  }

  if (hero && lemas.length) {
    medir();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { encajar(true); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { encajar(); }).observe(lemasCaja);
    var tMedir;
    window.addEventListener('resize', function () { clearTimeout(tMedir); tMedir = setTimeout(medir, 120); });
    selectores.forEach(function (s, i) {
      s.addEventListener('click', function () { ir(i); });
      var raya = $('.selector__raya i', s);
      if (raya) raya.addEventListener('animationend', function () { if (s.classList.contains('corre')) ir((i + 1) % lemas.length); });
    });
    /* El cursor sobre la frase (sus letras, no la caja entera), los botones o las rayas la deja quieta para leerla */
    if (!tactil) {
      var rango = document.createRange();
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var dentro = !!(e.target.closest && e.target.closest('.hero__acciones a, .hero__mandos button'));
        if (!dentro && lemas[actual]) {
          rango.selectNodeContents(lemas[actual]);
          var r = rango.getBoundingClientRect();
          dentro = e.clientX >= r.left - 12 && e.clientX <= r.right + 12 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8;
        }
        if (dentro !== encima) { encima = dentro; parar(); }
      });
      hero.addEventListener('mouseleave', function () { encima = false; parar(); });
    }
    hero.addEventListener('focusin', function (e) { var t = e.target; foco = !!(t.matches && t.matches(':focus-visible')); parar(); });
    hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { foco = false; parar(); } });
    enVista(hero, function (v) { heroVisible = v; parar(); });
    if (pausaBtn) pausaBtn.addEventListener('click', function () {
      pausadoAMano = !pausadoAMano;
      pausaBtn.setAttribute('aria-pressed', String(pausadoAMano));
      pausaBtn.setAttribute('aria-label', pausadoAMano ? 'Reanudar las frases' : 'Pausar las frases');
      parar();
    });
    if (quieto) { ponerTono(0, true); hero.classList.add('listo'); ir(0); }
    else {
      /* Entrada: sobre el marino de sus botones se abre el azul del logo y llega la primera frase */
      ponerTono(1, true);
      requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('listo'); ir(0); }); });
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
