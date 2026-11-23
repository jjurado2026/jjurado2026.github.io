/* Reggae School Madrid — v6.2
   El carril del profesorado y la sección en curso en el menú. Solo transform. Sin JS, en captura (?ss) o con
   movimiento reducido: todo se lee quieto. */
(() => {
  'use strict';
  const captura = document.documentElement.classList.contains('ss');
  const yo = document.currentScript ? document.currentScript.src : '';
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

  /* ---------- Hero (v8): la historia ----------
     Pasa sola cuando se llena su barrita: la animación CSS de 4,8 s marca el tiempo, así que pausar la
     animación pausa la historia. Tocar a la derecha o a la izquierda (o las flechas, o ← →) va adelante
     o atrás; deslizar de lado, también; mantener pulsado la para. Fuera de pantalla o con la pestaña
     oculta, quieta. Con movimiento reducido o en captura no pasa sola (no hay animación que termine). */
  const historia = document.querySelector('[data-historia]');
  if (historia) {
    const fotos = [...historia.querySelectorAll('[data-historia-foto]')];
    const barras = [...historia.querySelectorAll('.historia__barras span')];
    const cursos = [...historia.querySelectorAll('[data-historia-curso]')];
    const total = fotos.length;
    const estado = { fuera: false, oculta: document.hidden, sostenida: false };
    const pausar = () => historia.classList.toggle('pausa', estado.fuera || estado.oculta || estado.sostenida);
    const precargar = (k) => {
      const img = fotos[((k % total) + total) % total].querySelector('img');
      if (img && img.loading === 'lazy') img.loading = 'eager';
    };
    let actual = 0;
    const ir = (k, cargarSiguiente = true) => {
      const antes = actual;
      actual = ((k % total) + total) % total;
      fotos.forEach((f, n) => {
        f.classList.toggle('activa', n === actual);
        f.classList.toggle('sale', n === antes && antes !== actual);
        if (n === actual) f.removeAttribute('aria-hidden'); else f.setAttribute('aria-hidden', 'true');
      });
      if (antes !== actual) setTimeout(() => fotos[antes].classList.remove('sale'), 800);
      barras.forEach((b, n) => { b.classList.remove('activa'); b.classList.toggle('vista', n < actual); });
      void barras[actual].offsetWidth; // reinicia la animación de la barrita
      barras[actual].classList.add('activa');
      cursos.forEach((c, n) => { c.classList.toggle('activa', n === actual); c.tabIndex = n === actual ? 0 : -1; });
      if (cargarSiguiente) precargar(actual + 1);
    };
    ir(0, false);
    if (document.readyState === 'complete') precargar(1);
    else window.addEventListener('load', () => precargar(1), { once: true });

    historia.addEventListener('animationend', (e) => {
      if (e.animationName === 'historia-barra' && e.target.parentElement === barras[actual]) ir(actual + 1);
    });
    visibleEn(historia, 0.15, (v) => { estado.fuera = !v; pausar(); });
    document.addEventListener('visibilitychange', () => { estado.oculta = document.hidden; pausar(); });
    historia.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
    });

    let pulsado = null, sinClic = false;
    const anularClic = () => { sinClic = true; setTimeout(() => { sinClic = false; }, 0); };
    historia.querySelectorAll('[data-historia-paso]').forEach((b) => {
      const paso = Number(b.dataset.historiaPaso);
      b.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        const pp = { id: e.pointerId, x: e.clientX, ux: e.clientX };
        // Mantener pulsado (sin mover el dedo) la para, como en Instagram
        pp.reloj = setTimeout(() => { if (pulsado === pp && Math.abs(pp.ux - pp.x) < 12) { estado.sostenida = true; pausar(); } }, 280);
        pulsado = pp;
        try { b.setPointerCapture(e.pointerId); } catch (_) { /* sin captura también vale */ }
      });
      b.addEventListener('pointermove', (e) => { if (pulsado && pulsado.id === e.pointerId) pulsado.ux = e.clientX; });
      const soltar = (e, cancelado) => {
        const pp = pulsado;
        if (!pp || pp.id !== e.pointerId) return;
        pulsado = null;
        clearTimeout(pp.reloj);
        const eraPausa = estado.sostenida;
        if (eraPausa) { estado.sostenida = false; pausar(); }
        const dx = pp.ux - pp.x;
        if (!cancelado && Math.abs(dx) > 40) { ir(actual + (dx < 0 ? 1 : -1)); anularClic(); return; }
        if (eraPausa) anularClic();
      };
      b.addEventListener('pointerup', (e) => soltar(e, false));
      b.addEventListener('pointercancel', (e) => soltar(e, true));
      b.addEventListener('click', () => { if (!sinClic) ir(actual + paso); });
    });
  }

  /* ---------- Artistas (v8): los nombres caen y se amontonan; cada compás uno salta y se enciende ----------
     Física con Matter.js (vendor/matter.min.js, MIT), que solo se carga al acercarse a la sección. Con quién
     tocó cada artista se saca del «Ha tocado con» de los profes del carrusel, así en WordPress va solo.
     Móvil: se tocan (sin bloquear el scroll). Ratón: al pasar se encienden, y se cogen y se lanzan.
     Sin JS, con movimiento reducido o en captura: la lista quieta; al tocar un nombre igualmente se ve con quién. */
  const escena = document.querySelector('[data-escenario]');
  if (escena) {
    const caja = escena.querySelector('.escenario');
    const foco = escena.querySelector('[data-escenario-foco]');
    const botones = [...escena.querySelectorAll('[data-nombre]')];
    const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\band\b/g, '&').replace(/^the\s+/, '').replace(/\s+/g, ' ').trim();
    const profes = [...document.querySelectorAll('[data-flow-carta]')].map((c) => ({
      nombre: (c.querySelector('.flow__nombre') || {}).textContent?.trim() || '',
      clases: ((c.querySelector('.flow__clases') || {}).textContent || '').split('.')[0].trim(),
      con: norm((c.querySelector('.flow__con') || {}).textContent || ''),
      foto: c.querySelector('.flow__foto img'),
    }));
    const datos = botones.map((b) => {
      const nombre = b.textContent.trim();
      return { nombre, top: b.classList.contains('nombre--top'), profes: profes.filter((pr) => pr.nombre && pr.con.includes(norm(nombre))) };
    });
    const esc = (t) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const minus = (t) => (/^Combo\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
    const pintarFoco = (k) => {
      const d = datos[k];
      let con;
      if (!d.profes.length) con = 'con el equipo de la escuela';
      else if (d.profes.length === 1) con = `con <strong>${esc(d.profes[0].nombre)}</strong>${d.profes[0].clases ? `, profe de ${esc(minus(d.profes[0].clases))}` : ''}`;
      else con = `con ${d.profes.map((pr) => `<strong>${esc(pr.nombre)}</strong>`).join(', ').replace(/, (?!.*, )/, ' y ')}`;
      const caras = d.profes.slice(0, 3).map((pr) => (pr.foto ? `<img src="${esc(pr.foto.currentSrc || pr.foto.src)}" alt="" width="44" height="44" decoding="async">` : '')).join('');
      foco.innerHTML = `<p class="escenario__artista${d.top ? ' top' : ''}" style="--largo:${d.nombre.length}">${esc(d.nombre)}</p>`
        + `<p class="escenario__con">${caras ? `<span class="escenario__caras" aria-hidden="true">${caras}</span>` : ''}<span>${con}</span></p>`;
    };

    let mundo = null, manual = -1e9, sobreNombre = false, enPantalla = false;
    const elegir = (k, saltar, aMano) => {
      botones.forEach((b, n) => b.classList.toggle('elegido', n === k));
      pintarFoco(k);
      if (aMano) { manual = performance.now(); foco.setAttribute('aria-live', 'polite'); }
      if (saltar && mundo) mundo.saltar(k);
    };
    foco.setAttribute('aria-live', 'off'); // el paso automático no se anuncia; lo que elige la persona, sí
    elegir(0, false, false);

    // Paso automático: un compás (3,2 s) por artista; los tres cabezas, primero
    const orden = [...datos.keys()].sort((x, y) => (datos[y].top - datos[x].top) || (x - y));
    let turno = 0;
    visibleEn(caja, 0.2, (v) => { enPantalla = v; });
    setInterval(() => {
      if (!enPantalla || quieto() || sobreNombre || performance.now() - manual < 9600) return;
      turno = (turno + 1) % orden.length;
      elegir(orden[turno], true, false);
    }, 3200);

    let sinClic = false;
    botones.forEach((b, k) => {
      b.addEventListener('click', () => { if (!sinClic) elegir(k, true, true); });
      b.addEventListener('focus', () => { let teclado = true; try { teclado = b.matches(':focus-visible'); } catch (_) { /* */ } if (teclado) elegir(k, false, true); });
      // Al pasar el ratón: se enciende y espera mientras sigue encima (solo ese nombre, no todo el bloque)
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !(mundo && mundo.cogido())) { sobreNombre = true; elegir(k, false, true); } });
      b.addEventListener('pointerleave', () => { sobreNombre = false; });
    });

    const conFisica = !captura && !reducido.matches && 'IntersectionObserver' in window && 'requestAnimationFrame' in window;
    if (conFisica) {
      caja.classList.add('fisica');
      const rutaMatter = yo ? yo.replace(/secciones\.js(\?.*)?$/, 'vendor/matter.min.js$1') : 'assets/js/vendor/matter.min.js';
      const cargarMatter = () => new Promise((ok, ko) => {
        if (window.Matter) { ok(window.Matter); return; }
        const sc = document.createElement('script');
        sc.src = rutaMatter; sc.async = true;
        sc.onload = () => (window.Matter ? ok(window.Matter) : ko(new Error('Matter')));
        sc.onerror = ko;
        document.head.appendChild(sc);
      });
      const sinFisica = () => { caja.classList.remove('fisica'); caja.style.removeProperty('--alto'); };

      const crearMundo = (M) => {
        const { Engine, Bodies, Body, Composite, Constraint, Query, Sleeping } = M;
        const lis = botones.map((b) => b.parentElement);
        const PASO = 1000 / 60;
        let motor = null, cuerpos = [], muelle = null, raf = 0, ultimo = 0, resto = 0, ancho = 0, alto = 0, vivo = false, caido = false;

        const pintar = () => {
          for (const c of cuerpos) {
            if (!c.dentro) continue;
            const pz = c.pieza;
            pz.li.style.transform = `translate3d(${(c.position.x - pz.w / 2).toFixed(1)}px, ${(c.position.y - pz.h / 2).toFixed(1)}px, 0) rotate(${c.angle.toFixed(4)}rad)`;
          }
        };
        const bucle = (t) => {
          if (!ultimo) ultimo = t - PASO;
          resto = Math.min(resto + (t - ultimo), PASO * 4);
          ultimo = t;
          while (resto >= PASO) { Engine.update(motor, PASO); resto -= PASO; }
          pintar();
          const quietos = !muelle && cuerpos.every((c) => !c.dentro || c.isSleeping);
          if (vivo && !quietos) raf = requestAnimationFrame(bucle);
          else { raf = 0; ultimo = 0; }
        };
        const despertar = () => { if (vivo && !raf && motor) raf = requestAnimationFrame(bucle); };
        const despertarTodos = () => cuerpos.forEach((c) => { if (c.dentro) Sleeping.set(c, false); });

        // Píldora: cápsula de su tamaño; giran poco (inercia x3) para que los nombres se lean
        const pildora = (pz) => {
          const c = Bodies.rectangle(-999, -999, pz.w, pz.h, {
            chamfer: { radius: Math.max(1, pz.h / 2 - 1) }, restitution: 0.3, friction: 0.45, frictionAir: 0.015, density: 0.0018,
          });
          Body.setInertia(c, c.inertia * 3);
          return c;
        };
        const MARGEN = 8;
        const paredes = (m, h) => {
          const g = 400;
          Composite.add(m.world, [
            Bodies.rectangle(ancho / 2, h - MARGEN + g / 2, ancho + g * 2, g, { isStatic: true }),
            Bodies.rectangle(MARGEN - g / 2, h / 2 - 800, g, h + 1600 + g, { isStatic: true }),
            Bodies.rectangle(ancho - MARGEN + g / 2, h / 2 - 800, g, h + 1600 + g, { isStatic: true }),
          ]);
        };
        // Mide las píldoras y monta el mundo: suelo, paredes altas y un cuerpo por nombre (aún fuera).
        // El alto sale de un ensayo sin pintar: se dejan caer todas y se mide lo que ocupa el montón.
        const preparar = () => {
          ancho = caja.clientWidth;
          const piezas = lis.map((li) => ({ li, w: li.offsetWidth, h: li.offsetHeight }));
          if (!ancho || piezas.some((pz) => !pz.w || !pz.h)) return false;
          const H = 3000;
          const ensayo = Engine.create();
          ensayo.gravity.y = 1.15;
          paredes(ensayo, H);
          piezas.forEach((pz, n) => {
            const c = pildora(pz);
            Body.setPosition(c, { x: MARGEN + pz.w / 2 + Math.random() * Math.max(1, ancho - 2 * MARGEN - pz.w), y: H - 120 - n * 48 });
            Body.setAngle(c, (Math.random() - 0.5) * 0.6);
            Composite.add(ensayo.world, c);
          });
          for (let k = 0; k < 900; k++) Engine.update(ensayo, PASO);
          const cima = Math.min(...Composite.allBodies(ensayo.world).filter((c) => !c.isStatic).map((c) => c.bounds.min.y));
          Composite.clear(ensayo.world, false);
          Engine.clear(ensayo);
          alto = Math.round(foco.offsetHeight + Math.max(90, H - cima) * 1.1 + 24);
          caja.style.setProperty('--alto', `${alto}px`);
          motor = Engine.create({ enableSleeping: true });
          motor.gravity.y = 1.15;
          paredes(motor, alto);
          cuerpos = piezas.map((pz, n) => {
            const c = pildora(pz);
            c.pieza = pz; c.indice = n; c.dentro = false;
            pz.li.classList.remove('dentro');
            return c;
          });
          return true;
        };
        // Orden de caída: los tres cabezas, los últimos, para que queden encima, a la vista
        const ordenCaida = () => [...cuerpos.keys()].sort((x, y) => (datos[x].top - datos[y].top) || (Math.random() - 0.5));
        const entrar = (c) => {
          const pz = c.pieza;
          Body.setPosition(c, { x: MARGEN + pz.w / 2 + Math.random() * Math.max(1, ancho - 2 * MARGEN - pz.w), y: -pz.h - 20 });
          Body.setAngle(c, (Math.random() - 0.5) * 0.6);
          Composite.add(motor.world, c);
          c.dentro = true;
          pz.li.classList.add('dentro');
        };
        const caer = () => {
          caido = true;
          ordenCaida().forEach((n, k) => setTimeout(() => { entrar(cuerpos[n]); despertar(); }, k * 80));
        };
        const colocar = () => { // tras un cambio de tamaño: caen de golpe y se asientan sin verse
          ordenCaida().forEach((n) => entrar(cuerpos[n]));
          for (let k = 0; k < 420; k++) Engine.update(motor, PASO);
          pintar();
        };

        if (!preparar()) return null;
        new IntersectionObserver((es) => es.forEach((e) => {
          vivo = e.isIntersecting;
          if (vivo && !caido && e.intersectionRatio >= 0.25) caer();
          if (vivo) despertar();
        }), { threshold: [0, 0.25] }).observe(caja);

        let reajuste = 0;
        window.addEventListener('resize', () => {
          clearTimeout(reajuste);
          reajuste = setTimeout(() => {
            if (Math.abs(caja.clientWidth - ancho) < 24) return;
            if (muelle) muelle = null;
            Composite.clear(motor.world, false);
            Engine.clear(motor);
            if (preparar() && caido) colocar();
          }, 260);
        });

        return {
          saltar(k) {
            const c = cuerpos[k];
            if (!c || !c.dentro) return;
            despertarTodos();
            Body.setVelocity(c, { x: (Math.random() - 0.5) * 3, y: -8.5 });
            Body.setAngularVelocity(c, (Math.random() - 0.5) * 0.16);
            despertar();
          },
          punto(e) { const r = caja.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; },
          cuerpoEn(pt) { return Query.point(cuerpos.filter((c) => c.dentro), pt)[0] || null; },
          coger(c, pt) {
            despertarTodos();
            muelle = Constraint.create({ pointA: { x: pt.x, y: pt.y }, bodyB: c, pointB: { x: pt.x - c.position.x, y: pt.y - c.position.y }, stiffness: 0.2, damping: 0.1, length: 0 });
            Composite.add(motor.world, muelle);
            despertar();
          },
          mover(pt) { if (muelle) { muelle.pointA.x = pt.x; muelle.pointA.y = pt.y; } },
          soltar() {
            if (!muelle) return;
            const c = muelle.bodyB;
            Composite.remove(motor.world, muelle);
            muelle = null;
            const v = c.velocity, max = 28, n = Math.hypot(v.x, v.y);
            if (n > max) Body.setVelocity(c, { x: (v.x / n) * max, y: (v.y / n) * max });
            despertar();
          },
          cogido() { return !!muelle; },
        };
      };

      // Coger y lanzar con el ratón (con el dedo no: así el scroll del móvil no se bloquea)
      let arrastre = null;
      caja.addEventListener('pointerdown', (e) => {
        if (!mundo || e.pointerType !== 'mouse' || e.button !== 0) return;
        const pt = mundo.punto(e);
        const c = mundo.cuerpoEn(pt);
        if (c) arrastre = { id: e.pointerId, x0: e.clientX, y0: e.clientY, movido: false, c, pt };
      });
      const soltarArrastre = (e) => {
        if (!arrastre || e.pointerId !== arrastre.id) return;
        const { movido } = arrastre;
        arrastre = null;
        if (!movido) return;
        mundo.soltar();
        caja.classList.remove('arrastrando');
        sinClic = true;
        setTimeout(() => { sinClic = false; }, 0);
      };
      caja.addEventListener('pointermove', (e) => {
        if (!arrastre || e.pointerId !== arrastre.id) return;
        if (!(e.buttons & 1)) { soltarArrastre(e); return; }
        if (!arrastre.movido) {
          if (Math.hypot(e.clientX - arrastre.x0, e.clientY - arrastre.y0) < 6) return;
          arrastre.movido = true;
          mundo.coger(arrastre.c, arrastre.pt);
          caja.classList.add('arrastrando');
          try { caja.setPointerCapture(e.pointerId); } catch (_) { /* sin captura también vale */ }
        }
        mundo.mover(mundo.punto(e));
      });
      caja.addEventListener('pointerup', soltarArrastre);
      caja.addEventListener('pointercancel', soltarArrastre);
      caja.addEventListener('lostpointercapture', (e) => { if (e.target === caja) soltarArrastre(e); });
      caja.addEventListener('click', (e) => { if (sinClic) { e.preventDefault(); e.stopPropagation(); } }, true);
      caja.addEventListener('dragstart', (e) => e.preventDefault());

      // Se carga Matter al acercarse; se monta cuando la sección ya se maqueta (fuentes listas)
      let pedido = false;
      new IntersectionObserver((es, ob) => {
        if (pedido || !es.some((e) => e.isIntersecting)) return;
        pedido = true;
        ob.disconnect();
        Promise.all([cargarMatter(), document.fonts ? document.fonts.ready : Promise.resolve()])
          .then(([M]) => {
            // Si aún no se puede medir (sección sin maquetar por content-visibility), se reintenta al verla
            const intentar = () => { mundo = crearMundo(M); return !!mundo; };
            if (!intentar()) {
              new IntersectionObserver((es2, ob2) => {
                if (es2.some((e) => e.isIntersecting) && intentar()) ob2.disconnect();
              }).observe(caja);
            }
          })
          .catch(sinFisica);
      }, { rootMargin: '700px 0px' }).observe(caja);
    }
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
