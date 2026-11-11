/* ============================================
   VELARQUE — Homepage JS
   Splide sliders + horizontal scroll + counters
   ============================================ */

(function () {
  'use strict';

  // --- Testimonials Slider (Splide) ---
  var testimonialsSlider = document.getElementById('testimonialsSlider');
  if (testimonialsSlider && typeof Splide !== 'undefined') {
    new Splide('#testimonialsSlider', {
      type: 'fade',
      rewind: true,
      perPage: 1,
      pagination: true,
      arrows: false,
      autoplay: true,
      interval: 5000,
      speed: 800,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }).mount();
  }

  // --- Horizontal scroll (pinned cases section) ---
  function initHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var section = document.querySelector('[data-gsap="horizontal-scroll"]');
    var track = document.querySelector('[data-gsap="horizontal-track"]');
    if (!section || !track) return;

    // Wait for layout to settle
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var cards = track.children;
        if (!cards.length) return;

        // Calculate total scroll distance
        var trackWidth = track.scrollWidth;
        var viewportWidth = window.innerWidth;
        var scrollDistance = trackWidth - viewportWidth + 80; // 80px for right padding

        if (scrollDistance <= 0) return; // No need for horizontal scroll

        gsap.to(track, {
          x: function () { return -scrollDistance; },
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: function () { return '+=' + scrollDistance; },
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      });
    });
  }

  // --- Initialize horizontal scroll after animations are ready ---
  function onAnimationsReady() {
    // Wait for the animation system to be ready (it initializes at 900ms after load)
    setTimeout(initHorizontalScroll, 1000);
  }

  if (document.readyState === 'complete') {
    onAnimationsReady();
  } else {
    window.addEventListener('load', onAnimationsReady);
  }

})();
