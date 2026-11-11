/* ============================================
   VELARQUE — Global JS
   Shared across all pages
   (Animations handled by animations.js + GSAP)
   ============================================ */

(function () {
  'use strict';

  // --- LOADER ---
  var loader = document.getElementById('loader');
  function hideLoader() {
    setTimeout(function () {
      if (loader) loader.classList.add('hidden');
      document.body.style.overflow = '';
      // Layout changed — tell ScrollTrigger to recalculate
      if (typeof ScrollTrigger !== 'undefined') {
        requestAnimationFrame(function () {
          ScrollTrigger.refresh();
        });
      }
    }, 800);
  }
  if (loader) {
    document.body.style.overflow = 'hidden';
  }
  // Handle loader regardless of readyState
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }

  // --- CUSTOM CURSOR ---
  var cursor = document.getElementById('cursor');
  var follower = document.getElementById('cursorFollower');

  if (cursor && follower && !window.matchMedia('(pointer: coarse)').matches) {
    var mouseX = 0, mouseY = 0;
    var followerX = 0, followerY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    function animateFollower() {
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';
      requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover effect on interactive elements
    var hoverTargets = 'a, button, .work-card, .solution-card, .service-card, .value-block, .blog-card, .project-card, .tech-item, .team-card, .contact-block, .result-card, details summary';
    document.querySelectorAll(hoverTargets).forEach(function (el) {
      el.addEventListener('mouseenter', function () { follower.classList.add('hovering'); });
      el.addEventListener('mouseleave', function () { follower.classList.remove('hovering'); });
    });
  }

  // --- NAV ---
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 100) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    }, { passive: true });
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('nav__links--open');
      navToggle.classList.toggle('nav__toggle--open');
    });
  }

  // Active nav link detection
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links > a, .nav__dropdown a').forEach(function (link) {
    var linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
      // If inside dropdown, also mark parent
      var parentItem = link.closest('.nav__item');
      if (parentItem) parentItem.querySelector(':scope > a').classList.add('active');
    }
  });

  // Nav dropdown toggle for touch devices
  var navItems = document.querySelectorAll('.nav__item');
  navItems.forEach(function (item) {
    var trigger = item.querySelector(':scope > a');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      if (window.matchMedia('(pointer: coarse)').matches && item.querySelector('.nav__dropdown')) {
        e.preventDefault();
        item.classList.toggle('nav__item--open');
      }
    });
  });

  // Smooth scroll for anchor links via Lenis or fallback
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      var target = document.querySelector(href);
      if (target) {
        // Use Lenis if available
        var lenis = window.VelarqueAnimations && window.VelarqueAnimations.getLenis();
        if (lenis) {
          lenis.scrollTo(target, { offset: 0 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (navLinks) {
          navLinks.classList.remove('nav__links--open');
          if (navToggle) navToggle.classList.remove('nav__toggle--open');
        }
      }
    });
  });

  // Close mobile menu on link click
  if (navLinks) {
    navLinks.querySelectorAll('a:not([href^="#"])').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('nav__links--open');
        if (navToggle) navToggle.classList.remove('nav__toggle--open');
      });
    });
  }

})();
