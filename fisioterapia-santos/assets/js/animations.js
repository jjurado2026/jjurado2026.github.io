/* ============================================
   FISIOTERAPIA SANTOS — Advanced Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Reveal on scroll --- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObs.observe(el));
  }

  /* --- Animated counters in stats --- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countObs.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  /* --- Hero split-text reveal (word by word) --- */
  const heroTitle = document.querySelector('.hero__title');
  if (heroTitle && heroTitle.classList.contains('split-reveal')) {
    const html = heroTitle.innerHTML;
    // Wrap each word (preserving HTML tags like <em> and <br>)
    const words = [];
    let insideTag = false;
    let buffer = '';

    for (let i = 0; i < html.length; i++) {
      const ch = html[i];
      if (ch === '<') { insideTag = true; buffer += ch; continue; }
      if (ch === '>') { insideTag = false; buffer += ch; continue; }
      if (insideTag) { buffer += ch; continue; }
      if (ch === ' ' || ch === '\n') {
        if (buffer.trim()) words.push(buffer);
        buffer = '';
        words.push(' ');
      } else {
        buffer += ch;
      }
    }
    if (buffer.trim()) words.push(buffer);

    let wordIndex = 0;
    heroTitle.innerHTML = words.map(w => {
      if (w === ' ') return ' ';
      if (w.startsWith('<')) return w;
      wordIndex++;
      return `<span class="word" style="animation-delay:${0.15 + wordIndex * 0.08}s">${w}</span>`;
    }).join('');

    heroTitle.classList.add('split-reveal--ready');
  }

  /* --- Parallax on scroll (subtle) --- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          parallaxEls.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.1;
            const rect = el.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const viewCenter = window.innerHeight / 2;
            const offset = (center - viewCenter) * speed;
            el.style.transform = `translateY(${offset}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* --- Magnetic hover on CTA buttons --- */
  const magneticBtns = document.querySelectorAll('.btn--magnetic');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(.16,1,.3,1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });

  /* --- Horizontal scroll marquee for stats --- */
  const marquees = document.querySelectorAll('.marquee');
  marquees.forEach(m => {
    const inner = m.querySelector('.marquee__inner');
    if (!inner) return;
    // Clone for seamless loop
    inner.innerHTML += inner.innerHTML;
  });

  /* --- Staggered image reveal for gallery --- */
  const galleries = document.querySelectorAll('.stagger-gallery');
  if (galleries.length) {
    const galObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll('.stagger-gallery__item');
          items.forEach((item, i) => {
            item.style.animationDelay = `${i * 0.15}s`;
            item.classList.add('stagger-gallery__item--visible');
          });
          galObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    galleries.forEach(el => galObs.observe(el));
  }

});
