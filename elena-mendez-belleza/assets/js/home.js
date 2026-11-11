/* Elena Méndez — home v6 «Portada»: el vídeo dentro de la palabra «Novedades», los vídeos que se reproducen
   solo si se pulsan, la guía «¿Qué te gustaría mejorar?», el índice de tratamientos y la cita por correo.
   El scroll es el normal: nada se mueve ni se fija al bajar. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var quieto = html.classList.contains('quieto');
  var CORREO = 'elenamendez-belleza@hotmail.com';

  /* ── Novedades: el vídeo de la palabra, solo mientras se ve ─────────────── */
  var palabra = d.querySelector('[data-palabra]');
  var videoPalabra = d.querySelector('[data-palabra-video]');
  if (palabra && videoPalabra && !quieto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var p = videoPalabra.play(); if (p && p.catch) p.catch(function () {}); }
        else videoPalabra.pause();
      });
    }, { rootMargin: '80px 0px' }).observe(palabra);
  }

  /* ── Los vídeos de cada novedad: solo si se pulsan ──────────────────────── */
  var botonesPlay = d.querySelectorAll('[data-play]');
  var pararVideo = function (b) {
    var v = b.parentNode.querySelector('video');
    if (!v.paused) v.pause();
    b.classList.remove('sonando');
    b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/^Pausar/, 'Reproducir'));
    b.querySelector('use').setAttribute('href', '#i-play');
  };
  botonesPlay.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.parentNode.querySelector('video');
      if (v.paused) {
        botonesPlay.forEach(function (o) { if (o !== b) pararVideo(o); });
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        b.classList.add('sonando');
        b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/^Reproducir/, 'Pausar'));
        b.querySelector('use').setAttribute('href', '#i-pausa');
      } else pararVideo(b);
    });
  });

  /* ── La guía: de lo que te preocupa a sus tratamientos ──────────────────── */
  var MEJORAS = {
    arrugas: { titulo: 'Para tus arrugas', cta: 'para tus arrugas', valor: 'Arrugas',
      items: [['Relleno de arrugas dinámicas'], ['Karisma Rh Collagen'], ['Dermapen + Indiba', 'novedad']] },
    labios: { titulo: 'Para tus labios', cta: 'para tus labios', valor: 'Labios',
      items: [['Ácido hialurónico en labios', 'promoción del mes'], ['Micropigmentación de labios']] },
    flacidez: { titulo: 'Para la flacidez', cta: 'para la flacidez', valor: 'Flacidez',
      items: [['HIFU', 'desde 99 €'], ['Endolift', 'novedad'], ['Indiba Edna Pro Max', 'novedad'], ['Hilos tensores']] },
    manchas: { titulo: 'Para tus manchas', cta: 'para tus manchas', valor: 'Manchas',
      items: [['Nanoláser STP y láser ND-YAG', 'desde 69 €'], ['Despigmentación con Mesoestetic'], ['Peelings']] },
    vello: { titulo: 'Para el vello, en cualquier piel', cta: 'de depilación láser', valor: 'Depilación láser',
      items: [['Láser de diodo SLD e IPL SHR', 'desde 19,90 €'], ['Indoloro']] },
    silueta: { titulo: 'Para tu silueta', cta: 'para tu silueta', valor: 'Silueta',
      items: [['Bodyshock de Mesoestetic'], ['Maderoterapia'], ['Ultracavitación'], ['Dieta proteinada con control médico']] },
    piel: { titulo: 'Para la luminosidad de tu piel', cta: 'para tu piel', valor: 'Luminosidad de la piel',
      items: [['Exosomas', 'novedad'], ['La Cápsula del Tiempo', 'exclusiva'], ['Peelings de Mesoestetic']] },
    bienestar: { titulo: 'Para tu bienestar', cta: 'de bienestar', valor: 'Bienestar y masajes',
      items: [['Masajes relajantes y terapéuticos'], ['Kobido'], ['Piedras volcánicas'], ['Reflexología']] }
  };
  var guia = d.querySelector('[data-guia]');
  if (guia) {
    var respuesta = guia.querySelector('[data-guia-respuesta]');
    var opciones = guia.querySelectorAll('[data-mejora]');
    var pinta = function (m) {
      respuesta.textContent = '';
      var t = d.createElement('h3');
      t.className = 'guia__titulo';
      t.textContent = m.titulo;
      var ul = d.createElement('ul');
      ul.className = 'guia__lista';
      m.items.forEach(function (it) {
        var li = d.createElement('li');
        li.textContent = it[0];
        if (it[1]) { var e = d.createElement('em'); e.textContent = it[1]; li.appendChild(e); }
        ul.appendChild(li);
      });
      var a = d.createElement('a');
      a.className = 'boton';
      a.href = '#cita';
      a.setAttribute('data-cita', m.valor);
      var s = d.createElement('span');
      s.textContent = 'Pedir cita ' + m.cta;
      a.appendChild(s);
      respuesta.appendChild(t);
      respuesta.appendChild(ul);
      respuesta.appendChild(a);
    };
    opciones.forEach(function (b) {
      b.addEventListener('click', function () {
        var ya = b.getAttribute('aria-pressed') === 'true';
        opciones.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        if (ya) { respuesta.hidden = true; respuesta.textContent = ''; return; }
        b.setAttribute('aria-pressed', 'true');
        pinta(MEJORAS[b.getAttribute('data-mejora')]);
        respuesta.hidden = false;
      });
    });
  }

  /* ── El índice de tratamientos: se elige con un clic. En móvil, un acordeón ─ */
  var indice = d.querySelector('[data-indice]');
  if (indice) {
    var enMovil = matchMedia('(max-width: 899px)');
    var botones = indice.querySelectorAll('[data-indice-boton]');
    var abre = function (b, si) {
      b.setAttribute('aria-expanded', String(si));
      d.getElementById(b.getAttribute('aria-controls')).classList.toggle('es-activa', si);
    };
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var abierto = b.getAttribute('aria-expanded') === 'true';
        // En escritorio siempre hay uno a la vista; en móvil se puede cerrar el que está abierto
        if (abierto && !enMovil.matches) return;
        botones.forEach(function (o) { abre(o, false); });
        if (!abierto) abre(b, true);
      });
    });
    var cambia = function () {
      if (enMovil.matches || indice.querySelector('[aria-expanded="true"]')) return;
      abre(botones[0], true);
    };
    if (enMovil.addEventListener) enMovil.addEventListener('change', cambia);
  }

  /* ── La cita, por correo ─────────────────────────────────────────────────── */
  var form = d.querySelector('[data-formulario]');
  if (form) {
    var aviso = form.querySelector('[data-formulario-aviso]');
    var interes = form.elements.interes;
    var conRaton = matchMedia('(hover: hover) and (pointer: fine)').matches;
    var marca = function (el, si) {
      var caja = el.closest('.campo, .formulario__acepto');
      caja.classList.toggle('con-error', si);
      if (el.type !== 'checkbox') { if (si) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
    };
    form.addEventListener('input', function (e) { if (e.target.name) marca(e.target, false); });
    form.addEventListener('change', function (e) { if (e.target.name === 'acepto') marca(e.target, false); });

    // Cualquier «Pedir cita» llega con la elección hecha
    d.addEventListener('click', function (e) {
      var a = e.target.closest('[data-cita]');
      if (!a) return;
      var v = a.getAttribute('data-cita');
      if (Array.prototype.some.call(interes.options, function (o) { return o.value === v || o.text === v; })) interes.value = v;
      if (conRaton) setTimeout(function () { var n = form.elements.nombre; if (!n.value) n.focus({ preventScroll: true }); }, quieto ? 0 : 700);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var nombre = f.nombre.value.trim(), tel = f.telefono.value.trim(), email = f.email.value.trim(), que = f.interes.value;
      var telMal = tel.replace(/\D/g, '').length < 9, emailMal = !!email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      marca(f.nombre, !nombre); marca(f.telefono, telMal); marca(f.email, emailMal); marca(f.acepto, !f.acepto.checked);
      var falta = !nombre ? [f.nombre, 'Falta tu nombre.'] : telMal ? [f.telefono, 'Falta un teléfono de 9 cifras.'] : emailMal ? [f.email, 'Revisa tu correo electrónico.'] : !f.acepto.checked ? [f.acepto, 'Falta aceptar la política de privacidad.'] : null;
      if (falta) { aviso.textContent = falta[1]; falta[0].focus(); return; }
      var asunto = 'Cita' + (que ? ': ' + que : '') + ' (' + nombre + ')';
      var cuerpo = 'Me llamo ' + nombre + ' y quiero cita para ' + (que || 'lo que me aconsejéis') + '.\nPodéis llamarme al ' + tel + (email ? ' o escribirme a ' + email : '') + '.';
      location.href = 'mailto:' + CORREO + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
      aviso.textContent = 'Se ha abierto tu correo con la cita escrita: solo tienes que enviarlo.';
    });
  }
})();
