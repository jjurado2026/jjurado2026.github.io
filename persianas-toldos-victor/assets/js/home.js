/* =====================================================================
   Persianas y Toldos Víctor · home (rondas 2 y 3)
   Hero con su foto hecha persiana (lamas 3D que giran y se inclinan con el cursor),
   botones de rodillo, cintas en movimiento, fachada de servicios con fichas que pasan solas,
   paletas de 1963, preguntas en lamas, horario en vivo y formulario.
   Parámetros: ?ss (capturas, quieto) · ?ahora=1-10.5 (día 0-6 y hora) · ?caducada
   ===================================================================== */
(() => {
  'use strict';
  window.PTV = true;
  const d = document.documentElement;
  const quieto = d.classList.contains('quieto');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const reflujo = el => el.getBoundingClientRect();
  const raton = matchMedia('(hover: hover) and (pointer: fine)');

  /* ── Botones de rodillo: el texto en dos caras de un prisma que gira ─ */
  $$('.boton').forEach(b => {
    const html = b.innerHTML.trim();
    b.innerHTML = `<span class="boton__rodillo"><span class="boton__cara">${html}</span><span class="boton__cara boton__cara--b" aria-hidden="true">${html}</span></span>`;
    b.classList.add('listo');
  });

  /* ── Títulos: palabra a palabra ───────────────────────────────────── */
  $$('.titulo').forEach(t => {
    let i = 0;
    t.innerHTML = t.textContent.trim().split(/\s+/).map(w => `<span class="palabra" style="--i:${i++}">${w}</span>`).join(' ');
  });

  /* ── Hora de Madrid y horario ─────────────────────────────────────── */
  const HORARIO = { 1: [[9, 13.5], [17, 19.5]], 2: [[9, 13.5], [17, 19.5]], 3: [[9, 13.5], [17, 19.5]], 4: [[9, 13.5], [17, 19.5]], 5: [[9, 14]], 6: [], 0: [] };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const hora = h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  function madrid() {
    const m = location.search.match(/[?&]ahora=(\d)-([\d.]+)/);
    if (m) return { dia: +m[1], h: +m[2] };
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const o = {};
    for (const p of f.formatToParts(new Date())) o[p.type] = p.value;
    return { dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h: (+o.hour % 24) + (+o.minute) / 60 };
  }
  function estadoTienda() {
    const { dia, h } = madrid();
    const tramo = HORARIO[dia].find(([a, b]) => h >= a && h < b);
    if (tramo) return { abierto: true, txt: `Abierto ahora, hasta las ${hora(tramo[1])}`, dia, h };
    for (let k = 0; k < 8; k++) {
      const dd = (dia + k) % 7;
      const sig = HORARIO[dd].find(([a]) => k > 0 || a > h);
      if (sig) return { abierto: false, txt: `Cerrado. Abrimos ${k === 0 ? 'hoy' : k === 1 ? 'mañana' : `el ${DIAS[dd]}`} a las ${hora(sig[0])}`, dia, h };
    }
    return { abierto: false, txt: 'Cerrado', dia, h };
  }
  function pintarEstado() {
    const e = estadoTienda();
    $$('[data-estado]').forEach(el => {
      el.classList.toggle('is-abierto', e.abierto);
      el.classList.toggle('is-cerrado', !e.abierto);
      $('.estado__txt', el).textContent = e.txt;
    });
    $$('.horario__tabla tr').forEach(tr => {
      const hoy = +tr.dataset.dia === e.dia;
      tr.classList.toggle('is-hoy', hoy);
      if (hoy) tr.style.setProperty('--h', Math.min(21, Math.max(8, e.h)).toFixed(2));
    });
  }
  pintarEstado();
  setInterval(pintarEstado, 60000);

  /* ── «En vista» y bucles en pausa fuera de pantalla ──────────────── */
  const alVer = new Map();
  const vistos = $$('.titulo, .fachada, .experiencia__rejilla, .trabajos__rejilla, .horario, .lamas-faq');
  if (quieto || !('IntersectionObserver' in window)) vistos.forEach(el => el.classList.add('en-vista'));
  else {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('en-vista');
      io.unobserve(en.target);
      (alVer.get(en.target) || []).forEach(f => f());
    }), { rootMargin: '0px 0px -12% 0px', threshold: .12 });
    vistos.forEach(el => io.observe(el));
  }
  const cuandoSeVea = (el, f) => { if (el.classList.contains('en-vista')) f(); else alVer.set(el, [...(alVer.get(el) || []), f]); };
  const visibles = new Set();
  if (!quieto && 'IntersectionObserver' in window) {
    const ioBucle = new IntersectionObserver(es => es.forEach(en => {
      en.target.classList.toggle('fuera', !en.isIntersecting);
      if (en.isIntersecting) visibles.add(en.target); else visibles.delete(en.target);
    }));
    $$('main > section, .pie').forEach(s => ioBucle.observe(s));
  }
  const enPantalla = el => quieto || visibles.has(el);

  /* ── Menú del móvil ───────────────────────────────────────────────── */
  const botonMenu = $('.cab__menu'), menu = $('#menu-movil');
  function menuAbierto(si) {
    botonMenu.setAttribute('aria-expanded', String(si));
    menu.hidden = !si;
    d.style.overflow = si ? 'hidden' : '';
    $('span', botonMenu).textContent = si ? 'Cerrar' : 'Menú';
  }
  botonMenu.addEventListener('click', () => menuAbierto(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) menuAbierto(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { menuAbierto(false); botonMenu.focus(); } });
  matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) menuAbierto(false); });

  /* ── 1 · Hero: su foto hecha persiana ─────────────────────────────── */
  const hero = $('.hero');
  const escena = $('#escena');
  const capaLamas = $('#lamas');
  const foto = $('#hero-foto');
  let lamas = [], alto = 0, paso = 0, raf = 0, intro = null, enIntro = false;
  const puntero = { activo: false, y: 0, vx: 0 };
  const onda = { activa: false, desde: 0, t0: 0, dur: 2600 };
  const gauss = x => Math.exp(-x * x);
  const suave = t => 1 - Math.pow(1 - t, 3);

  function construir(conIntro) {
    const src = foto.currentSrc || foto.src;
    alto = escena.clientHeight;
    const n = Math.max(8, Math.min(18, Math.round(alto / (innerWidth < 700 ? 44 : 56))));
    paso = alto / n;
    capaLamas.textContent = '';
    lamas = [];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'lama3d';
      el.style.top = `${(i * paso).toFixed(2)}px`;
      el.style.height = `${(paso + .8).toFixed(2)}px`;
      el.innerHTML = `<div class="lama3d__cara"><div class="lama3d__foto" style="top:${(-i * paso).toFixed(2)}px;height:${alto}px;background-image:url('${src}')"></div><div class="lama3d__sombra"></div></div><div class="lama3d__cara lama3d__dorso"></div>`;
      capaLamas.appendChild(el);
      lamas.push({ el, sombra: $('.lama3d__sombra', el), a: conIntro ? 180 : 0, c: (i + .5) * paso });
    }
    hero.classList.add('con-lamas');
    lamas.forEach(l => pintar(l));
    if (conIntro) { intro = performance.now() + 450; enIntro = true; }
    arrancar();
  }
  function pintar(l) {
    l.el.style.transform = `rotateX(${l.a.toFixed(2)}deg)`;
    const s = Math.min(1, Math.abs(l.a > 90 ? 180 - l.a : l.a) / 42);
    l.sombra.style.opacity = s.toFixed(3);
  }
  function arrancar() { if (!raf) raf = requestAnimationFrame(cuadro); }
  function cuadro(t) {
    raf = 0;
    let vivo = false;
    if (enIntro) {
      lamas.forEach((l, i) => {
        const p = Math.min(1, Math.max(0, (t - intro - i * 65) / 1100));
        l.a = 180 * (1 - suave(p));
        pintar(l);
      });
      if (t - intro > lamas.length * 65 + 1150) { enIntro = false; lamas.forEach(l => { l.a = 0; pintar(l); }); }
      raf = requestAnimationFrame(cuadro);
      return;
    }
    let yOnda = null;
    if (onda.activa) {
      const p = (t - onda.t0) / onda.dur;
      if (p >= 1) onda.activa = false;
      else yOnda = onda.desde + (alto + 2 * paso - onda.desde) * suave(p);
    }
    for (const l of lamas) {
      let obj = 0;
      if (puntero.activo) obj += 36 * gauss((l.c - puntero.y) / (1.35 * paso));
      if (yOnda !== null) obj += 26 * gauss((l.c - yOnda) / (1.7 * paso));
      l.a += (obj - l.a) * .13;
      if (Math.abs(obj - l.a) > .04 || Math.abs(l.a) > .04) vivo = true; else l.a = obj;
      pintar(l);
    }
    if (vivo || puntero.activo || onda.activa) raf = requestAnimationFrame(cuadro);
  }
  function lanzarOnda(desdeY) {
    if (enIntro || !lamas.length) return;
    onda.activa = true; onda.t0 = performance.now(); onda.desde = desdeY ?? -2 * paso;
    arrancar();
  }
  if (!quieto) {
    const iniciar = () => construir(true);
    if (foto.complete && foto.naturalWidth) iniciar(); else foto.addEventListener('load', iniciar, { once: true });
    hero.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || enIntro) return;
      const r = escena.getBoundingClientRect();
      if (e.clientY > r.bottom) { puntero.activo = false; return; }
      puntero.activo = true; puntero.y = e.clientY - r.top;
      if (!hero.classList.contains('usada')) { clearTimeout(hero._u); hero._u = setTimeout(() => hero.classList.add('usada'), 1200); }
      arrancar();
    });
    hero.addEventListener('pointerleave', () => { puntero.activo = false; arrancar(); });
    escena.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      hero.classList.add('usada');
      lanzarOnda(e.clientY - escena.getBoundingClientRect().top);
    });
    setInterval(() => { if (!puntero.activo && enPantalla(hero) && !document.hidden) lanzarOnda(); }, 6500);
    let rz = 0, ancho = innerWidth;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (lamas.length && (innerWidth !== ancho || Math.abs(escena.clientHeight - alto) > 2)) { ancho = innerWidth; construir(false); } }, 220);
    });
  }

  /* ── Cintas en movimiento constante (servicios, ofertas, opiniones) ── */
  function cinta(el) {
    if (quieto) return;
    const pista = $('.cinta__pista', el);
    const originales = [...pista.children];
    const clonar = () => {
      const f = document.createDocumentFragment();
      originales.forEach(o => {
        const c = o.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('data-clon', '');
        c.inert = true;
        c.removeAttribute('id');
        $$('[id]', c).forEach(x => x.removeAttribute('id'));
        if (c.matches('button, a')) c.tabIndex = -1;
        $$('a, button', c).forEach(x => { x.tabIndex = -1; });
        f.appendChild(c);
      });
      pista.appendChild(f);
    };
    const medir = () => {
      $$('[data-clon]', pista).forEach(c => c.remove());
      clonar();
      const primerClon = pista.children[originales.length];
      const w = primerClon.offsetLeft - originales[0].offsetLeft;
      let total = pista.scrollWidth;
      while (total < w + el.clientWidth + 40) { clonar(); total = pista.scrollWidth; }
      el.style.setProperty('--w', `${w}px`);
      el.style.setProperty('--dur', `${(w / (+el.dataset.velocidad || 40)).toFixed(1)}s`);
      el.classList.add('lista');
    };
    medir();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(medir);
    let t = 0;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(medir, 250); });
  }

  /* ── 2 · Nuestros servicios: la fachada y sus fichas, que pasan solas ─
     Cada ficha se queda --paso (5,2 s; la barra del pie lo marca) y da paso a la siguiente.
     Se para con el cursor encima. Al elegir uno (fachada, cinta o teclado), la ficha se queda
     12 s y luego sigue sola. Lo que pasa solo no colorea ningún botón. */
  const servicios = $('#servicios');
  const fachada = $('.fachada');
  const pistaServicios = $('.productos');
  const zonas = $$('.zona');
  const fichas = $$('.ficha');
  const piezas = Object.fromEntries($$('[data-fz]').map(el => [el.dataset.fz, el]));
  const orden = fichas.map(f => f.dataset.servicio);
  const pestanas = () => $$('[data-producto]', pistaServicios);
  const originalesServicios = $$('[role="tab"]', pistaServicios);
  const PAUSA_ELEGIDO = 12000;
  let actual = null, elegidoHasta = 0;
  zonas.forEach((z, i) => z.style.setProperty('--n', i));

  function jugar(id) {
    if (quieto) return;
    const el = piezas[id];
    if (!el) return;
    el.classList.remove('juega'); reflujo(fachada); el.classList.add('juega');
    if (id === 'motorizacion') {
      fachada.classList.remove('motor'); reflujo(fachada); fachada.classList.add('motor');
      clearTimeout(jugar.t); jugar.t = setTimeout(() => fachada.classList.remove('motor'), 3200);
    }
  }
  $$('[data-fz]').forEach(el => el.addEventListener('animationend', () => { if (!el.getAnimations || !el.getAnimations({ subtree: true }).length) el.classList.remove('juega'); }));

  // La ficha que sale gira hacia un lado y la que entra llega del otro. Solo están en la página
  // la visible, la que sale y la siguiente («prepara»: así su foto ya está cargada cuando entra)
  function mostrar(id, { conPieza = true } = {}) {
    const nueva = fichas.find(f => f.dataset.servicio === id);
    if (!nueva.classList.contains('prepara')) { nueva.classList.add('prepara'); reflujo(nueva); }
    const siguiente = fichas[(fichas.indexOf(nueva) + 1) % fichas.length];
    fichas.forEach(f => f.classList.toggle('prepara', f === nueva || f === siguiente));
    fichas.forEach(f => {
      const si = f.dataset.servicio === id;
      clearTimeout(f.t);
      if (!si && f.classList.contains('is-visible')) { f.classList.add('sale'); f.t = setTimeout(() => f.classList.remove('sale'), 950); }
      if (si) f.classList.remove('sale');
      f.classList.toggle('is-visible', si);
    });
    zonas.forEach(z => z.classList.toggle('is-actual', z.dataset.ir === id));
    actual = id;
    if (conPieza) jugar(id);
  }
  function automatico(si) {
    servicios.classList.toggle('auto', si);
    if (si) pestanas().forEach(t => t.setAttribute('aria-selected', 'false'));
  }
  function elegir(id, { foco = false } = {}) {
    elegidoHasta = Date.now() + PAUSA_ELEGIDO;
    automatico(false);
    pestanas().forEach(t => t.setAttribute('aria-selected', String(t.dataset.producto === id)));
    originalesServicios.forEach(t => { t.tabIndex = t.dataset.producto === id ? 0 : -1; if (foco && t.dataset.producto === id) t.focus(); });
    if (id === actual) jugar(id); else mostrar(id);
  }
  mostrar(orden[0], { conPieza: false });
  if (!quieto) {
    automatico(true);
    cuandoSeVea(fachada, () => setTimeout(() => jugar(actual), 700));
    // Al acabar la barra del pie, la siguiente
    servicios.addEventListener('animationend', e => {
      if (e.animationName !== 'progreso' || !servicios.classList.contains('auto')) return;
      mostrar(orden[(orden.indexOf(actual) + 1) % orden.length]);
    });
    // Pasado el rato tras elegir uno, y con el cursor fuera, vuelve a pasar solo
    setInterval(() => {
      if (servicios.classList.contains('auto') || Date.now() < elegidoHasta) return;
      if ((raton.matches && fachada.matches(':hover')) || servicios.querySelector(':focus-visible')) return;
      automatico(true);
    }, 1000);
  }

  originalesServicios.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const j = (originalesServicios.indexOf(t) + k + originalesServicios.length) % originalesServicios.length;
      elegir(originalesServicios[j].dataset.producto, { foco: true });
    });
  });
  pistaServicios.addEventListener('click', e => { const b = e.target.closest('[data-producto]'); if (b) elegir(b.dataset.producto); });
  // La fachada: cada pieza se elige con un clic; al mover el cursor por ella, se mueve
  const pantallaAncha = matchMedia('(min-width: 1000px)');
  zonas.forEach(z => {
    z.addEventListener('click', () => {
      elegir(z.dataset.ir);
      if (!pantallaAncha.matches) $('.ficha-caja').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'nearest' });
    });
    z.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !z.jugada) { z.jugada = true; if (z.dataset.ir !== actual) jugar(z.dataset.ir); } });
    z.addEventListener('pointerleave', () => { z.jugada = false; });
  });
  $$('a[data-ir]').forEach(a => a.addEventListener('click', () => elegir(a.dataset.ir)));

  /* ── Botones «Obtener presupuesto» de un servicio: lo dejan escrito ── */
  const form = $('#formulario');
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-pedir]');
    if (!a) return;
    const ta = form.consulta;
    const linea = `Quiero presupuesto de: ${a.dataset.pedir}.`;
    if (!ta.value.includes(linea)) ta.value = ta.value ? `${ta.value.trim()}\n${linea}` : linea;
  });

  /* ── 4 · Paletas de 1963 ──────────────────────────────────────────── */
  $$('[data-paleta]').forEach(el => {
    const objetivo = [...el.dataset.paleta];
    const celdas = objetivo.map(ch => {
      const f = document.createElement('span');
      f.className = 'flap';
      f.innerHTML = '<span class="flap__arriba"><i></i></span><span class="flap__abajo"><i></i></span><span class="flap__hoja-a"><i></i></span><span class="flap__hoja-b"><i></i></span>';
      $$('i', f).forEach(x => { x.textContent = ch; });
      f.dataset.v = ch;
      el.appendChild(f);
      return f;
    });
    if (quieto) return;
    const cambiar = (f, ch) => {
      const viejo = f.dataset.v;
      const [arriba, abajo, ha, hb] = f.children;
      arriba.firstChild.textContent = ch; hb.firstChild.textContent = ch;
      ha.firstChild.textContent = viejo; abajo.firstChild.textContent = viejo;
      f.classList.remove('gira'); reflujo(f); f.classList.add('gira');
      f.dataset.v = ch;
      clearTimeout(f._t); f._t = setTimeout(() => { abajo.firstChild.textContent = ch; }, 330);
    };
    const barajar = () => celdas.forEach((f, i) => {
      const vueltas = 5 + i * 2;
      for (let k = 0; k <= vueltas; k++) setTimeout(() => cambiar(f, k === vueltas ? objetivo[i] : String((+f.dataset.v + 1 + Math.floor(Math.random() * 3)) % 10)), k * 120);
    });
    const rejilla = el.closest('.experiencia__rejilla');
    cuandoSeVea(rejilla, () => setTimeout(barajar, 500));
    setInterval(() => { if (enPantalla($('#experiencia')) && !document.hidden) barajar(); }, 9000);
  });

  /* ── 5 · Visor de trabajos ────────────────────────────────────────── */
  const visor = $('#visor');
  const visorImg = $('#visor-img');
  const visorPie = $('#visor-pie');
  const trabajos = $$('[data-visor]').map(b => {
    const img = $('img', b);
    return { src: img.getAttribute('src').replace(/-\d+\.webp$/, '-1280.webp'), alt: img.alt, pie: $('.trabajo__pie', b).textContent };
  });
  let visorI = 0, origenVisor = null;
  function verTrabajo(i) {
    visorI = (i + trabajos.length) % trabajos.length;
    const t = trabajos[visorI];
    const pre = new Image();
    pre.src = t.src;
    visorImg.classList.add('cambia');
    const poner = () => { visorImg.src = t.src; visorImg.alt = t.alt; visorPie.textContent = t.pie; requestAnimationFrame(() => visorImg.classList.remove('cambia')); };
    (pre.decode ? pre.decode() : Promise.resolve()).then(poner, poner);
    new Image().src = trabajos[(visorI + 1) % trabajos.length].src;
  }
  $$('[data-visor]').forEach(b => b.addEventListener('click', () => { origenVisor = b; verTrabajo(+b.dataset.visor); visor.showModal(); }));
  $$('[data-visor-ir]').forEach(b => b.addEventListener('click', () => verTrabajo(visorI + +b.dataset.visorIr)));
  $('[data-visor-cerrar]').addEventListener('click', () => visor.close());
  visor.addEventListener('click', e => { if (e.target === visor || e.target.classList.contains('visor__dentro')) visor.close(); });
  visor.addEventListener('keydown', e => { if (e.key === 'ArrowRight') verTrabajo(visorI + 1); if (e.key === 'ArrowLeft') verTrabajo(visorI - 1); });
  visor.addEventListener('close', () => { if (origenVisor) origenVisor.focus(); });

  /* ── 8 · Preguntas: la lama gira y enseña la respuesta ────────────── */
  const faq = $('.lamas-faq');
  $$('.pregunta__b', faq).forEach(b => {
    const r = $('.pregunta__cara--r', b), q = $('.pregunta__cara--q', b);
    r.setAttribute('aria-hidden', 'true');
    b.addEventListener('click', () => {
      const abierta = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(abierta));
      r.setAttribute('aria-hidden', String(!abierta));
      q.setAttribute('aria-hidden', String(abierta));
    });
  });
  cuandoSeVea(faq, () => setTimeout(() => faq.classList.add('listo'), 1500));

  /* ── Cintas (después de los botones, para que los clones los lleven) ─ */
  $$('[data-cinta]').forEach(cinta);

  /* ── 7 · Formulario: deja el correo escrito ───────────────────────── */
  const error = $('#formulario-error');
  const ok = $('#formulario-ok');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const datos = new FormData(form);
    const nombre = (datos.get('nombre') || '').trim();
    const tel = (datos.get('telefono') || '').trim();
    const email = (datos.get('email') || '').trim();
    const consulta = (datos.get('consulta') || '').trim();
    const telMal = tel.replace(/\D/g, '').length < 9;
    const emailMal = email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    form.nombre.setAttribute('aria-invalid', String(!nombre));
    form.telefono.setAttribute('aria-invalid', String(telMal));
    form.email.setAttribute('aria-invalid', String(emailMal));
    const faltan = [];
    if (!nombre) faltan.push('tu nombre');
    if (telMal) faltan.push('un teléfono de 9 cifras');
    if (emailMal) faltan.push('un email válido');
    if (!form.privacidad.checked) faltan.push('aceptar la Política de Privacidad');
    if (faltan.length) {
      error.textContent = `Para poder contestarte falta ${faltan.join(', ').replace(/, ([^,]*)$/, ' y $1')}.`;
      error.hidden = false; ok.hidden = true;
      (!nombre ? form.nombre : telMal ? form.telefono : emailMal ? form.email : form.privacidad).focus();
      return;
    }
    error.hidden = true;
    const cuerpo = [`Nombre: ${nombre}`, `Teléfono: ${tel}`, email ? `Email: ${email}` : '', '', '¿Cómo podemos ayudarte?', consulta || '(Os lo cuento por teléfono)'].filter((l, i) => l !== '' || i === 3).join('\n');
    location.href = `mailto:persianasvictor.zz@gmail.com?subject=${encodeURIComponent(`Pedir presupuesto (${nombre})`)}&body=${encodeURIComponent(cuerpo)}`;
    ok.hidden = false;
  });
  $$('input, textarea', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
})();
