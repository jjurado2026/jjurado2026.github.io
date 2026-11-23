/* Reggae School Madrid — v6.2
   El carril del profesorado y la sección en curso en el menú. Solo transform. Sin JS, en captura (?ss) o con
   movimiento reducido: todo se lee quieto. */
(() => {
  'use strict';
  const captura = document.documentElement.classList.contains('ss');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  const visibleEn = (el, umbral, cb) => {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold: umbral }).observe(el);
  };
  const quieto = () => captura || reducido.matches || document.hidden;

  /* ---------- Artistas: el foco con eco pasa por los 25 nombres (uno cada 2,4 s) ----------
     Al pasar el ratón (o el foco) por un nombre de la lista, el foco salta a él y espera. */
  const foco = document.querySelector('[data-foco]');
  if (foco) {
    const escenario = foco.querySelector('[data-foco-escenario]');
    const nombres = [...foco.querySelectorAll('[data-foco-n]')];
    let actual = -1, enPantalla = false, parado = false;
    const pintar = (k) => {
      if (k === actual) return;
      actual = (k + nombres.length) % nombres.length;
      const b = nombres[actual];
      const nombre = b.textContent.trim();
      nombres.forEach((x, j) => x.classList.toggle('activo', j === actual));
      escenario.querySelectorAll('.foco__nombre:not(.sale)').forEach((v) => {
        v.classList.add('sale');
        setTimeout(() => v.remove(), captura || reducido.matches ? 0 : 650);
      });
      const n = document.createElement('p');
      n.className = 'foco__nombre' + (b.classList.contains('foco__n--top') ? ' top' : '');
      n.style.setProperty('--largo', nombre.length);
      [[3, .22], [2, .42], [1, .7]].forEach(([k2, o]) => {
        const e = document.createElement('span');
        e.className = 'foco__eco'; e.style.setProperty('--n', k2); e.style.setProperty('--o', o); e.textContent = nombre;
        n.appendChild(e);
      });
      const t = document.createElement('span'); t.className = 'foco__txt'; t.textContent = nombre; n.appendChild(t);
      escenario.appendChild(n);
    };
    pintar(0);
    nombres.forEach((b, j) => {
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { parado = true; pintar(j); } });
      b.addEventListener('pointerleave', () => { parado = false; });
      b.addEventListener('focus', () => { parado = true; pintar(j); });
      b.addEventListener('blur', () => { parado = false; });
      b.addEventListener('click', () => pintar(j));
    });
    visibleEn(foco, 0.25, (v) => { enPantalla = v; });
    setInterval(() => { if (enPantalla && !parado && !quieto()) pintar(actual + 1); }, 2400);
  }

  /* ---------- Cómo se aprende: la luz recorre los cuatro pads a 75 BPM (uno por negra) ---------- */
  const secuencia = document.querySelector('[data-secuencia]');
  if (secuencia) {
    const pads = [...secuencia.querySelectorAll('[data-pad]')];
    let paso = -1, enPantalla = false;
    visibleEn(secuencia, 0.3, (v) => { enPantalla = v; if (!v) pads.forEach((pd) => pd.classList.remove('suena')); });
    setInterval(() => {
      if (!enPantalla || quieto()) return;
      paso = (paso + 1) % pads.length;
      pads.forEach((pd, i) => pd.classList.toggle('suena', i === paso));
    }, 800);
  }

  /* ---------- Quién te da clase: carrusel en 3D ----------
     Pasa solo cada seis negras (4,8 s). Solo se para con el ratón sobre la ficha (para que el botón no
     se escape) o con el foco de teclado dentro. Se cambia de profe:
     · arrastrando con el ratón o el dedo: las cartas siguen al cursor y al soltar se quedan en la más
       cercana (un tirón corto también pasa al siguiente);
     · deslizando de lado en el trackpad (un gesto = un profe);
     · pulsando una carta o con las flechas del teclado.
     Tras cambiar a mano, la cuenta de 4,8 s vuelve a empezar. */
  const flow = document.querySelector('[data-flow]');
  if (flow) {
    const cartas = [...flow.querySelectorAll('[data-flow-carta]')];
    const total = cartas.length;
    let activo = 0, enPantalla = false, sobreFicha = false, porTeclado = false, reloj = 0;
    let arrastre = null, sinClic = false;
    // Opacidad según la distancia al centro (1 · 0,72 · 0,38 · 0), continua para el arrastre
    const opacidad = (d) => (d < 1 ? 1 - 0.28 * d : d < 2 ? 0.72 - 0.34 * (d - 1) : d < 3 ? 0.38 * (3 - d) : 0);
    // f: desplazamiento en cartas mientras se arrastra (positivo = hacia el siguiente)
    const pintar = (f = 0) => cartas.forEach((c, k) => {
      let o = (((k - activo - f) % total) + total) % total;
      if (o > total / 2) o -= total;
      const d = Math.abs(o);
      c.style.setProperty('--o', o.toFixed(3));
      c.style.setProperty('--d', d.toFixed(3));
      c.style.setProperty('--op', opacidad(d).toFixed(3));
      c.style.setProperty('--z', Math.round(100 - d * 10));
      c.classList.toggle('activa', d < 0.5);
      if (f) return;
      c.querySelectorAll('.flow__ficha a').forEach((a) => { a.tabIndex = d === 0 ? 0 : -1; });
      c.querySelector('.flow__ficha').setAttribute('aria-hidden', String(d !== 0));
      c.querySelector('.flow__foto').tabIndex = d > 2 ? -1 : 0;
    });
    const programar = () => {
      clearTimeout(reloj);
      reloj = setTimeout(() => {
        if (enPantalla && !arrastre && !sobreFicha && !porTeclado && !quieto()) { activo = (activo + 1) % total; pintar(); }
        programar();
      }, 4800);
    };
    const ir = (k) => { activo = ((k % total) + total) % total; pintar(); programar(); };

    cartas.forEach((c, k) => c.querySelector('.flow__foto').addEventListener('click', () => ir(k)));
    flow.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'mouse') sobreFicha = !!e.target.closest('.flow__carta.activa .flow__ficha');
    });
    flow.addEventListener('pointerleave', () => { sobreFicha = false; });
    const deTeclado = (el) => { try { return el.matches(':focus-visible'); } catch (_) { return true; } };
    flow.addEventListener('focusin', (e) => { porTeclado = deTeclado(e.target); });
    flow.addEventListener('focusout', (e) => { if (!flow.contains(e.relatedTarget)) porTeclado = false; });
    flow.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(activo + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(activo - 1); }
    });

    // Arrastre con ratón, dedo o lápiz. Un paso = lo que se separan en pantalla dos cartas vecinas.
    const pasoPx = () => {
      const cs = getComputedStyle(flow);
      const persp = parseFloat(cs.perspective) || 1600;
      const fondo = parseFloat(cs.getPropertyValue('--fondo')) || 200;
      const paso = parseFloat(cs.getPropertyValue('--paso')) || 0.84;
      return Math.max(80, (cartas[0].offsetWidth * paso * persp) / (persp + fondo));
    };
    const soltar = (e) => {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      const { movido, f, dx } = arrastre;
      arrastre = null;
      if (!movido) return;
      flow.classList.remove('arrastrando');
      sinClic = true;
      setTimeout(() => { sinClic = false; }, 0);
      let n = Math.round(f);
      if (!n && Math.abs(dx) > 40) n = f > 0 ? 1 : -1;
      ir(activo + n);
    };
    flow.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      arrastre = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, f: 0, movido: false, paso: 0 };
    });
    flow.addEventListener('pointermove', (e) => {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { soltar(e); return; }
      const dx = e.clientX - arrastre.x0, dy = e.clientY - arrastre.y0;
      if (!arrastre.movido) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { arrastre = null; return; }
        if (Math.abs(dx) < 8) return;
        arrastre.movido = true;
        arrastre.paso = pasoPx();
        flow.classList.add('arrastrando');
        try { flow.setPointerCapture(e.pointerId); } catch (_) { /* sin captura también funciona */ }
      }
      arrastre.dx = dx;
      arrastre.f = Math.max(-3, Math.min(3, -dx / arrastre.paso));
      pintar(arrastre.f);
    });
    flow.addEventListener('pointerup', soltar);
    flow.addEventListener('pointercancel', soltar);
    // Solo cuando la pierde el propio carrusel: al tomarla él, el dedo la quita a la carta de debajo
    flow.addEventListener('lostpointercapture', (e) => { if (e.target === flow) soltar(e); });
    // Tras arrastrar no vale como clic (ni elige carta ni abre la reserva)
    flow.addEventListener('click', (e) => { if (sinClic) { e.preventDefault(); e.stopPropagation(); } }, true);
    flow.addEventListener('dragstart', (e) => e.preventDefault());

    // Trackpad: un deslizamiento de lado = un profe (la inercia del mismo gesto no cuenta)
    let ruedaUltima = 0, ruedaSuma = 0, ruedaUsada = false;
    flow.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const ahora = performance.now();
      if (ahora - ruedaUltima > 260) { ruedaSuma = 0; ruedaUsada = false; }
      ruedaUltima = ahora;
      if (ruedaUsada) return;
      ruedaSuma += e.deltaX;
      if (Math.abs(ruedaSuma) > 36) { ruedaUsada = true; ir(activo + (ruedaSuma > 0 ? 1 : -1)); }
    }, { passive: false });

    visibleEn(flow, 0.35, (v) => { enPantalla = v; });
    pintar();
    programar();
  }

  /* ---------- Lo cuentan quienes ya tocan: una voz cada vez, que entra palabra a palabra ---------- */
  const voces = document.querySelector('[data-voces]');
  if (voces) {
    const caras = [...voces.querySelectorAll('.voces__cara')];
    const citas = [...voces.querySelectorAll('.voz')];
    citas.forEach((fig) => {
      let w = 0;
      const envolver = (nodo) => [...nodo.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            const sp = document.createElement('span'); sp.className = 'w'; sp.style.setProperty('--w', w++); sp.textContent = t;
            frag.appendChild(sp);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) envolver(n);
      });
      envolver(fig.querySelector('.voz__cita'));
    });
    let i = 0, parado = false, enPantalla = false;
    const mostrar = (k, enfocar) => {
      i = (k + caras.length) % caras.length;
      caras.forEach((c, j) => { c.setAttribute('aria-selected', String(j === i)); c.tabIndex = j === i ? 0 : -1; });
      citas.forEach((f, j) => { f.hidden = j !== i; });
      if (enfocar) caras[i].focus();
    };
    caras.forEach((c, j) => {
      c.addEventListener('click', () => mostrar(j));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); mostrar(i + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); mostrar(i - 1, true); }
      });
    });
    voces.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') parado = true; });
    voces.addEventListener('pointerleave', () => { parado = false; });
    voces.addEventListener('focusin', () => { parado = true; });
    voces.addEventListener('focusout', () => { parado = false; });
    visibleEn(voces, 0.3, (v) => { enPantalla = v; });
    setInterval(() => { if (enPantalla && !parado && !quieto()) mostrar(i + 1); }, 9000);
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
