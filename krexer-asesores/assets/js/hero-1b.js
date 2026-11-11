/* 1b · El titular se abre. La foto se coloca para que las caras caigan en la rendija y, en escritorio,
   al bajar se apartan las dos tapas hasta que el equipo llena la pantalla. Sin movimiento: todo quieto y a la vista. */
(() => {
  'use strict';
  const d = document;
  const quieto = d.documentElement.classList.contains('quieto');
  const pista = d.querySelector('[data-pista]');
  if (!pista) return;
  const escena = pista.querySelector('[data-escena]');
  const fondo = escena.querySelector('[data-fondo]');
  const foto = fondo.querySelector('img');
  const velo = escena.querySelector('[data-velo]');
  const sup = escena.querySelector('[data-tapa="sup"]');
  const inf = escena.querySelector('[data-tapa="inf"]');
  const supTexto = sup.querySelector('.envoltura');
  const rendija = escena.querySelector('.hero-b__rendija');
  const cab = d.querySelector('[data-cab]');
  const menu = d.getElementById('menu-movil');
  const CARAS = 0.222; // altura media de las caras en la foto, desde arriba
  const grande = matchMedia('(min-width: 1024px) and (min-height: 600px)');
  let desfase = 0, hSup = 0, hInf = 0, activa = false, pedido = false;

  const suave = (t) => t * t * (3 - 2 * t);
  const pinta = () => {
    pedido = false;
    let e = 0;
    if (activa) {
      const r = pista.getBoundingClientRect();
      const recorrido = pista.offsetHeight - escena.offsetHeight;
      e = suave(Math.min(1, Math.max(0, -r.top / (recorrido * 0.8))));
      // Mientras la escena está fijada, la cabecera sigue en blanco y sin fondo
      const fijada = r.bottom - escena.offsetHeight > 2;
      if (menu.hidden) cab.classList.toggle('sobre', fijada);
      if (fijada) cab.classList.remove('con-sombra');
    }
    sup.style.transform = e ? `translate3d(0, ${(-e * (hSup + 4)).toFixed(1)}px, 0)` : '';
    // «Reinventamos» se apaga antes de pasar por debajo del logo
    supTexto.style.opacity = e ? Math.max(0, 1 - e * 2.6).toFixed(3) : '';
    inf.style.transform = e ? `translate3d(0, ${(e * (hInf + 4)).toFixed(1)}px, 0)` : '';
    fondo.style.transform = `translate3d(0, ${((1 - e) * desfase).toFixed(1)}px, 0)`;
    velo.style.opacity = e.toFixed(3);
  };
  const pide = () => { if (!pedido) { pedido = true; requestAnimationFrame(pinta); } };

  const mide = () => {
    activa = !quieto && grande.matches;
    pista.classList.toggle('escena', activa);
    const W = escena.clientWidth, H = escena.clientHeight;
    const iw = foto.naturalWidth || 1918, ih = foto.naturalHeight || 1278;
    const alto = ih * Math.max(W / iw, H / ih);
    const top = rendija.offsetTop, h = rendija.offsetHeight;
    desfase = Math.max(0, Math.min(top, top + h / 2 - alto * CARAS));
    hSup = sup.offsetHeight;
    hInf = inf.offsetHeight;
    pinta();
  };

  mide();
  if (!foto.complete) foto.addEventListener('load', mide, { once: true });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(mide);
  addEventListener('resize', mide, { passive: true });
  grande.addEventListener('change', mide);
  addEventListener('scroll', () => { if (activa) pide(); }, { passive: true });
})();
