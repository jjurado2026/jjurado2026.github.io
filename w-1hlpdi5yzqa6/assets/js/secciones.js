/* Reggae School Madrid — v4
   La cinta (con quién han tocado), el carril del profesorado y la sección
   en curso en el menú. Solo transform. Sin JS, en captura (?ss), con
   movimiento reducido o con el móvil en horizontal: todo se lee quieto. */
(() => {
  'use strict';
  const captura = document.documentElement.classList.contains('ss');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const conAltura = window.matchMedia('(min-height: 521px)');

  /* ---------- La cinta: los nombres pasan bajo el cabezal con el scroll ---------- */
  const cinta = document.querySelector('[data-cinta]');
  if (cinta) {
    const caja = cinta.querySelector('[data-cinta-pistas]');
    const pistas = [...cinta.querySelectorAll('.pista')];
    const fondo = cinta.querySelector('[data-cinta-fondo]');
    let corre = false;
    let pedido = false;
    let datos = [];

    // Cada pista empieza con un extremo en el cabezal y acaba con el otro; las pares, al revés
    const medir = () => {
      const centro = caja.clientWidth / 2;
      datos = pistas.map((ul, i) => {
        const items = [...ul.children].map((li) => ({ li, x: li.offsetLeft, w: li.offsetWidth }));
        const primero = centro - (items[0].x + items[0].w / 2);
        const ultimo = centro - (items[items.length - 1].x + items[items.length - 1].w / 2);
        const [desde, hasta] = i % 2 ? [ultimo, primero] : [primero, ultimo];
        return { ul, items, desde, hasta, activo: null };
      });
    };

    const pintar = () => {
      pedido = false;
      if (!corre) return;
      const recorrido = cinta.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -cinta.getBoundingClientRect().top / recorrido));
      const centro = caja.clientWidth / 2;
      for (const d of datos) {
        const x = d.desde + (d.hasta - d.desde) * p;
        d.ul.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        let activo = null;
        for (const it of d.items) {
          if (it.x + x <= centro && it.x + it.w + x >= centro) { activo = it.li; break; }
        }
        if (activo !== d.activo) {
          if (d.activo) d.activo.classList.remove('en-cabezal');
          if (activo) activo.classList.add('en-cabezal');
          d.activo = activo;
        }
      }
      if (fondo) fondo.style.transform = `translate3d(0, ${((p - 0.5) * -3).toFixed(2)}%, 0) scale(1.08)`;
    };

    const pedir = () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(pintar);
    };

    const decidir = () => {
      const debe = !captura && !reducido.matches && conAltura.matches;
      if (debe !== corre) {
        corre = debe;
        cinta.classList.toggle('cinta--corre', corre);
        if (!corre) {
          pistas.forEach((ul) => {
            ul.style.transform = '';
            [...ul.children].forEach((li) => li.classList.remove('en-cabezal'));
          });
          if (fondo) fondo.style.transform = '';
        }
      }
      if (corre) { medir(); pintar(); }
    };

    decidir();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(decidir);
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', decidir, { passive: true });
    reducido.addEventListener('change', decidir);
    conAltura.addEventListener('change', decidir);
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
