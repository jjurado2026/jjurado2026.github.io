/* ============================================================
   DON CHAMBERÍ — Propuesta de remaquetación de la home
   Sin JavaScript la página se lee completa (los estados ocultos
   solo se aplican con html.js). Esto añade: secuencia de carga,
   revelado al scroll, menús, carrusel de fichas, "Búsqueda
   avanzada", cajón de contacto y copiar enlace.
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const html = document.documentElement;
  const params = new URLSearchParams(location.search);

  /* ---------- Modo captura (?ss): sin animaciones, todo visible ---------- */
  const captura = params.has('ss');
  const quieto  = captura || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (captura) html.classList.add('captura');
  if (quieto)  html.classList.add('quieto');
  if (captura) $$('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));

  /* ---------- Secuencia de carga: espera a las fuentes (máx. 250 ms) ---------- */
  const arrancar = () => document.body.classList.add('listo');
  if (quieto) arrancar();
  else {
    let hecho = false;
    const una = () => { if (!hecho) { hecho = true; requestAnimationFrame(arrancar); } };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(una);
    setTimeout(una, 250);
  }

  /* ---------- Cabecera compacta al hacer scroll (altura fija en CSS, sin medir) ---------- */
  const cab = $('.cab');
  if (cab) {
    let compacta = false;
    const vigilar = () => {
      const c = scrollY > 120;
      if (c !== compacta) { compacta = c; cab.classList.toggle('cab--compacta', c); }
    };
    addEventListener('scroll', vigilar, { passive: true });
    vigilar();
  }

  /* ---------- Revelado al entrar en el viewport ----------
     Comprobación por geometría en scroll/resize/carga (sin IntersectionObserver):
     nada puede quedarse oculto si un evento no llega. */
  const revelables = $$('.rv, .rv-ventana');
  if (quieto) {
    revelables.forEach(el => el.classList.add('visto'));
  } else {
    let pendientes = revelables.slice();
    let tic = false;
    const revelar = () => {
      tic = false;
      if (!pendientes.length) return;
      const limite = innerHeight * 0.94;
      pendientes = pendientes.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < limite && r.bottom > 0) { el.classList.add('visto'); return false; }
        return true;
      });
    };
    const pedir = () => { if (!tic) { tic = true; requestAnimationFrame(revelar); } };
    addEventListener('scroll', pedir, { passive: true });
    addEventListener('resize', pedir, { passive: true });
    addEventListener('load', pedir);
    addEventListener('pageshow', pedir);
    revelar();
    setTimeout(revelar, 300);
    setTimeout(revelar, 1200);
  }

  /* ---------- Desplegables (idioma, submenú, búsqueda avanzada) ----------
     data-solo="no" marca los que no son exclusivos ni se cierran al pulsar fuera. */
  const desplegables = $$('[data-desplegable]');
  const panelDe = btn => $('#' + btn.getAttribute('aria-controls'));
  const poner = (btn, abierto) => {
    const panel = panelDe(btn);
    if (!panel) return;
    btn.setAttribute('aria-expanded', String(abierto));
    panel.classList.toggle(btn.dataset.desplegable || 'abierta', abierto);
    if (btn.dataset.solo !== 'no') panel.inert = !abierto;
  };
  const cerrarExclusivos = (salvo) => desplegables.forEach(b => { if (b !== salvo && b.dataset.solo !== 'no') poner(b, false); });
  desplegables.forEach(btn => {
    if (!panelDe(btn)) return;
    if (btn.dataset.solo !== 'no') panelDe(btn).inert = true;
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const abierto = btn.getAttribute('aria-expanded') === 'true';
      if (btn.dataset.solo !== 'no') cerrarExclusivos(btn);
      poner(btn, !abierto);
    });
  });
  document.addEventListener('click', ev => {
    if (!ev.target.closest('[data-desplegable], .idioma__lista, .nav__sub')) cerrarExclusivos(null);
  });
  // Al usar el teclado dentro de un desplegable exclusivo, se abre; al salir, se cierra.
  $$('.idioma, .nav > ul > li').forEach(cont => {
    cont.addEventListener('focusin', () => { const b = $('[data-desplegable]', cont); if (b) poner(b, true); });
    cont.addEventListener('focusout', ev => { if (!cont.contains(ev.relatedTarget)) { const b = $('[data-desplegable]', cont); if (b) poner(b, false); } });
  });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    cerrarExclusivos(null);
    cerrarCajon();
    cerrarMenu();
  });

  /* ---------- Menú móvil ---------- */
  const hamb = $('.hamb');
  const menuMovil = $('#menu-movil');
  if (menuMovil) menuMovil.inert = true;
  const cerrarMenu = () => {
    if (!hamb || !menuMovil || hamb.getAttribute('aria-expanded') !== 'true') return;
    hamb.setAttribute('aria-expanded', 'false');
    menuMovil.classList.remove('abierto');
    menuMovil.inert = true;
    document.body.style.overflow = '';
    if (menuMovil.contains(document.activeElement) || document.activeElement === document.body) hamb.focus();
  };
  if (hamb && menuMovil) {
    hamb.addEventListener('click', () => {
      const abierto = hamb.getAttribute('aria-expanded') === 'true';
      if (abierto) { cerrarMenu(); return; }
      hamb.setAttribute('aria-expanded', 'true');
      menuMovil.classList.add('abierto');
      menuMovil.inert = false;
      document.body.style.overflow = 'hidden';
    });
    addEventListener('resize', () => { if (innerWidth >= 900) cerrarMenu(); }, { passive: true });
  }

  /* ---------- Cajón de contacto (diálogo modal) ---------- */
  const cajon = $('#cajon-contacto');
  const velo  = $('#velo');
  const fondo = () => $$('header, main, footer, .contacto-tab, .menu-movil');
  if (cajon) cajon.inert = true;
  let disparador = null;
  const abrirCajon = (btn) => {
    if (!cajon || cajon.classList.contains('abierto')) return;
    disparador = btn || null;
    cajon.classList.add('abierto');
    cajon.setAttribute('aria-hidden', 'false');
    cajon.inert = false;
    fondo().forEach(el => { el.inert = true; });
    $$('[data-abre-contacto]').forEach(b => b.setAttribute('aria-expanded', 'true'));
    velo && velo.classList.add('visible');
    document.body.style.overflow = 'hidden';
    const primero = $('input', cajon) || $('button, a', cajon);
    if (!primero) return;
    if (quieto) { primero.focus(); return; }
    let enfocado = false;
    const enfocar = () => { if (!enfocado) { enfocado = true; primero.focus(); } };
    cajon.addEventListener('transitionend', enfocar, { once: true });
    setTimeout(enfocar, 480);
  };
  const cerrarCajon = () => {
    if (!cajon || !cajon.classList.contains('abierto')) return;
    cajon.classList.remove('abierto');
    cajon.setAttribute('aria-hidden', 'true');
    cajon.inert = true;
    fondo().forEach(el => { el.inert = false; });
    if (menuMovil) menuMovil.inert = !(hamb && hamb.getAttribute('aria-expanded') === 'true');
    $$('[data-abre-contacto]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    velo && velo.classList.remove('visible');
    document.body.style.overflow = '';
    disparador && disparador.focus();
  };
  $$('[data-abre-contacto]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); abrirCajon(b); }));
  $$('[data-cierra-contacto]').forEach(b => b.addEventListener('click', cerrarCajon));
  velo && velo.addEventListener('click', cerrarCajon);
  if (cajon) {
    cajon.addEventListener('keydown', ev => {
      if (ev.key !== 'Tab') return;
      const focos = $$('a[href], button, input, select, textarea', cajon).filter(el => !el.disabled);
      if (!focos.length) return;
      const primero = focos[0], ultimo = focos[focos.length - 1];
      if (ev.shiftKey && document.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
    });
  }

  /* ---------- Fichas: carrusel de fotos + copiar enlace ---------- */
  $$('.ficha').forEach(ficha => {
    const fotos = $$('.ficha__foto img', ficha);
    const aviso = $('.ficha__foto-estado', ficha);
    let i = 0;
    const cargar = img => {
      if (img && img.dataset.src) { img.src = img.dataset.src; if (img.dataset.srcset) img.srcset = img.dataset.srcset; delete img.dataset.src; }
    };
    const ir = (n) => {
      if (fotos.length < 2) return;
      i = (n + fotos.length) % fotos.length;
      fotos.forEach((img, k) => {
        const activa = k === i;
        if (activa) cargar(img);
        img.classList.toggle('activa', activa);
        img.setAttribute('aria-hidden', String(!activa));
      });
      cargar(fotos[(i + 1) % fotos.length]);
      if (aviso) aviso.textContent = `Foto ${i + 1} de ${fotos.length}`;
    };
    const izq = $('.ficha__flecha--izq', ficha), der = $('.ficha__flecha--der', ficha);
    izq && izq.addEventListener('click', ev => { ev.preventDefault(); ir(i - 1); });
    der && der.addEventListener('click', ev => { ev.preventDefault(); ir(i + 1); });
    ficha.addEventListener('mouseenter', () => cargar(fotos[1]), { once: true });

    const copiar = $('.copiar', ficha);
    if (copiar) {
      copiar.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(copiar.dataset.url);
          copiar.classList.add('copiado');
          copiar.setAttribute('aria-label', 'Dirección copiada');
          setTimeout(() => { copiar.classList.remove('copiado'); copiar.setAttribute('aria-label', 'Copiar dirección al portapapeles'); }, 1600);
        } catch (e) { location.href = copiar.dataset.url; }
      });
    }
  });

  /* ---------- Selects con placeholder en gris ---------- */
  $$('select').forEach(s => {
    const marcar = () => s.classList.toggle('vacio', s.value === '');
    marcar(); s.addEventListener('change', marcar);
  });

  /* ---------- Formularios: en el prototipo no envían ---------- */
  $$('form[data-prototipo]').forEach(f => {
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const estado = $('.estado', f);
      if (estado) estado.textContent = 'Prototipo: el formulario aún no envía. En la web definitiva este envío llega al CRM.';
    });
  });
})();
