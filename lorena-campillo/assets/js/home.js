/* =====================================================================
   LORENA CAMPILLO — v4 «Luz de espejo»
   Sin JavaScript la página se lee entera (servicios, horario, preguntas y
   contacto están en el HTML). Esto añade lo útil y el movimiento:
   estado abierto/cerrado en vivo, la reserva con su resguardo, la vitrina
   de servicios, los espejos que se encienden, el hilo de la trayectoria,
   la conversación de preguntas y los botones vivos.
   Parámetros: ?ss → sin animaciones (capturas)
               ?ahora=2026-09-29T11:30 → fija la hora de Madrid (revisión)
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const raiz = document.documentElement;
  const quieto = raiz.classList.contains('quieto');
  const captura = raiz.classList.contains('captura');
  const params = new URLSearchParams(location.search);
  const punteroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const escritorio = matchMedia('(min-width: 1024px)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reiniciar = (el, clase) => { el.classList.remove(clase); void el.offsetWidth; el.classList.add(clase); };
  const espera = ms => new Promise(r => setTimeout(r, ms));

  /* Capturas: todo cargado desde el principio */
  if (captura) {
    $$('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    $$('iframe[loading="lazy"]').forEach(f => { f.loading = 'eager'; });
  }

  /* =================================================================
     Textos que se animan: letras del nombre, palabras de los titulares
     ================================================================= */
  // Las letras del nombre se encienden una a una, como un rótulo de luz, de «L» a «o»
  let letraHero = 0;
  $$('[data-letras-hero]').forEach(el => {
    el.innerHTML = [...el.textContent.trim()].map(c => `<span class="l" style="--d:${letraHero++}">${c}</span>`).join('');
  });
  $$('[data-palabras]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((p, i) => `<span class="p"><span class="p__in" style="--w:${i}">${p}</span></span>`).join(' ');
  });
  const citaSalon = $('[data-encender]');
  let palabrasCita = [];
  if (citaSalon) {
    citaSalon.innerHTML = citaSalon.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    palabrasCita = $$('.w', citaSalon);
  }

  /* =================================================================
     Botones: el texto rueda, la tinta nace donde entra el cursor y los
     principales siguen al cursor como un imán
     ================================================================= */
  $$('.boton__txt').forEach(t => {
    const html = t.innerHTML;
    t.innerHTML = `<span class="boton__rodillo"><span>${html}</span><span aria-hidden="true">${html}</span></span>`;
  });
  $$('.boton').forEach(b => {
    const origen = e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--rx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      b.style.setProperty('--ry', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    };
    b.addEventListener('pointerenter', origen);
    b.addEventListener('pointerleave', origen);
  });
  if (punteroFino && !quieto) {
    $$('[data-magnetico]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px`);
        b.style.setProperty('--my', `${((e.clientY - r.top - r.height / 2) * .34).toFixed(1)}px`);
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }
  /* El color sigue al cursor: en cada grupo, la mancha del botón que deja de
     estar coloreado se recoge hacia el que se toca, y al salir del grupo
     vuelve al principal por el lado por donde se fue el cursor */
  $$('.hero__acciones, .acciones, .ticket__acciones, [data-grupo-botones]').forEach(g => {
    const botones = $$('.boton', g);
    if (botones.length < 2) return;
    const hacia = (b, x, y) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--rx', `${clamp((x - r.left) / r.width * 100, -20, 120).toFixed(1)}%`);
      b.style.setProperty('--ry', `${clamp((y - r.top) / r.height * 100, -20, 120).toFixed(1)}%`);
    };
    botones.forEach(b => b.addEventListener('pointerenter', () => {
      const r = b.getBoundingClientRect();
      botones.forEach(o => { if (o !== b) hacia(o, r.left + r.width / 2, r.top + r.height / 2); });
    }));
    g.addEventListener('pointerleave', e => botones.forEach(o => hacia(o, e.clientX, e.clientY)));
  });

  /* =================================================================
     El horario: una sola fuente
     Minutos desde medianoche. 0 = domingo … 6 = sábado.
     ================================================================= */
  const HORARIO = { 0: null, 1: [600, 1230], 2: [600, 1230], 3: [600, 1230], 4: [600, 1230], 5: [600, 1230], 6: [540, 900] };
  const MEDIODIA = 840;
  const DIAS    = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIAS_C  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MESES   = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const hhmm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

  /* Hora de Madrid, esté donde esté quien mira */
  function ahora() {
    const fija = params.get('ahora');
    if (fija && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fija)) {
      const [f, h] = fija.split('T');
      const [y, m, d] = f.split('-').map(Number);
      const [hh, mi] = h.split(':').map(Number);
      return { y, m, d, min: hh * 60 + mi, dia: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
    }
    const p = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    const y = +p.year, m = +p.month, d = +p.day;
    return { y, m, d, min: +p.hour * 60 + +p.minute, dia: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
  }

  function estado(t) {
    const hoy = HORARIO[t.dia];
    if (hoy && t.min >= hoy[0] && t.min < hoy[1]) {
      return { abierto: true, txt: hoy[1] - t.min <= 45 ? 'Cierra pronto' : 'Abierto ahora', sub: `cierra a las ${hhmm(hoy[1])}` };
    }
    for (let i = 0; i < 8; i++) {
      const d = (t.dia + i) % 7, h = HORARIO[d];
      if (!h || (i === 0 && t.min >= h[0])) continue;
      const cuando = i === 0 ? 'hoy' : i === 1 ? 'mañana' : `el ${DIAS[d]}`;
      return { abierto: false, txt: 'Cerrado ahora', sub: `abre ${cuando} a las ${hhmm(h[0])}` };
    }
    return null;
  }

  function pintarEstado() {
    const t = ahora();
    const e = estado(t);
    if (!e) return;
    $$('[data-estado]').forEach(el => {
      el.classList.toggle('es-abierto', e.abierto);
      el.classList.toggle('es-cerrado', !e.abierto);
      el.innerHTML = `<span class="estado__punto" aria-hidden="true"></span><span class="estado__txt">${e.txt}</span><span class="estado__sub">${e.sub}</span>`;
    });
    $$('.horario tr[data-dias]').forEach(tr => tr.classList.toggle('es-hoy', tr.dataset.dias.split(' ').includes(String(t.dia))));
  }
  pintarEstado();
  setInterval(pintarEstado, 60000);

  /* =================================================================
     Hero: el tocador
     Las bombillas se agrandan hacia el cursor (o el dedo), los objetos
     del marco flotan con él, la polaroid pasa sus trabajos y todo se
     para cuando el hero no se ve
     ================================================================= */
  const heroTocador = $('#inicio');
  const espejoHero = heroTocador && $('.tocador__espejo', heroTocador);
  if (espejoHero) {
    const bombillas = $$('.bombilla', espejoHero);
    let centros = [], punto = null, pendienteLuz = false, enVista = true;

    // Centros de las bombillas respecto al hero (se rehacen al cambiar el tamaño)
    const medirLuces = () => {
      const h = heroTocador.getBoundingClientRect();
      centros = bombillas.map(b => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2 - h.left, r.top + r.height / 2 - h.top]; });
    };
    const pintarLuz = () => {
      pendienteLuz = false;
      if (!punto) return;
      const [x, y, w, h] = punto;
      const radio = espejoHero.offsetWidth * .45;
      bombillas.forEach((b, i) => {
        const t = Math.max(0, 1 - Math.hypot(centros[i][0] - x, centros[i][1] - y) / radio);
        const k = (1 + .55 * t * t).toFixed(2);
        if (b.style.getPropertyValue('--k-luz') !== k) b.style.setProperty('--k-luz', k);
      });
      heroTocador.style.setProperty('--px', clamp(x / w * 2 - 1, -1, 1).toFixed(3));
      heroTocador.style.setProperty('--py', clamp(y / h * 2 - 1, -1, 1).toFixed(3));
    };
    const acercar = e => {
      if (!centros.length) medirLuces();
      const h = heroTocador.getBoundingClientRect();
      punto = [e.clientX - h.left, e.clientY - h.top, h.width, h.height];
      if (!pendienteLuz) { pendienteLuz = true; requestAnimationFrame(pintarLuz); }
    };
    const soltar = () => {
      punto = null;
      bombillas.forEach(b => b.style.removeProperty('--k-luz'));
      heroTocador.style.removeProperty('--px');
      heroTocador.style.removeProperty('--py');
    };

    // La polaroid: cada pocos segundos, otro trabajo y su servicio (solo fotos ya cargadas)
    const fotos = $$('.polaroid__foto img', espejoHero);
    const pies = $$('.polaroid__pie > span', espejoHero);
    const polaroid = $('.objeto--polaroid', espejoHero);
    let actual = 0, encima = false;
    const cargada = f => f.complete && f.naturalWidth > 0;
    const pasarFoto = () => {
      if (!enVista || encima || document.hidden) return;
      let sig = (actual + 1) % fotos.length;
      for (let n = 0; n < fotos.length && !cargada(fotos[sig]); n++) sig = (sig + 1) % fotos.length;
      if (sig === actual) return;
      fotos[actual].classList.remove('activa');
      fotos[sig].classList.add('activa');
      pies.forEach(p => p.classList.remove('sale'));
      pies[actual].classList.replace('activa', 'sale');
      pies[sig].classList.add('activa');
      actual = sig;
    };

    if (!quieto) {
      heroTocador.addEventListener('pointermove', acercar, { passive: true });
      heroTocador.addEventListener('pointerdown', acercar, { passive: true });
      heroTocador.addEventListener('pointerleave', soltar);
      heroTocador.addEventListener('pointercancel', soltar);
      heroTocador.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(soltar, 700); });
      addEventListener('resize', () => { centros = []; });

      if (fotos.length > 1 && pies.length === fotos.length) {
        const empezar = () => {
          fotos.forEach(f => { if (f.dataset.src) { f.src = f.dataset.src; f.removeAttribute('data-src'); } });
          setInterval(pasarFoto, 3600);
        };
        if (document.readyState === 'complete') setTimeout(empezar, 2000);
        else addEventListener('load', () => setTimeout(empezar, 2000), { once: true });
        if (polaroid) {
          polaroid.addEventListener('pointerenter', () => { encima = true; });
          polaroid.addEventListener('pointerleave', () => { encima = false; });
        }
      }

      // Fuera de pantalla (o con la pestaña oculta) no se mueve nada
      const pausar = () => heroTocador.classList.toggle('en-pausa', !enVista || document.hidden);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { enVista = e.isIntersecting; pausar(); }).observe(heroTocador);
      }
      document.addEventListener('visibilitychange', pausar);
    }
  }

  /* =================================================================
     Cabecera, menú, barra fija y botón flotante
     ================================================================= */
  const cab = $('#cab');
  const botonMenu = $('.cab__menu');
  const menu = $('#menu');
  const menuAbierto = () => botonMenu.getAttribute('aria-expanded') === 'true';
  function abrirMenu() {
    menu.hidden = false;
    botonMenu.setAttribute('aria-expanded', 'true');
    raiz.classList.add('menu-abierto');
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('abierto')));
  }
  function cerrarMenu() {
    menu.classList.remove('abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
    raiz.classList.remove('menu-abierto');
    setTimeout(() => { if (!menuAbierto()) menu.hidden = true; }, quieto ? 0 : 200);
  }
  botonMenu.addEventListener('click', () => (menuAbierto() ? cerrarMenu() : abrirMenu()));
  menu.addEventListener('click', e => { if (e.target.closest('a')) cerrarMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuAbierto()) { cerrarMenu(); botonMenu.focus(); } });
  escritorio.addEventListener('change', e => { if (e.matches && menuAbierto()) cerrarMenu(); });

  const fija = $('[data-fija]');
  const flotante = $('[data-flotante]');
  const hero = $('#inicio');
  const seccionCita = $('#cita');
  const pie = $('.pie');
  let trasHero = false, enCita = false, enPie = false, escribiendo = false;
  const pintarFijos = () => {
    if (fija) fija.classList.toggle('visible', trasHero && !enCita && !escribiendo);
    if (flotante) flotante.classList.toggle('visible', trasHero && !enCita && !enPie);
  };
  if ('IntersectionObserver' in window) {
    if (hero) new IntersectionObserver(([e]) => { trasHero = !e.isIntersecting && e.boundingClientRect.top < 0; pintarFijos(); }).observe(hero);
    if (seccionCita) new IntersectionObserver(([e]) => { enCita = e.isIntersecting; pintarFijos(); }, { threshold: .12 }).observe(seccionCita);
    if (pie) new IntersectionObserver(([e]) => { enPie = e.isIntersecting; pintarFijos(); }).observe(pie);
  }
  document.addEventListener('focusin', e => { if (e.target.matches('input[type="text"], input[type="tel"]')) { escribiendo = true; pintarFijos(); } });
  document.addEventListener('focusout', e => { if (e.target.matches('input[type="text"], input[type="tel"]')) { escribiendo = false; pintarFijos(); } });

  /* =================================================================
     Lo que se enciende al entrar en pantalla (una vez)
     ================================================================= */
  const vistas = [
    ['[data-palabras]', 'visible', .35],
    ['[data-revela]', 'visible', .2],
    ['.espejo--pared', 'encendido', .3]
  ];
  if (!quieto && 'IntersectionObserver' in window) {
    vistas.forEach(([sel, clase, umbral]) => {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add(clase);
        io.unobserve(e.target);
      }), { threshold: umbral, rootMargin: '0px 0px -6% 0px' });
      $$(sel).forEach(el => io.observe(el));
    });
  } else {
    vistas.forEach(([sel, clase]) => $$(sel).forEach(el => el.classList.add(clase)));
  }

  /* =================================================================
     El salón: los espejos responden al cursor
     El que miras se vuelve hacia ti y se le enciende el LED; los demás
     bajan la luz y se giran un poco hacia el cursor (movimiento.css).
     Sin bucles: se pinta al mover. En táctil, un toque lo enciende.
     ================================================================= */
  const pared = $('[data-pared]');
  if (pared && !quieto) {
    const espejos = $$('.espejo--pared', pared);
    if (punteroFino) {
      // La caja de maquetación (sin transformaciones), en coordenadas de página
      const caja = el => { let x = 0, y = 0; for (let e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
      let mirado = null, cx = 0, cy = 0, pendiente = false;
      const pintar = () => {
        pendiente = false;
        if (!mirado) return;
        const x = cx + scrollX, y = cy + scrollY;
        espejos.forEach(f => {
          const c = caja(f);
          if (f === mirado) {
            f.style.setProperty('--mira-x', clamp((x - c.x) / c.w * 2 - 1, -1, 1).toFixed(3));
            f.style.setProperty('--mira-y', clamp((y - c.y) / c.h * 2 - 1, -1, 1).toFixed(3));
            return;
          }
          // Los demás se vuelven hacia el cursor como hacia alguien de pie ante la pared
          const dx = x - c.x - c.w / 2, dy = y - c.y - c.h / 2, lejos = c.w * 2.4;
          f.style.setProperty('--hacia-x', (dx / Math.hypot(dx, lejos)).toFixed(3));
          f.style.setProperty('--hacia-y', (dy / Math.hypot(dy, lejos)).toFixed(3));
        });
      };
      const programar = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(pintar); };
      espejos.forEach(f => {
        f.addEventListener('pointerenter', e => {
          if (e.pointerType === 'touch') return;
          if (mirado && mirado !== f) mirado.classList.remove('mirado');
          cx = e.clientX; cy = e.clientY; mirado = f;
          pintar();
          f.classList.add('mirado');
          pared.classList.add('mirando');
        });
        f.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') { cx = e.clientX; cy = e.clientY; programar(); } });
        f.addEventListener('pointerleave', () => {
          f.classList.remove('mirado');
          if (mirado === f) { mirado = null; pared.classList.remove('mirando'); }
        });
      });
      // Con la rueda, el espejo pasa bajo el cursor quieto
      addEventListener('scroll', () => { if (mirado) programar(); }, { passive: true });
    } else {
      espejos.forEach(f => f.addEventListener('click', () => reiniciar(f, 'toque')));
    }
  }

  /* =================================================================
     Servicios: la vitrina (escritorio) y el carrusel (móvil)
     ================================================================= */
  const gesto = el => { if (el && !quieto) reiniciar(el, 'gesto'); };
  const carta = $('[data-carta]');
  const servs = $$('.serv');
  const fotosVitrina = $$('.vitrina__foto');
  const nombreVitrina = $('[data-vitrina-nombre]');
  const luzVitrina = $('.vitrina__luz');
  let activo = servs[0] ? servs[0].dataset.serv : '';

  function activar(id) {
    if (!id || id === activo) return;
    activo = id;
    const s = servs.find(x => x.dataset.serv === id);
    servs.forEach(x => x.classList.toggle('activo', x === s));
    fotosVitrina.forEach(f => f.classList.toggle('activa', f.dataset.v === id));
    if (nombreVitrina && s) {
      nombreVitrina.textContent = $('.serv__nombre span', s).textContent;
      if (!quieto) reiniciar(nombreVitrina, 'nuevo');
    }
    if (luzVitrina && !quieto) reiniciar(luzVitrina, 'pasa');
    gesto(s);
  }

  if (carta) {
    // Escritorio: el servicio que cruza el centro de la pantalla se enciende; el cursor también
    if ('IntersectionObserver' in window && !captura) {
      const ioCentro = new IntersectionObserver(es => {
        if (!escritorio.matches) return;
        es.forEach(e => { if (e.isIntersecting) activar(e.target.dataset.serv); });
      }, { rootMargin: '-46% 0px -46% 0px' });
      servs.forEach(s => ioCentro.observe(s));
    }
    servs.forEach(s => {
      s.addEventListener('pointerenter', e => { if (escritorio.matches && e.pointerType === 'mouse') activar(s.dataset.serv); });
      s.addEventListener('focusin', () => { if (escritorio.matches) activar(s.dataset.serv); });
    });

    // Móvil: carrusel con profundidad; la tarjeta centrada hace su gesto
    const posCarta = $('[data-carta-pos]');
    let centrada = -1;
    const profundidad = () => {
      if (escritorio.matches) { servs.forEach(s => s.style.removeProperty('--k')); return; }
      const c = carta.getBoundingClientRect();
      const medio = c.left + c.width / 2;
      let mejor = 0, dMin = Infinity;
      servs.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - medio);
        if (!quieto) s.style.setProperty('--k', clamp(d / (r.width * 1.05), 0, 1).toFixed(3));
        if (d < dMin) { dMin = d; mejor = i; }
      });
      if (mejor !== centrada) {
        centrada = mejor;
        if (posCarta) posCarta.textContent = String(mejor + 1);
        gesto(servs[mejor]);
      }
    };
    let pendiente = false;
    const programar = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; profundidad(); }); };
    carta.addEventListener('scroll', programar, { passive: true });
    addEventListener('resize', programar);
    profundidad();
  }

  /* =================================================================
     Pide tu cita
     ================================================================= */
  const form = $('#form-cita');
  const reserva = $('[data-reserva]');
  const ticket = $('[data-resguardo]');
  const cajaDias = $('[data-dias]');
  const segmento = $('[data-franjas]');
  const progreso = $('[data-progreso]');
  const botonEmail = $('[data-email]');
  const nota = $('.ticket__nota');
  const notaBase = nota ? nota.textContent : '';

  /* Los próximos seis días en que abren (sin domingos; hoy solo si da tiempo) */
  function construirDias() {
    if (!cajaDias) return;
    const t = ahora();
    const fichas = [];
    for (let i = 0; fichas.length < 6 && i < 14; i++) {
      const f = new Date(Date.UTC(t.y, t.m - 1, t.d + i));
      const d = f.getUTCDay(), h = HORARIO[d];
      if (!h || (i === 0 && t.min > h[1] - 60)) continue;
      const cab = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_C[d];
      const valor = `${i === 0 ? 'Hoy, ' : i === 1 ? 'Mañana, ' : ''}${DIAS[d]} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]}`;
      fichas.push(
        `<label class="dia"><input type="radio" name="dia" value="${valor}" data-d="${d}" data-hoy="${i === 0 ? 1 : 0}" data-num="${f.getUTCDate()}" data-sem="${DIAS[d]}" data-mes="${MESES[f.getUTCMonth()]}">` +
        `<span class="dia__cara"><b>${cab}</b><span class="dia__num">${f.getUTCDate()}</span><small>${MESES_C[f.getUTCMonth()]}</small></span></label>`
      );
    }
    cajaDias.innerHTML = fichas.join('');
  }

  /* Mañana / tarde según el día: el sábado solo hay mañana; hoy, lo que quede */
  function ajustarFranjas() {
    if (!segmento) return;
    const elegido = form.querySelector('input[name="dia"]:checked');
    const d = elegido ? +elegido.dataset.d : 1;
    const esHoy = elegido && elegido.dataset.hoy === '1';
    const t = ahora();
    const h = HORARIO[d] || HORARIO[1];
    const franjas = d === 6
      ? [{ v: 'Por la mañana', n: 'Mañana', ini: h[0], fin: h[1] }]
      : [{ v: 'Por la mañana', n: 'Mañana', ini: h[0], fin: MEDIODIA }, { v: 'Por la tarde', n: 'Tarde', ini: MEDIODIA, fin: h[1] }];
    const antes = (form.querySelector('input[name="franja"]:checked') || {}).value;
    segmento.style.setProperty('--ops', franjas.length);
    segmento.innerHTML = franjas.map(f => {
      const pasada = esHoy && t.min > f.fin - 60;
      const empezada = esHoy && t.min > f.ini;
      const rango = pasada ? 'ya no da tiempo' : empezada ? `hasta las ${hhmm(f.fin)}` : `${hhmm(f.ini)} a ${hhmm(f.fin)}`;
      return `<label class="segmento__op"><input type="radio" name="franja" value="${f.v}"${pasada ? ' disabled' : ''}${!pasada && antes === f.v ? ' checked' : ''}>` +
             `<span>${f.n} <small>${rango}</small></span></label>`;
    }).join('') + '<span class="segmento__pulgar" aria-hidden="true"></span>';
    moverPulgar();
  }
  function moverPulgar() {
    if (!segmento) return;
    const ops = $$('input[name="franja"]', segmento);
    const i = ops.findIndex(o => o.checked);
    segmento.style.setProperty('--pos', Math.max(0, i));
    segmento.style.setProperty('--vis', i >= 0 ? 1 : 0);
  }

  function leer() {
    const fd = new FormData(form);
    return {
      servicio: fd.getAll('servicio'),
      dia: fd.get('dia') || '',
      franja: fd.get('franja') || '',
      nombre: String(fd.get('nombre') || '').trim(),
      telefono: String(fd.get('telefono') || '').trim()
    };
  }
  function linea(clave, texto, vacio) {
    const dd = ticket.querySelector(`[data-r="${clave}"]`);
    if (!dd || dd.textContent === texto) return;
    dd.textContent = texto;
    dd.classList.toggle('vacio', vacio);
    if (!vacio && !quieto) reiniciar(dd, 'cambia');
  }
  /* La hoja de calendario del resguardo: el día elegido, en grande */
  const hojaFecha = $('.ticket__fecha');
  const hojaSem = $('[data-t-sem]');
  const hojaNum = $('[data-t-num]');
  const hojaMes = $('[data-t-mes]');
  const hojaVacia = hojaFecha ? [hojaSem.textContent, hojaNum.textContent, hojaMes.textContent] : [];
  function pintarHoja() {
    if (!hojaFecha) return;
    const d = form.querySelector('input[name="dia"]:checked');
    const [sem, num, mes] = d && d.dataset.num ? [d.dataset.sem, d.dataset.num, d.dataset.mes] : d ? ['', '·', d.value] : hojaVacia;
    if (hojaNum.textContent === num && hojaMes.textContent === mes && hojaSem.textContent === sem) return;
    hojaSem.textContent = sem;
    hojaNum.textContent = num;
    hojaMes.textContent = mes;
    hojaFecha.classList.toggle('vacia', !d);
    if (d && !quieto) reiniciar(hojaFecha, 'pasa');
  }

  let estabaLista = false;
  function pintarResguardo() {
    const v = leer();
    const franja = form.querySelector('input[name="franja"]:checked');
    const rango = franja ? franja.parentElement.querySelector('small').textContent : '';
    linea('servicio', v.servicio.length ? v.servicio.join(', ') : 'Elige uno o varios', !v.servicio.length);
    linea('dia', v.dia || 'Sin elegir', !v.dia);
    linea('franja', v.franja ? `${v.franja} (${rango.replace(/ /g, '\u00a0')})` : 'Sin elegir', !v.franja); // el horario no se parte
    linea('nombre', v.nombre || 'Sin escribir', !v.nombre);
    pintarHoja();

    const pasos = [v.servicio.length > 0, !!v.dia, !!v.franja, !!v.nombre].filter(Boolean).length;
    if (progreso) progreso.style.setProperty('--p', (pasos / 4).toFixed(2));

    const lista = v.servicio.length > 0 && !!v.dia && !!v.franja;
    reserva.classList.toggle('lista', lista);
    if (lista && !estabaLista && !quieto) { reserva.classList.add('recien-lista'); setTimeout(() => reserva.classList.remove('recien-lista'), 1400); }
    estabaLista = lista;
    if (lista && nota.classList.contains('aviso')) { nota.classList.remove('aviso'); nota.textContent = notaBase; }

    const cuerpo = [
      'Hola, me gustaría pedir cita.', '',
      `Servicio: ${v.servicio.join(', ') || 'por decidir'}`,
      `Día: ${v.dia || 'a convenir'}`,
      `Franja: ${v.franja ? `${v.franja} (${rango})` : 'a convenir'}`,
      `Nombre: ${v.nombre || '—'}`,
      `Teléfono: ${v.telefono || '—'}`, '', 'Gracias.'
    ].join('\n');
    const asunto = `Petición de cita${v.nombre ? ` · ${v.nombre}` : ''}`;
    botonEmail.href = `mailto:lorenacampillopeluqueria@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }

  if (form && reserva && ticket) {
    construirDias();
    ajustarFranjas();
    pintarResguardo();

    form.addEventListener('change', e => {
      if (e.target.name === 'dia') ajustarFranjas();
      if (e.target.name === 'franja') moverPulgar();
      if (e.target.name === 'servicio' && e.target.checked) gesto(e.target.closest('.pieza'));
      pintarResguardo();
    });
    form.addEventListener('input', e => { if (e.target.matches('input[type="text"], input[type="tel"]')) pintarResguardo(); });
    form.addEventListener('submit', e => e.preventDefault());

    /* La tinta de cada servicio y cada día nace donde se toca (con teclado, desde el centro) */
    form.addEventListener('pointerdown', e => {
      const opcion = e.target.closest('.pieza, .dia');
      const cara = opcion && $('.pieza__cara, .dia__cara', opcion);
      if (!cara) return;
      const r = cara.getBoundingClientRect();
      cara.style.setProperty('--rx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      cara.style.setProperty('--ry', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    });

    /* Sin servicio y día, el email no sale vacío: se avisa y se lleva al hueco */
    botonEmail.addEventListener('click', e => {
      const v = leer();
      if (v.servicio.length && v.dia) return;
      e.preventDefault();
      nota.textContent = !v.servicio.length ? 'Elige al menos un servicio y el día.' : 'Elige el día que te viene bien.';
      nota.classList.add('aviso');
      const hueco = form.querySelector(!v.servicio.length ? 'input[name="servicio"]' : 'input[name="dia"]');
      if (hueco) { hueco.closest('fieldset').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'center' }); hueco.focus({ preventScroll: true }); }
    });

    /* «Pedir cita para…» desde cada servicio: deja el servicio marcado */
    $$('[data-elige]').forEach(a => a.addEventListener('click', () => {
      const casilla = form.querySelector(`input[name="servicio"][value="${a.dataset.elige}"]`);
      if (casilla && !casilla.checked) { casilla.checked = true; pintarResguardo(); }
    }));
  }

  /* =================================================================
     Preguntas frecuentes: una conversación
     ================================================================= */
  const chat = $('[data-chat]');
  const cajaPreguntas = $('[data-chat-preguntas]');
  if (chat && cajaPreguntas) {
    const burbujas = $$('.burbuja', chat);
    const pares = [];
    for (let i = 0; i + 1 < burbujas.length; i += 2) pares.push({ p: burbujas[i].textContent.trim(), r: burbujas[i + 1].innerHTML });
    chat.innerHTML = '';
    let ocupado = false, tocado = false;

    const alFinal = () => chat.scrollTo({ top: chat.scrollHeight, behavior: quieto ? 'auto' : 'smooth' });
    const decir = (quien, html) => {
      const b = document.createElement('p');
      b.className = `burbuja burbuja--${quien} nueva`;
      b.innerHTML = html;
      chat.appendChild(b);
      alFinal();
    };
    const escribirse = () => {
      const d = document.createElement('div');
      d.className = 'escribiendo';
      d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<span></span><span></span><span></span>';
      chat.appendChild(d);
      alFinal();
      return d;
    };
    async function preguntar(i) {
      if (ocupado || !pares[i]) return;
      ocupado = true;
      decir('yo', pares[i].p);
      if (!quieto) { await espera(380); const t = escribirse(); await espera(900); t.remove(); }
      decir('salon', pares[i].r);
      const b = cajaPreguntas.querySelector(`[data-i="${i}"]`);
      if (b) b.classList.add('hecha');
      ocupado = false;
    }

    decir('salon', 'Hola. Elige una pregunta y aquí tienes la respuesta.');
    cajaPreguntas.innerHTML = pares.map((x, i) =>
      `<button type="button" class="pregunta-btn" data-i="${i}" style="--i:${i}"><svg class="ico" aria-hidden="true"><use href="#i-ok"/></svg>${x.p}</button>`).join('');
    cajaPreguntas.hidden = false;
    cajaPreguntas.addEventListener('click', e => {
      const b = e.target.closest('.pregunta-btn');
      if (!b) return;
      tocado = true;
      preguntar(+b.dataset.i);
    });

    // La primera vez que se ve, la conversación arranca sola con la pregunta más habitual
    if (quieto) {
      preguntar(0);
    } else if ('IntersectionObserver' in window) {
      const ioChat = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        ioChat.disconnect();
        setTimeout(() => { if (!tocado) preguntar(0); }, 700);
      }, { threshold: .55 });
      ioChat.observe(chat);
    }
  }

  /* =================================================================
     Lo que se mueve con el scroll: el hero, el fondo de la cita, la
     pared de espejos, la frase del salón y el hilo de la trayectoria
     ================================================================= */
  const citaFondo = $('.cita__fondo');
  const lunas = $$('.espejo--pared .espejo__luna img');
  const lineaTiempo = $('[data-linea]');
  const hitos = $$('.hito');

  function alScroll() {
    const vh = innerHeight;
    if (cab) cab.classList.toggle('con-borde', scrollY > 8);

    if (hero && scrollY < hero.offsetHeight * 1.2) {
      hero.style.setProperty('--sy', Math.min(scrollY, hero.offsetHeight).toFixed(1));
    }
    if (citaFondo) {
      const r = citaFondo.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) citaFondo.style.setProperty('--zoom', (1.16 - .14 * clamp((vh - r.top) / (vh + r.height), 0, 1)).toFixed(4));
    }
    lunas.forEach((img, i) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const t = clamp((vh - r.top) / (vh + r.height), 0, 1);
      img.style.setProperty('--py', `${((.5 - t) * (12 + (i % 2) * 6)).toFixed(2)}%`);
    });
    if (citaSalon && palabrasCita.length) {
      const r = citaSalon.getBoundingClientRect();
      const t = clamp((vh * .88 - r.top) / (r.height + vh * .3), 0, 1);
      const n = Math.round(t * palabrasCita.length);
      palabrasCita.forEach((w, i) => w.classList.toggle('lit', i < n));
    }
    if (lineaTiempo) {
      const r = lineaTiempo.getBoundingClientRect();
      const ref = vh * .62;
      lineaTiempo.style.setProperty('--prog', clamp((ref - r.top) / r.height, 0, 1).toFixed(4));
      hitos.forEach(h => {
        const hr = h.getBoundingClientRect();
        h.classList.toggle('encendido', hr.top + hr.height * .5 < ref);
      });
    }
  }

  if (quieto) {
    // Quieta y completa: todo encendido, sin seguir el scroll
    palabrasCita.forEach(w => w.classList.add('lit'));
    hitos.forEach(h => h.classList.add('encendido'));
    if (lineaTiempo) lineaTiempo.style.setProperty('--prog', '1');
    addEventListener('scroll', () => { if (cab) cab.classList.toggle('con-borde', scrollY > 8); }, { passive: true });
  } else {
    let pendiente = false;
    const programar = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; alScroll(); }); };
    addEventListener('scroll', programar, { passive: true });
    addEventListener('resize', programar);
    alScroll();
  }

  /* Al imprimir: todo visible */
  addEventListener('beforeprint', () => {
    vistas.forEach(([sel, clase]) => $$(sel).forEach(el => el.classList.add(clase)));
    palabrasCita.forEach(w => w.classList.add('lit'));
    hitos.forEach(h => h.classList.add('encendido'));
  });
})();
