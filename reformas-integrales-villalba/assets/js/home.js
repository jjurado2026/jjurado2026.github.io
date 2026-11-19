/* Reformas Integrales Villalba — home. Sin dependencias. */
(() => {
  'use strict';
  window.RIV = true;
  const d = document.documentElement;
  const quieto = d.classList.contains('quieto');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const tactil = matchMedia('(hover: none)').matches;

  /* Avisa cuando un elemento entra o sale de la pantalla */
  const vigila = (el, fn, margen = '0px') => {
    const io = new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting)), { rootMargin: margen });
    io.observe(el);
  };
  /* Pausa común: fuera de pantalla, pestaña oculta o cursor encima */
  const pausable = (el, alCambiar) => {
    const estado = { fuera: true, encima: false, oculta: document.hidden };
    const aplica = () => alCambiar(estado.fuera || estado.encima || estado.oculta);
    vigila(el, (dentro) => { estado.fuera = !dentro; aplica(); });
    if (!tactil) {
      el.addEventListener('pointermove', () => { if (!estado.encima) { estado.encima = true; aplica(); } });
      el.addEventListener('pointerleave', () => { estado.encima = false; aplica(); });
    }
    document.addEventListener('visibilitychange', () => { estado.oculta = document.hidden; aplica(); });
    return estado;
  };

  /* ── Cabecera ── */
  const cab = $('[data-cab]');
  const alBajar = () => cab.classList.toggle('bajada', scrollY > 8);
  addEventListener('scroll', alBajar, { passive: true });
  alBajar();

  const abrir = $('[data-abrir-menu]');
  const panel = $('#menu-movil');
  const menu = (abre) => {
    abrir.setAttribute('aria-expanded', String(abre));
    panel.hidden = !abre;
    $('use', abrir).setAttribute('href', abre ? '#i-cerrar' : '#i-menu');
    document.body.style.overflow = abre ? 'hidden' : '';
  };
  abrir.addEventListener('click', () => menu(abrir.getAttribute('aria-expanded') !== 'true'));
  $$('a', panel).forEach((a) => a.addEventListener('click', () => menu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { menu(false); abrir.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1180 && !panel.hidden) menu(false); });

  /* ── Títulos: cada palabra sube desde su línea ── */
  $$('[data-palabras]').forEach((h) => {
    const palabras = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    palabras.forEach((p, i) => {
      const caja = document.createElement('span');
      caja.className = 'pal';
      const dentro = document.createElement('span');
      dentro.style.setProperty('--i', i);
      dentro.textContent = p;
      caja.appendChild(dentro);
      h.appendChild(caja);
      if (i < palabras.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });

  /* ── Entradas al aparecer ── */
  const revela = $$('[data-revela]');
  if (quieto) revela.forEach((el) => el.classList.add('visto'));
  else {
    const grupos = new Map();
    revela.forEach((el) => {
      const n = grupos.get(el.parentElement) || 0;
      el.style.setProperty('--d', n * 110);
      grupos.set(el.parentElement, n + 1);
    });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    revela.forEach((el) => io.observe(el));
  }

  /* ── Hero entero en la primera pantalla: si no cabe, la foto se reduce lo justo ── */
  const hero = $('[data-hero]');
  const encaja = () => {
    if (!hero) return;
    hero.style.removeProperty('--h');
    const barra = $('[data-barra]');
    const util = innerHeight - (barra && getComputedStyle(barra).display !== 'none' ? barra.offsetHeight : 0);
    const ultimos = $$('.hero__botones, .datos', hero).filter((el) => getComputedStyle(el).display !== 'none');
    for (let n = 0; n < 4; n++) {
      const fondo = Math.max(...ultimos.map((el) => el.getBoundingClientRect().bottom + scrollY));
      const sobra = fondo - util;
      if (sobra <= 0) break;
      const h = $('.vista', hero).offsetHeight;
      hero.style.setProperty('--h', Math.max(100, h - sobra - 6) + 'px');
    }
  };
  encaja();
  if (document.fonts) document.fonts.ready.then(encaja);
  /* Solo al cambiar el ancho o la orientación: en el móvil, la barra del navegador cambia el alto al hacer scroll */
  let tAjuste;
  let anchoAntes = innerWidth;
  let altoAntes = innerHeight;
  addEventListener('resize', () => {
    if (innerWidth === anchoAntes && Math.abs(innerHeight - altoAntes) < 140) return;
    anchoAntes = innerWidth; altoAntes = innerHeight;
    clearTimeout(tAjuste); tAjuste = setTimeout(encaja, 120);
  });

  /* ── Hero: la foto gira y entra otra estancia; el marco cambia de esquina ── */
  const carrusel = $('[data-carrusel]');
  if (carrusel) {
    const vistas = $$('.vista', carrusel);
    const pie = $('.hero__pie');
    const chalet = $('[data-pie-chalet]');
    const desc = $('[data-pie-desc]');
    const tiempo = $('.hero__tiempo');
    const barra = $('i', tiempo);
    let i = 0;
    let pausa = false;
    let arrancado = false;
    if (!quieto) vistas[0].classList.add('primera');
    vistas.forEach((v, j) => v.setAttribute('aria-hidden', String(j !== 0)));

    const corre = () => {
      tiempo.classList.remove('corre');
      void tiempo.offsetWidth;
      tiempo.classList.add('corre');
    };
    const ir = (n) => {
      n = (n + vistas.length) % vistas.length;
      if (n === i) return;
      const antes = vistas[i];
      const luego = vistas[n];
      antes.classList.remove('is-activa', 'primera');
      antes.classList.add('sale');
      setTimeout(() => antes.classList.remove('sale'), 800);
      luego.classList.remove('sale');
      luego.classList.toggle('marco-izq', n % 2 === 1);
      luego.classList.add('is-activa');
      antes.setAttribute('aria-hidden', 'true');
      luego.setAttribute('aria-hidden', 'false');
      pie.classList.add('cambia');
      setTimeout(() => {
        chalet.textContent = luego.dataset.chalet;
        desc.textContent = luego.dataset.desc;
        pie.classList.remove('cambia');
      }, quieto ? 0 : 320);
      i = n;
      if (arrancado) corre();
    };
    if (!quieto) {
      barra.addEventListener('animationend', () => { if (!pausa) ir(i + 1); });
      const estado = pausable(carrusel, (p) => { pausa = p; tiempo.classList.toggle('pausa', p); });
      setTimeout(() => { arrancado = true; corre(); if (estado.fuera || estado.encima) tiempo.classList.add('pausa'); }, 1500);
    }
    carrusel.tabIndex = 0;
    carrusel.addEventListener('click', () => ir(i + 1));
    carrusel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(i - 1); }
    });
  }

  /* ── Olas: los iconos de una lista hacen su gesto por turnos ── */
  if (!quieto) $$('[data-ola]').forEach((lista) => {
    const items = [...lista.children];
    let k = 0;
    let parada = true;
    pausable(lista, (p) => { parada = p; });
    setInterval(() => {
      if (parada) return;
      const el = items[k % items.length];
      el.classList.add('gesto-on');
      setTimeout(() => el.classList.remove('gesto-on'), 1500);
      k++;
    }, 2300);
  });

  /* ── Láminas: en obra → terminado, giran solas; con clic o Intro se giran a mano ── */
  $$('[data-lamina]').forEach((lam, n) => {
    let parada = true;
    let mano = 0;
    const gira = (v) => {
      lam.classList.toggle('vuelta', v);
      lam.setAttribute('aria-pressed', String(v));
    };
    const alterna = () => gira(!lam.classList.contains('vuelta'));
    lam.addEventListener('click', () => { alterna(); mano = Date.now(); });
    lam.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alterna(); mano = Date.now(); } });
    if (quieto) return;
    pausable(lam, (p) => { parada = p; });
    setTimeout(() => setInterval(() => {
      if (parada || Date.now() - mano < 10000) return;
      alterna();
    }, 4800), 1200 + n * 2400);
  });

  /* ── Historias de obra: barras de tiempo, se pasan tocando a los lados ── */
  $$('[data-historia]').forEach((h, n) => {
    const fotos = $$('.historia__fotos img', h);
    const caja = $('.historia__barras', h);
    const barras = fotos.map(() => {
      const s = document.createElement('span');
      s.appendChild(document.createElement('i'));
      caja.appendChild(s);
      return s;
    });
    let k = 0;
    let vivo = false;
    const muestra = (m) => {
      k = (m + fotos.length) % fotos.length;
      fotos.forEach((f, j) => { f.classList.toggle('is-activa', j === k); f.setAttribute('aria-hidden', String(j !== k)); });
      barras.forEach((b, j) => {
        b.classList.toggle('hecha', j < k);
        b.classList.remove('ahora');
      });
      void caja.offsetWidth;
      if (vivo || quieto) barras[k].classList.add('ahora');
    };
    muestra(0);
    $$('[data-paso]', h).forEach((b) => b.addEventListener('click', () => muestra(k + Number(b.dataset.paso))));
    if (quieto) return;
    barras.forEach((b) => $('i', b).addEventListener('animationend', () => { if (b.classList.contains('ahora')) muestra(k + 1); }));
    pausable(h, (p) => h.classList.toggle('pausa', p));
    vigila(h, (dentro) => {
      if (dentro && !vivo) setTimeout(() => { vivo = true; muestra(k); }, 400 + n * 900);
    });
  });

  /* ── Opiniones: una cita grande, tres nombres con barra de tiempo ── */
  const citas = $('[data-citas]');
  if (citas) {
    const tabs = $$('.autor', citas);
    const textos = $$('.cita', citas);
    let k = 0;
    let vivo = false;
    const elige = (m, foco) => {
      k = (m + tabs.length) % tabs.length;
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === k));
        t.tabIndex = j === k ? 0 : -1;
        t.classList.remove('corre');
      });
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
      vigila(citas, (dentro) => { if (dentro && !vivo) { vivo = true; setTimeout(() => elige(k), 300); } }, '0px 0px -20% 0px');
    } else elige(0);
  }

  /* ── Presupuesto: los botones de cada servicio dejan escrito el asunto ── */
  const form = $('[data-formulario]');
  const asunto = $('#f-asunto');
  $$('[data-asunto]').forEach((a) => a.addEventListener('click', () => {
    const v = a.dataset.asunto;
    if (v) asunto.value = 'Presupuesto: ' + v;
    setTimeout(() => $(v ? '#f-nombre' : '#f-nombre').focus({ preventScroll: true }), quieto ? 0 : 700);
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
      const hecho = $('[data-hecho]');
      hecho.hidden = false;
      hecho.focus();
    });
    ['email', 'mensaje'].forEach((id) => $('#f-' + id).addEventListener('input', () => err(id, '')));
    $('#f-acepto').addEventListener('change', () => err('acepto', ''));
  }

  /* ── Mapa: se carga al acercarse ── */
  const mapa = $('.contacto__mapa iframe');
  if (mapa) {
    const carga = () => { if (mapa.dataset.src) { mapa.src = mapa.dataset.src; delete mapa.dataset.src; } };
    if (d.classList.contains('captura')) carga();
    else vigila(mapa, (dentro) => { if (dentro) carga(); }, '600px');
  }
})();
