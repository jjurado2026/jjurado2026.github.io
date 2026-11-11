/* Krexer Asesores — homepage. JavaScript puro, sin dependencias.
   «quieto» (reducir movimiento o ?ss): nada se mueve solo y todo queda a la vista. */
(() => {
  'use strict';
  const d = document;
  const html = d.documentElement;
  const quieto = html.classList.contains('quieto');
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const conRaton = () => matchMedia('(hover: hover)').matches;
  window.KREXER = true;

  /* Vigía: los bucles solo corren mientras su bloque se ve */
  const vigilados = new Map();
  const vigia = new IntersectionObserver((es) => es.forEach((e) => {
    const fn = vigilados.get(e.target);
    if (fn) fn(e.isIntersecting);
  }), { threshold: 0.15 });
  const enPantalla = (el, fn) => { if (!el) return; vigilados.set(el, fn); vigia.observe(el); };

  /* ─── Partir en palabras (titulares, subtítulos y la frase del formulario) ─── */
  const partir = (el, cuenta = { i: 0 }, elementosEnteros = false) => {
    const nodos = [...el.childNodes];
    el.textContent = '';
    let ultima = null;
    for (const n of nodos) {
      if (n.nodeType === 3) {
        for (const t of n.textContent.split(/(\s+)/)) {
          if (!t) continue;
          if (/^\s+$/.test(t)) { el.append(' '); ultima = null; continue; }
          const s = d.createElement('span');
          s.className = 'pal';
          s.style.setProperty('--i', cuenta.i++);
          s.textContent = t;
          el.append(s);
          ultima = s;
        }
      } else if (n.nodeType === 1 && n.classList.contains('punto')) {
        (ultima || el).append(n);
      } else if (n.nodeType === 1 && elementosEnteros) {
        n.classList.add('pal');
        n.style.setProperty('--i', cuenta.i++);
        el.append(n);
        ultima = null;
      } else if (n.nodeType === 1) {
        partir(n, cuenta);
        el.append(n);
        ultima = null;
      }
    }
  };
  $$('[data-titulo], [data-sub]').forEach((el) => partir(el));
  $$('[data-escribe]').forEach((el) => partir(el, { i: 0 }, true));

  /* «El corte»: la línea diagonal de la K barre el titular y va destapando sus palabras */
  const DURA_CORTE = 1000;
  const preparaCorte = (t) => {
    const corte = d.createElement('span');
    corte.className = 'corte';
    corte.setAttribute('aria-hidden', 'true');
    t.append(corte);
  };
  const barre = (t) => {
    const r = t.getBoundingClientRect();
    const total = r.width + r.height * 0.87;
    $$('.pal', t).forEach((p) => {
      const q = p.getBoundingClientRect();
      const avance = ((q.left - r.left) + (q.top - r.top) * 0.87) / total;
      p.style.setProperty('--d', `${Math.round(avance * DURA_CORTE * 0.8)}ms`);
    });
    t.style.setProperty('--fin', `${Math.round(r.width + 40)}px`);
    t.classList.remove('barre');
    void t.offsetWidth;
    t.classList.add('barre');
  };
  $$('[data-titulo]').forEach(preparaCorte);

  const revela = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const t = e.target;
    if (t.matches('[data-titulo]') && !quieto) barre(t);
    t.classList.add('visto');
    revela.unobserve(t);
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  $$('[data-titulo]:not(.hero__titulo), [data-sub]:not(.hero__lead), [data-revela], [data-escribe]').forEach((el) => revela.observe(el));
  // Al pasar el cursor por un titular de sección, la línea vuelve a barrerlo
  $$('.seccion [data-titulo], .llamada [data-titulo]').forEach((t) => {
    let ultima = 0;
    t.addEventListener('pointerenter', (e) => {
      if (quieto || e.pointerType !== 'mouse' || !t.classList.contains('visto') || Date.now() - ultima < 2200) return;
      ultima = Date.now();
      t.classList.remove('barre');
      void t.offsetWidth;
      t.classList.add('barre');
    });
  });

  /* ─── Cabecera: la línea de abajo aparece en cuanto se baja ─── */
  const cab = $('[data-cab]');
  const hamb = $('.hamburguesa');
  const menuMovil = $('#menu-movil');
  const sombra = () => cab.classList.toggle('con-sombra', scrollY > 8);
  addEventListener('scroll', sombra, { passive: true });
  sombra();

  const cierraMenu = () => {
    hamb.setAttribute('aria-expanded', 'false');
    hamb.setAttribute('aria-label', 'Abrir el menú');
    menuMovil.hidden = true;
    sombra();
  };
  hamb.addEventListener('click', () => {
    if (hamb.getAttribute('aria-expanded') === 'true') return cierraMenu();
    hamb.setAttribute('aria-expanded', 'true');
    hamb.setAttribute('aria-label', 'Cerrar el menú');
    $$('li', menuMovil).forEach((li, i) => li.style.setProperty('--i', i));
    menuMovil.hidden = false;
    sombra();
  });
  menuMovil.addEventListener('click', (e) => { if (e.target.closest('a')) cierraMenu(); });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menuMovil.hidden) { cierraMenu(); hamb.focus(); } });

  /* ─── Hero: los listones del equipo suben por su carril, el filo se dibuja y el titular sale de su máscara (en CSS) ─── */
  const hero = $('[data-hero]');
  const h1 = $('.hero__titulo');
  const arrancaHero = () => {
    hero.classList.add('listo');
    h1.classList.add('visto');
  };
  const listoFuentes = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, espera(1200)]) : espera(200);
  listoFuentes.then(() => requestAnimationFrame(arrancaHero));

  /* Al bajar, los listones se entreabren: el primero sigue pegado al filo y cada uno se aparta un poco más, en perpendicular
     a la diagonal. Las juntas caen entre personas. Con el ratón se entreabren apenas, más cuanto más cerca de la foto */
  const marco = $('[data-marco]');
  if (marco && !quieto) {
    const listones = $$('.hero__liston', marco);
    const texto = $('.hero__texto', marco);
    const foto = $('.hero__foto', marco);
    const PX = 0.7547, PY = -0.6561;   // perpendicular al filo de 41°, hacia arriba a la derecha
    const ratonFino = matchMedia('(hover: hover) and (pointer: fine)');
    const estrecho = matchMedia('(max-width: 899.98px), (max-aspect-ratio: 1/1)');   // en móvil la foto es más baja y el recorrido, más corto
    let p = 0, rx = 0, rObjetivo = 0, visible = true, pedido = false, izq = 0;
    const pinta = () => {
      pedido = false;
      rx += (rObjetivo - rx) * 0.1;
      const paso = estrecho.matches ? 12 : 20;   // juntas finas: se nota que son listones sin tapar a nadie
      listones.forEach((l, k) => {
        const a = p * k * paso + rx * k * 3;
        l.style.translate = a ? `${(PX * a).toFixed(1)}px ${(PY * a).toFixed(1)}px` : '';
      });
      texto.style.translate = p ? `0 ${(-p * 70).toFixed(1)}px` : '';
      if (visible && Math.abs(rObjetivo - rx) > 0.002) pide();
    };
    const pide = () => { if (!pedido) { pedido = true; requestAnimationFrame(pinta); } };
    const mide = () => { p = Math.min(1, Math.max(0, scrollY / marco.offsetHeight)); };
    addEventListener('scroll', () => { if (visible) { mide(); pide(); } }, { passive: true });
    marco.addEventListener('pointerenter', () => { izq = foto.getBoundingClientRect().left; });
    marco.addEventListener('pointermove', (e) => {
      if (!ratonFino.matches || e.pointerType !== 'mouse') return;
      rObjetivo = Math.min(1, Math.max(0, (e.clientX - izq) / (innerWidth - izq)));
      pide();
    });
    marco.addEventListener('pointerleave', () => { rObjetivo = 0; pide(); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { mide(); pide(); } }).observe(marco);
  }

  /* ─── Valores: los pictogramas hacen su gesto por turnos ─── */
  const valores = $$('.valor');
  const gesto = (li) => { li.classList.remove('gesto'); void li.offsetWidth; li.classList.add('gesto'); };
  valores.forEach((li) => li.addEventListener('pointerenter', () => gesto(li)));
  if (!quieto && valores.length) {
    let v = 0;
    let reloj2 = null;
    enPantalla($('[data-ola]'), (si) => {
      clearInterval(reloj2);
      if (!si) return;
      reloj2 = setInterval(() => {
        if ($('[data-ola]').matches(':hover')) return;
        gesto(valores[v]);
        v = (v + 1) % valores.length;
      }, 1500);
    });
  }

  /* ─── Soluciones: «el dato» recorre la tubería de pasos de cada proceso ─── */
  const procesos = $$('[data-proceso]');
  const motores = procesos.map((card, n) => {
    const tuberia = $('.tuberia', card);
    const via = $('.tuberia__via', tuberia);
    const hecho = $('.tuberia__hecho', tuberia);
    const pasos = $$('.tuberia__pasos li', tuberia);
    const nodos = pasos.map((p) => $('.tuberia__nodo', p));
    const dato = $('.tuberia__dato', tuberia);
    let i = -1;
    let reloj3 = null;
    const centro = (nodo) => {
      const a = tuberia.getBoundingClientRect();
      const b = nodo.getBoundingClientRect();
      return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2 };
    };
    const traza = () => {
      const p0 = centro(nodos[0]);
      const p1 = centro(nodos[nodos.length - 1]);
      const vertical = Math.abs(p1.x - p0.x) < 4;
      via.classList.toggle('es-vertical', vertical);
      via.style.left = `${(vertical ? p0.x - 1 : p0.x)}px`;
      via.style.top = `${(vertical ? p0.y : p0.y - 1)}px`;
      via.style.width = vertical ? '2px' : `${p1.x - p0.x}px`;
      via.style.height = vertical ? `${p1.y - p0.y}px` : '2px';
    };
    const coloca = (k, sin) => {
      const c = centro(nodos[k]);
      if (sin) dato.style.transition = 'none';
      dato.style.transform = `translate(${c.x - 9}px, ${c.y - 9}px)`;
      if (sin) { void dato.offsetWidth; dato.style.transition = ''; }
      hecho.style.setProperty('--p', (k / (nodos.length - 1)).toFixed(3));
    };
    const avanza = () => {
      i++;
      if (i >= pasos.length) {
        dato.classList.remove('va');
        reloj3 = setTimeout(() => {
          pasos.forEach((p) => p.classList.remove('en', 'hecho'));
          hecho.style.setProperty('--p', 0);
          i = -1;
          reloj3 = setTimeout(avanza, 600);
        }, 600);
        return;
      }
      pasos.forEach((p, k) => { p.classList.toggle('en', k === i); p.classList.toggle('hecho', k <= i); });
      coloca(i, i === 0);
      dato.classList.add('va');
      reloj3 = setTimeout(avanza, i === pasos.length - 1 ? 2400 : 1500);
    };
    traza();
    addEventListener('resize', () => { traza(); if (i >= 0 && i < nodos.length) coloca(i, true); });
    if (quieto) pasos.forEach((p) => p.classList.add('hecho'));
    return {
      para: () => { clearTimeout(reloj3); reloj3 = null; },
      sigue: () => { if (!reloj3) reloj3 = setTimeout(avanza, 300 + n * 600); },
      traza,
    };
  });
  if (!quieto) enPantalla($('.procesos'), (si) => motores.forEach((m) => (si ? m.sigue() : m.para())));
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => motores.forEach((m) => m.traza()));

  /* Carril del móvil: flechas y barra */
  $$('[data-carril]').forEach((carril) => {
    const pista = $('[data-pista]', carril);
    const ant = $('[data-ant]', carril);
    const sig = $('[data-sig]', carril);
    const barra = $('.carril__barra', carril);
    if (!pista || !ant || !sig || !barra) return;   // la cinta del hero también es [data-carril], pero sin flechas
    const tarjeta =() => (pista.firstElementChild ? pista.firstElementChild.offsetWidth + 12 : 300);
    const pinta = () => {
      const max = pista.scrollWidth - pista.clientWidth;
      const p = max > 0 ? (pista.scrollLeft + pista.clientWidth) / pista.scrollWidth : 1;
      barra.style.setProperty('--p', p.toFixed(3));
      ant.disabled = pista.scrollLeft < 4;
      sig.disabled = pista.scrollLeft > max - 4;
    };
    ant.addEventListener('click', () => pista.scrollBy({ left: -tarjeta(), behavior: quieto ? 'auto' : 'smooth' }));
    sig.addEventListener('click', () => pista.scrollBy({ left: tarjeta(), behavior: quieto ? 'auto' : 'smooth' }));
    pista.addEventListener('scroll', pinta, { passive: true });
    addEventListener('resize', pinta);
    pinta();
  });

  /* ─── Franquicias: su K en el centro y la red de franquicias que crece hacia los dos lados ─── */
  const red = $('[data-red]');
  if (red) {
    const estrecho = matchMedia('(max-width: 599.98px)');
    const monta = () => {
      const radio = estrecho.matches ? 5 : 8;
      const cols = radio * 2 + 1;
      const piezas = [];
      for (let f = 0; f < 3; f++) {
        for (let c = 0; c < cols; c++) {
          const o = Math.abs(c - radio) + Math.abs(f - 1);
          piezas.push(o === 0
            ? '<span class="red__origen"><svg viewBox="0 0 672 672"><use href="#k-logo"/></svg></span>'
            : o > radio ? '<span class="red__vacio"></span>' : `<span style="--o:${o}"><i></i></span>`);
        }
      }
      red.style.setProperty('--red-cols', cols);
      red.innerHTML = piezas.join('');
    };
    monta();
    estrecho.addEventListener('change', monta);
    if (quieto) {
      red.classList.add('crece');
    } else {
      let vivo = false;
      const ciclo = async () => {
        while (vivo) {
          red.classList.remove('apaga');
          red.classList.add('crece');
          await espera(3600);
          if (!vivo) break;
          red.classList.add('apaga');
          await espera(1000);
          red.classList.remove('crece');
          await espera(700);
        }
        red.classList.remove('apaga');
      };
      enPantalla(red, (si) => { if (si && !vivo) { vivo = true; ciclo(); } else if (!si) vivo = false; });
    }
  }

  /* ─── Modelos: la baraja de fotos ─── */
  const baraja = $('[data-baraja]');
  if (baraja) {
    const tabs = $$('[role="tab"]', baraja);
    const textos = tabs.map((t) => d.getElementById(t.getAttribute('aria-controls')));
    const cartas = $$('[data-carta]', baraja);
    const mazo = $('[data-cartas]', baraja);
    const n = tabs.length;
    const DURA = 7000;
    let actual = 0;
    let anim = null;
    let visible = false;
    let encima = false;
    textos.forEach((t, k) => { t.hidden = false; t.inert = k !== 0; });
    const posiciones = (k) => cartas.forEach((c, j) => {
      const pos = (j - k + n) % n;
      c.classList.remove('pos-0', 'pos-1', 'pos-2');
      c.classList.add(`pos-${pos}`);
    });
    const tiempo = () => {
      if (anim) anim.cancel();
      if (quieto) return;
      const barra = $('.caso__tiempo span', tabs[actual]);
      anim = barra.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DURA, fill: 'forwards' });
      anim.onfinish = () => elegir((actual + 1) % n);
      if (!visible || encima) anim.pause();
    };
    const elegir = (k, foco = false) => {
      if (k === actual) { tiempo(); return; }
      const carta = cartas[k];
      // La foto elegida sale del mazo por la izquierda y se pone delante; las demás retroceden
      if (!quieto) {
        const desde = getComputedStyle(carta).transform;
        carta.style.zIndex = '1';
        const a = carta.animate([
          { transform: desde === 'none' ? 'none' : desde },
          { transform: 'translate(-46%, 4%) rotate(-11deg) scale(.95)', offset: 0.45 },
          { transform: 'none' },
        ], { duration: 1050, easing: 'cubic-bezier(.45, 0, .2, 1)' });
        setTimeout(() => { carta.style.zIndex = '5'; }, 470);
        a.onfinish = () => { carta.style.zIndex = ''; };
      }
      posiciones(k);
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === k));
        t.tabIndex = j === k ? 0 : -1;
        if (j !== k) $('.caso__tiempo span', t).getAnimations().forEach((x) => x.cancel());
      });
      textos.forEach((t, j) => { t.classList.toggle('es-activo', j === k); t.inert = j !== k; });
      actual = k;
      if (foco) tabs[k].focus();
      tiempo();
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => elegir(k));
      t.addEventListener('keydown', (e) => {
        const mapa = { ArrowDown: 1, ArrowRight: 1, ArrowUp: n - 1, ArrowLeft: n - 1 };
        if (mapa[e.key]) { e.preventDefault(); elegir((actual + mapa[e.key]) % n, true); }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); elegir(e.key === 'Home' ? 0 : n - 1, true); }
      });
    });
    // Arrastrar la foto de delante: a la izquierda pasa a la siguiente, a la derecha vuelve a la anterior
    let arrastre = null;
    mazo.addEventListener('pointerdown', (e) => {
      const frente = e.target.closest('.carta.pos-0');
      if (!frente) return;
      arrastre = { x0: e.clientX, carta: frente, dx: 0 };
      frente.setPointerCapture(e.pointerId);
      frente.classList.add('arrastra');
      if (anim) anim.pause();
    });
    mazo.addEventListener('pointermove', (e) => {
      if (!arrastre) return;
      arrastre.dx = e.clientX - arrastre.x0;
      arrastre.carta.style.transform = `translateX(${arrastre.dx}px) rotate(${arrastre.dx / 22}deg)`;
    });
    const suelta = () => {
      if (!arrastre) return;
      const { carta, dx } = arrastre;
      arrastre = null;
      carta.classList.remove('arrastra');
      carta.style.transform = '';
      if (dx < -70) elegir((actual + 1) % n);
      else if (dx > 70) elegir((actual + n - 1) % n);
      else if (anim && visible && !encima) anim.play();
    };
    mazo.addEventListener('pointerup', suelta);
    mazo.addEventListener('pointercancel', suelta);
    const ajusta = () => { if (!anim) return; if (visible && !encima) anim.play(); else anim.pause(); };
    baraja.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { encima = true; ajusta(); } });
    baraja.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { encima = false; ajusta(); } });
    baraja.addEventListener('focusin', () => { encima = true; ajusta(); });
    baraja.addEventListener('focusout', (e) => { if (!baraja.contains(e.relatedTarget)) { encima = false; ajusta(); } });
    enPantalla(baraja, (si) => { visible = si; if (si && !anim) tiempo(); ajusta(); });
  }

  /* ─── Llamada: la K se monta pieza a pieza al llegar; su brazo se abre solo con el cursor sobre la propia K ─── */
  const granK = $('[data-gran-k]');
  if (granK) {
    if (quieto) {
      granK.classList.add('armada');
    } else {
      const obs = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return;
        granK.classList.add('armada');
        obs.disconnect();
      }, { threshold: 0.35 });
      obs.observe(granK);
      granK.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') granK.classList.add('abre'); });
      granK.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') granK.classList.remove('abre'); });
      granK.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') granK.classList.toggle('abre'); });
    }
  }

  /* ─── Nos caracteriza: las fichas se dan la vuelta ─── */
  const rasgos = $$('.rasgo');
  let olaRasgos = true;
  rasgos.forEach((r) => r.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    olaRasgos = false;
    const abierta = r.dataset.abierta === '1';
    r.dataset.abierta = abierta ? '0' : '1';
    r.classList.toggle('gira', !abierta);
  }));
  if (!quieto && rasgos.length) {
    const obs = new IntersectionObserver(async (es) => {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      for (const r of rasgos) { if (!olaRasgos) return; r.classList.add('gira'); await espera(260); }
      await espera(900);
      for (const r of rasgos) { if (!olaRasgos) return; r.classList.remove('gira'); await espera(200); }
    }, { threshold: 0.5 });
    obs.observe($('.rasgos'));
  }

  /* Textura de hormigón: se pide cuando su sección se acerca */
  const cercania = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('cerca');
    cercania.unobserve(e.target);
  }), { rootMargin: '900px 0px' });
  $$('.seccion--hormigon').forEach((s) => cercania.observe(s));

  /* ─── Preguntas frecuentes: buscador ─── */
  const buscador = $('[data-buscador]');
  if (buscador) {
    const campo = $('.buscador__campo', buscador);
    const input = $('[data-busca]', buscador);
    const tecleo = $('[data-tecleo]', buscador);
    const preguntas = $$('.pregunta', buscador);
    const respuestas = $$('[data-respuesta]', buscador);
    const vacio = $('[data-vacio]', buscador);
    const der = $('.buscador__der', buscador);
    const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const textos = new Map(preguntas.map((p) => [p, p.textContent]));
    let activa = 'laboral';
    preguntas[0].classList.add('es-activa');
    preguntas.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.r === activa)));
    const muestra = (r, desdeUsuario = true) => {
      if (r === activa) return;
      activa = r;
      preguntas.forEach((p) => { p.classList.toggle('es-activa', p.dataset.r === r); p.setAttribute('aria-pressed', String(p.dataset.r === r)); });
      respuestas.forEach((a) => {
        const es = a.dataset.respuesta === r;
        a.hidden = !es;
        a.classList.toggle('es-activa', es);
        if (es) { a.classList.remove('entra'); void a.offsetWidth; a.classList.add('entra'); }
      });
      // En el móvil la respuesta queda debajo: se trae a la vista
      if (desdeUsuario && matchMedia('(max-width: 959.98px)').matches) {
        const r2 = der.getBoundingClientRect();
        if (r2.top > innerHeight - 120 || r2.bottom < 80) der.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'center' });
      }
    };
    preguntas.forEach((p) => p.addEventListener('click', () => muestra(p.dataset.r)));
    const marca = (p, terminos) => {
      const t = textos.get(p);
      if (!terminos.length) { p.textContent = t; return; }
      const base = sinAcentos(t);
      const tramos = [];
      terminos.forEach((w) => {
        let k = base.indexOf(w);
        while (k !== -1) { tramos.push([k, k + w.length]); k = base.indexOf(w, k + w.length); }
      });
      tramos.sort((a, b) => a[0] - b[0]);
      p.textContent = '';
      let pos = 0;
      for (const [a, b] of tramos) {
        if (a < pos) continue;
        p.append(t.slice(pos, a));
        const m = d.createElement('mark');
        m.textContent = t.slice(a, b);
        p.append(m);
        pos = b;
      }
      p.append(t.slice(pos));
    };
    const filtra = () => {
      const q = sinAcentos(input.value.trim());
      campo.classList.toggle('con-texto', q.length > 0);
      const terminos = q.split(/\s+/).filter((w) => w.length > 1);
      let primera = null;
      preguntas.forEach((p) => {
        const heno = sinAcentos(`${textos.get(p)} ${p.dataset.claves}`);
        const vale = !terminos.length || terminos.every((w) => heno.includes(w));
        p.parentElement.hidden = !vale;
        marca(p, vale ? terminos : []);
        if (vale && !primera) primera = p;
      });
      vacio.hidden = !!primera;
      if (primera && terminos.length) muestra(primera.dataset.r, false);
    };
    input.addEventListener('input', filtra);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { const p = preguntas.find((x) => !x.parentElement.hidden); if (p) { e.preventDefault(); p.focus(); } }
      if (e.key === 'Enter') { e.preventDefault(); const p = preguntas.find((x) => !x.parentElement.hidden); if (p) muestra(p.dataset.r); }
    });
    buscador.addEventListener('keydown', (e) => {
      if (!e.target.classList.contains('pregunta') || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const vis = preguntas.filter((x) => !x.parentElement.hidden);
      const k = vis.indexOf(e.target) + (e.key === 'ArrowDown' ? 1 : -1);
      e.preventDefault();
      if (k < 0) input.focus(); else if (vis[k]) vis[k].focus();
    });
    // El buscador teclea solo lo que se puede buscar, mientras está vacío
    const EJEMPLOS = ['nóminas', 'impuestos', 'contabilidad', 'emprender', 'pymes'];
    if (quieto) {
      tecleo.textContent = 'Busca: nóminas, impuestos…';
    } else {
      let vivo = false;
      const escribe = async () => {
        let k = 0;
        while (vivo) {
          const palabra = `Busca: ${EJEMPLOS[k % EJEMPLOS.length]}`;
          for (let c = 7; c <= palabra.length && vivo; c++) { tecleo.textContent = palabra.slice(0, c); await espera(c === 7 ? 260 : 85); }
          await espera(1500);
          for (let c = palabra.length; c >= 7 && vivo; c--) { tecleo.textContent = palabra.slice(0, c); await espera(35); }
          k++;
        }
      };
      tecleo.textContent = 'Busca: ';
      enPantalla(buscador, (si) => { if (si && !vivo) { vivo = true; escribe(); } else if (!si) vivo = false; });
    }
  }

  /* ─── Contacto: la frase que se rellena ─── */
  const frase = $('[data-frase]');
  if (frase) {
    const mensaje = $('[data-mensaje]', frase);
    const email = frase.elements.email;
    const priv = frase.elements.privacidad;
    const gracias = $('[data-gracias]', frase);
    const errEmail = d.getElementById('err-email');
    const errPriv = d.getElementById('err-priv');
    // Cada hueco crece con lo que se escribe
    const ajustes = $$('.hueco input', frase).map((inp) => {
      const medida = d.createElement('span');
      medida.className = 'hueco__medida';
      medida.setAttribute('aria-hidden', 'true');
      inp.after(medida);
      const ajusta = () => {
        medida.textContent = inp.value || inp.placeholder;
        inp.style.width = `${Math.ceil(medida.offsetWidth) + 6}px`;
        inp.closest('.hueco').classList.toggle('lleno', inp.value.trim().length > 0);
      };
      inp.addEventListener('input', ajusta);
      ajusta();
      return ajusta;
    });
    addEventListener('resize', () => ajustes.forEach((f) => f()));
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => ajustes.forEach((f) => f()));
    mensaje.addEventListener('input', () => mensaje.closest('.hueco').classList.toggle('lleno', mensaje.value.trim().length > 0));
    // Cualquier «Contacta» de un servicio deja escrito el interés
    d.addEventListener('click', (e) => {
      const a = e.target.closest('[data-interes]');
      if (!a || !a.dataset.interes) return;
      const ahora = mensaje.value.trim();
      if (!ahora || /^Me interesa:/.test(ahora)) {
        mensaje.value = `Me interesa: ${a.dataset.interes}. `;
        mensaje.closest('.hueco').classList.add('lleno');
      }
    });
    const mal = (campo, err, texto) => {
      err.textContent = texto;
      const caja = campo.closest('.hueco') || campo.closest('.acepto');
      if (!caja) return;
      caja.classList.toggle('mal', !!texto);
      if (texto) { caja.classList.remove('tiembla'); void caja.offsetWidth; caja.classList.add('tiembla'); }
      campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
    };
    email.addEventListener('input', () => mal(email, errEmail, ''));
    priv.addEventListener('change', () => mal(priv, errPriv, ''));
    frase.addEventListener('submit', (e) => {
      e.preventDefault();
      let primero = null;
      const v = email.value.trim();
      if (!v) { mal(email, errEmail, 'Falta tu email: escríbelo en el hueco subrayado para que podamos responderte.'); primero = email; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { mal(email, errEmail, 'Revisa tu email: le falta algo (por ejemplo, nombre@empresa.es).'); primero = email; }
      if (!priv.checked) { mal(priv, errPriv, 'Marca la casilla de protección de datos para poder enviarlo.'); primero = primero || priv; }
      if (primero) { primero.focus(); return; }
      const f = frase.elements;
      const nombre = f.nombre.value.trim();
      const cuerpo = [`Nombre: ${nombre}`, `Email: ${v}`, `Teléfono: ${f.telefono.value.trim()}`, '', f.mensaje.value.trim()].join('\n');
      $('[data-quien]', gracias).textContent = nombre ? `, ${nombre}` : '';
      frase.classList.add('enviada');
      gracias.hidden = false;
      gracias.focus();
      location.href = `mailto:krexer@krexer.com?subject=${encodeURIComponent('Solicitud de contacto desde la web')}&body=${encodeURIComponent(cuerpo)}`;
    });
    $('[data-otra]', frase).addEventListener('click', () => {
      frase.reset();
      $$('.hueco', frase).forEach((h) => h.classList.remove('lleno', 'mal'));
      ajustes.forEach((f) => f());
      frase.classList.remove('enviada');
      gracias.hidden = true;
      frase.elements.nombre.focus();
    });
  }
})();
