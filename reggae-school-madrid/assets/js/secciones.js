/* Reggae School Madrid — v9
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

  /* ---------- Hero (v9): las fotos pasan solas ----------
     El zoom lento de cada foto (4,8 s, en CSS) marca el tiempo: cuando termina, entra la siguiente en
     fundido. Fuera de pantalla o con la pestaña oculta se para (se pausa la animación). Con movimiento
     reducido o en captura no pasa sola (no hay animación que termine). */
  const historia = document.querySelector('[data-historia]');
  if (historia) {
    const fotos = [...historia.querySelectorAll('[data-historia-foto]')];
    const total = fotos.length;
    const estado = { fuera: false, oculta: document.hidden };
    const pausar = () => historia.classList.toggle('pausa', estado.fuera || estado.oculta);
    const precargar = (k) => {
      const img = fotos[k % total].querySelector('img');
      if (img && img.loading === 'lazy') img.loading = 'eager';
    };
    let actual = 0;
    const ir = (k) => {
      const antes = actual;
      actual = k % total;
      fotos.forEach((f, n) => {
        f.classList.toggle('activa', n === actual);
        f.classList.toggle('sale', n === antes && antes !== actual);
        if (n === actual) f.removeAttribute('aria-hidden'); else f.setAttribute('aria-hidden', 'true');
      });
      if (antes !== actual) setTimeout(() => fotos[antes].classList.remove('sale'), 800);
      precargar(actual + 1);
    };
    if (document.readyState === 'complete') precargar(1);
    else window.addEventListener('load', () => precargar(1), { once: true });
    historia.addEventListener('animationend', (e) => {
      if (e.animationName === 'historia-zoom' && e.target === fotos[actual].querySelector('img')) ir(actual + 1);
    });
    visibleEn(historia, 0.15, (v) => { estado.fuera = !v; pausar(); });
    document.addEventListener('visibilitychange', () => { estado.oculta = document.hidden; pausar(); });
  }

  /* ---------- Artistas (v9.1): cuatro cintas de créditos ----------
     Cada artista, con el nombre del profe que tocó con él: se saca del «Ha tocado con» de los
     profes del carrusel, así en WordPress va solo. Las cintas son copias (aria-hidden): la lista de verdad
     queda para los lectores de pantalla. Con movimiento reducido o en captura, la lista quieta. */
  const creditos = document.querySelector('[data-creditos]');
  if (creditos) {
    const caja = creditos.querySelector('.creditos');
    const items = [...creditos.querySelectorAll('.creditos__lista .credito')];
    const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\band\b/g, '&').replace(/^the\s+/, '').replace(/\s+/g, ' ').trim();
    const profes = [...document.querySelectorAll('[data-flow-carta]')].map((c) => ({
      nombre: ((c.querySelector('.flow__nombre') || {}).textContent || '').trim(),
      con: norm((c.querySelector('.flow__con') || {}).textContent || ''),
      foto: c.querySelector('.flow__foto img'),
    })).filter((pr) => pr.nombre);
    const pila = (pr) => pr.nombre.split(' ')[0];
    // Con varios profes, el nombre de pila; el completo si otro profe se llama igual (hay dos Miguel)
    const corto = (pr) => (profes.some((o) => o !== pr && pila(o) === pila(pr)) ? pr.nombre : pila(pr));
    const y = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0]);
    items.forEach((li) => {
      const art = li.querySelector('.credito__artista');
      const quien = profes.filter((pr) => pr.con.includes(norm(art.textContent)));
      if (!quien.length) return;
      const con = document.createElement('span');
      con.className = 'credito__con';
      con.textContent = `con ${quien.length === 1 ? quien[0].nombre : y(quien.map(corto))}`;
      const texto = document.createElement('span');
      texto.className = 'credito__texto';
      texto.append(art, con);
      li.replaceChildren(texto);
    });

    if (caja && !captura && !reducido.matches && items.length) {
      const cinta = document.createElement('div');
      cinta.className = 'creditos__cinta';
      cinta.setAttribute('aria-hidden', 'true');
      const FILAS = 4;
      [...Array(FILAS).keys()].forEach((fila) => {
        const f = document.createElement('div');
        f.className = `creditos__fila${fila % 2 ? ' creditos__fila--b' : ''}`;
        const pista = document.createElement('div');
        pista.className = 'creditos__pista';
        const grupo = document.createElement('ul');
        items.filter((_, k) => k % FILAS === fila).forEach((li) => grupo.appendChild(li.cloneNode(true)));
        // Tres copias: con pocos nombres por fila, así nunca queda hueco ni en pantallas muy anchas
        pista.append(grupo, grupo.cloneNode(true), grupo.cloneNode(true));
        f.appendChild(pista);
        cinta.appendChild(f);
      });
      caja.appendChild(cinta);
      caja.classList.add('en-cinta');
      // La misma velocidad en todas las filas (unos 38 px por segundo), mida lo que mida cada una
      const medir = () => cinta.querySelectorAll('.creditos__pista').forEach((p) => {
        const ancho = p.scrollWidth / 3;
        if (ancho > 0) p.style.setProperty('--dur', `${Math.max(24, ancho / 38).toFixed(1)}s`);
      });
      let medida = false;
      visibleEn(caja, 0, (v) => {
        caja.classList.toggle('pausa', !v);
        if (v && !medida) { medida = true; medir(); }
      });
    }
  }

  /* ---------- Quién te da clase: carrusel en 3D ----------
     Pasa solo cada seis negras (4,8 s). Solo se para con el ratón sobre la ficha (para que el botón no
     se escape) o con el foco de teclado dentro. Se cambia de profe:
     · arrastrando con el ratón o el dedo: las cartas siguen al cursor y al soltar se quedan en la más
       cercana (un tirón corto también pasa al siguiente);
     · deslizando de lado en el trackpad (un gesto = un profe);
     · pulsando una carta, con las flechas de los lados (v9) o con las del teclado.
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
    flow.querySelectorAll('[data-flow-paso]').forEach((b) => b.addEventListener('click', () => ir(activo + Number(b.dataset.flowPaso))));
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

  /* ---------- Lo cuentan quienes ya tocan (v9): tarjetas en fila que se deslizan ----------
     Scroll de lado nativo (dedo y trackpad) que encaja en cada tarjeta; con el ratón, además, se arrastran.
     Las flechas y las caras llevan a cada una. Pasan solas cada ocho negras (6,4 s) mientras están a la vista
     y nadie las toca; tras tocarlas, esperan 12 s. Con movimiento reducido o en captura, no pasan solas. */
  const voces = document.querySelector('[data-voces]');
  const riel = voces && voces.querySelector('[data-voces-carril]');
  if (riel) {
    const pista = riel.querySelector('.voces__pista');
    const tarjetas = [...riel.querySelectorAll('.voz')];
    const n = tarjetas.length;
    const tira = voces.querySelector('[data-voces-caras]');
    const caras = [];
    let i = 0, objetivo = null, ultimoToque = -1e9, encima = false, enPantalla = false;
    const tocado = () => { ultimoToque = performance.now(); };
    const pad = () => parseFloat(getComputedStyle(pista).paddingLeft) || 0;
    const maximo = () => riel.scrollWidth - riel.clientWidth;
    const marcar = (k) => caras.forEach((b, j) => b.setAttribute('aria-current', String(j === k)));
    const cercana = () => {
      const x = riel.scrollLeft + pad();
      let m = 0, d = Infinity;
      tarjetas.forEach((t, k) => { const dd = Math.abs(t.offsetLeft - x); if (dd < d) { d = dd; m = k; } });
      return m;
    };
    const ir = (k) => {
      i = ((k % n) + n) % n;
      marcar(i);
      const x = Math.max(0, Math.min(tarjetas[i].offsetLeft - pad(), maximo()));
      if (Math.abs(x - riel.scrollLeft) < 2) { objetivo = null; return; }
      objetivo = i;
      riel.scrollTo({ left: x, behavior: reducido.matches ? 'auto' : 'smooth' });
    };
    const siguiente = () => ir(riel.scrollLeft >= maximo() - 4 ? 0 : i + 1);
    const anterior = () => ir(riel.scrollLeft <= 4 ? n - 1 : i - 1);

    if (tira) {
      tarjetas.forEach((t, k) => {
        const img = t.querySelector('.voz__quien img');
        const nombre = ((t.querySelector('.voz__quien strong') || {}).textContent || '').trim();
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'voces__cara';
        b.setAttribute('aria-label', `Opinión de ${nombre}`);
        if (img) { const c = img.cloneNode(); Object.assign(c, { width: 46, height: 46, alt: '' }); b.appendChild(c); }
        b.addEventListener('click', () => { tocado(); ir(k); });
        tira.appendChild(b);
        caras.push(b);
      });
      marcar(0);
    }
    // «Ver más» (v9.1): las opiniones largas, recortadas a cinco líneas, se despliegan en su tarjeta
    tarjetas.forEach((t) => {
      const cita = t.querySelector('.voz__cita');
      if (!cita) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'voz__mas';
      b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<span>Ver más</span><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      cita.after(b);
      b.addEventListener('click', () => {
        const abre = !t.classList.contains('abierta');
        t.classList.toggle('abierta', abre);
        b.setAttribute('aria-expanded', String(abre));
        b.firstElementChild.textContent = abre ? 'Ver menos' : 'Ver más';
        tocado();
      });
    });
    // Solo llevan «Ver más» las que no caben (se mide al verlas: fuera de pantalla no hay medidas)
    const medirCitas = () => tarjetas.forEach((t) => {
      const cita = t.querySelector('.voz__cita');
      const b = t.querySelector('.voz__mas');
      if (!cita || !b || t.classList.contains('abierta') || !cita.clientHeight) return;
      const sobra = cita.scrollHeight > cita.clientHeight + 2;
      b.classList.toggle('oculto', !sobra);
      b.tabIndex = sobra ? 0 : -1;
      b.setAttribute('aria-hidden', String(!sobra));
      t.classList.toggle('recortada', sobra);
    });
    window.addEventListener('resize', medirCitas);
    voces.querySelectorAll('[data-voces-paso]').forEach((b) => b.addEventListener('click', () => {
      tocado();
      if (Number(b.dataset.vocesPaso) > 0) siguiente(); else anterior();
    }));

    // Al pararse el scroll (a mano o no), la cara de la tarjeta que ha quedado delante
    let tAsiento = 0;
    riel.addEventListener('scroll', () => {
      clearTimeout(tAsiento);
      tAsiento = setTimeout(() => {
        if (objetivo !== null) { i = objetivo; objetivo = null; } else i = cercana();
        marcar(i);
      }, 140);
    }, { passive: true });

    // Arrastre con el ratón (con el dedo y el trackpad ya es nativo)
    let arr = null;
    riel.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arr = { id: e.pointerId, x: e.clientX, s: riel.scrollLeft, movido: false };
    });
    riel.addEventListener('pointermove', (e) => {
      if (!arr || e.pointerId !== arr.id) return;
      if (!(e.buttons & 1)) { arr = null; riel.classList.remove('arrastrando'); return; }
      const dx = e.clientX - arr.x;
      if (!arr.movido) {
        if (Math.abs(dx) < 6) return;
        arr.movido = true;
        riel.classList.add('arrastrando');
        try { riel.setPointerCapture(e.pointerId); } catch (_) { /* sin captura también vale */ }
      }
      riel.scrollLeft = arr.s - dx;
    });
    const soltar = (e) => {
      if (!arr || e.pointerId !== arr.id) return;
      const { movido, x, s: s0 } = arr;
      arr = null;
      if (!movido) return;
      riel.classList.remove('arrastrando');
      // Encaja en la más cercana; un tirón corto también pasa a la siguiente
      let k = cercana();
      const dx = e.clientX - x;
      if (k === i && Math.abs(dx) > 40 && Math.abs(riel.scrollLeft - s0) > 40) k += dx < 0 ? 1 : -1;
      ir(Math.max(0, Math.min(n - 1, k)));
    };
    riel.addEventListener('pointerup', soltar);
    riel.addEventListener('pointercancel', soltar);
    riel.addEventListener('dragstart', (e) => e.preventDefault());

    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((ev) => riel.addEventListener(ev, tocado, { passive: true }));
    riel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') encima = true; });
    riel.addEventListener('pointerleave', () => { encima = false; });
    visibleEn(riel, 0.4, (v) => { enPantalla = v; if (v) medirCitas(); });
    setInterval(() => {
      if (!enPantalla || encima || quieto() || arr || performance.now() - ultimoToque < 12000) return;
      if (tarjetas.some((t) => t.classList.contains('abierta'))) return;
      const f = document.activeElement;
      try { if (f && voces.contains(f) && f.matches(':focus-visible')) return; } catch (_) { /* sin :focus-visible */ }
      siguiente();
    }, 6400);
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
