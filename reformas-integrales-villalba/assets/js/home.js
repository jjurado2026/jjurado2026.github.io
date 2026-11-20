/* Reformas Integrales Villalba — home v2. Sin dependencias. */
(() => {
  'use strict';
  window.RIV = true;
  const d = document.documentElement;
  const quieto = d.classList.contains('quieto');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const tactil = matchMedia('(hover: none)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  const vigila = (el, fn, margen = '0px', umbral = 0) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting, e)), { rootMargin: margen, threshold: umbral });
    io.observe(el);
    return io;
  };
  /* Pausa común: fuera de pantalla, pestaña oculta o cursor encima (solo con movimiento real del ratón) */
  const pausable = (el, alCambiar) => {
    const estado = { fuera: true, encima: false, oculta: document.hidden };
    const aplica = () => alCambiar(estado.fuera || estado.encima || estado.oculta, estado);
    vigila(el, (dentro) => { estado.fuera = !dentro; aplica(); });
    if (!tactil) {
      el.addEventListener('pointermove', () => { if (!estado.encima) { estado.encima = true; aplica(); } });
      el.addEventListener('pointerleave', () => { estado.encima = false; aplica(); });
    }
    document.addEventListener('visibilitychange', () => { estado.oculta = document.hidden; aplica(); });
    return estado;
  };

  /* ── Círculo que se abre: recorte SVG cuyo círculo crece (solo transform) ── */
  const svgDefs = (() => {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'sprite'); s.setAttribute('aria-hidden', 'true');
    const defs = document.createElementNS(SVGNS, 'defs');
    s.appendChild(defs); document.body.appendChild(s);
    return defs;
  })();
  let nClip = 0;
  /* Recorte en unidades de la caja (0-1): el círculo cubre la caja entera a escala 1 */
  const clipCaja = (el, cx = .5, cy = .5) => {
    const id = 'cv' + (++nClip);
    const cp = document.createElementNS(SVGNS, 'clipPath');
    cp.setAttribute('id', id); cp.setAttribute('clipPathUnits', 'objectBoundingBox');
    const c = document.createElementNS(SVGNS, 'circle');
    const r = Math.max(Math.hypot(cx, cy), Math.hypot(1 - cx, cy), Math.hypot(cx, 1 - cy), Math.hypot(1 - cx, 1 - cy)) + .02;
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.style.transformBox = 'view-box'; c.style.transformOrigin = `${cx}px ${cy}px`; c.style.transform = 'scale(0)';
    cp.appendChild(c); svgDefs.appendChild(cp);
    el.style.clipPath = `url(#${id})`;
    return c;
  };
  const abre = (circulo, dur = 1300, retraso = 0, easing = 'cubic-bezier(.65,0,.35,1)', desde = 0, hasta = 1) =>
    circulo.animate([{ transform: `scale(${desde})` }, { transform: `scale(${hasta})` }], { duration: dur, delay: retraso, easing, fill: 'forwards' }).finished;

  /* ── Cabecera ── */
  const cab = $('[data-cab]');
  const alBajar = () => cab.classList.toggle('bajada', scrollY > 30);
  addEventListener('scroll', alBajar, { passive: true });
  alBajar();
  const abrir = $('[data-abrir-menu]');
  const panel = $('#menu-movil');
  const menu = (abre) => {
    abrir.setAttribute('aria-expanded', String(abre));
    panel.hidden = !abre;
    $('use', abrir).setAttribute('href', abre ? '#i-cerrar' : '#i-menu');
    document.body.style.overflow = abre ? 'hidden' : '';
    cab.classList.toggle('bajada', abre || scrollY > 30);
  };
  abrir.addEventListener('click', () => menu(abrir.getAttribute('aria-expanded') !== 'true'));
  $$('a', panel).forEach((a) => a.addEventListener('click', () => menu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { menu(false); abrir.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1260 && !panel.hidden) menu(false); });

  /* ── Títulos: cada palabra sube desde su línea ── */
  $$('[data-lineas]').forEach((h) => {
    let n = 0;
    const parte = (cont) => {
      const palabras = cont.textContent.trim().split(/\s+/);
      cont.textContent = '';
      palabras.forEach((p, i) => {
        const caja = document.createElement('span'); caja.className = 'pal';
        const dentro = document.createElement('span'); dentro.style.setProperty('--i', n++); dentro.textContent = p;
        caja.appendChild(dentro); cont.appendChild(caja);
        if (i < palabras.length - 1) cont.appendChild(document.createTextNode(' '));
      });
    };
    const lineas = $$('.l', h);
    if (lineas.length) lineas.forEach(parte); else parte(h);
  });
  /* Títulos en dos líneas exactas: si una línea no cabe en su columna, el título se reduce lo justo */
  const ajustaLineas = () => {
    const hs = $$('[data-lineas]').filter((h) => h.querySelector('.l'));
    hs.forEach((h) => { h.style.fontSize = ''; });
    if (innerWidth < 900) return;
    /* se leen todas las medidas de una vez y luego se escribe: un solo cálculo de la página */
    const medidas = hs.map((h) => ({ h, ancho: h.clientWidth, linea: Math.max(...$$('.l', h).map((l) => l.scrollWidth)), fs: parseFloat(getComputedStyle(h).fontSize) }));
    medidas.forEach(({ h, ancho, linea, fs }) => { if (linea > ancho + 1) h.style.fontSize = (fs * ancho / linea * .985).toFixed(2) + 'px'; });
  };
  if (document.fonts) document.fonts.ready.then(() => requestAnimationFrame(ajustaLineas)); else ajustaLineas();
  let tLin;
  addEventListener('resize', () => { clearTimeout(tLin); tLin = setTimeout(ajustaLineas, 150); });

  /* ── Entradas al aparecer ── */
  const revela = $$('[data-revela]');
  if (quieto) revela.forEach((el) => el.classList.add('visto'));
  else {
    const grupos = new Map();
    revela.forEach((el) => { const n = grupos.get(el.parentElement) || 0; el.style.setProperty('--d', n * 120); grupos.set(el.parentElement, n + 1); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    revela.forEach((el) => io.observe(el));
  }

  /* ════════ HERO: sus mejores estancias, en fundido con un zoom lento ════════ */
  const hero = $('[data-hero]');
  if (/[?&]hero=sangre\b/.test(location.search)) d.classList.add('hero-sangre');
  const heroIn = $('.hero__in', hero);
  const titulo = $('.titulo', hero);
  /* Hero entero en la primera pantalla: si no cabe, primero se reduce la foto (móvil) y luego el titular */
  const encaja = () => {
    hero.style.removeProperty('--t');
    heroIn.style.removeProperty('--hv');
    const barra = $('[data-barra]');
    const util = innerHeight - (barra && getComputedStyle(barra).display !== 'none' ? barra.offsetHeight : 0);
    const apilado = getComputedStyle(heroIn).gridTemplateColumns.trim().split(/\s+/).length === 1;
    for (let n = 0; n < 3; n++) {
      const ult = [$('.datos', hero), $('.hero__botones', hero)].filter((e) => getComputedStyle(e).display !== 'none')[0];
      const sobra = ult.getBoundingClientRect().bottom + scrollY + 12 - util;
      if (sobra <= 0) break;
      const vis = $('.hero__visual', hero);
      if (apilado && !d.classList.contains('hero-sangre') && vis.offsetHeight > 132) {
        heroIn.style.setProperty('--hv', Math.max(130, vis.offsetHeight - sobra - 4) + 'px');
      } else {
        /* el titular ocupa tres líneas: se reduce lo que sobra, repartido entre ellas */
        const t = parseFloat(getComputedStyle(titulo).fontSize);
        const nuevo = Math.max(24, t - sobra / 3.1);
        hero.style.setProperty('--t', nuevo.toFixed(2) + 'px');
      }
    }
  };
  encaja();
  if (document.fonts) document.fonts.ready.then(() => requestAnimationFrame(encaja));
  let tAj; let anchoAntes = innerWidth; let altoAntes = innerHeight;
  addEventListener('resize', () => {
    if (innerWidth === anchoAntes && Math.abs(innerHeight - altoAntes) < 140) return;
    anchoAntes = innerWidth; altoAntes = innerHeight;
    clearTimeout(tAj); tAj = setTimeout(encaja, 120);
  });

  const fondos = $$('.fondo', hero);
  const ficha = $('[data-ficha-hero]');
  const barras = $$('.ficha-hero__barras i', ficha);
  const nombre = $('.ficha-hero__nombre', ficha);
  let iF = 0; let pausaHero = false;
  const pinta = (n) => {
    const f = fondos[n];
    barras.forEach((b, j) => { b.classList.toggle('hecha', j < n); b.classList.remove('ahora'); });
    void ficha.offsetWidth;
    if (!quieto) barras[n].classList.add('ahora');
    nombre.classList.add('cambia');
    setTimeout(() => {
      $('[data-h-chalet]', ficha).textContent = f.dataset.chalet;
      $('[data-h-desc]', ficha).textContent = f.dataset.desc;
      $('[data-h-enlace]', ficha).href = f.dataset.enlace;
      nombre.classList.remove('cambia');
    }, quieto ? 0 : 300);
  };
  const vaA = (n) => {
    n = (n + fondos.length) % fondos.length;
    if (n === iF) return;
    const antes = fondos[iF]; const luego = fondos[n];
    pide(luego);
    fondos.forEach((f) => f.classList.remove('encima'));
    luego.classList.remove('zoom'); void luego.offsetWidth;
    luego.classList.add('encima', 'is-activa');
    fondos.forEach((f) => f.setAttribute('aria-hidden', String(f !== luego)));
    if (!quieto) luego.classList.add('zoom');
    iF = n;
    pinta(n);
    setTimeout(() => { if (antes !== fondos[iF]) antes.classList.remove('is-activa', 'zoom'); }, quieto ? 0 : 1700);
  };
  fondos.forEach((f, j) => f.setAttribute('aria-hidden', String(j !== 0)));
  if (!quieto) fondos[0].classList.add('zoom');
  /* las demás fotos se piden cuando la página ya ha cargado (no compiten con la primera pantalla) */
  const pide = (f) => { if (f.dataset.srcset) { f.srcset = f.dataset.srcset; delete f.dataset.srcset; } if (f.dataset.src) { f.src = f.dataset.src; delete f.dataset.src; } };
  if (document.readyState === 'complete') setTimeout(() => fondos.forEach(pide), 1200);
  else addEventListener('load', () => setTimeout(() => fondos.forEach(pide), 1200));
  barras.forEach((b) => b.addEventListener('animationend', () => { if (b.classList.contains('ahora') && !pausaHero) vaA(iF + 1); }));
  $$('[data-h-paso]', ficha).forEach((b) => b.addEventListener('click', () => vaA(iF + Number(b.dataset.hPaso))));
  if (!quieto) {
    pausable(ficha, (p) => { pausaHero = p; ficha.classList.toggle('pausa', p); });
    vigila(hero, (dentro) => { if (!dentro) { pausaHero = true; ficha.classList.add('pausa'); } else if (!ficha.matches(':hover')) { pausaHero = false; ficha.classList.remove('pausa'); } });
    setTimeout(() => pinta(0), 1300);
  } else pinta(0);

  /* Transición hero → servicios: un círculo blanco se abre desde el borde inferior del hero al bajar */
  const apertura = $('.hero__apertura', hero);
  if (apertura && !quieto) {
    let pedido = false;
    const mide = () => hero.style.setProperty('--d', (2 * Math.hypot(hero.offsetWidth / 2, hero.offsetHeight) + 8).toFixed(0) + 'px');
    const abreCirculo = () => {
      pedido = false;
      const p = Math.min(1, Math.max(0, scrollY / ((hero.offsetHeight || innerHeight) * .82)));
      const e = p * p * (3 - 2 * p);   /* suave al principio y al final */
      apertura.style.transform = `scale(${e.toFixed(4)})`;
      if (p > .92 && !pausaHero) { pausaHero = true; ficha.classList.add('pausa'); }
      else if (p <= .9 && pausaHero && !ficha.matches(':hover') && !document.hidden) { pausaHero = false; ficha.classList.remove('pausa'); }
    };
    mide();
    addEventListener('resize', () => { mide(); abreCirculo(); });
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(abreCirculo); } }, { passive: true });
    abreCirculo();
  }

  /* ── Cinta: se duplica para que no tenga fin ── */
  const cinta = $('[data-cinta]');
  if (cinta) {
    const copia = cinta.innerHTML;
    cinta.insertAdjacentHTML('beforeend', copia.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" '));
  }

  const resto = () => {
  /* ════════ Servicios en pila ════════ */
  const pila = $('[data-pila]');
  const fichas = $$('.servicio', pila);
  const fotosServ = fichas.map((f) => $('.servicio__foto img', f));
  if (!quieto) {
    const circulos = fotosServ.map((img) => clipCaja(img, .5, .55));
    fichas.forEach((f, i) => {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) {
          f.classList.add('visto');
          abre(circulos[i], 1400, 150).then(() => { fotosServ[i].style.clipPath = ''; });
          setTimeout(() => { f.classList.add('gesto-on'); setTimeout(() => f.classList.remove('gesto-on'), 1500); }, 700);
          io.disconnect();
        }
      }), { threshold: .3 });
      io.observe(f);
    });
    /* La ficha de abajo, al subir, empuja y oscurece la de arriba */
    let pedido = false;
    const apila = () => {
      pedido = false;
      for (let i = 0; i < fichas.length - 1; i++) {
        const a = fichas[i].getBoundingClientRect();
        const b = fichas[i + 1].getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
        fichas[i].style.transform = p > 0 ? `scale(${(1 - .06 * p).toFixed(4)})` : '';
        fichas[i].style.setProperty('--sombra-pila', (p * .45).toFixed(3));
      }
    };
    addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(apila); } }, { passive: true });
    apila();
  } else fichas.forEach((f) => f.classList.add('visto'));

  /* ════════ El mejor equipo: el párrafo se lee al bajar ════════ */
  const leido = $('[data-leido]');
  if (leido) {
    const palabras = leido.textContent.trim().split(/\s+/);
    leido.textContent = '';
    const ws = palabras.map((p, i) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = p; leido.appendChild(s);
      if (i < palabras.length - 1) leido.appendChild(document.createTextNode(' '));
      return s;
    });
    if (!quieto) {
      let pedido = false;
      const lee = () => {
        pedido = false;
        const r = leido.getBoundingClientRect();
        const inicio = innerHeight * .88; const fin = innerHeight * .38;
        const p = Math.min(1, Math.max(0, (inicio - r.top) / (inicio - fin + r.height * .6)));
        const n = Math.round(p * ws.length);
        ws.forEach((w, i) => w.classList.toggle('on', i < n));
      };
      addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(lee); } }, { passive: true });
      lee();
    }
  }

  /* ════════ En obra → terminado: el círculo se abre, se queda, se cierra ════════ */
  $$('[data-obra]').forEach((marco, k) => {
    const despues = $('.obra__despues', marco);
    const antes = $('.obra__antes', marco);
    if (quieto) { despues.setAttribute('aria-hidden', 'true'); return; }
    const c = clipCaja(despues, .5, .5);
    despues.classList.add('lista');
    let vivo = false; let parada = true;
    pausable(marco, (p) => { parada = p; });
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const esperaLibre = async () => { while (parada) await espera(300); };
    const ciclo = async () => {
      await espera(900 + k * 1800);
      for (;;) {
        await esperaLibre(); await espera(1600);
        marco.classList.add('fin');
        await abre(c, 1500, 0, 'cubic-bezier(.65,0,.35,1)', 0, 1);
        antes.classList.add('fuera');
        await espera(2800); await esperaLibre();
        antes.classList.remove('fuera'); await espera(350);
        marco.classList.remove('fin');
        await abre(c, 1100, 0, 'cubic-bezier(.65,0,.35,1)', 1, 0);
      }
    };
    vigila(marco, (dentro) => { if (dentro && !vivo) { vivo = true; ciclo(); } });
  });

  /* ── Olas: los iconos de una lista hacen su gesto por turnos ── */
  if (!quieto) $$('[data-ola]').forEach((lista) => {
    const items = [...lista.children];
    let k = 0; let parada = true;
    pausable(lista, (p) => { parada = p; });
    setInterval(() => {
      if (parada) return;
      const el = items[k % items.length];
      el.classList.add('gesto-on'); setTimeout(() => el.classList.remove('gesto-on'), 1300);
      k++;
    }, 1700);
  });

  /* ════════ Nuestros trabajos: galería justificada, filtros y visor ════════ */
  const galeria = $('[data-galeria]');
  const NOMBRES = { cm: 'Collado Mediano', v: 'Ventas', lm: 'Los Molinos' };
  const DESCS = { cm: 'Reforma de chalet en la Sierra', v: 'Reforma de chalet en Madrid centro', lm: 'Reforma de chalet en la Sierra' };
  const ENLACES = { cm: 'https://reformasintegralesvillalba.es/reformas/chalet-collado-mediano/', v: 'https://reformasintegralesvillalba.es/reformas/chalet-ventas/', lm: 'https://reformasintegralesvillalba.es/reformas/chalet-los-molinos/' };
  if (galeria) {
    const fotos = $$('.foto', galeria);
    fotos.forEach((f) => {
      const img = $('img', f);
      f.dataset.r = (img.getAttribute('width') / img.getAttribute('height')).toFixed(4);
      f.dataset.nombre = NOMBRES[f.dataset.c];
      f.setAttribute('aria-label', 'Ampliar foto: ' + img.alt);
      f.insertAdjacentHTML('beforeend', '<span class="lupa" aria-hidden="true"><svg><use href="#i-mas"/></svg></span>');
    });
    let filtro = 'todos';
    const visibles = () => fotos.filter((f) => (filtro === 'todos' ? f.hasAttribute('data-top') : f.dataset.c === filtro));
    const coloca = (animar) => {
      const ancho = galeria.clientWidth;
      const gap = innerWidth < 600 ? 8 : 14;
      const alto = innerWidth < 600 ? 150 : innerWidth < 1000 ? 230 : 310;
      const vis = visibles();
      const antes = new Map();
      if (animar) fotos.forEach((f) => antes.set(f, f.getBoundingClientRect()));
      /* filas: se van sumando fotos hasta llenar el ancho; luego la fila se escala para encajar justo */
      const filas = []; let fila = []; let suma = 0;
      vis.forEach((f) => {
        fila.push(f); suma += +f.dataset.r;
        if (suma * alto + gap * (fila.length - 1) >= ancho) { filas.push({ fila, suma, llena: true }); fila = []; suma = 0; }
      });
      if (fila.length) filas.push({ fila, suma, llena: false });
      let y = 0;
      filas.forEach(({ fila, suma, llena }) => {
        let h = (ancho - gap * (fila.length - 1)) / suma;
        if (!llena) h = Math.min(h, alto);
        const total = suma * h + gap * (fila.length - 1);
        let x = llena ? 0 : (ancho - total) / 2;
        fila.forEach((f) => {
          const w = +f.dataset.r * h;
          f.style.width = w.toFixed(2) + 'px'; f.style.height = h.toFixed(2) + 'px';
          f.dataset.x = x; f.dataset.y = y;
          x += w + gap;
        });
        y += h + gap;
      });
      galeria.style.height = Math.max(0, y - gap) + 'px';
      const rg = galeria.getBoundingClientRect();
      fotos.forEach((f) => {
        const dentro = vis.includes(f);
        f.classList.toggle('fuera', !dentro);
        f.tabIndex = dentro ? 0 : -1;
        f.setAttribute('aria-hidden', String(!dentro));
        const X = +f.dataset.x || 0; const Y = +f.dataset.y || 0;
        if (animar && dentro && !quieto) {
          const a = antes.get(f);
          const eraVisible = a.width > 0 && !f.dataset.estabaFuera;
          if (eraVisible) {
            const sx = a.width / parseFloat(f.style.width);
            f.classList.remove('mueve');
            f.style.transform = `translate(${a.left - rg.left}px, ${a.top - rg.top}px) scale(${sx})`;
            void f.offsetWidth;
          } else {
            f.classList.remove('mueve');
            f.style.transform = `translate(${X}px, ${Y + 30}px) scale(.92)`;
            void f.offsetWidth;
          }
          f.classList.add('mueve');
        }
        f.style.transform = `translate(${X}px, ${Y}px)`;
        f.dataset.estabaFuera = dentro ? '' : '1';
      });
    };
    coloca(false);
    let tG; let anchoG = galeria.clientWidth;
    addEventListener('resize', () => { clearTimeout(tG); tG = setTimeout(() => { if (galeria.clientWidth !== anchoG) { anchoG = galeria.clientWidth; coloca(false); } }, 150); });
    $$('.filtro').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.filtro === filtro) return;
      filtro = b.dataset.filtro;
      $$('.filtro').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      coloca(true);
    }));
    /* entrada: cada foto se abre en un círculo, en cascada */
    if (!quieto) {
      const circs = new Map();
      fotos.forEach((f) => circs.set(f, clipCaja($('img', f), .5, .5)));
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        visibles().forEach((f, i) => abre(circs.get(f), 1100, i * 90).then(() => { $('img', f).style.clipPath = ''; }));
        fotos.filter((f) => !visibles().includes(f)).forEach((f) => { circs.get(f).style.transform = 'scale(1)'; $('img', f).style.clipPath = ''; });
        io.disconnect();
      }), { threshold: .15 });
      io.observe(galeria);
    }

    /* Visor */
    const visor = document.createElement('div');
    visor.className = 'visor'; visor.hidden = true;
    visor.setAttribute('role', 'dialog'); visor.setAttribute('aria-modal', 'true'); visor.setAttribute('aria-label', 'Fotos de nuestros trabajos');
    visor.innerHTML = '<div class="visor__cab"><span class="visor__cuenta" data-v-cuenta></span><button class="visor__boton" type="button" data-v-cerrar><svg aria-hidden="true"><use href="#i-cerrar"/></svg><span class="oculto">Cerrar</span></button></div>'
      + '<div class="visor__escena"><img alt="" data-v-img><button class="visor__boton visor__atras" type="button" data-v-paso="-1"><svg aria-hidden="true"><use href="#i-atras"/></svg><span class="oculto">Foto anterior</span></button><button class="visor__boton visor__sigue" type="button" data-v-paso="1"><svg aria-hidden="true"><use href="#i-sigue"/></svg><span class="oculto">Foto siguiente</span></button></div>'
      + '<div class="visor__pie"><strong data-v-chalet></strong><span data-v-desc></span><a class="btn btn--claro" data-v-enlace href="#"><span class="btn__fondo" aria-hidden="true"></span><span class="btn__texto" data-t="Ver la reforma"><span>Ver la reforma</span></span><span class="btn__ico" aria-hidden="true"><svg><use href="#i-flecha"/></svg></span></a></div>';
    document.body.appendChild(visor);
    const vImg = $('[data-v-img]', visor);
    let lista = []; let iV = 0; let origen = null;
    const muestra = (n) => {
      iV = (n + lista.length) % lista.length;
      const f = lista[iV]; const img = $('img', f);
      vImg.classList.remove('lista');
      const src = img.currentSrc.replace('-480.webp', '-960.webp');
      const nueva = new Image(); nueva.src = src;
      const pon = () => { vImg.src = src; vImg.alt = img.alt; requestAnimationFrame(() => vImg.classList.add('lista')); };
      if (nueva.complete) pon(); else { nueva.onload = pon; nueva.onerror = pon; }
      $('[data-v-cuenta]', visor).textContent = `${iV + 1} / ${lista.length}`;
      $('[data-v-chalet]', visor).textContent = NOMBRES[f.dataset.c];
      $('[data-v-desc]', visor).textContent = DESCS[f.dataset.c];
      $('[data-v-enlace]', visor).href = ENLACES[f.dataset.c];
    };
    const cierra = () => { visor.hidden = true; document.body.style.overflow = ''; if (origen) origen.focus(); };
    fotos.forEach((f) => f.addEventListener('click', () => {
      lista = visibles(); origen = f;
      visor.hidden = false; document.body.style.overflow = 'hidden';
      muestra(lista.indexOf(f));
      $('[data-v-cerrar]', visor).focus();
    }));
    $('[data-v-cerrar]', visor).addEventListener('click', cierra);
    $$('[data-v-paso]', visor).forEach((b) => b.addEventListener('click', () => muestra(iV + Number(b.dataset.vPaso))));
    visor.addEventListener('click', (e) => { if (e.target === visor || e.target.classList.contains('visor__escena')) cierra(); });
    addEventListener('keydown', (e) => {
      if (visor.hidden) return;
      if (e.key === 'Escape') cierra();
      if (e.key === 'ArrowRight') muestra(iV + 1);
      if (e.key === 'ArrowLeft') muestra(iV - 1);
      if (e.key === 'Tab') { const foc = $$('button, a', visor); const i = foc.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); foc[foc.length - 1].focus(); } else if (!e.shiftKey && i === foc.length - 1) { e.preventDefault(); foc[0].focus(); } }
    });
    let x0 = null;
    visor.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    visor.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 50) muestra(iV + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  }

  /* ════════ Opiniones: palabra a palabra, tres nombres con barra de tiempo ════════ */
  const citas = $('[data-citas]');
  if (citas) {
    $$('[data-palabras]', citas).forEach((p) => {
      let n = 0;
      const recorre = (nodo) => {
        [...nodo.childNodes].forEach((h) => {
          if (h.nodeType === 3) {
            const partes = h.textContent.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            partes.forEach((t) => {
              if (!t) return;
              if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(t));
              else { const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--n', n++); s.textContent = t; frag.appendChild(s); }
            });
            h.replaceWith(frag);
          } else if (h.nodeType === 1) recorre(h);
        });
      };
      recorre(p);
    });
    const tabs = $$('.autor', citas);
    const textos = $$('.cita', citas);
    let k = 0; let vivo = false;
    const elige = (m, foco) => {
      k = (m + tabs.length) % tabs.length;
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === k)); t.tabIndex = j === k ? 0 : -1; t.classList.remove('corre'); });
      textos.forEach((c, j) => { c.classList.toggle('is-activa', j === k); c.setAttribute('aria-hidden', String(j !== k)); });
      if (foco) tabs[k].focus();
      if (vivo) { void citas.offsetWidth; tabs[k].classList.add('corre'); }
    };
    textos.forEach((c) => c.setAttribute('role', 'tabpanel'));
    tabs.forEach((t, j) => {
      t.addEventListener('click', () => elige(j));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); elige(k + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); elige(k - 1, true); }
      });
      $('.autor__tiempo i', t).addEventListener('animationend', () => { if (t.classList.contains('corre')) elige(k + 1); });
    });
    if (!quieto) {
      textos[0].classList.remove('is-activa');
      pausable(citas, (p) => citas.classList.toggle('pausa', p));
      vigila(citas, (dentro) => { if (dentro && !vivo) { vivo = true; citas.classList.add('visto'); setTimeout(() => elige(k), 250); } }, '0px 0px -20% 0px');
    } else elige(0);
  }

  /* ════════ Presupuesto: cada botón deja escrito el asunto ════════ */
  const form = $('[data-formulario]');
  const asunto = $('#f-asunto');
  $$('[data-asunto]').forEach((a) => a.addEventListener('click', () => {
    const v = a.dataset.asunto;
    if (v) asunto.value = 'Presupuesto: ' + v;
    setTimeout(() => $('#f-nombre').focus({ preventScroll: true }), quieto ? 0 : 800);
  }));
  if (form) {
    const err = (id, txt) => { $('#e-' + id).textContent = txt; const c = $('#f-' + id); if (c) c.setAttribute('aria-invalid', txt ? 'true' : 'false'); };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#f-email').value.trim();
      const mensaje = $('#f-mensaje').value.trim();
      const acepto = $('#f-acepto').checked;
      err('email', !email ? 'Escriba su email para poder responderle.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Revise el email: falta la @ o el dominio.'));
      err('mensaje', mensaje ? '' : 'Escriba su mensaje.');
      err('acepto', acepto ? '' : 'Marque la casilla para poder enviar el formulario.');
      const primero = $('[aria-invalid="true"]', form);
      if (primero) { primero.focus(); return; }
      const nombre = $('#f-nombre').value.trim();
      $('[data-hecho-nombre]').textContent = nombre ? ', ' + nombre.split(' ')[0] : '';
      form.classList.add('enviado');
      const hecho = $('[data-hecho]'); hecho.hidden = false; hecho.focus();
    });
    ['email', 'mensaje'].forEach((id) => $('#f-' + id).addEventListener('input', () => err(id, '')));
    $('#f-acepto').addEventListener('change', () => err('acepto', ''));
  }

  /* ── Mapa: se carga al acercarse ── */
  const mapa = $('.contacto__mapa iframe');
  if (mapa) {
    const carga = () => { if (mapa.dataset.src) { mapa.src = mapa.dataset.src; delete mapa.dataset.src; } };
    if (d.classList.contains('captura')) carga(); else vigila(mapa, (dentro) => { if (dentro) carga(); }, '600px');
  }

  /* ── WhatsApp: aparece al dejar atrás el hero; su saludo sale una vez ── */
  const wa = $('[data-wa]');
  if (wa) {
    const muestraWa = () => wa.classList.toggle('ve', scrollY > innerHeight * .55);
    addEventListener('scroll', muestraWa, { passive: true }); muestraWa();
  }
  /* ── WhatsApp: su saludo aparece una vez, a los 9 s ── */
  const burbuja = $('[data-wa-burbuja]');
  if (burbuja && !quieto && innerWidth >= 900) {
    let visto = false;
    try { visto = sessionStorage.getItem('riv-wa') === '1'; } catch (e) { /* sin almacenamiento */ }
    if (!visto) setTimeout(() => { burbuja.hidden = false; try { sessionStorage.setItem('riv-wa', '1'); } catch (e) { /* nada */ } setTimeout(() => { burbuja.hidden = true; }, 12000); }, 9000);
    $('[data-wa-cerrar]').addEventListener('click', () => { burbuja.hidden = true; });
  }
  };
  /* primero se pinta la primera pantalla; después se prepara el resto */
  if (document.readyState === 'complete') setTimeout(resto, 0); else requestAnimationFrame(() => setTimeout(resto, 0));
})();
