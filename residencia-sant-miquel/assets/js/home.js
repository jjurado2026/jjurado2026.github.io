/* Sant Miquel Arcàngel — home (página única): sus plazas en un contador que rueda,
   la casa que gira como un cubo, las fotos de talleres y Navidad con su visor,
   el menú que marca dónde se está y el formulario que abre el correo. */
(function () {
  'use strict';
  var d = document, SM = window.SM || { quieto: true, observa: function (e) { e.classList.add('visto'); }, enPantalla: function (e, f) { f(true); } };
  var quieto = SM.quieto;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* Un temporizador que solo corre cuando su bloque se ve y nadie lo está tocando */
  function rellotge(bloc, ms, pas) {
    var visible = false, aturat = false, t = null;
    function arrenca() { para(); if (visible && !aturat && !quieto && !d.hidden) t = setInterval(pas, ms); }
    function para() { if (t) { clearInterval(t); t = null; } }
    SM.enPantalla(bloc, function (si) { visible = si; arrenca(); });
    d.addEventListener('visibilitychange', arrenca);
    return {
      atura: function (si) { aturat = si; arrenca(); },
      reinicia: arrenca
    };
  }

  /* ================= 1 · Sus plazas: cada cifra rueda como un contador mecánico hasta 18 y 7 ================= */
  $$('[data-odo]').forEach(function (x) {
    var xifres = String(x.getAttribute('data-odo')).split('');
    x.textContent = '';
    xifres.forEach(function (c) {
      var col = d.createElement('span'), tira = d.createElement('span');
      col.className = 'odo__col'; tira.className = 'odo__tira';
      // Dos vueltas de 0 a 9 y se para en su cifra
      for (var k = 0; k < 20; k++) { var s = d.createElement('span'); s.textContent = k % 10; tira.appendChild(s); }
      tira.style.setProperty('--v', 10 + +c);
      col.appendChild(tira); x.appendChild(col);
    });
  });

  /* ================= 2 · La casa: la sala gira como un cubo y pasa a la estancia siguiente ================= */
  (function () {
    var est = $('[data-estancia]'); if (!est) return;
    var esc = $('[data-escenari]', est), cub = $('[data-cub]', est);
    var escenes = $$('[data-escena]', esc), n = escenes.length, actual = 0, ocupat = false;
    var botons = $$('[data-estanca]', est);
    var GIR = 1150;
    function marca(k) {
      escenes.forEach(function (e, i) { e.classList.toggle('actual', i === k); e.setAttribute('aria-hidden', String(i !== k)); });
    }
    function miniatura(k) {
      botons.forEach(function (b, i) { if (i === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    // Copia de una escena para una cara del cubo: la misma foto ya cargada, sin atributos que dupliquen
    function copia(e) {
      var c = e.cloneNode(true), img = $('img', c), orig = $('img', e);
      c.removeAttribute('data-escena'); c.removeAttribute('aria-hidden'); c.classList.add('actual');
      ['data-foto', 'srcset', 'sizes', 'loading'].forEach(function (a) { img.removeAttribute(a); });
      img.src = orig.currentSrc || orig.src; img.alt = ''; img.decoding = 'sync';
      return c;
    }
    function cara(e, classe) { var f = d.createElement('div'); f.className = 'cub__cara ' + classe; f.appendChild(copia(e)); return f; }
    function gira(nou, enrere) {
      esc.style.setProperty('--mig', (esc.clientWidth / 2) + 'px');
      cub.innerHTML = '';
      cub.appendChild(cara(escenes[actual], 'cub__cara--davant'));
      cub.appendChild(cara(escenes[nou], enrere ? 'cub__cara--esq' : 'cub__cara--dre'));
      cub.classList.remove('gira', 'gira-enrere');
      cub.hidden = false;
      void cub.offsetWidth;
      marca(-1);                       // mientras gira, detrás solo la penumbra
      actual = nou; miniatura(actual);
      cub.classList.add(enrere ? 'gira-enrere' : 'gira');
      setTimeout(function () {
        marca(actual);
        cub.hidden = true; cub.classList.remove('gira', 'gira-enrere'); cub.innerHTML = '';
        ocupat = false;
      }, GIR + 60);
    }
    function va(nou, enrere) {
      nou = (nou + n) % n;
      if (ocupat || nou === actual) return;
      if (quieto) { actual = nou; marca(actual); miniatura(actual); return; }
      ocupat = true;
      var img = $('img', escenes[nou]);
      img.loading = 'eager';
      var llesta = img.complete && img.naturalWidth ? Promise.resolve() : new Promise(function (ok) {
        img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true }); setTimeout(ok, 2500);
      });
      llesta.then(function () { return img.decode ? img.decode().catch(function () {}) : null; }).then(function () { gira(nou, enrere); });
    }
    var r = rellotge(est, 5200, function () { va(actual + 1); });
    // Las fotos se piden antes de llegar, para que el cubo no espere
    SM.enPantalla(est, function (si) { if (si) escenes.forEach(function (e) { $('img', e).loading = 'eager'; }); });
    $('[data-estancia-seg]', est).addEventListener('click', function () { va(actual + 1); r.reinicia(); });
    $('[data-estancia-ant]', est).addEventListener('click', function () { va(actual - 1, true); r.reinicia(); });
    esc.addEventListener('click', function () { if (esc._llisca) return; va(actual + 1); r.reinicia(); });
    botons.forEach(function (b) {
      b.addEventListener('click', function () { var i = +b.getAttribute('data-estanca'); va(i, i < actual); r.reinicia(); });
    });
    est.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') r.atura(true); });
    est.addEventListener('pointerleave', function () { r.atura(false); });
    // Deslizar con el dedo
    var x0 = null;
    esc.addEventListener('pointerdown', function (e) { x0 = e.clientX; esc._llisca = false; });
    esc.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { esc._llisca = true; va(dx < 0 ? actual + 1 : actual - 1, dx > 0); r.reinicia(); setTimeout(function () { esc._llisca = false; }, 50); }
    });
    SM.observa(est);
    marca(0); miniatura(0);
  })();

  /* ================= 3 · Talleres y Navidad: las filas entran en cascada y un visor recorre cada grupo ================= */
  (function () {
    $$('[data-mosaic]').forEach(SM.observa);

    var GRUPS = {};
    $$('[data-visor-grup]').forEach(function (b) {
      var g = b.getAttribute('data-visor-grup');
      (GRUPS[g] = GRUPS[g] || []).push(b);
      b.setAttribute('data-visor-i', GRUPS[g].length - 1);
    });
    $$('[data-visor-grup]').forEach(function (b) {
      b.setAttribute('aria-label', 'Amplia la foto: ' + $('img', b).alt);
    });

    var visor = $('[data-visor]'), vImg = $('[data-visor-img]'), vPeu = $('[data-visor-peu]');
    if (!visor || !visor.showModal) return;
    var grup = [], iv = 0;
    function gran(img) {
      var s = (img.getAttribute('srcset') || '').split(',').map(function (x) { return x.trim().split(/\s+/); });
      s.sort(function (a, b) { return parseInt(b[1], 10) - parseInt(a[1], 10); });
      return s.length && s[0][0] ? s[0][0] : img.src;
    }
    function mostra(k) {
      iv = (k + grup.length) % grup.length;
      var b = grup[iv], img = $('img', b), src = gran(img);
      var nova = new Image(); nova.src = src;
      vImg.classList.add('carrega');
      (nova.decode ? nova.decode() : Promise.resolve()).catch(function () {}).then(function () {
        vImg.src = src; vImg.alt = img.alt; vImg.classList.remove('carrega');
        var seg = new Image(); seg.src = gran($('img', grup[(iv + 1) % grup.length]));
      });
      vPeu.textContent = img.alt + ' (' + (iv + 1) + '/' + grup.length + ')';
      if (!visor.open) visor.showModal();
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-visor-grup]'); if (!b) return;
      grup = GRUPS[b.getAttribute('data-visor-grup')];
      mostra(+b.getAttribute('data-visor-i'));
    });
    $('[data-visor-tanca]').addEventListener('click', function () { visor.close(); });
    $('[data-visor-ant]').addEventListener('click', function () { mostra(iv - 1); });
    $('[data-visor-seg]').addEventListener('click', function () { mostra(iv + 1); });
    visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') mostra(iv + 1);
      if (e.key === 'ArrowLeft') mostra(iv - 1);
    });
    // Deslizar con el dedo dentro del visor
    var vx = null;
    visor.addEventListener('pointerdown', function (e) { vx = e.clientX; });
    visor.addEventListener('pointerup', function (e) {
      if (vx === null) return;
      var dx = e.clientX - vx; vx = null;
      if (Math.abs(dx) > 50 && e.pointerType !== 'mouse') mostra(dx < 0 ? iv + 1 : iv - 1);
    });
  })();

  /* ================= 4 · El menú subraya la sección que se está leyendo ================= */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var enllacos = $$('.menu a[href^="#"], .menu-mobil a[href^="#"]');
    var seccions = ['inici', 'installacions', 'tallers', 'nadal', 'contacte'].map(function (id) { return d.getElementById(id); }).filter(Boolean);
    var vistes = {};
    function marca() {
      var act = null;
      seccions.forEach(function (s) { if (vistes[s.id]) act = act || s.id; });
      if (!act) return;
      enllacos.forEach(function (a) {
        if (a.getAttribute('href') === '#' + act) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vistes[e.target.id] = e.isIntersecting; });
      marca();
    }, { rootMargin: '-45% 0px -50% 0px' });
    seccions.forEach(function (s) { io.observe(s); });
  })();

  /* ================= 5 · Formulario: abre el correo con el mensaje escrito ================= */
  (function () {
    var form = $('[data-form]'); if (!form) return;
    var err = $('[data-form-error]');
    var EMAIL = 'residencia_sant_miquel@hotmail.com';
    function valors() {
      var f = new FormData(form);
      return { nom: String(f.get('nom') || '').trim(), tel: String(f.get('tel') || '').trim(), msg: String(f.get('missatge') || '').trim() };
    }
    function avisa(tipus) {
      err.dataset.tipus = tipus;
      err.hidden = !tipus;
      err.classList.toggle('form__error--ok', tipus === 'enviat');
      if (tipus === 'error') err.textContent = 'Escriviu el vostre nom i un telèfon de 9 xifres per poder trucar-vos.';
      if (tipus === 'enviat') err.textContent = "S'obre el vostre correu amb el missatge. Si no s'obre, truqueu al 934 170 582.";
    }
    function valida() {
      var v = valors(), mal = [];
      var nom = form.elements.nom, tel = form.elements.tel;
      nom.setAttribute('aria-invalid', String(!v.nom)); if (!v.nom) mal.push(nom);
      var ok = (v.tel.match(/\d/g) || []).length >= 9;
      tel.setAttribute('aria-invalid', String(!ok)); if (!ok) mal.push(tel);
      avisa(mal.length ? 'error' : '');
      return mal;
    }
    form.addEventListener('input', function () { if (err.dataset.tipus === 'error') valida(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mal = valida();
      if (mal.length) { mal[0].focus(); return; }
      var v = valors();
      var cos = (v.msg ? v.msg + '\n\n' : '') + v.nom + '\n' + v.tel;
      avisa('enviat');
      location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(v.nom) + '&body=' + encodeURIComponent(cos);
    });
  })();

  window.SM = SM;
})();
