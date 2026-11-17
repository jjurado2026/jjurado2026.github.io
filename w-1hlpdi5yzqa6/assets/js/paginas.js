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
    let trasApertura = false, enPie = false;
    const pintar = () => {
      const visible = trasApertura && !enPie && !document.body.classList.contains('menu-abierto');
      fija.classList.toggle('visible', visible);
      fija.setAttribute('aria-hidden', String(!visible));
      const enlace = $('a', fija);
      if (enlace) enlace.tabIndex = visible ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { trasApertura = !e.isIntersecting && e.boundingClientRect.top < 0; pintar(); }).observe(apertura);
    if (pie) new IntersectionObserver(([e]) => { enPie = e.isIntersecting; pintar(); }).observe(pie);
  }

  /* ---------- El canal en solo: «Escucha la línea de bajo» ----------
     Usa el mismo riddim de la home (window.Riddim). Solo suena con un clic, se
     para al salir de la cabecera y el vúmetro sigue el nivel del instrumento. */
  const botones = $$('[data-solo]');
  const R = window.Riddim;
  if (botones.length) {
    if (!R || !R.soportado) {
      botones.forEach((b) => { b.hidden = true; });
    } else {
      // El texto no cambia (el botón no encoge bajo el cursor): cambia el icono y aria-pressed
      const tapa = $('[data-vu-tapa]');
      botones.forEach((b) => b.addEventListener('click', () => {
        if (R.sonando) R.parar(); else R.tocar(b.dataset.solo);
      }));
      R.alCambiar((suena) => {
        botones.forEach((b) => b.setAttribute('aria-pressed', String(suena)));
        if (!suena && tapa) tapa.style.transform = '';
      });
      if (tapa) {
        const canal = botones[0].dataset.solo;
        R.alNivel((n) => {
          if (reducido.matches) return;
          const v = Math.min(1, .05 + (n[canal] || 0) * .92);
          tapa.style.transform = `scaleY(${(1 - v).toFixed(3)})`;
        });
      }
      const zona = botones[0].closest('section');
      if (zona && 'IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { if (!e.isIntersecting && R.sonando) R.parar(); }, { threshold: 0 }).observe(zona);
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
    fc.addEventListener('submit', (e) => {
      e.preventDefault();
      const fallos = Object.keys(reglas).filter((n) => !revisar(n));
      if (fallos.length) { fc.elements[fallos[0]].focus(); return; }
      if (ok) { ok.hidden = false; }
      fc.querySelector('[type="submit"]').disabled = true;
    });
  }

  /* ---------- LED de las listas: se encienden al entrar (la clase la pone main.js) ---------- */
  if (captura || reducido.matches) $$('.leds').forEach((l) => l.classList.add('visto'));
})();
