/* 1c · La diagonal. Al bajar, cada listón se desliza por su carril a una velocidad distinta;
   con el ratón encima se mecen un poco. Sin movimiento: nada se mueve. */
(() => {
  'use strict';
  const d = document;
  if (d.documentElement.classList.contains('quieto')) return;
  const marco = d.querySelector('[data-marco-c]');
  if (!marco) return;
  const listones = [...marco.querySelectorAll('.hero-c__liston')];
  const texto = marco.querySelector('.hero-c__texto');
  const SEN = 0.6561, COS = 0.7547;   // la dirección del filo, 41°
  const conRaton = matchMedia('(hover: hover) and (pointer: fine)');
  let p = 0, rx = 0, rObjetivo = 0, visible = true, pedido = false;

  const pinta = () => {
    pedido = false;
    rx += (rObjetivo - rx) * 0.1;
    listones.forEach((l, k) => {
      const a = p * (k + 1) * 46 + rx * (k + 1) * 5;
      l.style.translate = `${(SEN * a).toFixed(1)}px ${(-COS * a).toFixed(1)}px`;
    });
    texto.style.translate = p ? `0 ${(-p * 70).toFixed(1)}px` : '';
    if (visible && Math.abs(rObjetivo - rx) > 0.002) pide();
  };
  const pide = () => { if (!pedido) { pedido = true; requestAnimationFrame(pinta); } };

  addEventListener('scroll', () => {
    if (!visible) return;
    p = Math.min(1, Math.max(0, scrollY / marco.offsetHeight));
    pide();
  }, { passive: true });
  marco.addEventListener('pointermove', (e) => {
    if (!conRaton.matches || e.pointerType !== 'mouse') return;
    rObjetivo = (e.clientX / innerWidth - 0.5) * 2;
    pide();
  });
  marco.addEventListener('pointerleave', () => { rObjetivo = 0; pide(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pide(); }).observe(marco);
})();
