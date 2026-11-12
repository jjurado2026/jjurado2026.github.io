/* Reggae School Madrid — v4.1
   La cinta (con quién han tocado), el carril del profesorado y la sección
   en curso en el menú. Solo transform. Sin JS, en captura (?ss) o con
   movimiento reducido: todo se lee quieto. */
(() => {
  'use strict';
  const captura = document.documentElement.classList.contains('ss');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- La cinta: los nombres pasan solos bajo el cabezal ----------
     Tres pistas a distinta velocidad, la del medio en sentido contrario. Se
     para con el ratón encima, fuera de pantalla o con la pestaña oculta. Con
     movimiento reducido o en captura (?ss), listas quietas que se leen enteras. */
  const cinta = document.querySelector('[data-cinta]');
  if (cinta) {
    const caja = cinta.querySelector('[data-cinta-pistas]');
    const pistas = [...cinta.querySelectorAll('.pista')];
    const velocidad = [-58, 46, -66]; // px por segundo; negativo, hacia la izquierda
    let viva = false;
    let visible = false;
    let parada = false;
    let raf = 0;
    let antes = 0;
    let datos = [];

    const limpiar = () => {
      pistas.forEach((ul) => {
        ul.querySelectorAll('[data-clon]').forEach((n) => n.remove());
        ul.style.transform = '';
        [...ul.children].forEach((li) => li.classList.remove('en-cabezal'));
      });
    };

    // Clona cada pista hasta cubrir la pantalla más una vuelta: así el bucle no tiene costura
    const preparar = () => {
      limpiar();
      const ancho = caja.clientWidth;
      datos = pistas.map((ul, i) => {
        const originales = [...ul.children];
        const vuelta = ul.offsetWidth;
        for (let cubierto = vuelta; cubierto < ancho + vuelta; cubierto += vuelta) {
          originales.forEach((li) => {
            const c = li.cloneNode(true);
            c.setAttribute('data-clon', '');
            c.setAttribute('aria-hidden', 'true');
            ul.appendChild(c);
          });
        }
        // Se enciende cuando el cabezal cruza la palabra, no su margen (16 px de tolerancia)
        const items = [...ul.children].map((li) => {
          const n = li.querySelector('.pista__n') || li;
          return { li, x: li.offsetLeft + (n === li ? 0 : n.offsetLeft) - 16, w: n.offsetWidth + 32 };
        });
        const v = velocidad[i % velocidad.length];
        return { ul, items, vuelta, v, x: -vuelta * [0.15, 0.5, 0.8][i % 3], activo: null };
      });
    };

    const pintar = () => {
      const centro = caja.clientWidth / 2;
      for (const d of datos) {
        d.ul.style.transform = `translate3d(${d.x.toFixed(1)}px, 0, 0)`;
        let activo = null;
        for (const it of d.items) {
          if (it.x + d.x <= centro && it.x + it.w + d.x >= centro) { activo = it.li; break; }
        }
        if (activo !== d.activo) {
          if (d.activo) d.activo.classList.remove('en-cabezal');
          if (activo) activo.classList.add('en-cabezal');
          d.activo = activo;
        }
      }
    };

    const paso = (t) => {
      const dt = Math.min(64, t - (antes || t)) / 1000;
      antes = t;
      if (!parada) {
        for (const d of datos) {
          d.x += d.v * dt;
          // Siempre entre -vuelta y 0: con una vuelta clonada de más, nunca queda hueco
          if (d.x <= -d.vuelta) d.x += d.vuelta;
          if (d.x > 0) d.x -= d.vuelta;
        }
      }
      pintar();
      raf = requestAnimationFrame(paso);
    };

    const arrancar = () => {
      cancelAnimationFrame(raf);
      antes = 0;
      if (viva && visible && !document.hidden) raf = requestAnimationFrame(paso);
    };

    const decidir = () => {
      viva = !captura && !reducido.matches;
      cinta.classList.toggle('cinta--viva', viva);
      cancelAnimationFrame(raf);
      if (viva) { preparar(); pintar(); } else { limpiar(); datos = []; }
      arrancar();
    };

    let espera = 0;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(decidir, 180); }, { passive: true });
    reducido.addEventListener('change', decidir);
    document.addEventListener('visibilitychange', arrancar);
    caja.addEventListener('pointerenter', () => { parada = true; });
    caja.addEventListener('pointerleave', () => { parada = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; arrancar(); }).observe(cinta);
    } else {
      visible = true;
    }
    decidir();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(decidir);
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
