/* Reggae School Madrid — páginas interiores (v4.4)
   Barra fija del móvil, aviso de páginas que llegan más adelante (solo en
   el prototipo) y el canal en solo de cada curso, con el riddim real. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const captura = document.documentElement.classList.contains('ss');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Aviso: «esta página llega en la semana…» ---------- */
  const aviso = $('[data-aviso-pronto]');
  let tAviso = 0;
  $$('[data-pronto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (!aviso) return;
    aviso.textContent = a.dataset.pronto;
    aviso.classList.add('visible');
    clearTimeout(tAviso);
    tAviso = setTimeout(() => aviso.classList.remove('visible'), 3200);
  }));

  /* ---------- Barra fija del móvil: aparece al dejar atrás la cabecera de la página ---------- */
  const fija = $('[data-fija-pag]');
  const apertura = $('main > section');
  if (fija && apertura && 'IntersectionObserver' in window && !captura) {
    const pie = $('.pie');
    const reserva = $('#reserva');
    let trasApertura = false, enPie = false, enReserva = false;
    const pintar = () => {
      const visible = trasApertura && !enPie && !enReserva && !document.body.classList.contains('menu-abierto');
      fija.classList.toggle('visible', visible);
      fija.setAttribute('aria-hidden', String(!visible));
      const enlace = $('a', fija);
      if (enlace) enlace.tabIndex = visible ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { trasApertura = !e.isIntersecting && e.boundingClientRect.top < 0; pintar(); }).observe(apertura);
    if (pie) new IntersectionObserver(([e]) => { enPie = e.isIntersecting; pintar(); }).observe(pie);
    if (reserva) new IntersectionObserver(([e]) => { enReserva = e.isIntersecting; pintar(); }, { rootMargin: '0px 0px -15% 0px' }).observe(reserva);
  }

  /* ---------- El canal en solo: «Escucha la guitarra», «Escucha la línea de bajo»… ----------
     Usa el mismo riddim de la home (window.Riddim). Solo suena con un clic. Cada botón
     hace sonar su canal (si suena otro, cambia a este) y mueve el vúmetro de su
     sección; se para al salir esa sección de la pantalla o al ocultar la pestaña.
     El texto del botón no cambia (no encoge bajo el cursor): cambian el icono y aria-pressed. */
  const botones = $$('[data-solo]');
  const R = window.Riddim;
  if (botones.length) {
    if (!R || !R.soportado) {
      botones.forEach((b) => { b.hidden = true; });
    } else {
      const tapas = $$('[data-vu-tapa]');
      const tapaDe = (c) => tapas.filter((t) => (t.dataset.vuTapa || botones[0].dataset.solo) === c);
      let actual = null;
      const marcar = () => botones.forEach((b) => b.setAttribute('aria-pressed', String(R.sonando && b.dataset.solo === actual)));
      const limpiar = () => tapas.forEach((t) => { t.style.transform = ''; });
      botones.forEach((b) => b.addEventListener('click', () => {
        if (R.sonando && actual === b.dataset.solo) { R.parar(); return; }
        actual = b.dataset.solo;
        limpiar();
        R.tocar(actual);
        marcar();
      }));
      R.alCambiar((suena) => { marcar(); if (!suena) limpiar(); });
      if (tapas.length) {
        R.alNivel((n) => {
          if (reducido.matches || !actual) return;
          const v = Math.min(1, .05 + (n[actual] || 0) * .92);
          tapaDe(actual).forEach((t) => { t.style.transform = `scaleY(${(1 - v).toFixed(3)})`; });
        });
      }
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
          const b = $('[data-solo]', e.target);
          if (!e.isIntersecting && b && R.sonando && b.dataset.solo === actual) R.parar();
        }), { threshold: 0 });
        new Set(botones.map((b) => b.closest('section')).filter(Boolean)).forEach((s) => io.observe(s));
      }
      document.addEventListener('visibilitychange', () => { if (document.hidden && R.sonando) R.parar(); });
    }
  }

  /* ---------- Formulario de contacto: validación en línea (en WordPress lo recibe el plugin) ---------- */
  const fc = $('[data-form-contacto]');
  if (fc) {
    const ok = $('[data-form-contacto-ok]', fc);
    const reglas = {
      nombre: (el) => el.value.trim() !== '',
      email: (el) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()),
      instrumento: (el) => el.value !== '',
      rgpd: (el) => el.checked,
    };
    const revisar = (nombre) => {
      const el = fc.elements[nombre];
      const bien = reglas[nombre](el);
      el.setAttribute('aria-invalid', String(!bien));
      const err = $(`[data-error-c="${nombre}"]`, fc);
      if (err) err.hidden = bien;
      return bien;
    };
    Object.keys(reglas).forEach((n) => fc.elements[n].addEventListener('change', () => revisar(n)));
    fc.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fallos = Object.keys(reglas).filter((n) => !revisar(n));
      if (fallos.length) { fc.elements[fallos[0]].focus(); return; }
      const boton = fc.querySelector('[type="submit"]');
      const fallo = $('[data-form-fallo]', fc);
      boton.disabled = true;
      if (fc.dataset.envio) {
        try {
          const r = await fetch(fc.dataset.envio, { method: 'POST', body: new FormData(fc), credentials: 'same-origin' });
          const j = await r.json();
          if (!j.success) throw new Error('rechazado');
          if (fallo) fallo.hidden = true;
        } catch (err) {
          boton.disabled = false;
          if (fallo) { fallo.hidden = false; fallo.focus(); }
          return;
        }
      }
      if (ok) { ok.hidden = false; }
    });
  }

  /* ---------- Equipo docente: un profesor cada vez; pasa solo hasta que eliges uno ----------
     Cuatro compases (12,8 s). Se para con el ratón encima, con el foco dentro, fuera de
     pantalla y con movimiento reducido. Flechas, Inicio y Fin como en cualquier pestaña. */
  $$('[data-pestas]').forEach((lista) => {
    const tabs = $$('[role="tab"]', lista);
    const paneles = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    let fijo = false, encima = false, visible = false;
    const elegir = (i, foco = false) => {
      tabs.forEach((t, j) => {
        const si = j === i;
        t.setAttribute('aria-selected', String(si));
        t.tabIndex = si ? 0 : -1;
        if (paneles[j]) paneles[j].hidden = !si;
      });
      if (foco) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { fijo = true; elegir(i); });
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const k = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault(); fijo = true; elegir(k % n, true);
      });
    });
    elegir(0);
    const zona = lista.closest('section');
    zona.addEventListener('pointerenter', () => { encima = true; });
    zona.addEventListener('pointerleave', () => { encima = false; });
    zona.addEventListener('focusin', () => { encima = true; });
    zona.addEventListener('focusout', () => { encima = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .3 }).observe(zona);
    setInterval(() => {
      if (fijo || encima || !visible || captura || reducido.matches || document.hidden) return;
      const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      elegir((i + 1) % tabs.length);
    }, 12800);
  });

  /* ---------- Tiras de fotos (data-carril): avanzan solas cada dos compases ---------- */
  $$('[data-carril]').forEach((carril) => {
    if (document.body.classList.contains('inicio') && carril.closest('.profes')) return; // la home ya lo hace en secciones.js
    const pista = $('.carril__pista', carril);
    if (!pista) return;
    let parado = false, visible = false, t = 0;
    const parar = () => { parado = true; clearTimeout(t); };
    const seguir = () => { clearTimeout(t); t = setTimeout(() => { parado = false; }, 2400); };
    ['pointerenter', 'focusin', 'pointerdown', 'wheel'].forEach((ev) => carril.addEventListener(ev, parar, { passive: true }));
    ['pointerleave', 'focusout', 'pointerup'].forEach((ev) => carril.addEventListener(ev, seguir, { passive: true }));
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .4 }).observe(carril);
    setInterval(() => {
      if (parado || !visible || captura || reducido.matches || document.hidden) return;
      const max = carril.scrollWidth - carril.clientWidth;
      if (max <= 4) return;
      const paso = pista.firstElementChild.offsetWidth + (parseFloat(getComputedStyle(pista).columnGap) || 0);
      if (carril.scrollLeft >= max - 4) carril.scrollTo({ left: 0, behavior: 'smooth' });
      else carril.scrollBy({ left: paso, behavior: 'smooth' });
    }, 6400);
  });

  /* ---------- Contacto: llega con el curso elegido (?instrumento=Armonía online) ---------- */
  const sel = $('#c-inst');
  const qi = new URLSearchParams(location.search).get('instrumento');
  if (sel && qi) { const o = [...sel.options].find((x) => x.text === qi); if (o) sel.value = o.value; }

  /* ---------- Aviso de cookies: aceptar y rechazar al mismo nivel; se puede cambiar después ----------
     La elección se guarda en el navegador. En WordPress, Google Analytics solo se carga si es «aceptadas». */
  const avisoC = $('[data-cookies]');
  if (avisoC) {
    const CLAVE = 'rsm-cookies';
    const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
    const estado = $$('[data-cookies-estado]');
    const pintarEstado = () => estado.forEach((e) => { e.textContent = { aceptadas: 'analíticas aceptadas', rechazadas: 'analíticas rechazadas' }[leer()] || 'sin elegir'; });
    const abrir = (si) => { avisoC.hidden = !si; document.body.classList.toggle('cookies-abierto', si); };
    /* Google Analytics 4: solo con el código puesto en «Datos de la escuela» y las analíticas aceptadas */
    const GA = (window.RSM && /^G-[A-Z0-9]+$/.test(window.RSM.ga4 || '')) ? window.RSM.ga4 : '';
    let gaCargado = false;
    const cargarGA = () => {
      if (!GA || captura) return;
      window['ga-disable-' + GA] = false;
      if (gaCargado) return;
      gaCargado = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA);
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
      document.head.appendChild(s);
    };
    const guardar = (v) => {
      try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: no se recuerda */ }
      if (v === 'aceptadas') cargarGA(); else if (GA) window['ga-disable-' + GA] = true;
      abrir(false); pintarEstado();
    };
    if (leer() === 'aceptadas') cargarGA();
    $('[data-cookies-aceptar]', avisoC).addEventListener('click', () => guardar('aceptadas'));
    $('[data-cookies-rechazar]', avisoC).addEventListener('click', () => guardar('rechazadas'));
    $$('[data-cookies-abrir]').forEach((b) => b.addEventListener('click', () => { abrir(true); $('[data-cookies-aceptar]', avisoC).focus(); }));
    pintarEstado();
    if (!leer() && !captura) abrir(true);
  }

  /* ---------- LED de las listas: se encienden al entrar (la clase la pone main.js) ---------- */
  if (captura || reducido.matches) $$('.leds').forEach((l) => l.classList.add('visto'));
})();
