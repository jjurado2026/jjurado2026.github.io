/* JAP & Asociados — interacción de la homepage
   Sin dependencias. Todo el contenido es legible sin JS. */
(function () {
  'use strict';
  var html = document.documentElement;
  if (/[?&]captura=1/.test(window.location.search)) html.classList.add('captura');

  /* 1. Secuencia de entrada del hero: arranca cuando las fuentes están listas */
  var arrancado = false;
  function arranca() {
    if (arrancado) return;
    arrancado = true;
    html.classList.add('cargado');
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(arranca);
  } else {
    arranca();
  }
  setTimeout(arranca, 1200);

  /* 2. Cabecera compacta y barra móvil al pasar el hero */
  var cab = document.getElementById('cabecera');
  var barra = document.getElementById('barra-movil');
  var hero = document.querySelector('.hero');
  function alScroll() {
    var y = window.scrollY;
    cab.classList.toggle('cab--compacta', y > 8);
    if (barra && hero) barra.classList.toggle('visible', y > hero.offsetTop + hero.offsetHeight - 80);
  }
  alScroll();
  window.addEventListener('scroll', alScroll, { passive: true });

  /* 2b. Paralaje suave del hero con el puntero (solo ratón y sin movimiento reducido) */
  var visual = document.querySelector('.hero__visual');
  var finoYConMovimiento = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hero && visual && finoYConMovimiento) {
    var pendiente = null;
    hero.addEventListener('pointermove', function (ev) {
      var r = hero.getBoundingClientRect();
      var px = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      var py = ((ev.clientY - r.top) / r.height - 0.5) * 2;
      if (pendiente) return;
      pendiente = requestAnimationFrame(function () {
        visual.style.setProperty('--px', px.toFixed(3));
        visual.style.setProperty('--py', py.toFixed(3));
        pendiente = null;
      });
    });
    hero.addEventListener('pointerleave', function () {
      visual.style.setProperty('--px', '0');
      visual.style.setProperty('--py', '0');
    });
  }

  /* 3. Revelado de bloques al entrar en el viewport */
  var animados = document.querySelectorAll('[data-anim]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visto');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    animados.forEach(function (el) { io.observe(el); });
  } else {
    animados.forEach(function (el) { el.classList.add('visto'); });
  }

  /* 4. Menú: submenús (táctil y teclado) y panel móvil */
  var burger = document.querySelector('.cab__burger');
  var nav = document.getElementById('nav');
  var items = Array.prototype.slice.call(document.querySelectorAll('.nav__item--sub'));

  function cierraTodos(salvo) {
    items.forEach(function (it) {
      if (it === salvo) return;
      it.classList.remove('abierto');
      var b = it.querySelector('button[aria-expanded]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  items.forEach(function (it) {
    var btn = it.querySelector('button[aria-expanded]');
    if (!btn) return;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      var abrir = !it.classList.contains('abierto');
      cierraTodos(it);
      it.classList.toggle('abierto', abrir);
      btn.setAttribute('aria-expanded', String(abrir));
    });
  });

  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.nav__item--sub')) cierraTodos();
  });

  function alternaMovil(forzar) {
    var abierto = typeof forzar === 'boolean' ? forzar : !nav.classList.contains('abierto');
    nav.classList.toggle('abierto', abierto);
    burger.setAttribute('aria-expanded', String(abierto));
    burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('sin-scroll', abierto);
    if (!abierto) cierraTodos();
  }
  burger.addEventListener('click', function () { alternaMovil(); });

  /* Al pulsar un enlace interno del menú móvil, se cierra el panel */
  nav.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#"]');
    if (a && nav.classList.contains('abierto')) alternaMovil(false);
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    cierraTodos();
    if (nav.classList.contains('abierto')) {
      alternaMovil(false);
      burger.focus();
    }
  });

  var mq = window.matchMedia('(min-width: 1081px)');
  var alCambiar = function () {
    if (mq.matches && nav.classList.contains('abierto')) alternaMovil(false);
  };
  if (mq.addEventListener) mq.addEventListener('change', alCambiar);
  else if (mq.addListener) mq.addListener(alCambiar);

  /* 5. Pestañas por perfil */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var indicador = document.querySelector('.tabs__indicador');
  var paneles = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  function colocaIndicador(tab) {
    if (!indicador || !tab) return;
    var lista = tab.parentNode;
    var x = tab.offsetLeft - lista.scrollLeft;
    indicador.style.transform = 'translateX(' + x + 'px) scaleX(' + (tab.offsetWidth / 100) + ')';
  }

  function activa(tab, enfocar) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute('aria-selected', String(sel));
      t.setAttribute('tabindex', sel ? '0' : '-1');
    });
    paneles.forEach(function (p) {
      var sel = p.id === tab.getAttribute('aria-controls');
      p.hidden = !sel;
      p.classList.toggle('activo', sel);
    });
    colocaIndicador(tab);
    if (enfocar) tab.focus();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { activa(t, false); });
    t.addEventListener('keydown', function (ev) {
      var j = null;
      if (ev.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (ev.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (ev.key === 'Home') j = 0;
      if (ev.key === 'End') j = tabs.length - 1;
      if (j !== null) { ev.preventDefault(); activa(tabs[j], true); }
    });
  });
  if (tabs.length) {
    var inicial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    activa(inicial, false);
    window.addEventListener('resize', function () { colocaIndicador(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0]); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { colocaIndicador(inicial); });
  }

  /* 6. Formularios (prototipo: sin envío real) */
  function mensaje(el, texto, ok) {
    if (!el) return;
    el.textContent = texto;
    el.classList.toggle('es-error', !ok);
  }
  var formPdf = document.getElementById('form-pdf');
  if (formPdf) {
    formPdf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = formPdf.querySelector('input[type="email"]');
      var estado = formPdf.querySelector('.captura__estado');
      if (!email.value || !email.checkValidity()) {
        mensaje(estado, 'Escribe un email válido para recibir el informe.', false);
        email.focus();
        return;
      }
      mensaje(estado, 'Listo. Te enviamos el informe en PDF a ' + email.value + '.', true);
      formPdf.reset();
    });
  }
  var formContacto = document.getElementById('form-contacto');
  if (formContacto) {
    formContacto.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var estado = formContacto.querySelector('.form__estado');
      var faltan = Array.prototype.filter.call(formContacto.querySelectorAll('[required]'), function (c) {
        return c.type === 'checkbox' ? !c.checked : !c.value.trim() || !c.checkValidity();
      });
      if (faltan.length) {
        mensaje(estado, 'Revisa los campos marcados: nombre, email, teléfono y la política de privacidad.', false);
        faltan[0].focus();
        return;
      }
      mensaje(estado, 'Consulta enviada. Te respondemos en menos de 24 horas laborables.', true);
      formContacto.reset();
    });
  }
})();
