/* =====================================================================
   FIESTAS CON GLAMOUR — v3 "Noche de estreno"
   Todo el contenido se lee sin JavaScript: las 77 páginas de servicio
   están en el HTML (sin JS, las siete categorías se ven seguidas).
   Esto añade el movimiento y las piezas interactivas:
     · encendido del hero: focos, rótulo letra a letra y chispas
     · tiovivo con las siete fotos de su slider (gira, se arrastra)
     · visor: la foto pulsada vuela a primer plano con un flash
     · invitaciones que llegan en sobre, se inclinan y se dan la vuelta
     · abanico de categorías, cintas de servicios y buscador
     · tríptico con las tres fotos de su banner de ideas
     · foco de las ideas: sigue al cursor o recorre las 14 ideas
     · cartelera de promociones: bombillas, sello y pases de fotos
     · telón del equipo y cita que se enciende al bajar
     · mega-menú y menú móvil, construidos desde el catálogo
     · cabecera compacta, presupuesto siempre a mano y formulario

   Parámetros para revisar y capturar:
     ?ss                  sin animaciones (estado final)
     &menu=celebraciones  abre el mega-menú
     &movil               abre el menú móvil
     &cat=infantiles      abre una categoría del abanico
     &q=payaso            lanza una búsqueda
     &foto=3              trae al frente la foto 3 del tiovivo
     &visor=3             abre en el visor la foto 3 del tiovivo
     &verIdea=6           abre en el visor la idea 6
     &girar=empresas      da la vuelta a una invitación
     &idea=5              ilumina una idea
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const raiz = document.documentElement;
  const params = new URLSearchParams(location.search);
  const captura  = params.has('ss');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieto   = captura || reducido;
  const raton    = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const io       = 'IntersectionObserver' in window;

  if (quieto) raiz.classList.add('quieto');
  if (captura) $$('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));

  const reanima = (el, clase) => { el.classList.remove(clase); void el.offsetWidth; el.classList.add(clase); };
  const esc  = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const suave = quieto ? 'auto' : 'smooth';

  // fn se ejecuta la primera vez que el elemento entra en pantalla
  const alEntrar = (el, fn, umbral = .15) => {
    if (!el) return;
    if (quieto || !io) { fn(el); return; }
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { o.disconnect(); fn(el); }
    }, { threshold: umbral, rootMargin: '0px 0px -6% 0px' });
    o.observe(el);
  };
  // fn(true/false) cada vez que el elemento entra o sale de pantalla
  const enPantalla = (el, fn) => {
    if (!el) return;
    if (!io) { fn(true); return; }
    new IntersectionObserver(([e]) => fn(e.isIntersecting)).observe(el);
  };
  // Las secciones con movimiento propio lo paran fuera de pantalla
  $$('.escena, .invitaciones, .abanico, .ideas, .promo, .nosotros, .contacto, .pie').forEach(s => enPantalla(s, v => s.classList.toggle('fuera', !v)));

  // Bloquea el scroll de la página (menú móvil, visor) sin que salte el ancho
  const bloquear = on => {
    const barra = innerWidth - raiz.clientWidth;
    document.body.style.overflow = on ? 'hidden' : '';
    document.body.style.paddingRight = on && barra > 0 ? `${barra}px` : '';
  };

  let visorAbierto = false;

  /* =====================================================================
     HERO · encendido: los focos se encienden, el rótulo se ilumina letra
     a letra como un neón, entran lema y botones y sube el tiovivo.
     Una sola vez, al cargar.
     ===================================================================== */
  const escena = $('.escena');
  const rotulo = $('#rotulo');
  let orden = 0;
  $$('.rotulo__palabra', rotulo).forEach(p => {
    const letras = [...p.textContent.trim()];
    p.textContent = '';
    letras.forEach(l => {
      const s = document.createElement('span');
      s.className = 'rotulo__l';
      s.textContent = l;
      // En orden, pero cada letra con su pequeño titubeo
      s.style.setProperty('--d', `${(.25 + orden++ * .05 + Math.random() * .14).toFixed(2)}s`);
      p.append(s);
    });
  });
  rotulo.classList.add('partido');

  const chispas = $('.escena__chispas');
  if (chispas && !quieto) {
    const cuantas = innerWidth < 700 ? 12 : 24;
    let html = '';
    for (let i = 0; i < cuantas; i++) {
      const t = 9 + Math.random() * 10;
      html += `<i class="chispa" style="left:${(Math.random() * 100).toFixed(1)}%;--s:${(1.5 + Math.random() * 2.5).toFixed(1)}px;--t:${t.toFixed(1)}s;--d:${(-Math.random() * t).toFixed(1)}s;--x:${Math.round((Math.random() - .5) * 140)}px"></i>`;
    }
    chispas.innerHTML = html;
  }

  const encender = () => raiz.classList.add('encendido');
  if (quieto) encender();
  else {
    // Espera a las fuentes (máx. 800 ms) para que el rótulo no cambie de medida
    const fuentes = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fuentes, new Promise(r => setTimeout(r, 800))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(encender)));
  }

  /* =====================================================================
     VISOR · la foto pulsada vuela desde su sitio a primer plano (FLIP,
     solo transform) y salta un flash al aterrizar. Al cerrar vuelve a
     su sitio. Cierran Esc, el fondo y la X; el foco vuelve a la foto.
     ===================================================================== */
  const visor = (() => {
    const v = $('#visor');
    const marcoPadre = $('.visor__marco', v);
    const marco = $('.visor__foto', v);
    const img = $('img', marco);
    const pie = $('.visor__pie', v);
    const titulo = $('.visor__t', v), texto = $('.visor__d', v);
    const pide = $('.visor__acciones .boton', v), ver = $('.visor__ver', v);
    const cerrarBtn = $('.visor__cerrar', v);
    let d = null;

    // La foto se dibuja a un tamaño fijo calculado aquí: así, cuando
    // llega la versión grande, no cambia de medida
    const medir = () => {
      const ar = d.origen.naturalWidth / d.origen.naturalHeight || 1.6;
      const pad = Math.min(56, Math.max(14, innerWidth * .04)) * 2;
      // Nunca por encima del tamaño real del archivo: ampliar más solo destaparía los límites del original
      const maxW = Math.min(1100, innerWidth - pad, d.grande ? 1600 : d.origen.naturalWidth);
      const maxH = Math.min(760, innerHeight - pad - pie.offsetHeight - 20);
      let w = maxW, h = w / ar;
      if (h > maxH) { h = Math.max(120, maxH); w = h * ar; }
      img.style.width = `${Math.round(w)}px`;
      img.style.height = `${Math.round(h)}px`;
    };
    // Caja de la foto en reposo (sin el transform del vuelo)
    const reposo = () => {
      const m = marcoPadre.getBoundingClientRect();
      return { left: m.left + marco.offsetLeft, top: m.top + marco.offsetTop, width: marco.offsetWidth, height: marco.offsetHeight };
    };
    const hacia = (a, b) =>
      `translate(${(a.left - b.left).toFixed(1)}px,${(a.top - b.top).toFixed(1)}px) scale(${(a.width / b.width).toFixed(4)},${(a.height / b.height).toFixed(4)})`;

    const abrir = async datos => {
      if (visorAbierto) return;
      visorAbierto = true;
      d = datos;
      img.alt = d.alt || '';
      img.src = d.origen.currentSrc || d.origen.src;
      titulo.textContent = d.titulo;
      texto.textContent = d.texto || '';
      texto.hidden = !d.texto;
      if (d.asunto) pide.dataset.asunto = d.asunto; else delete pide.dataset.asunto;
      ver.hidden = !d.href;
      if (d.href) { ver.href = d.href; ver.textContent = d.ver; }
      try { await img.decode(); } catch (e) { /* se pinta igual */ }
      if (!visorAbierto) return;
      v.hidden = false;
      raiz.classList.add('visor-abierto');
      bloquear(true);
      medir();
      if (!quieto) {
        const a = d.origen.getBoundingClientRect();
        marco.style.transition = 'none';
        marco.style.transform = hacia(a, reposo());
        d.oculta.style.opacity = '0';
        void marco.offsetWidth;
        marco.style.transition = 'transform .72s cubic-bezier(.2,1.1,.3,1)';
        marco.style.transform = '';
        const aterriza = e => {
          if (e.target !== marco) return;
          marco.removeEventListener('transitionend', aterriza);
          if (visorAbierto) reanima(v, 'aterriza');
        };
        marco.addEventListener('transitionend', aterriza);
      }
      v.classList.add('abierto');
      cerrarBtn.focus({ preventScroll: true });
      // La versión grande de la misma foto, cuando llegue
      if (d.grande && !img.src.endsWith(d.grande)) {
        const g = new Image();
        g.src = d.grande;
        const esta = d;
        g.decode().then(() => { if (visorAbierto && d === esta) img.src = g.src; }).catch(() => {});
      }
    };

    const cerrar = ({ inmediato = false, foco = true } = {}) => {
      if (!visorAbierto) return;
      visorAbierto = false;
      v.classList.remove('abierto', 'aterriza');
      const datos = d;
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        v.hidden = true;
        raiz.classList.remove('visor-abierto');
        marco.style.transition = '';
        marco.style.transform = '';
        datos.oculta.style.opacity = '';
        bloquear(false);
        if (foco) datos.boton.focus({ preventScroll: true });
        tiovivo.reanudar();
      };
      if (quieto || inmediato || !datos.origen.isConnected) { fin(); return; }
      marco.style.transition = 'transform .5s cubic-bezier(.5,0,.15,1)';
      marco.style.transform = hacia(datos.origen.getBoundingClientRect(), reposo());
      marco.addEventListener('transitionend', fin, { once: true });
      setTimeout(fin, 650);
    };

    cerrarBtn.addEventListener('click', () => cerrar());
    $('.visor__fondo', v).addEventListener('click', () => cerrar());
    // Un enlace del visor lleva a otra parte: se cierra sin volver
    v.addEventListener('click', e => { if (e.target.closest('a')) cerrar({ inmediato: true, foco: false }); });
    v.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      const f = $$('a, button', v).filter(x => !x.hidden && x.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    addEventListener('resize', () => { if (visorAbierto) medir(); });

    return { abrir, cerrar };
  })();

  // La candidata más grande de un srcset
  const masGrande = img => {
    if (!img.srcset) return img.src;
    return img.srcset.split(',').map(s => s.trim().split(/\s+/))
      .sort((a, b) => parseInt(b[1], 10) - parseInt(a[1], 10))[0][0];
  };

  /* =====================================================================
     TIOVIVO · las siete fotos de su slider en un aro 3D.
     Gira solo y despacio (una vuelta cada 48 s) y se para con el cursor
     encima o con el foco dentro. Se arrastra con el dedo o el ratón y
     las flechas pasan de una en una. La de delante se abre en el visor;
     las de los lados, al pulsarlas, vienen al frente.
     ===================================================================== */
  const tiovivo = (() => {
    const grupo = $('.tiovivo');
    const caja = $('.tiovivo__escena', grupo);
    const aro = $('.tiovivo__aro', grupo);
    const fotos = $$('.tiovivo__foto', aro);
    const actual = $('.tiovivo__actual', grupo);
    const nombres = fotos.map(f => $('.tiovivo__nombre', f).textContent.trim());
    const N = fotos.length, PASO = 360 / N, VEL = -7.5;

    let R = 0, ang = 0, vel = 0, meta = null, frente = -1, pintado = '';
    let encima = false, foco = false, pausaHasta = 0, visible = true, raf = 0, antes = 0;
    let arr = null, arrastrado = false;

    $$('img', aro).forEach(i => (i.draggable = false));

    const pintar = () => {
      const t = `translateZ(${(-R).toFixed(1)}px) rotateY(${ang.toFixed(2)}deg)`;
      if (t !== pintado) { aro.style.transform = t; pintado = t; }
      const i = ((Math.round(-ang / PASO) % N) + N) % N;
      if (i === frente) return;
      frente = i;
      fotos.forEach((f, k) => f.classList.toggle('delante', k === i));
      actual.textContent = nombres[i];
    };
    const medir = () => {
      R = aro.offsetWidth * 1.2;
      fotos.forEach((f, i) => (f.style.transform = `rotateY(${(i * PASO).toFixed(2)}deg) translateZ(${R.toFixed(1)}px)`));
      pintado = '';
      pintar();
    };

    const activo = () => visible && !document.hidden && !visorAbierto;
    const parado = () => quieto || encima || foco || performance.now() < pausaHasta;

    const fotograma = t => {
      raf = 0;
      const dt = Math.min(.05, Math.max(0, (t - antes) / 1000));
      antes = t;
      if (arr && arrastrado) {
        // el ángulo lo pone el puntero
      } else if (meta !== null) {
        // Muelle con un punto de rebote
        vel += (95 * (meta - ang) - 17 * vel) * dt;
        ang += vel * dt;
        if (Math.abs(meta - ang) < .03 && Math.abs(vel) < .4) { ang = meta; vel = 0; meta = null; }
      } else {
        vel += ((parado() ? 0 : VEL) - vel) * (1 - Math.exp(-dt * 2.4));
        ang += vel * dt;
      }
      pintar();
      const sigue = !quieto || arrastrado || meta !== null || Math.abs(vel) > .02;
      if (sigue && activo()) raf = requestAnimationFrame(fotograma);
    };
    const arrancar = () => {
      if (raf || !activo()) return;
      antes = performance.now();
      raf = requestAnimationFrame(fotograma);
    };

    // Lleva la foto i al frente por el camino más corto
    const ir = (i, pausa = 5000) => {
      const destino = -i * PASO;
      const objetivo = destino + Math.round((ang - destino) / 360) * 360;
      pausaHasta = performance.now() + pausa;
      if (quieto) { ang = objetivo; vel = 0; meta = null; pintar(); return; }
      meta = objetivo;
      arrancar();
    };
    const base = () => Math.round(-(meta !== null ? meta : ang) / PASO);
    // El rótulo de la foto solo se anuncia cuando la cambia el usuario
    let tAnuncio;
    const anunciar = () => {
      actual.setAttribute('aria-live', 'polite');
      clearTimeout(tAnuncio);
      tAnuncio = setTimeout(() => actual.setAttribute('aria-live', 'off'), 1600);
    };
    actual.setAttribute('aria-live', 'off');

    const abrirFoto = i => {
      const f = fotos[i], img = $('img', f);
      visor.abrir({
        origen: img, oculta: f, boton: f, alt: img.alt, grande: masGrande(img),
        titulo: nombres[i], texto: f.dataset.texto, asunto: f.dataset.asunto,
        href: f.dataset.href, ver: f.dataset.ver
      });
    };

    $$('.tiovivo__paso', grupo).forEach(b => b.addEventListener('click', () => {
      anunciar();
      ir(base() + Number(b.dataset.paso));
    }));
    fotos.forEach((f, i) => f.addEventListener('click', () => {
      if (i === frente) abrirFoto(i);
      else { anunciar(); ir(i, 6000); }
    }));

    // Arrastre: hasta 7 px es un clic; a partir de ahí, mueve el aro
    caja.addEventListener('pointerdown', e => {
      if (e.button) return;
      arrastrado = false;
      arr = { x0: e.clientX, a0: ang, x: e.clientX, t: e.timeStamp, v: 0, id: e.pointerId };
    });
    caja.addEventListener('pointermove', e => {
      if (!arr || e.pointerId !== arr.id) return;
      const dx = e.clientX - arr.x0;
      if (!arrastrado) {
        if (Math.abs(dx) < 7) return;
        arrastrado = true;
        meta = null;
        arr.a0 = ang;
        arr.x0 = e.clientX;
        caja.setPointerCapture(e.pointerId);
        caja.classList.add('arrastrando');
        arrancar();
        return;
      }
      const k = 64 / aro.offsetWidth;                     // grados por píxel
      ang = arr.a0 + dx * k;
      const dt = (e.timeStamp - arr.t) / 1000;
      if (dt > .001) arr.v = .75 * ((e.clientX - arr.x) * k / dt) + .25 * arr.v;
      arr.x = e.clientX;
      arr.t = e.timeStamp;
      if (quieto) pintar();
    });
    const soltar = e => {
      if (!arr || e.pointerId !== arr.id) return;
      const v = arr.v;
      arr = null;
      if (!arrastrado) return;
      caja.classList.remove('arrastrando');
      // Inercia: hasta dónde llegaría sola, y de ahí a la foto más cercana
      const lanzado = Math.max(-260, Math.min(260, v));
      anunciar();
      ir(Math.round(-(ang + lanzado * .3) / PASO), 6000);
      if (!quieto) vel = lanzado;
    };
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
    caja.addEventListener('lostpointercapture', soltar);
    // Un arrastre no es un clic
    caja.addEventListener('click', e => {
      if (!arrastrado) return;
      e.preventDefault();
      e.stopPropagation();
      arrastrado = false;
    }, true);

    caja.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') encima = true; });
    caja.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') encima = false; });
    grupo.addEventListener('focusin', e => {
      if (!e.target.matches(':focus-visible')) return;
      foco = true;
      const f = e.target.closest('.tiovivo__foto');
      if (f) ir(fotos.indexOf(f), 0);
    });
    grupo.addEventListener('focusout', e => { if (!grupo.contains(e.relatedTarget)) foco = false; });
    grupo.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      anunciar();
      const f = e.target.closest('.tiovivo__foto');
      if (f) fotos[(((fotos.indexOf(f) + d) % N) + N) % N].focus();
      else ir(base() + d);
    });

    enPantalla(escena, v => { visible = v; arrancar(); });
    document.addEventListener('visibilitychange', arrancar);
    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(aro);
    else addEventListener('resize', medir);
    medir();
    arrancar();

    return { ir, abrirFoto, reanudar: arrancar };
  })();

  // @bloque invitaciones
  /* =====================================================================
     INVITACIONES · se reparten sobre la mesa al llegar, se inclinan
     con el ratón (con un brillo que sigue al cursor) y se dan la vuelta
     para ver qué incluyen. La cara oculta queda inerte.
     ===================================================================== */
  const mesa = $('.mesa');
  const invitaciones = $$('.invitacion');
  let pendienteInv = null;

  const girar = (inv, vuelta, { foco = false } = {}) => {
    inv.classList.toggle('vuelta', vuelta);
    const frente = $('.invitacion__cara--frente', inv), dorso = $('.invitacion__cara--dorso', inv);
    frente.inert = vuelta;
    dorso.inert = !vuelta;
    $('.invitacion__girar', frente).setAttribute('aria-expanded', String(vuelta));
    if (foco) (vuelta ? $('a', dorso) : $('.invitacion__girar', frente)).focus({ preventScroll: true });
  };

  invitaciones.forEach(inv => {
    girar(inv, false);
    inv.addEventListener('click', e => {
      if (!e.target.closest('.invitacion__girar')) return;
      mesa.classList.add('usada');                       // ya no hace falta que se asomen
      girar(inv, !inv.classList.contains('vuelta'), { foco: true });
    });
    if (!raton || quieto) return;
    const inclina = $('.invitacion__inclina', inv);
    const brillo = $('.invitacion__brillo', inv);
    inv.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !mesa.classList.contains('asentada')) return;
      const r = inv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      inclina.style.transform = `rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg)`;
      brillo.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`);
      brillo.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`);
      inv.classList.add('inclinada');
    });
    inv.addEventListener('pointerleave', () => {
      inclina.style.transform = '';
      inv.classList.remove('inclinada');
    });
  });

  // Cada invitación llega en su sobre y se abre al verse (en móvil, al deslizarla)
  const abrirSobre = inv => inv.classList.add('abierta');
  const obsSobres = quieto || !io ? null : new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    abrirSobre(e.target);
    obsSobres.unobserve(e.target);
  }), { threshold: .55 });

  alEntrar(mesa, () => {
    mesa.classList.add('repartida');
    if (obsSobres && mesa.scrollWidth <= mesa.clientWidth) invitaciones.forEach(inv => obsSobres.observe(inv));
    else invitaciones.forEach(abrirSobre);
    // Abiertos los sobres, fuera los retrasos para que todo responda al momento
    setTimeout(() => {
      mesa.classList.add('asentada');
      if (pendienteInv) { pendienteInv(); pendienteInv = null; }
    }, quieto ? 0 : 3600);
  }, .2);

  // "Eventos de empresa", "Fiestas infantiles"…: lleva a su invitación y la abre
  const abrirInvitacion = publico => {
    const inv = $(`.invitacion[data-publico="${publico}"]`);
    if (!inv) return;
    const hacer = () => {
      // Si su sobre seguía cerrado (móvil), se abre y se espera a que salga
      if (!inv.classList.contains('abierta')) {
        invitaciones.forEach(abrirSobre);
        setTimeout(hacer, quieto ? 0 : 2900);
        return;
      }
      invitaciones.forEach(x => { if (x !== inv && x.classList.contains('vuelta')) girar(x, false); });
      // En móvil la mesa es una fila deslizable: centra la invitación
      if (mesa.scrollWidth > mesa.clientWidth) {
        const m = mesa.getBoundingClientRect(), r = inv.getBoundingClientRect();
        mesa.scrollTo({ left: mesa.scrollLeft + r.left - m.left - (m.width - r.width) / 2, behavior: suave });
      }
      girar(inv, true, { foco: true });
      inv.classList.add('destacada');
      setTimeout(() => inv.classList.remove('destacada'), 1800);
    };
    if (mesa.classList.contains('asentada')) setTimeout(hacer, quieto ? 0 : 500);
    else pendienteInv = hacer;
  };
  $$('[data-abre]').forEach(a => a.addEventListener('click', () => abrirInvitacion(a.dataset.abre)));

  // /@bloque invitaciones

  /* =====================================================================
     ABANICO · siete varillas. Ninguna está marcada de inicio: el cursor
     colorea la que tiene encima y al pulsarla se abre su panel justo
     debajo. Debajo, dos cintas lentas con los 77 servicios.
     ===================================================================== */
  const abanico = $('.abanico');
  const mano = $('.abanico__mano');
  const varillas = $$('.varilla');
  const paneles = $$('.cat-panel');
  const cajaPaneles = $('.cat-paneles');
  const cintas = $('.cintas');

  const datosCat = id => {
    const p = $(`#cat-${id}`);
    if (!p) return null;
    const ver = $('.cat-panel__ver', p);
    return {
      id, p,
      nombre: $('.cat-panel__t', p).textContent.trim(),
      lema: $('.cat-panel__lema', p).textContent.trim(),
      url: ver.href,
      ver: ver.textContent.trim(),
      enlaces: $$('.servicios a', p)
    };
  };

  paneles.forEach(p => { p.hidden = true; p.tabIndex = -1; });

  const abrirCat = (id, { desplazar = true, foco = false } = {}) => {
    let abierto = null;
    paneles.forEach(p => {
      const on = p.dataset.cat === id;
      if (on && p.hidden && !quieto) reanima(p, 'abre');
      p.hidden = !on;
      if (on) abierto = p;
    });
    varillas.forEach(v => v.setAttribute('aria-expanded', String(v.dataset.cat === id)));
    abanico.classList.toggle('elegido', !!abierto);
    if (!abierto) return;
    if (foco) abierto.focus({ preventScroll: true });
    if (desplazar) {
      // Si el panel queda por debajo, se sube hasta tenerlo a la vista
      const r = abierto.getBoundingClientRect();
      if (r.top > innerHeight * .62) scrollBy({ top: r.top - innerHeight * .32, behavior: suave });
    }
  };

  varillas.forEach(v => v.addEventListener('click', () => {
    abrirCat(v.getAttribute('aria-expanded') === 'true' ? null : v.dataset.cat);
  }));
  $$('.cat-panel__cerrar').forEach(b => b.addEventListener('click', () => {
    const id = b.closest('.cat-panel').dataset.cat;
    abrirCat(null);
    $(`.varilla[data-cat="${id}"]`).focus({ preventScroll: true });
  }));

  // Cintas: los servicios alternos de todo el catálogo, cada fila hacia
  // un lado. Cada cinta lleva su contenido dos veces para el bucle.
  const todos = paneles.flatMap(p => $$('.servicios a', p));
  const pistas = $$('.cinta__pista', cintas);
  [todos.filter((_, i) => i % 2 === 0), todos.filter((_, i) => i % 2 === 1)].forEach((grupo, k) => {
    const una = grupo.map(a => `<a class="pastilla" href="${a.href}" tabindex="-1">${esc(a.textContent.trim())}</a>`).join('');
    pistas[k].innerHTML = una + una;
  });
  // La misma calma en las dos: unos 34 px por segundo
  const ritmoCintas = () => pistas.forEach(p => p.style.setProperty('--dur', `${(p.scrollWidth / 2 / 34).toFixed(1)}s`));
  ritmoCintas();
  if (document.fonts) document.fonts.ready.then(ritmoCintas);

  /* ---------- Buscador ----------
     Sin tildes ni mayúsculas: "comunion" encuentra "Organización de
     comuniones". Busca en el rótulo y en data-k (palabras de su página). */
  const campo = $('#busca');
  const borrar = $('.buscador__borrar');
  const resultados = $('#resultados');
  const lista = $('.resultados__lista', resultados);
  const vacio = $('.resultados__vacio', resultados);
  const cuenta = $('.resultados__n', resultados);

  const indice = paneles.map(p => {
    const c = datosCat(p.dataset.cat);
    return { ...c, items: c.enlaces.map(a => ({ a, texto: a.textContent.trim(), clave: norm(`${a.textContent} ${a.dataset.k || ''}`) })) };
  });
  const total = indice.reduce((n, c) => n + c.items.length, 0);
  $$('[data-total]').forEach(el => (el.textContent = total));

  // Resalta cada término dentro del rótulo visible (quitar tildes con NFD
  // no cambia la longitud de un texto en NFC: las posiciones coinciden)
  const marcar = (texto, terminos) => {
    const n = norm(texto);
    const marcas = new Array(texto.length).fill(false);
    terminos.forEach(t => {
      let i = n.indexOf(t);
      while (i > -1 && t) { for (let k = i; k < i + t.length; k++) marcas[k] = true; i = n.indexOf(t, i + t.length); }
    });
    let html = '', dentro = false;
    [...texto].forEach((c, k) => {
      if (marcas[k] && !dentro) { html += '<mark>'; dentro = true; }
      if (!marcas[k] && dentro) { html += '</mark>'; dentro = false; }
      html += esc(c);
    });
    return dentro ? html + '</mark>' : html;
  };

  const buscar = () => {
    const bruto = campo.value.trim();
    const q = norm(bruto);
    borrar.hidden = !bruto;
    const buscando = q.length >= 2;
    mano.hidden = cajaPaneles.hidden = cintas.hidden = buscando;
    resultados.hidden = !buscando;
    if (!buscando) { cuenta.textContent = ''; return; }
    const terminos = q.split(/\s+/).filter(Boolean);
    let n = 0;
    lista.textContent = '';
    indice.forEach(cat => {
      const hits = cat.items.filter(it => terminos.every(t => it.clave.includes(t)));
      if (!hits.length) return;
      n += hits.length;
      const g = document.createElement('div');
      g.className = 'resultados__grupo';
      g.innerHTML = `<div class="resultados__cab"><h3 class="resultados__t">${esc(cat.nombre)}</h3><button type="button" class="resultados__ver" data-ver="${cat.id}">Ver la categoría</button></div>`;
      const ul = document.createElement('ul');
      ul.className = 'servicios';
      hits.forEach(it => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = it.a.href;
        // El rótulo va en un span: el enlace es flex y cada <mark> sería una columna
        a.innerHTML = `<span>${marcar(it.texto, terminos)}</span>`;
        li.append(a);
        ul.append(li);
      });
      g.append(ul);
      lista.append(g);
    });
    vacio.hidden = n > 0;
    cuenta.textContent = n
      ? `${n} ${n === 1 ? 'servicio' : 'servicios'} para «${bruto}»`
      : `Ningún servicio para «${bruto}»`;
  };
  const limpiarBusqueda = () => { if (campo.value) { campo.value = ''; buscar(); } };

  campo.addEventListener('input', buscar);
  campo.addEventListener('keydown', e => { if (e.key === 'Escape' && campo.value) { e.stopPropagation(); limpiarBusqueda(); } });
  borrar.addEventListener('click', () => { limpiarBusqueda(); campo.focus(); });
  lista.addEventListener('click', e => {
    const b = e.target.closest('[data-ver]');
    if (!b) return;
    limpiarBusqueda();
    abrirCat(b.dataset.ver, { foco: true });
  });
  // "Cuéntanos qué buscas": la búsqueda viaja al mensaje del formulario
  $('[data-pide]').addEventListener('click', () => {
    const m = $('#f-mensaje');
    if (campo.value.trim() && !m.value) m.value = `Busco: ${campo.value.trim()}. `;
  });

  // Enlaces del pie que abren una categoría concreta
  $$('[data-cat-abre]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    limpiarBusqueda();
    abrirCat(a.dataset.catAbre, { desplazar: false, foco: true });
    $(`#cat-${a.dataset.catAbre}`).scrollIntoView({ behavior: suave, block: 'start' });
  }));

  /* =====================================================================
     IDEAS · escenario a oscuras con un foco. Con ratón, la luz sigue al
     cursor e ilumina la idea más cercana; si nadie la mueve, recorre las
     14 ideas sola. La lista y las fotos abren la idea en el visor.
     ===================================================================== */
  const ideas = (() => {
    const seccion = $('#ideas');
    const pared = $('#pared');
    const luz = $('.pared__luz', pared);
    const fotos = $$('.pared__foto', pared);
    const botones = $$('.programa__lista button');
    const listaIdeas = $('.programa__lista');
    const activo = $('.programa__activo');
    const tIdea = $('#idea-t'), dIdea = $('#idea-d');
    const URL_IDEAS = 'http://www.fiestasconglamour.com/servicios-bodas-eventos-fiestas-madrid/ideas-originales/';
    let W = 0, H = 0, centros = [];
    let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, actual = -1;
    let conCursor = false, enLista = false, visible = false, gira = 0, colocada = false;

    const medir = () => {
      const p = pared.getBoundingClientRect();
      W = p.width; H = p.height;
      centros = fotos.map(f => {
        const r = f.getBoundingClientRect();
        return { x: r.left - p.left + r.width / 2, y: r.top - p.top + r.height / 2 };
      });
    };
    const pintarLuz = () => { luz.style.transform = `translate3d(${(cx - W / 2).toFixed(1)}px,${(cy - H / 2).toFixed(1)}px,0)`; };
    const bucle = () => {
      raf = 0;
      cx += (tx - cx) * .11;
      cy += (ty - cy) * .11;
      pintarLuz();
      if (Math.abs(tx - cx) > .4 || Math.abs(ty - cy) > .4) raf = requestAnimationFrame(bucle);
    };
    const mover = (x, y, inmediato = false) => {
      tx = x; ty = y;
      if (inmediato || quieto) { cx = x; cy = y; pintarLuz(); return; }
      if (!raf) raf = requestAnimationFrame(bucle);
    };

    const elegir = i => {
      if (i === actual) return;
      actual = i;
      fotos.forEach((f, k) => f.classList.toggle('iluminada', k === i));
      botones.forEach((b, k) => b.classList.toggle('activa', k === i));
      tIdea.textContent = botones[i].textContent;
      dIdea.textContent = fotos[i].dataset.d;
      if (!quieto) reanima(activo, 'cambia');
      // En móvil la lista es una fila deslizable: el botón activo, a la vista
      if (listaIdeas.scrollWidth > listaIdeas.clientWidth + 2 && !enLista) {
        const l = listaIdeas.getBoundingClientRect(), r = botones[i].getBoundingClientRect();
        listaIdeas.scrollTo({ left: listaIdeas.scrollLeft + r.left - l.left - (l.width - r.width) / 2, behavior: suave });
      }
    };
    const irA = (i, inmediato = false) => {
      elegir(i);
      if (!centros.length) medir();
      mover(centros[i].x, centros[i].y, inmediato);
    };
    const cercana = (x, y) => {
      let mejor = 0, dist = Infinity;
      centros.forEach((c, i) => { const d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < dist) { dist = d; mejor = i; } });
      return mejor;
    };

    // Recorrido solo: una idea cada 2,8 s mientras nadie mueva la luz
    const recorrer = () => {
      clearInterval(gira);
      if (quieto) return;
      gira = setInterval(() => {
        if (!conCursor && !enLista && visible && !visorAbierto && !document.hidden) irA((actual + 1) % fotos.length);
      }, 2800);
    };

    if (raton && !quieto) {
      pared.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        conCursor = true;
        const r = pared.getBoundingClientRect();
        mover(e.clientX - r.left, e.clientY - r.top);
        elegir(cercana(tx, ty));
      });
      pared.addEventListener('pointerleave', e => {
        if (e.pointerType !== 'mouse') return;
        conCursor = false;
        if (actual > -1) mover(centros[actual].x, centros[actual].y);
        recorrer();
      });
    }

    const abrirIdea = (i, boton) => {
      const f = fotos[i], img = $('img', f), b = $('.pared__btn', f);
      irA(i, true);
      visor.abrir({
        origen: img, oculta: b, boton: boton || b, alt: img.alt,
        titulo: botones[i].textContent, texto: f.dataset.d,
        asunto: 'Bienvenida original', href: URL_IDEAS, ver: 'Ver todas las ideas'
      });
    };

    botones.forEach((b, i) => {
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { enLista = true; irA(i); } });
      b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { enLista = false; recorrer(); } });
      b.addEventListener('focus', () => { if (b.matches(':focus-visible')) { enLista = true; irA(i); } });
      b.addEventListener('blur', () => { enLista = false; });
      b.addEventListener('click', () => abrirIdea(i, b));
    });
    fotos.forEach((f, i) => $('.pared__btn', f).addEventListener('click', () => abrirIdea(i)));

    const recolocar = () => { medir(); if (actual > -1) mover(centros[actual].x, centros[actual].y, true); };
    if ('ResizeObserver' in window) new ResizeObserver(recolocar).observe(pared);
    else addEventListener('resize', recolocar);

    enPantalla(seccion, v => {
      visible = v;
      if (v && !colocada) { colocada = true; medir(); irA(actual > -1 ? actual : 0, true); recorrer(); }
    });
    if (quieto) { medir(); irA(0, true); }

    return { irA, abrirIdea };
  })();

  // @bloque promo
  /* =====================================================================
     SERVICIOS EN PROMOCIÓN · cartelera de estreno: los carteles entran
     girando, se encienden las bombillas, cae el sello y en cada pantalla
     pasan las fotos de su banner, a destiempo unas de otras.
     ===================================================================== */
  const cartelera = $('.cartelera');
  if (cartelera) {
    alEntrar(cartelera, el => {
      el.classList.add('visible');
      setTimeout(() => el.classList.add('encendida', 'sellada'), quieto ? 0 : 950);
      setTimeout(() => el.classList.add('asentada'), quieto ? 0 : 2300);
    }, .15);
    const pases = $$('[data-pase]', cartelera).map(p => ({ fotos: $$('.pase__foto', p), i: 0 }));
    pases.forEach(x => x.fotos[0].classList.add('activa'));
    let cartelVisible = false, turno = 0;
    enPantalla(cartelera, v => { cartelVisible = v; });
    if (!quieto) setInterval(() => {
      if (!cartelVisible || document.hidden || visorAbierto) return;
      const x = pases[turno++ % pases.length];
      if (x.fotos.length < 2) return;
      x.fotos[x.i].classList.remove('activa');
      x.i = (x.i + 1) % x.fotos.length;
      x.fotos[x.i].classList.add('activa');
    }, 1500);
    if (raton && !quieto) $$('.cartel', cartelera).forEach(c => {
      const luz = $('.cartel__luz', c);
      c.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = c.getBoundingClientRect();
        luz.style.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`);
        luz.style.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`);
        c.classList.add('iluminado');
      });
      c.addEventListener('pointerleave', () => c.classList.remove('iluminado'));
    });
  }
  // /@bloque promo

  // @bloque ideas-tira
  /* =====================================================================
     IDEAS · las tres fotos de su portada, en escena. Se despliegan al
     llegar, giran un poco siguiendo al cursor y se abren en el visor.
     ===================================================================== */
  const triptico = $('.triptico');
  if (triptico) {
    alEntrar(triptico, el => {
      el.classList.add('visible');
      setTimeout(() => el.classList.add('asentado'), quieto ? 0 : 1300);
    }, .25);
    const escenaT = $('.triptico__escena', triptico);
    // En móvil es una fila deslizable: arranca centrada en la foto del medio
    if (escenaT.scrollWidth > escenaT.clientWidth + 2) {
      const centro = $('.triptico__foto--centro', escenaT);
      escenaT.scrollLeft = centro.offsetLeft - (escenaT.clientWidth - centro.offsetWidth) / 2;
    }
    if (raton && !quieto) {
      triptico.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = triptico.getBoundingClientRect();
        escenaT.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - .5) * 8).toFixed(2)}deg`);
        escenaT.style.setProperty('--rx', `${(-((e.clientY - r.top) / r.height - .5) * 5).toFixed(2)}deg`);
      });
      triptico.addEventListener('pointerleave', () => { escenaT.style.removeProperty('--ry'); escenaT.style.removeProperty('--rx'); });
    }
    $$('.triptico__btn', triptico).forEach(b => b.addEventListener('click', () => {
      const img = $('img', b);
      visor.abrir({
        origen: img, oculta: b, boton: b, alt: img.alt,
        titulo: b.dataset.titulo, texto: b.dataset.texto, asunto: 'Bienvenida original',
        href: b.dataset.href, ver: b.dataset.ver
      });
    }));
  }
  // /@bloque ideas-tira

  // @bloque nosotros
  /* =====================================================================
     QUIÉNES SOMOS · el telón se abre al llegar y descubre al equipo;
     la cita se enciende palabra a palabra al bajar y se firma al final.
     ===================================================================== */
  const nosotros = $('.nosotros');
  alEntrar($('.escenario'), () => nosotros.classList.add('abierto'), .35);
  const frase = $('.cita__frase');
  if (frase && !quieto) {
    // Las palabras siguen siendo texto: los lectores de pantalla leen la frase igual
    frase.innerHTML = frase.textContent.trim().split(/\s+/).map(p => `<span class="palabra">${esc(p)}</span>`).join(' ');
    const palabras = $$('.palabra', frase), cita = frase.closest('.cita');
    let rafCita = 0;
    const encender = () => {
      rafCita = 0;
      const top = frase.getBoundingClientRect().top;
      const ini = innerHeight * .95, fin = innerHeight * .68;
      const n = Math.round(Math.min(1, Math.max(0, (ini - top) / (ini - fin))) * palabras.length);
      palabras.forEach((s, i) => s.classList.toggle('encendida', i < n));
      cita.classList.toggle('firmada', n >= palabras.length);
    };
    const alBajar = () => { if (!rafCita) rafCita = requestAnimationFrame(encender); };
    enPantalla(frase, v => {
      if (v) { addEventListener('scroll', alBajar, { passive: true }); encender(); }
      else removeEventListener('scroll', alBajar);
    });
  } else if (frase) frase.closest('.cita').classList.add('firmada');
  // /@bloque nosotros

  // @bloque contacto
  /* ---------- Contacto: el trazo bajo «la fiesta de tus sueños» se dibuja al llegar ---------- */
  alEntrar($('.contacto'), el => el.classList.add('visible'), .25);
  // /@bloque contacto

  // @bloque pie
  // /@bloque pie

  /* =====================================================================
     CABECERA · compacta al bajar. Mega-menú construido desde el
     catálogo: con ratón se abre con 120 ms de intención y se cierra al
     salir de la cabecera; con clic y teclado alterna. Esc cierra y
     devuelve el foco.
     ===================================================================== */
  const cab = $('#cab');
  const alScroll = () => cab.classList.toggle('compacta', scrollY > 24);
  addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  const mega = $('#mega');
  const botones = $$('.menu__btn');
  let abierto = null, porHover = false, tAbre, tCierra;
  const clonar = a => { const c = a.cloneNode(true); c.removeAttribute('data-k'); return c; };

  const pintarMega = btn => {
    const cats = btn.dataset.cats.split(' ').map(datosCat);
    const [p] = cats;
    mega.innerHTML = `<div class="mega__env"><div class="mega__lado"><p class="mega__t">${esc(p.nombre)}</p><p class="mega__lema">${esc(p.lema)}</p><a class="enlace" href="${p.url}">${esc(p.ver)}</a></div><div class="mega__grupos"></div></div>`;
    const grupos = $('.mega__grupos', mega);
    cats.forEach(c => {
      const g = document.createElement('div');
      if (cats.length > 1) g.innerHTML = `<p class="mega__grupo-t">${esc(c.nombre)}</p>`;
      const ul = document.createElement('ul');
      ul.className = 'mega__lista';
      c.enlaces.forEach(a => { const li = document.createElement('li'); li.append(clonar(a)); ul.append(li); });
      g.append(ul);
      grupos.append(g);
    });
  };
  const abrirMega = (btn, { hover = false, animar = true } = {}) => {
    clearTimeout(tCierra);
    if (abierto === btn) return;
    const venia = !!abierto;
    botones.forEach(b => b.setAttribute('aria-expanded', String(b === btn)));
    pintarMega(btn);
    mega.hidden = false;
    cab.classList.add('abierta');
    // Entre categorías el panel ya está abierto: se cambia sin animar
    if (!venia && animar && !quieto) reanima(mega, 'entra-mega');
    abierto = btn;
    porHover = hover;
  };
  const cerrarMega = (devolverFoco = false) => {
    if (!abierto) return;
    const b = abierto;
    abierto = null;
    botones.forEach(x => x.setAttribute('aria-expanded', 'false'));
    mega.hidden = true;
    mega.classList.remove('entra-mega');
    cab.classList.remove('abierta');
    if (devolverFoco) b.focus();
  };

  botones.forEach(b => {
    b.addEventListener('click', () => {
      if (abierto === b && !porHover) cerrarMega();
      else abrirMega(b, { animar: !abierto });
      porHover = false;
    });
    b.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(tCierra);
      tAbre = setTimeout(() => abrirMega(b, { hover: true }), abierto ? 0 : 120);
    });
    b.addEventListener('pointerleave', () => clearTimeout(tAbre));
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); abrirMega(b, { animar: false }); $('a', mega)?.focus(); }
    });
  });
  cab.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') tCierra = setTimeout(() => cerrarMega(), 240); });
  cab.addEventListener('pointerenter', () => clearTimeout(tCierra));
  cab.addEventListener('focusout', e => { if (abierto && !cab.contains(e.relatedTarget)) cerrarMega(); });
  mega.addEventListener('click', e => { if (e.target.closest('a')) cerrarMega(); });
  document.addEventListener('click', e => { if (abierto && !cab.contains(e.target)) cerrarMega(); });

  /* ---------- Menú móvil: acordeón por categoría, del mismo catálogo ---------- */
  const movil = $('#movil');
  const abrirBtn = $('.cab__abrir');
  const navMovil = $('.movil__nav', movil);

  botones.forEach((b, i) => {
    const cats = b.dataset.cats.split(' ').map(datosCat);
    const id = `movil-l-${i}`;
    const div = document.createElement('div');
    div.className = 'movil__cat';
    div.innerHTML = `<button class="movil__btn" type="button" aria-expanded="false" aria-controls="${id}">${esc(b.textContent.trim())}<svg aria-hidden="true"><use href="#i-baja"/></svg></button><div class="movil__lista" id="${id}" hidden></div>`;
    const caja = $('.movil__lista', div);
    cats.forEach(c => {
      const ul = document.createElement('ul');
      c.enlaces.forEach(a => { const li = document.createElement('li'); li.append(clonar(a)); ul.append(li); });
      const li = document.createElement('li');
      li.innerHTML = `<a class="movil__todo" href="${c.url}">${esc(c.ver)}</a>`;
      ul.append(li);
      caja.append(ul);
    });
    navMovil.append(div);
  });

  const abrirMovil = () => {
    movil.hidden = false;
    if (!quieto) reanima(movil, 'entra-movil');
    abrirBtn.setAttribute('aria-expanded', 'true');
    $('.vo', abrirBtn).textContent = 'Cerrar menú';
    $('use', abrirBtn).setAttribute('href', '#i-cerrar');
    cab.classList.add('abierta');
    bloquear(true);
  };
  const cerrarMovil = (devolverFoco = false) => {
    if (movil.hidden) return;
    movil.hidden = true;
    abrirBtn.setAttribute('aria-expanded', 'false');
    $('.vo', abrirBtn).textContent = 'Abrir menú';
    $('use', abrirBtn).setAttribute('href', '#i-menu');
    cab.classList.remove('abierta');
    bloquear(false);
    if (devolverFoco) abrirBtn.focus();
  };

  abrirBtn.addEventListener('click', () => (movil.hidden ? abrirMovil() : cerrarMovil()));
  movil.addEventListener('click', e => {
    const b = e.target.closest('.movil__btn');
    if (b) {
      const on = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(on));
      $(`#${b.getAttribute('aria-controls')}`).hidden = !on;
      return;
    }
    if (e.target.closest('a')) cerrarMovil();
  });
  matchMedia('(min-width: 1100px)').addEventListener('change', e => (e.matches ? cerrarMovil() : cerrarMega()));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || visorAbierto) return;
    if (abierto) cerrarMega(true);
    cerrarMovil(true);
  });

  /* ---------- Presupuesto siempre a mano ----------
     Botón flotante (escritorio) y barra fija (móvil): aparecen al dejar
     atrás el hero y se retiran al llegar al contacto. */
  const flotante = $('.flotante'), fija = $('.fija');
  let fueraHero = false, enContacto = false;
  const pintaCtas = () => {
    const v = fueraHero && !enContacto;
    [flotante, fija].forEach(el => { el.classList.toggle('visible', v); el.setAttribute('aria-hidden', String(!v)); });
    flotante.tabIndex = v ? 0 : -1;
    $$('a', fija).forEach(a => (a.tabIndex = v ? 0 : -1));
  };
  if (io) {
    enPantalla(escena, v => { fueraHero = !v; pintaCtas(); });
    new IntersectionObserver(([e]) => { enContacto = e.isIntersecting; pintaCtas(); }, { threshold: .12 }).observe($('#contacto'));
  }

  /* =====================================================================
     FORMULARIO · validación en línea, sin castigar mientras se escribe.
     Cualquier "Pide presupuesto" con data-asunto deja elegido el asunto.
     ===================================================================== */
  const form = $('#formulario');
  const asunto = $('#f-asunto');
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-asunto]');
    if (a && a.dataset.asunto) asunto.value = a.dataset.asunto;
  });

  const reglas = {
    'f-nombre': el => el.value.trim().length > 1,
    'f-email': el => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()),
    'f-asunto': el => !!el.value,
    'f-priv': el => el.checked
  };
  const validar = el => {
    const ok = reglas[el.id](el);
    el.setAttribute('aria-invalid', String(!ok));
    $(`#${el.getAttribute('aria-describedby')}`).hidden = ok;
    return ok;
  };
  Object.keys(reglas).forEach(id => {
    const el = $(`#${id}`);
    const cambio = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(cambio, () => { if (el.value || el.hasAttribute('aria-invalid')) validar(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validar(el); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if ($('#f-web').value) return;                       // trampa para bots
    const malos = Object.keys(reglas).map(id => $(`#${id}`)).filter(el => !validar(el));
    if (malos.length) { malos[0].focus(); return; }
    const ok = $('.formulario__ok', form);
    $('.formulario__pie', form).hidden = true;
    ok.hidden = false;
    ok.tabIndex = -1;
    if (!quieto) reanima(ok, 'entra-ok');
    ok.focus();
  });

  /* ---------- Estados por parámetro (revisión y capturas) ---------- */
  if (params.get('menu')) {
    const b = botones.find(x => x.dataset.cats.split(' ')[0] === params.get('menu'));
    if (b) abrirMega(b, { animar: false });
  }
  if (params.has('movil')) abrirMovil();
  if (params.get('cat')) abrirCat(params.get('cat'), { desplazar: false });
  if (params.get('q')) { campo.value = params.get('q'); buscar(); }
  if (params.get('girar')) {
    const inv = $(`.invitacion[data-publico="${params.get('girar')}"]`);
    if (inv) girar(inv, true);
  }
  if (params.get('idea')) ideas.irA(Number(params.get('idea')), true);
  if (params.get('foto')) tiovivo.ir(Number(params.get('foto')), 600000);
  if (params.get('visor')) {
    const i = Number(params.get('visor'));
    tiovivo.ir(i, 600000);
    setTimeout(() => tiovivo.abrirFoto(i), quieto ? 0 : 900);
  }
  if (params.get('verIdea')) ideas.abrirIdea(Number(params.get('verIdea')));
})();
