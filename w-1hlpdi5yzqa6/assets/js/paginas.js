/* Reggae School Madrid — páginas interiores (v4.4)
   Barra fija del móvil, aviso de páginas que llegan más adelante (solo en
   el prototipo) y el canal en solo de cada curso, con el riddim real. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const captura = document.documentElement.classList.contains('ss');
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Aviso: «esta página llega en la semana…» ---------- */
  /* ---------- Titulares que entran palabra a palabra ----------
     Cada palabra va en su máscara y sube al verse el titular (main.js le pone .visto).
     Los que llevan eco dub se quedan enteros. */
  const partir = (h) => {
    let p = 0;
    const envolver = (nodo) => [...nodo.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const a = document.createElement('span'); a.className = 'pal';
          const b = document.createElement('span'); b.className = 'pal__i'; b.style.setProperty('--p', p++); b.textContent = t;
          a.appendChild(b); frag.appendChild(a);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') envolver(n);
    });
    envolver(h);
    h.classList.add('t-partido');
  };
  $$('h2.t-seccion[data-revela]').forEach((h) => { if (!h.querySelector('.eco')) partir(h); });

  /* ---------- Luz de oro que recorre el borde de las llamadas principales ---------- */
  $$('.boton--luz').forEach((b) => {
    if (!b.querySelector('.boton__luz')) b.insertAdjacentHTML('beforeend', '<span class="boton__luz" aria-hidden="true"><span></span></span>');
  });

  /* ---------- Menú: Cursos y La escuela abren su desplegable (no llevan enlace) ----------
     Con el ratón, al pasar; con el dedo o el teclado, al pulsar. Se cierra al salir, con Escape
     o al pulsar fuera. Las fotos del desplegable se cargan la primera vez que se abre. */
  const desplegables = $$('[data-desplegable]');
  const abrir = (item, si) => {
    const btn = $('.nav__padre', item);
    const sub = $('.nav__sub', item);
    item.classList.toggle('abierto', si);
    if (btn) btn.setAttribute('aria-expanded', String(si));
    if (sub) sub.inert = !si;
    if (si) {
      $$('img[data-src]', item).forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
      desplegables.forEach((otro) => { if (otro !== item && otro.classList.contains('abierto')) abrir(otro, false); });
    }
  };
  desplegables.forEach((item) => {
    const btn = $('.nav__padre', item);
    abrir(item, false);
    item.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') abrir(item, true); });
    item.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') abrir(item, false); });
    if (btn) btn.addEventListener('click', () => abrir(item, !item.classList.contains('abierto')));
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) abrir(item, false); });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && item.classList.contains('abierto')) { abrir(item, false); if (btn) btn.focus(); }
    });
  });
  document.addEventListener('click', (e) => {
    desplegables.forEach((item) => { if (item.classList.contains('abierto') && !item.contains(e.target)) abrir(item, false); });
  });

  const aviso = $('[data-aviso-pronto]');
  let tAviso = 0;
  $$('[data-pronto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (!aviso) return;
    aviso.textContent = a.dataset.pronto;
    aviso.classList.add('visible');
    clearTimeout(tAviso);
    tAviso = setTimeout(() => aviso.classList.remove('visible'), 3200);
  }));

  /* ---------- Páginas de cursos (v10): un curso cada vez ----------
     Las fotos de la apertura y la barra fija eligen el curso; se ve su ficha y las demás se ocultan.
     La dirección lleva el curso (#guitarra…), así que los enlaces del menú y las redirecciones de las
     direcciones antiguas abren el suyo. Sin JS, todas las fichas seguidas y los enlaces son anclas. */
  /* ---------- v10.2: vídeos que vuelven a su portada ----------
     Un vídeo que se oculta (al cambiar de curso, o de «Vídeo» a «Cartel») deja de sonar: el iframe vuelve
     a ser la portada con su botón. */
  const portadas = new Map();
  $$('.cu-ficha .video').forEach((v) => { const b = $('[data-video]', v); if (b) portadas.set(v, b.cloneNode(true)); });
  const ponerVideo = (btn) => btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1&rel=0`;
    f.title = (btn.getAttribute('aria-label') || 'Vídeo').replace(/^Reproducir /, '');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    btn.replaceWith(f);
    f.focus();
  });
  const apagarVideos = (zona) => $$('.video', zona).forEach((v) => {
    const f = $('iframe', v);
    const copia = portadas.get(v);
    if (!f || !copia) return;
    const b = copia.cloneNode(true);
    ponerVideo(b);
    f.replaceWith(b);
  });

  /* ---------- v10.2: con dos vídeos (batería) o vídeo y cartel (Combo), uno cada vez ---------- */
  $$('[data-medios]').forEach((m) => {
    const items = $$('[data-medio]', m);
    const botones = $$('[data-medio-b]', m);
    m.classList.add('con-pase');
    const elegir = (k) => {
      items.forEach((it, j) => {
        const si = j === k;
        it.classList.toggle('activo', si);
        if (si) it.removeAttribute('inert');
        else { it.setAttribute('inert', ''); apagarVideos(it); }
      });
      botones.forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
    };
    botones.forEach((b, j) => b.addEventListener('click', () => elegir(j)));
    elegir(0);
  });

  const fichas = $$('[data-ficha]');
  if (fichas.length > 1) {
    const pestanas = $$('[data-ficha-tab]');
    const cab = $('[data-cab]');
    const barra = $('.cu-selector');
    const ids = fichas.map((f) => f.id);
    const mostrar = (id, desplazar) => {
      const f = fichas.find((x) => x.id === id) || fichas[0];
      fichas.forEach((x) => { x.hidden = x !== f; if (x !== f) apagarVideos(x); });
      pestanas.forEach((t) => {
        const si = t.dataset.fichaTab === f.id;
        t.setAttribute('aria-selected', String(si));
        t.tabIndex = si || !t.closest('.cu-selector') ? 0 : -1;
      });
      // La barra lleva a la vista su curso (solo de lado: la barra ya está a la vista)
      const chip = barra && $(`[data-ficha-tab="${f.id}"]`, barra);
      if (chip) {
        const lista = chip.parentElement;
        lista.scrollTo({ left: chip.offsetLeft - (lista.clientWidth - chip.offsetWidth) / 2, behavior: reducido.matches ? 'auto' : 'smooth' });
      }
      if (desplazar) {
        const arriba = (cab ? cab.offsetHeight : 64) + (barra ? barra.offsetHeight : 0) - 1;
        const y = f.getBoundingClientRect().top + window.scrollY - arriba;
        window.scrollTo({ top: Math.max(0, y), behavior: reducido.matches ? 'auto' : 'smooth' });
      }
      // La dirección cambia solo cuando la persona elige (al cargar sin #, nada: si no, otro script bajaría a la ficha)
      if (desplazar && location.hash.slice(1) !== f.id) history.replaceState(null, '', `#${f.id}`);
    };
    pestanas.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); mostrar(t.dataset.fichaTab, true); }));
    // Flechas del teclado dentro de la barra
    if (barra) barra.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const chips = $$('[data-ficha-tab]', barra);
      const k = chips.indexOf(document.activeElement);
      if (k < 0) return;
      e.preventDefault();
      const sig = chips[(k + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length];
      mostrar(sig.dataset.fichaTab, false);
      sig.focus();
    });
    // v10.2: al pasar el ratón, la píldora de cada curso sigue un poco al cursor (se mueve la píldora y el
    // texto, no el enlace)
    if (barra && window.matchMedia('(hover: hover)').matches && !reducido.matches) {
      $$('.cu-selector__b', barra).forEach((b) => {
        b.addEventListener('pointermove', (e) => {
          if (e.pointerType !== 'mouse') return;
          const r = b.getBoundingClientRect();
          b.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) - 0.5) * 10}px`);
          b.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) - 0.5) * 6}px`);
        });
        b.addEventListener('pointerleave', () => { b.style.removeProperty('--mx'); b.style.removeProperty('--my'); });
      });
    }
    const pedido = location.hash.slice(1);
    const deEntrada = ids.includes(pedido);
    mostrar(deEntrada ? pedido : ids[0], false);
    // Con #curso en la dirección, al curso (tras pintar, que el navegador ya habrá saltado a la ficha)
    if (deEntrada) requestAnimationFrame(() => mostrar(pedido, true));
    window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (ids.includes(id)) mostrar(id, true); });
  }

  /* ---------- Barra fija del móvil: aparece al dejar atrás la cabecera de la página ---------- */
  const fija = $('[data-fija-pag]');
  const apertura = $('main > section');
  if (fija && apertura && 'IntersectionObserver' in window && !captura) {
    const pie = $('.pie');
    const reserva = $('#reserva');
    let trasApertura = false, enPie = false, enReserva = false;
    const pintar = () => {
      const visible = trasApertura && !enPie && !enReserva && !document.body.classList.contains('menu-abierto');
      fija.classList.toggle('visible', visible);
      fija.setAttribute('aria-hidden', String(!visible));
      const enlace = $('a', fija);
      if (enlace) enlace.tabIndex = visible ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { trasApertura = !e.isIntersecting && e.boundingClientRect.top < 0; pintar(); }).observe(apertura);
    if (pie) new IntersectionObserver(([e]) => { enPie = e.isIntersecting; pintar(); }).observe(pie);
    if (reserva) new IntersectionObserver(([e]) => { enReserva = e.isIntersecting; pintar(); }, { rootMargin: '0px 0px -15% 0px' }).observe(reserva);
  }

  /* ---------- El canal en solo: «Escucha la guitarra», «Escucha la línea de bajo»… ----------
     Usa el mismo riddim de la home (window.Riddim). Solo suena con un clic. Cada botón
     hace sonar su canal (si suena otro, cambia a este) y mueve el vúmetro de su
     sección; se para al salir esa sección de la pantalla o al ocultar la pestaña.
     El texto del botón no cambia (no encoge bajo el cursor): cambian el icono y aria-pressed. */
  const botones = $$('[data-solo]');
  const R = window.Riddim;
  if (botones.length) {
    if (!R || !R.soportado) {
      botones.forEach((b) => { b.hidden = true; });
    } else {
      const tapas = $$('[data-vu-tapa]');
      const tapaDe = (c) => tapas.filter((t) => (t.dataset.vuTapa || botones[0].dataset.solo) === c);
      let actual = null;
      const marcar = () => botones.forEach((b) => b.setAttribute('aria-pressed', String(R.sonando && b.dataset.solo === actual)));
      const limpiar = () => tapas.forEach((t) => { t.style.transform = ''; });
      botones.forEach((b) => b.addEventListener('click', () => {
        if (R.sonando && actual === b.dataset.solo) { R.parar(); return; }
        actual = b.dataset.solo;
        limpiar();
        R.tocar(actual);
        marcar();
      }));
      R.alCambiar((suena) => { marcar(); if (!suena) limpiar(); });
      if (tapas.length) {
        R.alNivel((n) => {
          if (reducido.matches || !actual) return;
          const v = Math.min(1, .05 + (n[actual] || 0) * .92);
          tapaDe(actual).forEach((t) => { t.style.transform = `scaleY(${(1 - v).toFixed(3)})`; });
        });
      }
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
          const b = $('[data-solo]', e.target);
          if (!e.isIntersecting && b && R.sonando && b.dataset.solo === actual) R.parar();
        }), { threshold: 0 });
        new Set(botones.map((b) => b.closest('section')).filter(Boolean)).forEach((s) => io.observe(s));
      }
      document.addEventListener('visibilitychange', () => { if (document.hidden && R.sonando) R.parar(); });
    }
  }

  /* ---------- Formulario de contacto: validación en línea (en WordPress lo recibe el plugin) ---------- */
  const fc = $('[data-form-contacto]');
  if (fc) {
    const ok = $('[data-form-contacto-ok]', fc);
    const reglas = {
      nombre: (el) => el.value.trim() !== '',
      email: (el) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()),
      instrumento: (el) => el.value !== '',
      rgpd: (el) => el.checked,
    };
    const revisar = (nombre) => {
      const el = fc.elements[nombre];
      const bien = reglas[nombre](el);
      el.setAttribute('aria-invalid', String(!bien));
      const err = $(`[data-error-c="${nombre}"]`, fc);
      if (err) err.hidden = bien;
      return bien;
    };
    Object.keys(reglas).forEach((n) => fc.elements[n].addEventListener('change', () => revisar(n)));
    fc.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fallos = Object.keys(reglas).filter((n) => !revisar(n));
      if (fallos.length) { fc.elements[fallos[0]].focus(); return; }
      const boton = fc.querySelector('[type="submit"]');
      const fallo = $('[data-form-fallo]', fc);
      boton.disabled = true;
      if (fc.dataset.envio) {
        try {
          const r = await fetch(fc.dataset.envio, { method: 'POST', body: new FormData(fc), credentials: 'same-origin' });
          const j = await r.json();
          if (!j.success) throw new Error('rechazado');
          if (fallo) fallo.hidden = true;
        } catch (err) {
          boton.disabled = false;
          if (fallo) { fallo.hidden = false; fallo.focus(); }
          return;
        }
      }
      if (ok) { ok.hidden = false; }
    });
  }

  /* ---------- Equipo docente: un profesor cada vez; pasa solo hasta que eliges uno ----------
     Cuatro compases (12,8 s). Se para con el ratón encima, con el foco dentro, fuera de
     pantalla y con movimiento reducido. Flechas, Inicio y Fin como en cualquier pestaña. */
  $$('[data-pestas]').forEach((lista) => {
    const tabs = $$('[role="tab"]', lista);
    const paneles = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    let fijo = false, encima = false, visible = false;
    const elegir = (i, foco = false) => {
      tabs.forEach((t, j) => {
        const si = j === i;
        t.setAttribute('aria-selected', String(si));
        t.tabIndex = si ? 0 : -1;
        if (paneles[j]) paneles[j].hidden = !si;
      });
      if (foco) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { fijo = true; elegir(i); });
      t.addEventListener('keydown', (e) => {
        const n = tabs.length;
        const k = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
        if (k === undefined) return;
        e.preventDefault(); fijo = true; elegir(k % n, true);
      });
    });
    elegir(0);
    const zona = lista.closest('section');
    zona.addEventListener('pointerenter', () => { encima = true; });
    zona.addEventListener('pointerleave', () => { encima = false; });
    zona.addEventListener('focusin', () => { encima = true; });
    zona.addEventListener('focusout', () => { encima = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .3 }).observe(zona);
    setInterval(() => {
      if (fijo || encima || !visible || captura || reducido.matches || document.hidden) return;
      const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      elegir((i + 1) % tabs.length);
    }, 12800);
  });

  /* ---------- Tiras de fotos (data-carril): avanzan solas cada dos compases ---------- */
  $$('[data-carril]').forEach((carril) => {
    if (document.body.classList.contains('inicio') && carril.closest('.profes')) return; // la home ya lo hace en secciones.js
    const pista = $('.carril__pista', carril);
    if (!pista) return;
    let parado = false, visible = false, t = 0;
    const parar = () => { parado = true; clearTimeout(t); };
    const seguir = () => { clearTimeout(t); t = setTimeout(() => { parado = false; }, 2400); };
    ['pointerenter', 'focusin', 'pointerdown', 'wheel'].forEach((ev) => carril.addEventListener(ev, parar, { passive: true }));
    ['pointerleave', 'focusout', 'pointerup'].forEach((ev) => carril.addEventListener(ev, seguir, { passive: true }));
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .4 }).observe(carril);
    setInterval(() => {
      if (parado || !visible || captura || reducido.matches || document.hidden) return;
      const max = carril.scrollWidth - carril.clientWidth;
      if (max <= 4) return;
      const paso = pista.firstElementChild.offsetWidth + (parseFloat(getComputedStyle(pista).columnGap) || 0);
      if (carril.scrollLeft >= max - 4) carril.scrollTo({ left: 0, behavior: 'smooth' });
      else carril.scrollBy({ left: paso, behavior: 'smooth' });
    }, 6400);
  });

  /* ---------- Contacto: llega con el curso elegido (?instrumento=Armonía online) ---------- */
  const sel = $('#c-inst');
  const qi = new URLSearchParams(location.search).get('instrumento');
  if (sel && qi) { const o = [...sel.options].find((x) => x.text === qi); if (o) sel.value = o.value; }

  /* ---------- Aviso de cookies: aceptar y rechazar al mismo nivel; se puede cambiar después ----------
     La elección se guarda en el navegador. En WordPress, Google Analytics solo se carga si es «aceptadas». */
  const avisoC = $('[data-cookies]');
  if (avisoC) {
    const CLAVE = 'rsm-cookies';
    const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
    const estado = $$('[data-cookies-estado]');
    const pintarEstado = () => estado.forEach((e) => { e.textContent = { aceptadas: 'analíticas aceptadas', rechazadas: 'analíticas rechazadas' }[leer()] || 'sin elegir'; });
    const abrir = (si) => { avisoC.hidden = !si; document.body.classList.toggle('cookies-abierto', si); };
    /* Google Analytics 4: solo con el código puesto en «Datos de la escuela» y las analíticas aceptadas */
    const GA = (window.RSM && /^G-[A-Z0-9]+$/.test(window.RSM.ga4 || '')) ? window.RSM.ga4 : '';
    let gaCargado = false;
    const cargarGA = () => {
      if (!GA || captura) return;
      window['ga-disable-' + GA] = false;
      if (gaCargado) return;
      gaCargado = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA);
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
      document.head.appendChild(s);
    };
    const guardar = (v) => {
      try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: no se recuerda */ }
      if (v === 'aceptadas') cargarGA(); else if (GA) window['ga-disable-' + GA] = true;
      abrir(false); pintarEstado();
    };
    if (leer() === 'aceptadas') cargarGA();
    $('[data-cookies-aceptar]', avisoC).addEventListener('click', () => guardar('aceptadas'));
    $('[data-cookies-rechazar]', avisoC).addEventListener('click', () => guardar('rechazadas'));
    $$('[data-cookies-abrir]').forEach((b) => b.addEventListener('click', () => { abrir(true); $('[data-cookies-aceptar]', avisoC).focus(); }));
    pintarEstado();
    if (!leer() && !captura) abrir(true);
  }

  /* ---------- LED de las listas: se encienden al entrar (la clase la pone main.js) ---------- */
  if (captura || reducido.matches) $$('.leds').forEach((l) => l.classList.add('visto'));
})();
