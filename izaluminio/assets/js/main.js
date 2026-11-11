/* =====================================================================
   IZALUMINIO — "Luz"
   Todo el contenido es legible sin JavaScript. Esto añade: el titular que
   sube al cargar, la cortina del slider, las fotos que se descorren, el
   apilado de tarjetas en escritorio, las hojas de valores, el menú, la
   fachada del mapa y el formulario.
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const captura  = location.search.includes('ss');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieto   = captura || reducido;
  const puntero  = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mqPila   = matchMedia('(min-width: 1024px) and (min-height: 640px)');   // mismo umbral que el CSS; 760 dejaba fuera a muchos portátiles Windows
  if (captura) {
    document.documentElement.classList.add('captura');
    $$('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));
  }

  /* ---------- Titular del hero: palabra a palabra, una sola vez ---------- */
  $$('[data-palabras]').forEach(el => {
    const texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    el.innerHTML = texto.split(/\s+/).map((p, k) =>
      `<span class="pal" aria-hidden="true"><span style="--k:${k}">${p}</span></span>`
    ).join(' ');
    el.classList.add('palabras');
  });

  /* ---------- Titulares de sección: máscara que sube al entrar ---------- */
  $$('.mascara').forEach(el => {
    const linea = document.createElement('span');
    linea.className = 'mascara__linea';
    while (el.firstChild) linea.appendChild(el.firstChild);
    el.appendChild(linea);
  });

  /* ---------- Carga ---------- */
  const escenario = $('#hero-escenario');
  const arrancar = () => {
    document.body.classList.add('cargada');
    if (escenario) {
      escenario.classList.add('is-inicio', 'cargado');
      setTimeout(() => escenario.classList.remove('is-inicio'), 1400);
    }
    // Pasados los reveals de carga, la frase y los botones ya no llevan retardo
    setTimeout(() => document.body.classList.add('lista'), 1500);
  };
  if (document.fonts && document.fonts.ready && !captura) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]).then(() => requestAnimationFrame(arrancar));
  } else requestAnimationFrame(arrancar);

  /* ---------- Cabecera ---------- */
  const cab = $('.cab');
  if (cab) {
    const sombra = () => (cab.dataset.scroll = scrollY > 8 ? 'si' : 'no');
    sombra();
    addEventListener('scroll', sombra, { passive: true });

    const boton = $('.cab__menu');
    const cerrarMenu = () => { cab.dataset.menu = 'cerrado'; boton.setAttribute('aria-expanded', 'false'); };
    boton.addEventListener('click', () => {
      const abierto = cab.dataset.menu === 'abierto';
      cab.dataset.menu = abierto ? 'cerrado' : 'abierto';
      boton.setAttribute('aria-expanded', String(!abierto));
    });
    $$('.cab__nav a').forEach(a => a.addEventListener('click', cerrarMenu));
    addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });

    const sub = $('.cab__item--sub'), toggle = $('.cab__sub-toggle');
    if (sub && toggle) {
      toggle.addEventListener('click', () => {
        const abierto = sub.classList.toggle('is-abierto');
        toggle.setAttribute('aria-expanded', String(abierto));
        toggle.setAttribute('aria-label', (abierto ? 'Cerrar' : 'Abrir') + ' el submenú de Servicios');
      });
      sub.addEventListener('focusout', e => {
        if (!sub.contains(e.relatedTarget)) { sub.classList.remove('is-abierto'); toggle.setAttribute('aria-expanded', 'false'); }
      });
    }
  }

  /* ---------- HERO: cortina que se descorre ----------
     La foto nueva espera detrás de un panel del color del fondo; el panel
     se retira hacia el lado del avance y la foto respira de 1.06 a 1.
     En táctil o con movimiento reducido: fundido de 200 ms.            */
  const hero = $('#hero');
  if (hero) {
    const fotos    = $$('.hero__foto', hero);
    const captions = $$('.hero__caption', hero);
    const tramos   = $$('.hero__tramo', hero);
    const progreso = $('.hero__progreso', hero);
    const cortina  = $('.hero__cortina', hero);
    const nav      = $('.hero__nav', hero);
    const N = fotos.length, INTERVALO = 5000;
    let i = 0, animando = false, timer = null;
    let autoplay = !captura;   // pase automático en todos los dispositivos; con ratón, cortina; en táctil o con movimiento reducido, fundido
    let pausado = false, dentro = false, visible = true;

    const pintarProgreso = () => {
      tramos.forEach((t, k) => {
        t.classList.toggle('is-pasado', k < i);
        if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      const corriendo = autoplay && !pausado && !dentro && visible && !document.hidden;
      progreso.style.setProperty('--dur-auto', corriendo ? INTERVALO + 'ms' : '0ms');
    };

    const activar = n => {
      fotos.forEach((f, k) => f.classList.toggle('is-activa', k === n));
      captions.forEach((c, k) => {
        c.classList.toggle('is-activa', k === n);
        c.setAttribute('aria-hidden', String(k !== n));
      });
      i = n;
      pintarProgreso();
    };

    const ir = (n, dir) => {
      n = (n + N) % N;
      if (n === i || animando) return;
      dir = dir || (n > i ? 1 : -1);
      if (quieto || !puntero || !cortina) { activar(n); return; }
      animando = true;
      cortina.classList.add('is-salto', 'is-cubre');           // cubre al instante
      requestAnimationFrame(() => requestAnimationFrame(() => {
        activar(n);                                             // cambia la foto bajo la cortina
        cortina.classList.remove('is-salto', 'is-cubre');
        if (dir < 0) cortina.classList.add('is-izq');           // hacia atrás: se descorre a la izquierda
        setTimeout(() => {
          if (dir < 0) {
            cortina.classList.add('is-salto');
            cortina.classList.remove('is-izq');
            requestAnimationFrame(() => requestAnimationFrame(() => cortina.classList.remove('is-salto')));
          }
          animando = false;
        }, 950);
      }));
    };

    /* Pase automático continuo de 5 s. Solo se pausa con el cursor o el foco
       sobre los controles, fuera de pantalla o con la pestaña oculta: el resto
       del hero ocupa toda la pantalla y pausar ahí lo dejaba parado. */
    const tic = () => {
      timer = null;
      if (!autoplay || pausado || dentro || !visible || document.hidden) return;
      ir(i + 1, 1);
      programar();
    };
    const programar = () => { clearTimeout(timer); timer = setTimeout(tic, INTERVALO); };
    const detener = () => { autoplay = false; clearTimeout(timer); timer = null; pintarProgreso(); };
    const interaccion = () => { if (autoplay && !pausado) programar(); };   // reinicia la cuenta; el pase sigue

    $$('.hero__flecha', hero).forEach(b => b.addEventListener('click', () => { interaccion(); ir(i + Number(b.dataset.dir), Number(b.dataset.dir)); }));
    tramos.forEach(t => t.addEventListener('click', () => { interaccion(); ir(Number(t.dataset.i)); }));
    hero.addEventListener('keydown', e => {
      if (!e.target.closest('.hero__nav')) return;
      if (e.key === 'ArrowRight') { interaccion(); ir(i + 1, 1); }
      if (e.key === 'ArrowLeft')  { interaccion(); ir(i - 1, -1); }
    });

    // Deslizar con el dedo sobre la foto
    let x0 = null;
    escenario.addEventListener('pointerdown', e => { x0 = e.clientX; });
    escenario.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { interaccion(); ir(dx < 0 ? i + 1 : i - 1, dx < 0 ? 1 : -1); }
    });
    escenario.addEventListener('pointercancel', () => { x0 = null; });

    // Pausas: cursor o foco sobre los controles, fuera de pantalla, pestaña oculta
    if (nav) {
      nav.addEventListener('pointerenter', () => { dentro = true; pintarProgreso(); });
      nav.addEventListener('pointerleave', () => { dentro = false; pintarProgreso(); if (autoplay && !pausado) programar(); });
      nav.addEventListener('focusin',  () => { dentro = true; pintarProgreso(); });
      nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget)) { dentro = false; pintarProgreso(); if (autoplay && !pausado) programar(); } });
    }
    document.addEventListener('visibilitychange', () => { pintarProgreso(); if (!document.hidden && autoplay && !pausado) programar(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        visible = en.isIntersecting; pintarProgreso();
        if (visible && autoplay && !pausado) programar(); else clearTimeout(timer);
      }, { threshold: 0.3 }).observe(escenario);
    }

    pintarProgreso();
    if (autoplay) setTimeout(programar, 1300);   // arranca cuando la orquestación de carga ha terminado

    // ?slide=n → abre en esa diapositiva (revisión en captura)
    const pedida = location.search.match(/slide=(\d)/);
    if (pedida) { detener(); activar(Number(pedida[1]) - 1); }
  }

  /* ---------- Entradas al hacer scroll: bloques, titulares y fotos ---------- */
  const observables = $$('.revela, .mascara, .descorre, .tarjeta__foto, .panel__foto');
  if (quieto || !('IntersectionObserver' in window)) {
    observables.forEach(el => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('visible');
        obs.unobserve(en.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -4% 0px' });
    observables.forEach(el => io.observe(el));
  }

  /* ---------- SERVICIOS: al apilarse, la tarjeta cubierta se encoge un 4 % ---------- */
  const tarjetas = $$('.tarjeta');
  if (tarjetas.length > 1 && !quieto) {
    let pendiente = false;
    const medir = () => {
      pendiente = false;
      if (!mqPila.matches) { tarjetas.forEach(t => { t.style.transform = ''; t.classList.remove('is-cubierta'); }); return; }
      for (let k = 0; k < tarjetas.length - 1; k++) {
        const r = tarjetas[k].getBoundingClientRect(), s = tarjetas[k + 1].getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (r.bottom - s.top) / r.height));
        tarjetas[k].style.transform = p > 0 ? `scale(${(1 - 0.04 * p).toFixed(4)})` : '';
        tarjetas[k].classList.toggle('is-cubierta', p > 0.9);
      }
    };
    const pedir = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } };
    addEventListener('scroll', pedir, { passive: true });
    addEventListener('resize', pedir);
    mqPila.addEventListener('change', pedir);
    medir();
  }

  /* ---------- VALORES: en escritorio, clic o teclado abre la hoja ---------- */
  $$('.valor').forEach((valor, k) => {
    const cara = $('.valor__cara', valor);
    cara.addEventListener('click', () => {
      const abierta = valor.classList.toggle('is-abierta');
      cara.setAttribute('aria-expanded', String(abierta));
    });
    if (new RegExp('abrir=' + (k + 1) + '\\b').test(location.search)) {
      valor.classList.add('is-abierta'); cara.setAttribute('aria-expanded', 'true');
    }
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    $$('.valor.is-abierta').forEach(v => { v.classList.remove('is-abierta'); $('.valor__cara', v).setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- WhatsApp: tres pulsos al entrar en pantalla (solo puntero) ---------- */
  const pulso = $('.btn--pulso');
  if (pulso && puntero && !quieto && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en], obs) => { if (en.isIntersecting) { pulso.classList.add('is-pulsa'); obs.disconnect(); } }, { threshold: 0.6 }).observe(pulso);
  }

  /* ---------- Flotante y barra móvil: aparecen cuando el hero sale ---------- */
  const flotante = $('.flotante'), barra = $('.barra');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      const fuera = !en.isIntersecting;
      if (flotante) flotante.classList.toggle('is-visible', fuera);
      if (barra) barra.classList.toggle('is-visible', fuera);
    }, { threshold: 0.05 }).observe(hero);
  } else { if (flotante) flotante.classList.add('is-visible'); if (barra) barra.classList.add('is-visible'); }


  /* ---------- GALERÍA: flechas y arrastre con el ratón sobre scroll nativo ---------- */
  const pista = $('#galeria-pista');
  if (pista) {
    const paso = () => Math.min(pista.clientWidth * 0.8, 640);
    $$('.galeria__flecha').forEach(b => b.addEventListener('click', () => pista.scrollBy({ left: Number(b.dataset.dir) * paso(), behavior: quieto ? 'auto' : 'smooth' })));
    pista.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); pista.scrollBy({ left: paso(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); pista.scrollBy({ left: -paso(), behavior: 'smooth' }); }
    });
    if (puntero) {
      let arrastre = null;
      pista.addEventListener('pointerdown', e => { arrastre = { x: e.clientX, s: pista.scrollLeft, movido: false }; });
      pista.addEventListener('pointermove', e => {
        if (!arrastre) return;
        const dx = e.clientX - arrastre.x;
        if (Math.abs(dx) > 4) { arrastre.movido = true; pista.classList.add('is-arrastrando'); pista.scrollLeft = arrastre.s - dx; }
      });
      const soltar = () => { if (!arrastre) return; arrastre = null; setTimeout(() => pista.classList.remove('is-arrastrando'), 50); };
      pista.addEventListener('pointerup', soltar); pista.addEventListener('pointerleave', soltar); pista.addEventListener('pointercancel', soltar);
      pista.addEventListener('dragstart', e => e.preventDefault());
    }
  }

  /* ---------- Mapa: su iframe de Google, al pulsar ---------- */
  const mapa = $('#pie-mapa'), cargarMapa = $('#pie-mapa-cargar');
  if (mapa && cargarMapa) {
    cargarMapa.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = mapa.dataset.src;
      f.title = 'Mapa de Google: Izaluminio, instalación y reparación, en Arganda del Rey';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
      mapa.appendChild(f);
      const fachada = $('.pie__mapa-fachada', mapa); if (fachada) fachada.remove();
    });
  }

  /* ---------- Formulario corto: validación clara, sin sorpresas ---------- */
  const form = $('#form-presupuesto');
  if (form) {
    const estado = $('#form-estado');
    const foto = $('#f-foto'), nombreFoto = $('#f-foto-nombre');
    if (foto) foto.addEventListener('change', () => {
      const f = foto.files && foto.files[0];
      if (!f) { nombreFoto.textContent = ''; return; }
      if (f.size > 10 * 1024 * 1024) { nombreFoto.textContent = 'La foto supera 10 MB'; foto.value = ''; return; }
      nombreFoto.textContent = f.name.length > 24 ? f.name.slice(0, 22) + '…' : f.name;
    });
    const error = (campo, msg) => {
      campo.classList.add('is-error');
      let e = $('.campo__error', campo);
      if (!e) { e = document.createElement('span'); e.className = 'campo__error'; campo.appendChild(e); }
      e.textContent = msg;
    };
    const limpiar = () => { $$('.is-error', form).forEach(c => c.classList.remove('is-error')); $$('.campo__error', form).forEach(e => e.remove()); estado.textContent = ''; estado.classList.remove('is-error'); };
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      limpiar();
      if (form.elements.empresa.value) return;   // honeypot
      let ok = true;
      const nombre = form.elements.nombre, tel = form.elements.telefono, serv = form.elements.servicio, priv = form.elements.privacidad;
      if (!nombre.value.trim()) { error(nombre.closest('.campo'), 'Escribe tu nombre'); ok = false; }
      if (!/^[\d\s+()-]{9,}$/.test(tel.value.trim())) { error(tel.closest('.campo'), 'Escribe un teléfono de 9 cifras'); ok = false; }
      if (!serv.value) { error(serv.closest('.campo'), 'Elige un servicio'); ok = false; }
      if (!priv.checked) { priv.closest('.check').classList.add('is-error'); ok = false; }
      if (!ok) { estado.textContent = 'Revisa los campos marcados.'; estado.classList.add('is-error'); ($('.is-error input, .is-error select', form) || {}).focus?.(); return; }
      const btn = $('button[type="submit"]', form), txt = $('span', btn);
      btn.disabled = true; txt.textContent = 'Enviando…';
      setTimeout(() => {
        txt.textContent = 'Enviado';
        estado.innerHTML = 'Recibido. Te llamamos lo antes posible al teléfono indicado. Si tienes prisa: <a href="tel:695970967">695 970 967</a> · <a href="https://wa.me/34695970967" target="_blank" rel="noopener">WhatsApp</a>. <em>(Prototipo: el envío real se conecta en la web definitiva.)</em>';
      }, 800);
    });
  }
})();
