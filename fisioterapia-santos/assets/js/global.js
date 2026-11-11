/* ============================================
   FISIOTERAPIA SANTOS — Global JS
   Nav scroll, mobile menu, smooth scroll
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Sticky Nav on scroll --- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Mobile hamburger --- */
  const burger = document.querySelector('.nav__burger');
  const overlay = document.querySelector('.nav__overlay');
  if (burger && overlay) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('nav__burger--open');
      overlay.classList.toggle('nav__overlay--open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      burger.setAttribute('aria-expanded', isOpen);
    });

    overlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('nav__burger--open');
        overlay.classList.remove('nav__overlay--open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
        const y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

});
