/* ============================================
   VELARQUE — Animation System
   GSAP + ScrollTrigger + Lenis
   Pattern based on weavy.ai production code
   ============================================ */

(function () {
  'use strict';

  // Guard: GSAP must exist
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // 1. REGISTER PLUGINS IMMEDIATELY (before any usage)
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 1 });
  ScrollTrigger.defaults({ toggleActions: 'play none none none' });

  // 2. INIT LENIS IMMEDIATELY (like weavy.ai does)
  var lenis;
  if (typeof Lenis !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches) {
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }

  // 3. ALL ANIMATION DEFINITIONS

  function createHeroAnimation() {
    var hero = document.querySelector('[data-gsap="hero"]');
    if (!hero) return;

    var tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'power3.out' } });

    var eyebrow = hero.querySelector('.hero__eyebrow, .page-hero__eyebrow');
    if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.2);

    var words = hero.querySelectorAll('.hero__title-line .hero__word');
    if (words.length) {
      words.forEach(function (w, i) {
        tl.fromTo(w, { opacity: 0, y: '100%' }, { opacity: 1, y: '0%', duration: 0.9 }, 0.3 + i * 0.15);
      });
    }

    var pageTitle = hero.querySelector('.page-hero__title');
    if (pageTitle && !words.length) tl.fromTo(pageTitle, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, 0.4);

    var bottom = hero.querySelector('.hero__bottom, .page-hero__desc');
    if (bottom) tl.fromTo(bottom, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4');

    var cta = hero.querySelector('.hero__cta, .page-hero__actions');
    if (cta) tl.fromTo(cta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');

    var scroll = hero.querySelector('.hero__scroll');
    if (scroll) tl.fromTo(scroll, { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.2');

    // Geometric shapes — cinematic entrance + perpetual float
    var shapes = hero.querySelectorAll('.hero__shape');
    if (shapes.length) {
      var shapeRotations = [12, -15, -8, 20, -25];
      var shapeDelays = [0.3, 0.5, 0.4, 0.6, 0.7];

      shapes.forEach(function (shape, i) {
        var targetRotate = shapeRotations[i] || 0;
        var entranceDelay = shapeDelays[i] || 0.3 + i * 0.15;

        // Entrance: drop from above with rotation offset
        tl.fromTo(shape,
          { opacity: 0, y: -150, rotation: targetRotate - 15 },
          { opacity: 1, y: 0, rotation: targetRotate, duration: 2.4, ease: 'power4.out' },
          entranceDelay
        );
      });

      // Perpetual float — starts after all entrances complete
      shapes.forEach(function (shape, i) {
        gsap.to(shape, {
          y: 15,
          duration: 10 + i * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 3.5
        });
      });
    }
  }

  function createScrollAnimations() {
    // Reveal text
    gsap.utils.toArray('.reveal-text').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 1,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // Reveal up
    gsap.utils.toArray('.reveal-up').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // Stagger grids
    document.querySelectorAll('[data-gsap="stagger"]').forEach(function (container) {
      var items = container.children;
      if (!items.length) return;
      gsap.fromTo(items, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.12,
        scrollTrigger: { trigger: container, start: 'top 80%' },
      });
    });

    // Counters
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (String(target).split('.')[1] || '').length;
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: function () { el.textContent = prefix + obj.val.toFixed(decimals) + suffix; },
      });
    });

    // Text split
    document.querySelectorAll('[data-gsap="text-split"]').forEach(function (el) {
      var words = el.textContent.split(' ');
      el.innerHTML = '';
      words.forEach(function (word) {
        var span = document.createElement('span');
        span.style.cssText = 'display:inline-block;overflow:hidden';
        var inner = document.createElement('span');
        inner.style.display = 'inline-block';
        inner.textContent = word + '\u00A0';
        span.appendChild(inner);
        el.appendChild(span);
      });
      gsap.fromTo(el.querySelectorAll('span > span'), { y: '110%', opacity: 0 }, {
        y: '0%', opacity: 1, duration: 0.8, stagger: 0.04,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // Parallax
    document.querySelectorAll('[data-gsap="parallax"]').forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.3;
      gsap.to(el, {
        y: function () { return -100 * speed; }, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    });

    // Lines
    document.querySelectorAll('[data-gsap="line"]').forEach(function (line) {
      gsap.fromTo(line, { scaleX: 0, transformOrigin: 'left center' }, {
        scaleX: 1, duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: line, start: 'top 90%' },
      });
    });

    // Fade scale
    document.querySelectorAll('[data-gsap="fade-scale"]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, scale: 0.92 }, {
        opacity: 1, scale: 1, duration: 0.9,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
  }

  function createMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  // 4. MASTER INIT — waits for layout to be ready
  //    KEY: ScrollTrigger needs overflow restored and layout settled
  function createAllAnimations() {
    createHeroAnimation();
    createScrollAnimations();
    createMagneticButtons();
    // Double rAF ensures browser has painted after overflow:hidden removal
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ScrollTrigger.refresh();
      });
    });
  }

  // 5. TIMING: Create animations AFTER loader dismisses (900ms after load)
  //    The loader in global.js hides at 800ms after load. We wait 900ms to be safe.
  function onPageReady() {
    setTimeout(createAllAnimations, 900);
  }

  if (document.readyState === 'complete') {
    onPageReady();
  } else {
    window.addEventListener('load', onPageReady);
  }

  // 6. EXPOSE
  window.VelarqueAnimations = {
    createAllAnimations: createAllAnimations,
    getLenis: function () { return lenis; },
  };

})();
