/* Control Plagas 3D Aranjuez — main.js
   Cabecera, menú móvil, submenú, titular por palabras, aparición al hacer
   scroll, barra fija móvil y formulario de muestra. */
(() => {
  'use strict';

  const reducida = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cab = document.querySelector('.cab');
  if (!cab) return;

  /* Sombra y compactado de la cabecera al desplazarse */
  const alScroll = () => cab.classList.toggle('cab--scroll', window.scrollY > 8);
  alScroll();
  window.addEventListener('scroll', alScroll, { passive: true });

  /* Menú móvil */
  const botonMenu = cab.querySelector('.cab__menu');
  const cerrarMenu = () => {
    cab.classList.remove('cab--abierta');
    botonMenu.setAttribute('aria-expanded', 'false');
  };
  botonMenu.addEventListener('click', () => {
    const abierta = cab.classList.toggle('cab--abierta');
    botonMenu.setAttribute('aria-expanded', String(abierta));
  });
  cab.querySelectorAll('.cab__nav a').forEach((a) => a.addEventListener('click', cerrarMenu));

  /* Submenú "Servicios" (teclado y táctil; el hover lo resuelve el CSS) */
  const itemSub = cab.querySelector('.cab__item--sub');
  const botonSub = cab.querySelector('.cab__sub-toggle');
  const cerrarSub = () => {
    itemSub.classList.remove('abierto');
    botonSub.setAttribute('aria-expanded', 'false');
  };
  botonSub.addEventListener('click', () => {
    const abierto = itemSub.classList.toggle('abierto');
    botonSub.setAttribute('aria-expanded', String(abierto));
  });
  document.addEventListener('click', (e) => {
    if (!itemSub.contains(e.target)) cerrarSub();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cerrarSub(); cerrarMenu(); }
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', cerrarMenu);

  /* Titular del hero: cada palabra sube desde su propia máscara */
  const titulo = document.querySelector('.hero__titulo');
  if (titulo && !reducida) {
    let n = 0;
    const envolver = (nodo) => {
      [...nodo.childNodes].forEach((hijo) => {
        if (hijo.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach((trozo) => {
            if (!trozo) return;
            if (/^\s+$/.test(trozo)) { frag.appendChild(document.createTextNode(' ')); return; }
            const m = document.createElement('span');
            m.className = 'palabra';
            const s = document.createElement('span');
            s.style.setProperty('--p', n++);
            s.textContent = trozo;
            m.appendChild(s);
            frag.appendChild(m);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === Node.ELEMENT_NODE) {
          envolver(hijo);
        }
      });
    };
    envolver(titulo);
  }

  /* Los chips del hero pasan a flotar cuando han terminado de entrar */
  document.querySelectorAll('.hero__chip').forEach((chip) => {
    chip.addEventListener('animationend', () => chip.classList.add('flota'), { once: true });
  });

  /* Aparición al hacer scroll, una sola vez */
  const elementos = document.querySelectorAll('.revela');
  if (reducida || !('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('visto'));
  } else {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('visto');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    elementos.forEach((el) => io.observe(el));
  }

  /* Barra fija móvil: aparece cuando el hero sale de pantalla */
  const barra = document.querySelector('.barra');
  const hero = document.querySelector('.hero');
  if (barra && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      barra.classList.toggle('barra--visible', !entradas[0].isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  } else if (barra) {
    barra.classList.add('barra--visible');
  }

  /* Formulario: prototipo sin envío real. Textos de confirmación de su web actual. */
  const form = document.querySelector('.form');
  if (form) {
    const aviso = form.querySelector('.form__aviso');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      aviso.textContent = 'Gracias por contactarnos. Le responderemos lo antes posible.';
      form.reset();
    });
  }
})();
