/* LIT · landing v2 — interacción y movimiento.
   Todo vive dentro de #lp2 y usa el prefijo lp2- para no chocar con el tema de Shopify.
   Los datos de producto (variantes, precios, galería) llegan en el bloque JSON #lp2-data.
   Solo se animan transform y opacity. Sin GSAP o con movimiento reducido, todo queda
   visible y funcional. */
(() => {
  'use strict';

  const d = document;
  const lp2 = d.getElementById('lp2');
  if (!lp2) return;
  const $ = (s, c = lp2) => c.querySelector(s);
  const $$ = (s, c = lp2) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SS = /[?&]ss\b/.test(location.search); // modo captura: estado final, sin vídeo
  const isMobile = () => matchMedia('(max-width: 767px)').matches;

  /* ------------------------------------------------------------------
     Datos (variantes, precios en céntimos, galería por sabor)
     ------------------------------------------------------------------ */
  let DATA = null;
  try { DATA = JSON.parse($('#lp2-data').textContent); } catch (e) { DATA = null; }

  const SLOT_NAMES = ['Caja 1', 'Caja 2', 'Caja 3', 'Caja regalo'];
  const TXT = {
    note1: 'Cada caja incluye 30 sobres de 3,5 g. LIT Daily Hydration es una mezcla esencial de electrolitos que ayuda a combatir la fatiga, mejorar la concentración y mantener una hidratación constante a lo largo del día.',
    note4: 'El pack incluye 4 cajas de 30 sobres de 3,5 g: 120 sobres en total. Pagas 3 cajas y la cuarta es tu caja regalo.',
    det1: '30 sobres de 3,5 g por caja. Sin azúcar ni edulcorantes artificiales. Hecho en España.',
    det4: '4 cajas de 30 sobres de 3,5 g: 120 sobres en total. Eliges el sabor de cada caja. Sin azúcar ni edulcorantes artificiales. Hecho en España.',
    ingr: (aroma) => `Acidulante (ácido cítrico), cloruro de sodio, malato de magnesio, cloruro de potasio, aroma de ${aroma}, edulcorante (glucósidos de esteviol procedentes de estevia).`,
  };

  const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const fmt = (c) => money.format(c / 100);

  /* ------------------------------------------------------------------
     Odómetro: cada dígito es una columna 0-9 que se desplaza en Y
     ------------------------------------------------------------------ */
  function odometer(el) {
    let sig = null;
    const isDigit = (ch) => ch >= '0' && ch <= '9';
    function build(str) {
      el.textContent = '';
      for (const ch of str) {
        if (isDigit(ch)) {
          const col = d.createElement('span');
          col.className = 'lp2-odo__col';
          const strip = d.createElement('span');
          strip.className = 'lp2-odo__strip';
          for (let i = 0; i < 10; i++) {
            const n = d.createElement('span');
            n.textContent = i;
            strip.appendChild(n);
          }
          col.appendChild(strip);
          el.appendChild(col);
        } else {
          const c = d.createElement('span');
          c.className = 'lp2-odo__ch';
          c.textContent = ch === ' ' ? ' ' : ch;
          el.appendChild(c);
        }
      }
    }
    return {
      set(str, animate = true) {
        const s = [...str].map((ch) => (isDigit(ch) ? 'd' : ch)).join('');
        const rebuilt = s !== sig;
        if (rebuilt) { build(str); sig = s; }
        const strips = el.querySelectorAll('.lp2-odo__strip');
        let i = 0;
        for (const ch of str) {
          if (!isDigit(ch)) continue;
          const st = strips[i++];
          if (!animate || RM) { st.style.transition = 'none'; st.style.transform = `translateY(${-Number(ch) * 1.2}em)`; void st.offsetHeight; st.style.transition = ''; continue; }
          if (rebuilt) { st.style.transition = 'none'; st.style.transform = 'translateY(0)'; void st.offsetHeight; st.style.transition = ''; }
          st.style.transform = `translateY(${-Number(ch) * 1.2}em)`;
        }
      },
    };
  }

  /* ------------------------------------------------------------------
     Caja de compra (tres ofertas, como la versión B)
     ------------------------------------------------------------------ */
  function initBuy() {
    const form = $('[data-lp2-cart]');
    if (!form || !DATA) return null;
    const { flavors: FLAVORS, order: ORDER, pack: PACK, prices: PRICES } = DATA;
    const MAX_QTY = DATA.maxQty || 10;
    const OFFERS = {
      sub1: { pack: 1, plan: 'sub' },
      sub4: { pack: 4, plan: 'sub' },
      ot1: { pack: 1, plan: 'ot' },
    };
    const state = { flavor: ORDER[0], offer: 'sub1', qty: 1, slots: [ORDER[0], ORDER[0], ORDER[0], ORDER[0]], gi: 0 };

    const fId = form.elements.id;
    const fQty = form.elements.quantity;
    const fPlan = form.elements.selling_plan;
    const odo = odometer($('[data-lp2-odo]'));
    const totalSr = $('[data-lp2-total-sr]');
    const qtyOut = $('[data-lp2-qty-out]');
    const mix = $('[data-lp2-mix]');
    const mixSlots = $('#lp2-mix-slots');
    const mixToggle = $('[data-lp2-mix-toggle]');
    const mixSummary = $('[data-lp2-mix-summary]');
    const mixBoxes = $$('[data-lp2-mix-boxes] i');
    const stickThumb = $('[data-lp2-stick-thumb]');
    const cfgThumb = $('[data-lp2-cfg-thumb]');
    const freqs = { sub1: $('[data-lp2-freq="sub1"]'), sub4: $('[data-lp2-freq="sub4"]') };
    let firstRender = true;

    // Ranuras del pack (4 cajas)
    SLOT_NAMES.forEach((label, si) => {
      const fs = d.createElement('fieldset');
      fs.className = 'lp2-slot';
      fs.innerHTML = `<legend>${label}</legend><div class="lp2-slot__opts">${ORDER.map((k) => `
        <label class="lp2-opt" style="--fc:${FLAVORS[k].color}">
          <input type="radio" name="lp2-slot${si}" value="${k}"${k === state.flavor ? ' checked' : ''}>
          <span class="lp2-opt__box"><i></i>${FLAVORS[k].short}</span>
        </label>`).join('')}</div>`;
      mixSlots.appendChild(fs);
    });

    const offer = () => OFFERS[state.offer];
    const variant = () => {
      const o = offer();
      if (o.pack === 1) return FLAVORS[state.flavor][o.plan];
      const c = { lemon: 0, watermelon: 0, peach: 0 };
      state.slots.forEach((s) => c[s]++);
      return PACK[o.plan][`${c.lemon}-${c.watermelon}-${c.peach}`];
    };

    function render() {
      const f = FLAVORS[state.flavor];
      const o = offer();
      $$('[data-lp2-flavor-name]').forEach((el) => { el.textContent = f.name; });
      $('[data-lp2-gal-badge]').style.setProperty('--flavor', f.color);
      $$('[data-lp2-offer]').forEach((el) => el.classList.toggle('lp2-is-on', el.dataset.lp2Offer === state.offer));

      // Pack 3+1: mezcla de sabores
      mix.hidden = o.pack !== 4;
      const counts = {};
      state.slots.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
      const keys = Object.keys(counts);
      mixSummary.textContent = keys.length === 1
        ? `Las 4 cajas en ${FLAVORS[keys[0]].name}`
        : ORDER.filter((k) => counts[k]).map((k) => `${counts[k]} ${FLAVORS[k].name}`).join(' · ');
      mixBoxes.forEach((b, i) => b.style.setProperty('--c', FLAVORS[state.slots[i]].color));
      state.slots.forEach((s, i) => { const r = $(`input[name="lp2-slot${i}"][value="${s}"]`); if (r) r.checked = true; });

      // Textos que cambian con el pack o el sabor
      $('[data-lp2-box-note]').textContent = o.pack === 1 ? TXT.note1 : TXT.note4;
      $('[data-lp2-acc-details]').textContent = o.pack === 1 ? TXT.det1 : TXT.det4;
      const ingr = $('[data-lp2-acc-ingr]');
      if (o.pack === 1) ingr.textContent = TXT.ingr(f.aroma);
      else ingr.innerHTML = ORDER.map((k) => `<p><strong>${FLAVORS[k].name}:</strong> ${TXT.ingr(FLAVORS[k].aroma)}</p>`).join('');

      // Total y formulario
      const total = PRICES[o.pack][o.plan].now * state.qty;
      odo.set(fmt(total), !firstRender);
      firstRender = false;
      totalSr.textContent = fmt(total);
      qtyOut.textContent = state.qty;
      $('[data-lp2-qty="-1"]').disabled = state.qty <= 1;
      $('[data-lp2-qty="1"]').disabled = state.qty >= MAX_QTY;
      fId.value = variant();
      fQty.value = state.qty;
      fPlan.disabled = o.plan !== 'sub';
      if (o.plan === 'sub') fPlan.value = freqs[state.offer].value;
      if (stickThumb) stickThumb.src = f.sachet;
      if (cfgThumb) cfgThumb.src = f.gallery[0].thumb;
    }

    const setFlavor = (value, withFlip = true) => {
      if (!FLAVORS[value]) return;
      state.flavor = value;
      state.slots = [value, value, value, value];
      const r = $(`input[name="lp2-flavor"][value="${value}"]`);
      if (r) r.checked = true;
      render();
      gallery.reset(withFlip);
    };

    // Eventos
    $$('input[name="lp2-flavor"]').forEach((r) => r.addEventListener('change', () => setFlavor(r.value)));
    $$('input[name="lp2-offer"]').forEach((r) => r.addEventListener('change', () => { state.offer = r.value; render(); }));
    Object.entries(freqs).forEach(([key, sel]) => {
      const pickOffer = () => {
        if (state.offer === key) return;
        const r = $(`input[name="lp2-offer"][value="${key}"]`);
        r.checked = true;
        state.offer = key;
        render();
      };
      sel.addEventListener('focus', pickOffer);
      sel.addEventListener('change', () => { pickOffer(); render(); });
    });
    mixSlots.addEventListener('change', (e) => {
      const m = e.target.name && e.target.name.match(/^lp2-slot(\d)$/);
      if (!m) return;
      state.slots[Number(m[1])] = e.target.value;
      render();
    });
    mixToggle.addEventListener('click', () => {
      const open = mixSlots.hidden;
      mixSlots.hidden = !open;
      mixToggle.setAttribute('aria-expanded', String(open));
      mixToggle.textContent = open ? 'Listo' : 'Mezclar sabores';
    });
    $$('[data-lp2-qty]').forEach((b) => b.addEventListener('click', () => {
      state.qty = Math.min(MAX_QTY, Math.max(1, state.qty + Number(b.dataset.lp2Qty)));
      render();
    }));
    // Evento para analítica (GA4/Meta vía GTM): se lanza justo antes de ir al carrito
    form.addEventListener('submit', () => {
      render();
      const o = offer();
      lp2.dispatchEvent(new CustomEvent('lp2:add-to-cart', {
        bubbles: true,
        detail: {
          variantId: Number(fId.value),
          sellingPlanId: o.plan === 'sub' ? Number(fPlan.value) : null,
          quantity: state.qty,
          value: (PRICES[o.pack][o.plan].now * state.qty) / 100,
          currency: 'EUR',
          offer: state.offer,
          flavor: state.flavor,
        },
      }));
    });

    // Galería
    const gallery = (() => {
      const stage = $('.lp2-gal__stage');
      const flip = $('[data-lp2-gal-flip]');
      const img = $('[data-lp2-gal-img]');
      const thumbs = $('[data-lp2-gal-thumbs]');
      const count = $('[data-lp2-gal-count]');
      const list = () => FLAVORS[state.flavor].gallery;

      function drawThumbs() {
        thumbs.innerHTML = list().map((g, i) => `<button class="lp2-gal__thumb" type="button" aria-label="Ver imagen ${i + 1}: ${g.alt}" aria-current="${i === state.gi}" data-lp2-i="${i}"><img src="${g.thumb}" alt="" width="260" height="325" loading="lazy"></button>`).join('');
      }
      function load(src) {
        const pre = new Image();
        pre.src = src;
        return (pre.decode ? pre.decode() : Promise.resolve()).catch(() => {}).then(() => pre.src);
      }
      function show(i, mode) {
        const L = list();
        state.gi = (i + L.length) % L.length;
        const g = L[state.gi];
        $$('.lp2-gal__thumb', thumbs).forEach((t, k) => t.setAttribute('aria-current', String(k === state.gi)));
        if (count) count.textContent = `${state.gi + 1} / ${L.length}`;
        const swap = (src) => { img.src = src; img.alt = g.alt; };
        if (RM || !flip.animate) { load(g.src).then(swap); return; }
        if (mode === 'flip') {
          const out = flip.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }], { duration: 230, easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'forwards' });
          Promise.all([load(g.src), out.finished]).then(([src]) => {
            swap(src);
            flip.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0deg)' }], { duration: 640, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
          });
        } else if (mode) {
          const dir = mode === 'prev' ? -1 : 1;
          const out = img.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-dir * 24}px)` }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
          Promise.all([load(g.src), out.finished]).then(([src]) => {
            swap(src);
            img.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
          });
        } else {
          load(g.src).then(swap);
        }
      }
      thumbs.addEventListener('click', (e) => {
        const b = e.target.closest('.lp2-gal__thumb');
        if (b) show(Number(b.dataset.lp2I), Number(b.dataset.lp2I) < state.gi ? 'prev' : 'next');
      });
      $('[data-lp2-gal-prev]').addEventListener('click', () => show(state.gi - 1, 'prev'));
      $('[data-lp2-gal-next]').addEventListener('click', () => show(state.gi + 1, 'next'));
      let x0 = null;
      stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
      stage.addEventListener('pointerup', (e) => {
        if (x0 === null) return;
        const dx = e.clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 40) show(state.gi + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
      });
      drawThumbs();
      return {
        reset(withFlip) { state.gi = 0; drawThumbs(); show(0, withFlip ? 'flip' : null); },
      };
    })();

    // Precarga ligera de las fotos principales de los otros sabores
    const warm = () => ORDER.forEach((k) => { const i = new Image(); i.src = FLAVORS[k].gallery[0].src; });
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);

    render();

    // El bloque «Elige tu sabor» deja el sabor elegido aquí y baja a la compra
    return (value) => {
      setFlavor(value, false);
      const target = $('#ficha');
      if (target) target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    };
  }

  /* ------------------------------------------------------------------
     Elige tu sabor: botones «Elegir Salty …»
     ------------------------------------------------------------------ */
  function initFlavPick(pickFlavor) {
    if (!pickFlavor) return;
    $$('[data-lp2-pick]').forEach((b) => b.addEventListener('click', () => pickFlavor(b.dataset.lp2Pick)));
  }

  /* ------------------------------------------------------------------
     Vídeos: carga diferida, pausa accesible
     ------------------------------------------------------------------ */
  function initHeroVideo() {
    const v = $('.lp2-hero__video');
    if (!v || RM || SS) return;
    const start = () => {
      v.src = isMobile() ? v.dataset.lp2SrcM : v.dataset.lp2Src;
      v.addEventListener('canplay', () => { v.play().then(() => v.classList.add('lp2-is-ready')).catch(() => {}); }, { once: true });
      v.load();
    };
    if (d.readyState === 'complete') setTimeout(start, 150); else addEventListener('load', () => setTimeout(start, 150), { once: true });
  }

  function initToggles() {
    $$('[data-lp2-toggle-video]').forEach((btn) => {
      const v = $(btn.dataset.lp2ToggleVideo);
      if (!v) return;
      if (RM || SS) { btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Reproducir vídeo'); }
      btn.addEventListener('click', () => {
        const paused = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(paused));
        btn.setAttribute('aria-label', paused ? 'Reproducir vídeo' : 'Pausar vídeo');
        v.dataset.lp2UserPaused = paused ? '1' : '';
        if (paused) v.pause();
        else {
          if (!v.src && (v.dataset.lp2Src || v.dataset.lp2SrcM)) { v.src = isMobile() && v.dataset.lp2SrcM ? v.dataset.lp2SrcM : v.dataset.lp2Src; }
          v.play().then(() => v.classList.add('lp2-is-ready')).catch(() => {});
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Cómo tomarlo: pasos sincronizados con el vídeo
     ------------------------------------------------------------------ */
  function initHow() {
    const v = $('[data-lp2-how-video]');
    const steps = $$('[data-lp2-step]');
    if (!v || !steps.length) return;
    const SEG = [[0, 6.6], [6.6, 8.2], [8.2, 11.8], [11.8, 14.84]];
    const SEEK = [4.3, 6.6, 8.2, 11.8];
    const bars = steps.map((s) => $('.lp2-step__prog', s));
    let raf = 0;
    let active = 0;
    let loaded = false;

    const ensure = () => { if (!loaded) { v.src = v.dataset.lp2Src; loaded = true; } };
    function paint() {
      const t = v.currentTime;
      let idx = SEG.findIndex(([a, b]) => t >= a && t < b);
      if (idx < 0) idx = 3;
      if (idx !== active) { steps[active].classList.remove('lp2-is-active'); steps[idx].classList.add('lp2-is-active'); active = idx; }
      const [a, b] = SEG[idx];
      bars[idx].style.transform = `scaleX(${Math.min(1, Math.max(0, (t - a) / (b - a)))})`;
      bars.forEach((bar, i) => { if (i !== idx) bar.style.transform = 'scaleX(0)'; });
      if (!v.paused) raf = requestAnimationFrame(paint);
    }
    v.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); if (v.previousElementSibling) v.previousElementSibling.style.opacity = '0'; });
    v.addEventListener('pause', () => cancelAnimationFrame(raf));
    v.addEventListener('seeked', paint);

    steps.forEach((s, i) => s.addEventListener('click', () => {
      ensure();
      const go = () => { v.currentTime = SEEK[i]; v.play().catch(() => {}); };
      if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
      const btn = $('[data-lp2-toggle-video="[data-lp2-how-video]"]');
      if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Pausar vídeo'); v.dataset.lp2UserPaused = ''; }
    }));

    if (RM || SS) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { ensure(); if (!v.dataset.lp2UserPaused) v.play().catch(() => {}); }
      else v.pause();
    }, { threshold: 0.45 });
    io.observe(v);
  }

  /* ------------------------------------------------------------------
     Rodillo «Para los que…»
     ------------------------------------------------------------------ */
  function initRotor() {
    const list = $('[data-lp2-rotor]');
    if (!list || RM || SS) return;
    const n = list.children.length - 1;
    let i = 0;
    let timer = 0;
    const step = () => {
      i += 1;
      list.style.transition = 'transform .75s cubic-bezier(.34,1.56,.64,1)';
      list.style.transform = `translateY(${-i * 1.15}em)`;
      if (i === n) setTimeout(() => { list.style.transition = 'none'; list.style.transform = 'translateY(0)'; i = 0; }, 800);
    };
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(step, 1900);
    }).observe(list);
  }

  /* ------------------------------------------------------------------
     Sobre: girar en móvil / sin movimiento
     ------------------------------------------------------------------ */
  function initFlip() {
    const btn = $('[data-lp2-flip]');
    const mech = $('.lp2-mech');
    const inner = $('[data-lp2-sachet]');
    if (!btn || !mech || !inner) return;
    btn.addEventListener('click', () => {
      const on = !mech.classList.contains('lp2-is-flipped');
      mech.classList.toggle('lp2-is-flipped', on);
      btn.setAttribute('aria-pressed', String(on));
      $('span', btn).textContent = on ? 'Ver el frontal' : 'Ver el reverso';
      const to = on ? 'rotateY(180deg) rotateZ(3deg)' : 'rotateY(-16deg) rotateZ(-5deg)';
      if (RM || !inner.animate) { inner.style.transform = to; return; }
      const from = getComputedStyle(inner).transform;
      inner.animate([{ transform: from === 'none' ? 'rotateY(0deg)' : from }, { transform: to }], { duration: 900, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'forwards' });
    });
  }

  /* ------------------------------------------------------------------
     Barra fija de compra
     ------------------------------------------------------------------ */
  function initStick() {
    const stick = $('[data-lp2-stick]');
    const heroBuy = $('.lp2-hero__buy');
    const buy = $('#ficha .lp2-buy__grid');
    const end = $('.lp2-end');
    if (!stick || !heroBuy) return;
    const link = $('a', stick);
    const seen = { hero: true, buy: false, end: false };
    const sync = () => {
      const heroGone = !seen.hero && heroBuy.getBoundingClientRect().top < 0;
      const on = heroGone && !seen.buy && !seen.end;
      stick.classList.toggle('lp2-is-on', on);
      stick.setAttribute('aria-hidden', String(!on));
      link.tabIndex = on ? 0 : -1;
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === heroBuy) seen.hero = e.isIntersecting;
        else if (e.target === buy) seen.buy = e.isIntersecting;
        else if (e.target === end) seen.end = e.isIntersecting;
      });
      sync();
    }, { threshold: 0 });
    [heroBuy, buy, end].forEach((el) => el && io.observe(el));
  }

  /* ------------------------------------------------------------------
     Elige tu sabor: se cambia con un clic (o con las flechas), no con el scroll
     ------------------------------------------------------------------ */
  function initFlav() {
    const tabs = $$('[data-lp2-flav-tab]');
    const items = $$('.lp2-flav__item');
    const bgs = $$('.lp2-flav__bg');
    const words = $$('.lp2-flav__word');
    if (!tabs.length || items.length < 3) return;
    let active = 0;
    let z = 2;
    const running = new Set();
    const desk = () => matchMedia('(min-width: 1024px)').matches;
    // Cada animación se limpia una sola vez: al terminar o cuando se cambia de sabor antes de tiempo
    const anim = (el, frames, opts, done) => {
      const a = el.animate(frames, opts);
      const cleanup = () => {
        if (!running.has(a)) return;
        running.delete(a);
        if (done) done();
        a.cancel();
      };
      a.onfinish = cleanup;
      a.cleanup = cleanup;
      running.add(a);
      return a;
    };

    function go(i) {
      if (i === active) return;
      [...running].forEach((a) => a.cleanup());
      const prev = active;
      active = i;
      tabs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
      const settle = () => [items, bgs, words].forEach((list) => list.forEach((el, k) => el.classList.toggle('lp2-is-active', k === active)));
      if (RM || !desk() || !items[i].animate) { settle(); return; }

      // Fondo: el color nuevo entra por encima del anterior
      z += 1;
      bgs[i].style.zIndex = z;
      bgs[i].classList.add('lp2-is-active');
      anim(bgs[i], [{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' }, () => {
        bgs.forEach((b, k) => { if (k !== active) b.classList.remove('lp2-is-active'); });
      });

      // Palabra gigante de fondo
      words[i].classList.add('lp2-is-active');
      anim(words[prev], [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-5%)' }], { duration: 340, easing: 'ease-in', fill: 'forwards' }, () => {
        if (prev !== active) words[prev].classList.remove('lp2-is-active');
      });
      anim(words[i], [{ opacity: 0, transform: 'translateX(5%)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 700, delay: 120, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });

      // Producto, nombre y botón
      items[i].classList.add('lp2-is-active');
      anim(items[prev], [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-56px)' }], { duration: 280, easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'forwards' }, () => {
        if (prev !== active) items[prev].classList.remove('lp2-is-active');
      });
      anim(items[i], [{ opacity: 0, transform: 'translateX(56px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 720, delay: 250, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      anim($('.lp2-flav__sachet', items[i]), [{ transform: 'rotate(20deg) translateY(8%)' }, { transform: 'rotate(-8deg) translateY(0)' }], { duration: 900, delay: 280, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
    }

    tabs.forEach((t, k) => {
      t.addEventListener('click', () => go(k));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = (k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[n].focus();
        go(n);
      });
    });
  }

  /* ------------------------------------------------------------------
     Movimiento (GSAP + ScrollTrigger)
     ------------------------------------------------------------------ */
  function initMotion() {
    if (!lp2.classList.contains('lp2-anim') || !window.gsap || !window.ScrollTrigger) {
      lp2.classList.remove('lp2-anim');
      return;
    }
    window.__lp2Anim = true;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    // Apertura del hero: entra «no es cansancio», se tacha, entra «es deshidratación»
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .to('.lp2-hero__logo', { opacity: 1, duration: 1 }, 0)
      .to('.lp2-hero__line--off .lp2-hero__line-in', { y: 0, duration: 1.2 }, 0.1)
      .to('.lp2-hero__strike', { scaleX: 1, duration: 0.8, ease: 'power3.inOut' }, 0.8)
      .fromTo('.lp2-hero__struck-word', { opacity: 1 }, { opacity: 0.42, duration: 0.7, ease: 'power2.out' }, 1.05)
      .to('.lp2-hero__line--on .lp2-hero__line-in', { y: 0, duration: 1.2 }, 1.0)
      .fromTo('.lp2-hero__row > *', { y: 18 }, { y: 0, opacity: 1, duration: 1, stagger: 0.07 }, 1.25);

    gsap.to('[data-lp2-hero-frame]', { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.lp2-hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Titulares: líneas que suben desde su máscara
    $$('.lp2-h2').forEach((h) => {
      if (h.closest('.lp2-hero') || h.closest('.lp2-mech__back')) return;
      const lines = $$('.lp2-ln__in', h);
      if (!lines.length) return;
      gsap.from(lines, { yPercent: 135, duration: 1.15, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
    });
    $$('.lp2-stat__hero .lp2-ln__in, .lp2-news__quote .lp2-ln__in').forEach((el, i) => {
      gsap.from(el, { yPercent: 135, duration: 1.2, ease: 'expo.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: el.closest('.lp2-stat, .lp2-news__quote'), start: 'top 82%', once: true } });
    });

    // Bloques que suben en tanda
    gsap.set('[data-lp2-rise]', { y: 40, opacity: 0 });
    ScrollTrigger.batch('[data-lp2-rise]', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true }),
    });

    // Parallax de fotos
    $$('[data-lp2-parallax]').forEach((img) => {
      const amt = Number(img.dataset.lp2Parallax) || 7;
      gsap.fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    const mm = gsap.matchMedia();

    // Escena del sobre — escritorio: fijada y ligada al scroll
    mm.add('(min-width: 1024px)', () => {
      gsap.set('.lp2-mineral', { opacity: 0, y: 30 });
      gsap.set('.lp2-mineral__bar', { scaleX: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.lp2-mech', start: 'top top', end: '+=150%', pin: '.lp2-mech__pin', scrub: 0.9, anticipatePin: 1 } });
      tl.fromTo('[data-lp2-sachet]', { rotateY: -38, rotateZ: -11, y: 80, scale: 0.88 }, { rotateY: -12, rotateZ: -5, y: 0, scale: 1, duration: 1, ease: 'power2.out' }, 0)
        .fromTo('.lp2-mech__glow', { scale: 0.7, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
        .to('.lp2-mineral', { opacity: 1, y: 0, duration: 0.6, stagger: 0.36, ease: 'power2.out' }, 0.3)
        .to('.lp2-mineral__bar', { scaleX: 1, duration: 0.5, stagger: 0.36, ease: 'power2.out' }, 0.45)
        .to('[data-lp2-sachet]', { rotateY: 0, rotateZ: -2, duration: 0.8, ease: 'power1.inOut' }, 1.0)
        .to('[data-lp2-sachet]', { rotateY: 180, rotateZ: 3, duration: 1.3, ease: 'power2.inOut' }, 2.0)
        .to('.lp2-mech__front', { autoAlpha: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 2.1)
        .fromTo('.lp2-mech__back', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.65)
        .to({}, { duration: 0.5 });
    });

    // Escena del sobre — móvil y tableta: sin fijar, con un balanceo ligado al scroll
    mm.add('(max-width: 1023px)', () => {
      gsap.fromTo('.lp2-sachet', { rotateZ: -8, y: 30 }, { rotateZ: 5, y: -20, ease: 'none', scrollTrigger: { trigger: '.lp2-mech__stage', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.set('.lp2-mineral', { opacity: 0, y: 30 });
      ScrollTrigger.batch('.lp2-mineral', { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }) });
    });

    // Banda cinética: las dos filas se cruzan con el scroll
    $$('[data-lp2-kine]').forEach((row) => {
      const toLeft = Number(row.dataset.lp2Kine) < 0;
      gsap.fromTo(row, { xPercent: toLeft ? 0 : -24 }, { xPercent: toLeft ? -24 : 0, ease: 'none', scrollTrigger: { trigger: '.lp2-kine', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });

    // Datos: barras, segmentos y la mancuerna de fatiga
    const dataTl = gsap.timeline({ scrollTrigger: { trigger: '.lp2-data__grid', start: 'top 75%', once: true }, defaults: { ease: 'expo.out' } });
    dataTl
      .from('.lp2-dumb__link', { scaleX: 0, duration: 1.3 }, 0.2)
      .from('[data-lp2-end], [data-lp2-end-label]', { x: () => $('.lp2-dumb__plot').clientWidth * 0.572, duration: 1.3 }, 0.2)
      .from('.lp2-bar__fill', { scaleX: 0, duration: 1.2, stagger: 0.12 }, 0.35)
      .from('.lp2-stack__seg', { scaleX: 0, duration: 1, stagger: 0.14 }, 0.35)
      .from('.lp2-units__row img', { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.5);

    // Comparativa
    gsap.from('.lp2-vs__hl', { scaleY: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.lp2-vs__table', start: 'top 80%', once: true } });
    gsap.from('.lp2-vs__table tbody tr', { opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power2.out', scrollTrigger: { trigger: '.lp2-vs__table', start: 'top 80%', once: true } });

    // Recortes de prensa
    gsap.from('[data-lp2-clip]', { y: 70, opacity: 0, rotate: (i) => (i ? 7 : -7), duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.lp2-news__clips', start: 'top 85%', once: true } });

    // Cierre
    gsap.fromTo('[data-lp2-end-bg]', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.lp2-end', start: 'top bottom', end: 'bottom top', scrub: true } });

    const refresh = () => ScrollTrigger.refresh();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(refresh);
    addEventListener('load', refresh, { once: true });
  }

  initFlavPick(initBuy());
  initFlav();
  initToggles();
  initHeroVideo();
  initHow();
  initRotor();
  initFlip();
  initStick();
  initMotion();
})();
