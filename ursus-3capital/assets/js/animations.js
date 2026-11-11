/* ============================================
   URSUS-3 CAPITAL — Animations
   Reveal, counters, parallax, clip-path, magnetic
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
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => revealObs.observe(el));
  }

  /* --- Stagger reveal --- */
  const staggers = document.querySelectorAll('.reveal-stagger');
  if (staggers.length) {
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-stagger--visible');
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    staggers.forEach(el => staggerObs.observe(el));
  }

  /* --- Line draw on scroll --- */
  const lines = document.querySelectorAll('.line-draw');
  if (lines.length) {
    const lineObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('line-draw--visible');
          lineObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    lines.forEach(el => lineObs.observe(el));
  }

  /* --- Animated counters --- */
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
    const duration = 2000;
    const start = performance.now();

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  /* --- Hero title line-by-line reveal --- */
  const heroLines = document.querySelectorAll('.hero__title-line');
  if (heroLines.length) {
    heroLines.forEach((line, idx) => {
      const text = line.textContent;
      line.textContent = '';
      const inner = document.createElement('span');
      inner.textContent = text;
      inner.style.display = 'block';
      inner.style.transform = 'translateY(110%)';
      inner.style.transition = `transform 0.9s ${0.15 + idx * 0.12}s cubic-bezier(0.16, 1, 0.3, 1)`;
      line.appendChild(inner);
    });

    requestAnimationFrame(() => {
      heroLines.forEach(line => {
        line.querySelector('span').style.transform = 'translateY(0)';
      });
    });
  }

  /* --- Parallax on scroll (images & banners) --- */
  const parallaxEls = document.querySelectorAll('.hero__image img, .image-banner__inner img, .about__image img');
  if (parallaxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          parallaxEls.forEach(img => {
            const rect = img.closest('section, .hero__image, .about__image, .image-banner')?.getBoundingClientRect();
            if (!rect) return;
            const viewH = window.innerHeight;
            if (rect.top < viewH && rect.bottom > 0) {
              const progress = (viewH - rect.top) / (viewH + rect.height);
              const shift = (progress - 0.5) * 40;
              img.style.transform = `translateY(${shift}px) scale(1.08)`;
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* --- Magnetic hover on buttons --- */
  const magneticBtns = document.querySelectorAll('.btn--primary, .nav__cta');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });

  /* --- Service card tilt on hover --- */
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { card.style.transition = 'background var(--dur) var(--ease-out)'; }, 500);
    });
  });

  /* --- Stats number slot-machine effect --- */
  const statNumbers = document.querySelectorAll('.stats__number');
  if (statNumbers.length) {
    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.closest('.stats__item')?.classList.add('stats__item--visible');
          statsObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => statsObs.observe(el));
  }

  /* --- Clip-path reveal for about image --- */
  const aboutImage = document.querySelector('.about__image');
  if (aboutImage) {
    aboutImage.style.clipPath = 'inset(100% 0 0 0)';
    aboutImage.style.transition = 'clip-path 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
    const aboutObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.clipPath = 'inset(0 0 0 0)';
          aboutObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
    aboutObs.observe(aboutImage);
  }

  /* --- Image banner parallax text --- */
  const bannerContent = document.querySelector('.image-banner__content');
  if (bannerContent && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', () => {
      const rect = bannerContent.closest('.image-banner')?.getBoundingClientRect();
      if (!rect) return;
      const viewH = window.innerHeight;
      if (rect.top < viewH && rect.bottom > 0) {
        const progress = (viewH - rect.top) / (viewH + rect.height);
        bannerContent.style.transform = `translateY(${(0.5 - progress) * 30}px)`;
        bannerContent.style.opacity = Math.min(1, progress * 2);
      }
    }, { passive: true });
  }

  /* --- Blog cards staggered entrance (desktop only) --- */
  const blogCards = document.querySelectorAll('.blog-card');
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (blogCards.length && !isMobile) {
    const blogObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(blogCards).indexOf(entry.target);
          entry.target.style.transitionDelay = `${idx * 0.12}s`;
          entry.target.classList.add('blog-card--visible');
          blogObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    blogCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px)';
      card.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      blogObs.observe(card);
    });
  }

  /* --- Product accordion toggle --- */
  const productRows = document.querySelectorAll('.product-row');
  productRows.forEach(row => {
    row.addEventListener('click', () => {
      const isOpen = row.classList.contains('product-row--open');
      productRows.forEach(r => r.classList.remove('product-row--open'));
      if (!isOpen) row.classList.add('product-row--open');
    });
  });

  /* --- Quote text character split reveal --- */
  const quoteText = document.querySelector('.quote__text');
  if (quoteText) {
    const text = quoteText.textContent;
    quoteText.innerHTML = '';
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px) rotateX(40deg)';
      span.style.transition = `opacity 0.4s ${i * 0.02}s ease, transform 0.5s ${i * 0.02}s cubic-bezier(0.16, 1, 0.3, 1)`;
      quoteText.appendChild(span);
    });
    const quoteObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          quoteText.querySelectorAll('span').forEach(s => {
            s.style.opacity = '1';
            s.style.transform = 'translateY(0) rotateX(0)';
          });
          quoteObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    quoteObs.observe(quoteText);
  }

  /* --- Stats items scale-in with stagger --- */
  const statsItems = document.querySelectorAll('.stats__item');
  if (statsItems.length) {
    statsItems.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'scale(0.85)';
      item.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    const siObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statsItems.forEach((item, i) => {
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, i * 120);
          });
          siObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    if (statsItems[0]) siObs.observe(statsItems[0]);
  }

  /* --- Product rows slide-in from left with stagger --- */
  productRows.forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-30px)';
    row.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  });
  if (productRows.length) {
    const prObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          productRows.forEach((row, i) => {
            setTimeout(() => {
              row.style.opacity = '1';
              row.style.transform = 'translateX(0)';
            }, i * 60);
          });
          prObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    prObs.observe(productRows[0]);
  }

  /* --- Smooth scroll progress indicator --- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:var(--gold);z-index:9999;transform-origin:left;transform:scaleX(0);transition:none;pointer-events:none;';
  document.body.appendChild(progressBar);
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    progressBar.style.transform = `scaleX(${scrolled})`;
  }, { passive: true });

});
