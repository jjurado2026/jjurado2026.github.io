/* =====================================================================
   LATIN URBAN DANCE & FITNESS — "Compás"
   Todo el contenido es legible sin JavaScript: el horario es una tabla,
   las clases y las fechas son texto. Esto añade el movimiento y la
   interacción: títulos que entran palabra a palabra, el hero que se
   ajusta a la pantalla, la cinta a velocidad constante,
   los discos, el horario con vista previa, las acreditaciones
   que se balancean, el libro de la gira y las dudas apiladas.
   Los bucles solo corren con su sección a la vista.
   Parámetro ?ss → sin animaciones (para capturas).
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const limita = (v, a, b) => Math.min(b, Math.max(a, v));

  const captura  = location.search.includes('ss');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieto   = captura || reducido;
  const raton    = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (captura) {
    document.documentElement.classList.add('captura');
    $$('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));
  }

  /* ---------- Titulares: palabra a palabra ----------
     Se parte el texto en .w > .w__i conservando <br>, <em> y los
     espacios, así que un lector de pantalla lee la frase igual. */
  const partir = h => {
    let wi = 0;
    const recorre = nodo => {
      [...nodo.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.append(' '); return; }
            const w = document.createElement('span');
            const i = document.createElement('span');
            w.className = 'w'; i.className = 'w__i';
            i.textContent = p;
            i.style.setProperty('--wi', wi++);
            w.append(i);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.nodeName !== 'BR') {
          recorre(n);
        }
      });
    };
    recorre(h);
    h.classList.add('partido');
  };
  $$('.titular').forEach(partir);

  // El claim del pie, letra a letra
  $$('[data-letras]').forEach(el => {
    const texto = el.textContent;
    el.textContent = '';
    [...texto].forEach((ch, li) => {
      if (ch === ' ') { el.append(' '); return; }
      const s = document.createElement('span');
      s.className = 'l';
      s.textContent = ch;
      s.style.setProperty('--li', li);
      el.append(s);
    });
  });

  /* ---------- Horario: una sola fuente de datos ----------
     La próxima clase del hero, la columna de hoy y las etiquetas de día
     en móvil salen de la tabla. */
  const tabla = $('#tabla');
  const dias = tabla ? $$('thead th', tabla).slice(1).map(th => th.textContent.trim()) : [];
  const clasesSemana = [];
  const ahora = new Date();
  const hoy = ahora.getDay();               // 0 domingo … 6 sábado

  if (tabla) {
    $$('tbody tr', tabla).forEach((tr, fila) => {
      const inicio = ($('.hora', tr)?.firstChild?.textContent || '').trim();
      const [hh, mm] = inicio.split(':').map(Number);
      $$('td', tr).forEach((td, col) => {
        if (col + 1 === hoy) td.classList.add('hoy');
        const cl = $('.cl', td);
        if (!cl) return;
        if (dias[col]) cl.setAttribute('data-dia', dias[col].slice(0, 3));
        if (col + 1 === hoy) cl.classList.add('hoy');
        td.classList.add('g');
        td.style.setProperty('--i', col + fila);
        clasesSemana.push({
          el: cl,
          dia: col + 1,
          min: hh * 60 + mm,
          hora: inicio,
          nombre: $('.cl__n', cl)?.textContent.trim() || '',
          basico: !!$('.badge', cl),
          extra: $('.cl__extra', cl)?.textContent.trim() || ''
        });
      });
    });
    const thHoy = $$('thead th', tabla)[hoy];
    if (hoy >= 1 && thHoy) thHoy.classList.add('hoy');
  }

  /* ---------- Próxima clase (hero y horario) ---------- */
  const proxima = $('#proxima');
  if (proxima && clasesSemana.length) {
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    let hallada = null;
    for (let d = 0; d < 7 && !hallada; d++) {
      const dia = (hoy + d) % 7;
      const candidatas = clasesSemana
        .filter(c => c.dia === dia && (d > 0 || c.min > minAhora))
        .sort((a, b) => a.min - b.min);
      if (candidatas.length) hallada = { c: candidatas[0], d, dia };
    }
    if (hallada) {
      const { c, d, dia } = hallada;
      const cuando = d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : (dias[dia - 1] || '');
      $('#proxima-et').textContent = 'Próxima clase';
      $('#proxima-cuando').textContent = `${cuando}, ${c.hora}`;
      const que = $('#proxima-que');
      que.textContent = c.nombre + (c.extra ? ` · ${c.extra}` : '');
      if (c.basico) {
        const b = document.createElement('b');
        b.className = 'badge';
        b.textContent = 'Nivel básico';
        que.append(b);
      }
      proxima.setAttribute('aria-label', `Próxima clase: ${cuando}, ${c.hora}, ${c.nombre}. Ver el horario`);
      // y en la tabla, la misma clase marcada
      c.el.classList.add('siguiente');
      const ya = document.createElement('span');
      ya.className = 'cl__ya';
      ya.textContent = 'Próxima';
      c.el.append(ya);
    }
  }

  /* ---------- Ola: el --i de cada pieza es su columna real ---------- */
  const olas = $$('[data-ola]');
  const numerarOla = () => {
    olas.forEach(lista => {
      const hijos = [...lista.children];
      if (!hijos.length) return;
      const top0 = hijos[0].offsetTop;
      let cols = hijos.findIndex(h => h.offsetTop !== top0);
      if (cols < 1) cols = hijos.length;
      hijos.forEach((h, i) => h.style.setProperty('--i', i % cols));
    });
    $$('.pase').forEach((p, i) => p.style.setProperty('--i', Math.min(i, 6)));
  };
  numerarOla();

  /* ---------- Entradas por scroll: una vez ---------- */
  const entradas = $$('.entra, [data-grupo], .titular, [data-revela]');
  if (quieto || !('IntersectionObserver' in window)) {
    entradas.forEach(el => el.classList.add('visible'));
  } else {
    const obs = new IntersectionObserver((es, o) => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        o.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    entradas.forEach(el => obs.observe(el));
  }

  /* ---------- «Vivo»: los bucles solo corren a la vista ---------- */
  const enVista = new Map();                 // elemento → callbacks al entrar/salir
  const vivos = $$('[data-vivo]');
  if (!quieto && 'IntersectionObserver' in window) {
    const obsVivo = new IntersectionObserver(es => {
      es.forEach(e => {
        e.target.classList.toggle('vivo', e.isIntersecting);
        (enVista.get(e.target) || []).forEach(fn => fn(e.isIntersecting));
      });
    }, { rootMargin: '80px 0px' });
    vivos.forEach(el => obsVivo.observe(el));
  }
  const alVer = (el, fn) => { if (!el) return; enVista.set(el, [...(enVista.get(el) || []), fn]); };

  /* ---------- Hero ---------- */
  const hero = $('.hero');
  const rotulo = $('.rotulo');
  const rejilla = $('.hero__rejilla');

  // Que quepa entero sin scroll: si sobra alto, encoge el rótulo lo justo
  // El alto de referencia es el del hero (min-height: 100svh), no
  // innerHeight: en el móvil innerHeight cambia al esconderse la barra de
  // direcciones durante el scroll, y el rótulo cambiaría de tamaño a mitad
  // de página. 100svh es estable.
  const ajustarHero = () => {
    if (!hero || !rotulo) return;
    hero.style.setProperty('--ajuste', '1');
    const vh = parseFloat(getComputedStyle(hero).minHeight) || window.innerHeight;
    const exceso = hero.offsetHeight - vh;
    if (exceso <= 1) return;
    const dosColumnas = getComputedStyle(rejilla).gridTemplateColumns.split(' ').length > 1;
    const caja = $('.rotulo-caja');
    const panel = $('.hero__panel');
    if (dosColumnas && panel.offsetHeight > caja.offsetHeight) return; // manda el panel
    const h = rotulo.offsetHeight;
    if (h > 0) hero.style.setProperty('--ajuste', limita((h - exceso - 2) / h, .4, 1).toFixed(3));
  };
  ajustarHero();

  if (hero && !quieto) {
    // después de la cuenta de entrada, el compás sigue sonando
    setTimeout(() => hero.classList.add('contado'), 1800);
  }

  /* ---------- Cinta: velocidad constante ----------
     La mueve una animación CSS de transform, que el navegador ejecuta
     fuera del hilo principal: el scroll no la acelera, no la frena ni le
     cambia el sentido. Aquí solo se duplica cada lista (bucle sin corte)
     y se calcula la duración para que avance a los mismos px/s en
     cualquier pantalla. No se para al pasar el ratón: al hacer scroll con
     el cursor quieto, la cinta pasaría por debajo y se detendría. Para
     pararla está el botón de pausa (y el movimiento reducido). */
  const cinta = $('.cinta');
  const btnCinta = $('#cinta-btn');
  let medirCinta = () => {};
  if (cinta && !quieto) {
    const carriles = [
      { el: $('.cinta__carril--a'), lista: $('#cinta-a'), vel: 42, inversa: false },  // px/s
      { el: $('.cinta__carril--b'), lista: $('#cinta-b'), vel: 30, inversa: true }
    ].filter(c => c.el && c.lista);

    // Cada vuelta recorre la mitad de las listas del carril (-50 %), y esa
    // mitad tiene que cubrir la pantalla entera: si no, en un monitor ancho
    // asomaría un hueco por la derecha. Las copias se añaden por parejas,
    // ocultas a lectores de pantalla (la lista se lee una sola vez).
    const copiar = (c, ancho) => {
      const mitad = Math.max(1, Math.ceil(document.documentElement.clientWidth / ancho));
      while (c.el.children.length < 2 * mitad) {
        const copia = c.lista.cloneNode(true);
        copia.removeAttribute('id');
        copia.setAttribute('aria-hidden', 'true');
        c.el.appendChild(copia);
      }
    };

    // duración = listas por vuelta × ancho / velocidad. Si cambia (al girar
    // el móvil, por ejemplo), se conserva el punto del bucle: no da saltos.
    medirCinta = () => {
      carriles.forEach(c => {
        const ancho = c.lista.offsetWidth;
        if (!(ancho > 0)) return;
        const nAntes = c.el.children.length / 2;
        copiar(c, ancho);
        const n = c.el.children.length / 2;
        const seg = n * ancho / c.vel;
        const anim = c.el.getAnimations ? c.el.getAnimations()[0] : null;
        const antes = anim ? anim.effect.getComputedTiming().duration : 0;   // ms
        // mismo ancho (la barra del móvil, que dispara un resize al hacer
        // scroll): no se toca nada
        if (antes > 0 && n === nAntes && Math.abs(antes - seg * 1000) < 50) return;
        // punto del recorrido 0 → -50 % (el carril B va al revés)
        let q = antes > 0 ? (anim.currentTime % antes) / antes : 0;
        if (c.inversa) q = 1 - q;
        // con más listas por vuelta, misma posición dentro de una lista
        if (n !== nAntes) q = ((q * nAntes) % 1) / n;
        c.el.style.setProperty('--dur', seg.toFixed(2) + 's');
        if (antes > 0) {
          getComputedStyle(c.el).animationDuration;         // aplica la duración nueva
          anim.currentTime = (c.inversa ? 1 - q : q) * seg * 1000;
        }
      });
    };
    // Arranca con la fuente ya cargada: con la de reserva el ancho sería otro
    const arrancar = () => { medirCinta(); cinta.classList.add('en-marcha'); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    else arrancar();

    // Fuera de pantalla se detiene (no gasta) y vuelve antes de asomar
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => cinta.classList.toggle('fuera', !e.isIntersecting),
        { rootMargin: '200px 0px' }).observe(cinta);
    }

    // Botón de alternancia: la etiqueta («Pausar…») no cambia; el estado
    // lo dice aria-pressed, y el icono pausa/play cambia por CSS
    if (btnCinta) {
      btnCinta.addEventListener('click', () => {
        btnCinta.setAttribute('aria-pressed', String(cinta.classList.toggle('pausada')));
      });
    }
  }

  /* ---------- Discos: la funda se da la vuelta ---------- */
  // Igual que la pausa: etiqueta fija («Leer de qué va…»), estado en aria-pressed
  $$('.disco').forEach(disco => {
    const btn = $('.disco__girar', disco);
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-pressed', String(disco.classList.toggle('girado')));
    });
  });

  /* ---------- Horario: filtros con vista previa al pasar ---------- */
  if (tabla) {
    const filtros = $$('.filtro');
    const clases = $$('.cl', tabla);
    let avisa = null;

    const previa = f => {
      clases.forEach(cl => {
        if (!f || f === 'todo') { cl.classList.remove('previa', 'apagada'); return; }
        const ok = (cl.dataset.c || '').split(/\s+/).includes(f);
        cl.classList.toggle('previa', ok);
        cl.classList.toggle('apagada', !ok);
      });
    };

    filtros.forEach(btn => {
      btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') previa(btn.dataset.f); });
      btn.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') previa(null); });
      btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) previa(btn.dataset.f); });
      btn.addEventListener('blur', () => previa(null));

      btn.addEventListener('click', () => {
        const f = btn.dataset.f;
        previa(null);
        filtros.forEach(b => {
          const on = b === btn;
          b.classList.toggle('filtro--on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let visibles = 0;
        clases.forEach(cl => {
          const ok = f === 'todo' || (cl.dataset.c || '').split(/\s+/).includes(f);
          cl.classList.toggle('oculta', !ok);
          cl.tabIndex = ok ? 0 : -1;
          if (ok) visibles++;
        });
        if (!avisa) {
          avisa = document.createElement('p');
          avisa.className = 'vo';
          avisa.setAttribute('role', 'status');
          $('.filtros').after(avisa);
        }
        avisa.textContent = f === 'todo'
          ? `Mostrando las ${visibles} clases de la semana.`
          : `${visibles} clases coinciden con el filtro.`;
      });
    });
  }

  /* ---------- Carril horizontal: flechas y arrastre con ratón ---------- */
  const carril = (pista, botones) => {
    if (!pista) return;
    const paso = () => (pista.firstElementChild?.getBoundingClientRect().width || 300) + 24;
    const actualizar = () => {
      const max = pista.scrollWidth - pista.clientWidth - 2;
      botones.forEach(b => { b.disabled = b.dataset.dir === '-1' ? pista.scrollLeft <= 2 : pista.scrollLeft >= max; });
    };
    botones.forEach(b => b.addEventListener('click', () => {
      pista.scrollBy({ left: Number(b.dataset.dir) * paso(), behavior: quieto ? 'auto' : 'smooth' });
    }));
    pista.addEventListener('scroll', actualizar, { passive: true });
    addEventListener('resize', actualizar);
    actualizar();

    let x0 = 0, s0 = 0, movido = false, activo = false;
    pista.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      activo = true; movido = false; x0 = e.clientX; s0 = pista.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!activo) return;
      const dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 6) { movido = true; pista.classList.add('arrastrando'); }
      if (movido) pista.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!activo) return;
      activo = false;
      if (movido) requestAnimationFrame(() => pista.classList.remove('arrastrando'));
    });
    pista.addEventListener('click', e => { if (movido) { e.preventDefault(); movido = false; } }, true);
  };

  /* ---------- Equipo: acreditaciones con física de péndulo ----------
     Al deslizar el riel, cada pase se inclina contra el movimiento y
     vuelve oscilando (muelle amortiguado). Al pasar el ratón, se le da
     un toque. En reposo, un vaivén leve. */
  const pistaPases = $('#pases');
  carril(pistaPases, $$('.equipo__cab .ctrl__b'));
  const riel = $('.riel');
  if (pistaPases && riel && !quieto) {
    const colgantes = $$('.pase__colgante', pistaPases);
    const ang = colgantes.map(() => 0);
    const vel = colgantes.map(() => 0);
    let corriendo = false, t0 = 0, xAnt = pistaPases.scrollLeft, v = 0;
    const paso = t => {
      if (!corriendo) return;
      const dt = Math.min(48, t - (t0 || t)) / 1000; t0 = t;
      if (dt > 0) {
        const dx = pistaPases.scrollLeft - xAnt; xAnt = pistaPases.scrollLeft;
        v += (dx / dt - v) * .25;
        const s = t / 1000;
        colgantes.forEach((c, i) => {
          const objetivo = limita(-v * .016, -18, 18) + Math.sin(s * 1.5 + i * .9) * 1.4;
          const acc = -42 * (ang[i] - objetivo) - 5.5 * vel[i];
          vel[i] += acc * dt;
          ang[i] += vel[i] * dt;
          c.style.transform = `rotate(${ang[i].toFixed(2)}deg)`;
        });
      }
      requestAnimationFrame(paso);
    };
    alVer(riel, si => {
      if (si && !corriendo) { corriendo = true; t0 = 0; xAnt = pistaPases.scrollLeft; requestAnimationFrame(paso); }
      if (!si) corriendo = false;
    });
    if (raton) {
      colgantes.forEach((c, i) => {
        c.parentElement.addEventListener('pointerenter', () => { vel[i] += (i % 2 ? 1 : -1) * 70; });
      });
    }
  }

  /* ---------- Textos que llenan su ancho (nombre del pase, ciudad) ----------
     y nombres de disco que no se parten: si una palabra no cabe en la
     funda, el nombre se reduce lo justo */
  const llenar = () => {
    $$('.disco__nombre').forEach(el => {
      el.style.fontSize = '';
      if (el.scrollWidth > el.clientWidth + 1) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = (fs * el.clientWidth / el.scrollWidth * .98).toFixed(1) + 'px';
      }
    });
    $$('.pase__grande, .capitulo__ciudad').forEach(el => {
      el.style.fontSize = '';
      const padre = el.parentElement;
      const cs = getComputedStyle(padre);
      const disponible = padre.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      // offsetWidth (maquetación) y no getBoundingClientRect: los pases
      // entran girados y la caja transformada mediría de más
      const antes = el.style.display;
      el.style.display = 'inline-block';
      const ancho = el.offsetWidth;
      el.style.display = antes;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (ancho > 0 && disponible > 0) {
        const esPase = el.classList.contains('pase__grande');
        // la ciudad deja aire al lomo y a la sombra de su letra
        el.style.fontSize = Math.min(esPase ? 92 : 150, fs * disponible / ancho * (esPase ? .97 : .9)).toFixed(1) + 'px';
      }
    });
  };

  /* ---------- La gira: un libro que se hojea ---------- */
  const libro = $('#libro');
  let medirLibro = () => {};
  if (libro) {
    const hojas = $$('.hoja', libro);
    const n = hojas.length;
    const prev = $('[data-pasa="-1"]');
    const next = $('[data-pasa="1"]');
    const num = $('#libro-n');
    const doble = matchMedia('(min-width: 900px)');
    let pag = 0;

    // El libro mide lo que mide su página más larga
    const medir = medirLibro = () => {
      const eventos = $$('.evento', libro);
      eventos.forEach(e => (e.style.height = 'auto'));
      const alto = Math.max(0, ...eventos.map(e => e.offsetHeight));
      eventos.forEach(e => (e.style.height = ''));
      if (alto) libro.style.setProperty('--alto', Math.ceil(alto) + 'px');
    };

    const pintar = (animar = true) => {
      hojas.forEach((h, i) => {
        const pasada = i < pag;
        const cambia = h.classList.contains('pasada') !== pasada;
        h.classList.toggle('pasada', pasada);
        if (cambia && animar && !quieto) {
          // durante el giro, la hoja va por encima de todas
          h.style.zIndex = 300;
          h.classList.remove('girando'); void h.offsetWidth; h.classList.add('girando');
          clearTimeout(h._t);
          h._t = setTimeout(() => { h.classList.remove('girando'); h.style.zIndex = pasada ? 100 + i : 100 - i; }, 1000);
        } else {
          h.style.zIndex = pasada ? 100 + i : 100 - i;
        }
        h.inert = i !== pag;
      });
      if (num) num.textContent = pag + 1;
      if (prev) prev.disabled = pag === 0;
      if (next) next.disabled = pag === n - 1;
    };
    const ir = d => {
      const nueva = limita(pag + d, 0, n - 1);
      if (nueva === pag) return;
      pag = nueva;
      pintar();
    };

    [prev, next].forEach(b => b && b.addEventListener('click', () => ir(Number(b.dataset.pasa))));

    // Pulsar la página: derecha avanza, izquierda retrocede
    let arrastre = false;
    libro.addEventListener('click', e => {
      if (arrastre) { arrastre = false; return; }
      if (e.target.closest('a, button')) return;
      const r = libro.getBoundingClientRect();
      ir(doble.matches && e.clientX < r.left + r.width / 2 ? -1 : 1);
    });
    // Deslizar con el dedo (o arrastrar)
    let x0 = null;
    libro.addEventListener('pointerdown', e => { x0 = e.clientX; });
    libro.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) { arrastre = true; ir(dx < 0 ? 1 : -1); }
    });
    // Teclado: flechas con el foco dentro
    libro.closest('section').addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { ir(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { ir(-1); e.preventDefault(); }
    });

    medir();
    pintar(false);
    doble.addEventListener('change', () => { medir(); pintar(false); });
    addEventListener('load', medir);
  }

  /* ---------- Dudas: la de debajo se hunde al taparla la siguiente ---------- */
  const dudas = $$('.duda');
  if (dudas.length > 1 && !quieto) {
    let pend = false;
    const apilar = () => {
      pend = false;
      dudas.forEach((d, i) => {
        const sig = dudas[i + 1];
        if (!sig) return;
        const r = d.getBoundingClientRect(), rs = sig.getBoundingClientRect();
        const tapado = limita((r.bottom - rs.top) / r.height, 0, 1);
        d.style.transform = tapado ? `scale(${(1 - tapado * .06).toFixed(4)})` : '';
        d.style.setProperty('--tapa', (tapado * .6).toFixed(3));
      });
    };
    addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(apilar); } }, { passive: true });
  }

  /* ---------- Menú de móvil ---------- */
  const btnMenu = $('#cab-menu');
  const nav = $('#nav');
  if (btnMenu && nav) {
    const cerrar = (instante = false) => {
      if (instante) nav.classList.add('al-instante');
      nav.classList.remove('abierto');
      btnMenu.setAttribute('aria-expanded', 'false');
      if (instante) requestAnimationFrame(() => nav.classList.remove('al-instante'));
    };
    btnMenu.addEventListener('click', () => {
      const abierto = nav.classList.toggle('abierto');
      btnMenu.setAttribute('aria-expanded', String(abierto));
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) cerrar(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('abierto')) { cerrar(true); btnMenu.focus(); }
    });
    document.addEventListener('click', e => {
      if (nav.classList.contains('abierto') && !e.target.closest('#nav, #cab-menu')) cerrar();
    });
    matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) cerrar(true); });
  }

  /* ---------- Cabecera compacta, progreso y barra fija ---------- */
  const cab = $('#cab');
  const fija = $('#fija');
  const progreso = $('#progreso');
  const progresoNativo = CSS.supports && CSS.supports('animation-timeline: scroll()');

  let tick = false;
  const alScroll = () => {
    const y = scrollY;
    if (cab) cab.classList.toggle('compacta', y > 24);
    if (progreso && !progresoNativo) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progreso.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
    if (fija) {
      const limite = hero ? hero.offsetHeight * .8 : 600;
      const visible = y > limite;
      fija.classList.toggle('visible', visible);
      fija.setAttribute('aria-hidden', String(!visible));
      fija.inert = !visible;
    }
    tick = false;
  };
  addEventListener('scroll', () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(alScroll);
  }, { passive: true });

  // Al cargar las fuentes cambian las medidas: se recalcula todo lo que mide
  const remedir = () => { ajustarHero(); llenar(); numerarOla(); medirLibro(); medirCinta(); alScroll(); };
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(remedir, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedir);
  llenar();
  alScroll();
})();
