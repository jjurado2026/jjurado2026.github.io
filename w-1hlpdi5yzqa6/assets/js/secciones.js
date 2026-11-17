/* Reggae School Madrid — v4.4
   El cartel (con quién han tocado), el carril del profesorado y la sección
   en curso en el menú. Solo transform. Sin JS, en captura (?ss) o con
   movimiento reducido: todo se lee quieto. */
(() => {
  'use strict';
  const captura = document.documentElement.classList.contains('ss');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Cartel: cada compás, el eco dub salta a un cabeza de cartel ----------
     Un compás de one drop a 75 BPM = 3,2 s. Pasa solo, no depende del scroll. Se para
     con el ratón encima, fuera de pantalla y con la pestaña oculta. Con movimiento
     reducido o en captura (?ss), los ecos se quedan quietos y a la vista. */
  const cartel = document.querySelector('[data-cartel]');
  if (cartel && !captura) {
    const cabezas = [...cartel.querySelectorAll('[data-eco-cartel]')];
    let n = -1;
    let enPantalla = false;
    let encima = false;
    const lanzar = () => {
      if (!enPantalla || encima || reducido.matches || document.hidden) return;
      n = (n + 1) % cabezas.length;
      cabezas.forEach((c, i) => c.classList.toggle('suena', i === n));
    };
    cartel.addEventListener('pointerenter', () => { encima = true; });
    cartel.addEventListener('pointerleave', () => { encima = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const antes = enPantalla;
        enPantalla = e.isIntersecting;
        if (enPantalla) cartel.classList.add('entra');
        if (enPantalla && !antes && n < 0) setTimeout(lanzar, 1400); // tras entrar las líneas
      }, { threshold: 0.2 }).observe(cartel);
    } else { enPantalla = true; cartel.classList.add('entra'); }
    setInterval(lanzar, 3200);
  }

  /* ---------- Carril del profesorado: avanza solo, sin flechas ----------
     Cada dos compases de one drop a 75 BPM (6,4 s). Se para con el ratón
     encima, con el foco dentro o al tocarlo, y no corre con movimiento reducido. */
  const carril = document.querySelector('[data-carril]');
  if (carril) {
    const pista = carril.querySelector('.carril__pista');
    let parado = false;
    let visible = false;
    let reanudar = 0;
    const parar = () => { parado = true; clearTimeout(reanudar); };
    const seguir = () => {
      clearTimeout(reanudar);
      reanudar = setTimeout(() => { if (!carril.contains(document.activeElement)) parado = false; }, 2400);
    };
    ['pointerenter', 'focusin', 'pointerdown', 'wheel'].forEach((ev) => carril.addEventListener(ev, parar, { passive: true }));
    ['pointerleave', 'focusout', 'pointerup'].forEach((ev) => carril.addEventListener(ev, seguir, { passive: true }));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(carril);
    }

    const avanzar = () => {
      if (parado || !visible || captura || reducido.matches || document.hidden) return;
      const max = carril.scrollWidth - carril.clientWidth;
      if (max <= 4) return;
      const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
      const paso = pista.firstElementChild.offsetWidth + gap;
      if (carril.scrollLeft >= max - 4) carril.scrollTo({ left: 0, behavior: 'smooth' });
      else carril.scrollBy({ left: paso, behavior: 'smooth' });
    };
    setInterval(avanzar, 6400);
  }

  /* ---------- Menú: marca la sección en la que estás ---------- */
  const enlaces = [...document.querySelectorAll('.nav__lista a[href^="#"]')];
  const secciones = enlaces.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secciones.length) {
    // Solo la sección que cruza la franja central; fuera de ellas (reserva, pie…), ninguna
    const vistas = new Set();
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => (e.isIntersecting ? vistas.add(e.target.id) : vistas.delete(e.target.id)));
      enlaces.forEach((a) => {
        if (vistas.has(a.getAttribute('href').slice(1))) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secciones.forEach((s) => io.observe(s));
  }

})();
