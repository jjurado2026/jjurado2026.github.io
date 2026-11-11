/* ============================================
   VELARQUE — Landing Web Advanced Animations
   Aurora (CSS) + Typewriter + Split Timeline + Splide
   Requires: gsap, ScrollTrigger, Splide
   ============================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // ═══════════════════════════════════════════
  // 1. HERO — Character split with spring physics
  // ═══════════════════════════════════════════
  function initCharSplit() {
    var el = document.querySelector('[data-lw="char-split"]');
    if (!el) return;

    var words = el.querySelectorAll('.hero__word');
    words.forEach(function (word) {
      var text = word.innerHTML;
      var html = '';
      var inTag = false;
      var tagBuffer = '';

      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === '<') { inTag = true; tagBuffer += ch; continue; }
        if (inTag) {
          tagBuffer += ch;
          if (ch === '>') { inTag = false; html += tagBuffer; tagBuffer = ''; }
          continue;
        }
        if (ch === ' ') {
          html += '<span class="lw-char">&nbsp;</span>';
        } else {
          html += '<span class="lw-char">' + ch + '</span>';
        }
      }
      word.innerHTML = html;
    });

    var chars = el.querySelectorAll('.lw-char');
    if (!chars.length) return;

    gsap.set(chars, { opacity: 0, y: 100, rotateX: -90 });

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 1.2,
      stagger: 0.03,
      ease: 'back.out(1.7)',
      delay: 0.6,
    });
  }

  // ═══════════════════════════════════════════
  // 2. HERO — Typewriter cycling phrases
  // ═══════════════════════════════════════════
  function initTypewriter() {
    var wrapper = document.querySelector('[data-lw="typewriter"]');
    if (!wrapper) return;
    var textEl = wrapper.querySelector('.lw-typewriter__text');
    if (!textEl) return;

    var phrases = [
      'Diseño a medida',
      'Código limpio',
      'Entrega en semanas',
      'Resultados reales',
      'SEO que posiciona',
    ];

    var phraseIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 65;
    var deleteSpeed = 35;
    var pauseAfterType = 2200;
    var pauseAfterDelete = 400;

    // Fade the typewriter in after hero animation
    gsap.fromTo(wrapper,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 2.2 }
    );

    function tick() {
      var current = phrases[phraseIndex];

      if (!isDeleting) {
        charIndex++;
        textEl.textContent = current.substring(0, charIndex);

        if (charIndex === current.length) {
          setTimeout(function () {
            isDeleting = true;
            tick();
          }, pauseAfterType);
          return;
        }
        setTimeout(tick, typeSpeed + Math.random() * 40);
      } else {
        charIndex--;
        textEl.textContent = current.substring(0, charIndex);

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(tick, pauseAfterDelete);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }

    setTimeout(tick, 2800);
  }

  // ═══════════════════════════════════════════
  // 3. HERO — Scroll indicator + aurora parallax
  // ═══════════════════════════════════════════
  function initHeroSecondary() {
    var scroll = document.querySelector('.lw-hero .hero__scroll');
    if (scroll) {
      gsap.fromTo(scroll, { opacity: 0 }, { opacity: 1, duration: 1, delay: 2.4 });
    }

    // Parallax the aurora on scroll
    var aurora = document.querySelector('.lw-hero__aurora');
    if (aurora) {
      gsap.to(aurora, {
        y: -80,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.lw-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // 4. VELOCITY MARQUEE — with dynamic skew
  // ═══════════════════════════════════════════
  function initVelocityMarquee() {
    var section = document.querySelector('[data-lw="velocity-marquee"]');
    if (!section) return;
    var track = section.querySelector('.lw-marquee__track');
    if (!track) return;

    track.innerHTML += track.innerHTML;

    var baseSpeed = -1.5;
    var velocityMultiplier = 0;
    var currentX = 0;
    var currentSkew = 0;
    var halfWidth = track.scrollWidth / 2;

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) {
        var vel = self.getVelocity();
        velocityMultiplier = Math.abs(vel) / 600;
        var targetSkew = Math.min(Math.max(vel / 400, -5), 5);
        currentSkew += (targetSkew - currentSkew) * 0.08;
      },
    });

    function tick() {
      var speed = baseSpeed * (1 + Math.min(velocityMultiplier, 10));
      currentX += speed;
      if (Math.abs(currentX) >= halfWidth) currentX = 0;

      currentSkew *= 0.96;
      velocityMultiplier *= 0.94;

      gsap.set(track, { x: currentX, skewX: currentSkew });
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ═══════════════════════════════════════════
  // 5. PAIN POINTS — word-by-word scrub + highlights
  // ═══════════════════════════════════════════
  function initPainReveal() {
    var title = document.querySelector('.lw-pain__title');
    if (title) {
      function wrapWords(el) {
        var nodes = Array.from(el.childNodes);
        nodes.forEach(function (node) {
          if (node.nodeType === 3) {
            var parts = node.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (/\S/.test(p)) {
                var span = document.createElement('span');
                span.className = 'lw-word';
                span.textContent = p;
                frag.appendChild(span);
              } else if (p) {
                frag.appendChild(document.createTextNode(p));
              }
            });
            node.parentNode.replaceChild(frag, node);
          } else if (node.nodeType === 1) {
            wrapWords(node);
          }
        });
      }

      wrapWords(title);

      var wordSpans = title.querySelectorAll('.lw-word');
      if (wordSpans.length) {
        gsap.set(wordSpans, { opacity: 0.12 });
        gsap.to(wordSpans, {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: {
            trigger: title,
            start: 'top 80%',
            end: 'bottom 50%',
            scrub: 1,
          },
        });
      }
    }

    // Highlight sweep
    var highlights = document.querySelectorAll('[data-lw="highlight"]');
    highlights.forEach(function (hl) {
      ScrollTrigger.create({
        trigger: hl,
        start: 'top 75%',
        onEnter: function () { hl.classList.add('is-active'); },
      });
    });

    // Subtitle
    var subtitle = document.querySelector('.lw-pain__subtitle');
    if (subtitle) {
      gsap.fromTo(subtitle,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: subtitle, start: 'top 85%' },
        }
      );
    }
  }

  // ═══════════════════════════════════════════
  // 6. MANIFESTO — Text split word reveal
  // ═══════════════════════════════════════════
  function initManifestoReveal() {
    var text = document.querySelector('.lw-manifesto__text');
    if (!text) return;

    // Decorative line animation
    var section = document.querySelector('.lw-manifesto');
    if (section) {
      gsap.fromTo(section,
        { '--line-width': '0px' },
        {
          '--line-width': '60px', duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 85%' },
        }
      );
    }

    // Split text into words, preserving <em> tags
    function wrapManifestoWords(el) {
      var nodes = Array.from(el.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (/\S/.test(p)) {
              var span = document.createElement('span');
              span.className = 'lw-mword';
              span.textContent = p;
              span.style.display = 'inline-block';
              span.style.willChange = 'transform, opacity';
              frag.appendChild(span);
            } else if (p) {
              frag.appendChild(document.createTextNode(p));
            }
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName !== 'BR') {
          wrapManifestoWords(node);
        }
      });
    }

    wrapManifestoWords(text);

    var mWords = text.querySelectorAll('.lw-mword');
    if (mWords.length) {
      gsap.set(mWords, { opacity: 0, y: 40 });
      gsap.to(mWords, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: text,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: 1,
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // 7. SOLUTION CARDS — cinematic entrance + 3D tilt
  // ═══════════════════════════════════════════
  function initSolutionCards() {
    var cards = document.querySelectorAll('.lw-solution-card');
    if (!cards.length) return;

    var entrances = [
      { x: -80, y: 80, rotation: -5 },
      { x: 0, y: 120, rotation: 0 },
      { x: 80, y: 80, rotation: 5 },
    ];

    cards.forEach(function (card, i) {
      var from = entrances[i] || entrances[1];
      gsap.fromTo(card,
        { opacity: 0, x: from.x, y: from.y, rotation: from.rotation, scale: 0.88 },
        {
          opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
          duration: 1.4, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 90%' },
        }
      );
    });

    // 3D tilt on hover (desktop only)
    if (window.matchMedia('(pointer: coarse)').matches) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;

        gsap.to(card, {
          rotateX: (y - 0.5) * -12,
          rotateY: (x - 0.5) * 12,
          duration: 0.4,
          ease: 'power2.out',
          transformPerspective: 800,
          transformOrigin: 'center center',
        });

        var content = card.querySelector('.lw-solution-card__content');
        if (content) {
          gsap.to(content, {
            x: (x - 0.5) * 10,
            y: (y - 0.5) * 10,
            duration: 0.4,
            ease: 'power2.out',
          });
        }
      });

      card.addEventListener('mouseleave', function () {
        gsap.to(card, {
          rotateX: 0, rotateY: 0,
          duration: 0.8, ease: 'elastic.out(1, 0.4)',
        });
        var content = card.querySelector('.lw-solution-card__content');
        if (content) {
          gsap.to(content, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
        }
      });
    });
  }

  // ═══════════════════════════════════════════
  // 8. STATS — card entrance + count up + bar fills
  // ═══════════════════════════════════════════
  function initStatsDramatic() {
    var section = document.querySelector('[data-lw="stats-pin"]');
    if (!section) return;

    var cards = section.querySelectorAll('.lw-stat-card');
    var numbers = section.querySelectorAll('[data-lw-count]');
    if (!numbers.length) return;

    // Cards entrance
    gsap.fromTo(cards,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 70%' },
      }
    );

    // Count up numbers
    numbers.forEach(function (el, i) {
      var target = parseFloat(el.getAttribute('data-lw-count'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (String(target).split('.')[1] || '').length;
      var obj = { val: 0 };

      ScrollTrigger.create({
        trigger: section,
        start: 'top 65%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target,
            duration: 2.5,
            ease: 'power4.out',
            delay: i * 0.12,
            onUpdate: function () {
              el.textContent = prefix + obj.val.toFixed(decimals) + suffix;
            },
          });

          // Fill progress bars
          var bars = section.querySelectorAll('.lw-stat-card__bar-fill');
          bars.forEach(function (bar) {
            setTimeout(function () {
              bar.classList.add('is-filled');
            }, 300);
          });
        },
      });
    });
  }

  // ═══════════════════════════════════════════
  // 9. TIMELINE — Split sticky with preview swapping
  // ═══════════════════════════════════════════
  function initTimeline() {
    var timeline = document.querySelector('[data-lw="timeline"]');
    if (!timeline) return;

    var lineFill = timeline.querySelector('.lw-timeline__line-fill');
    var items = timeline.querySelectorAll('.lw-timeline__item');
    var dots = timeline.querySelectorAll('.lw-timeline__dot');
    var previewImgs = timeline.querySelectorAll('.lw-timeline__preview-img');

    if (!lineFill || !items.length) return;

    // Scroll-driven progress line
    gsap.to(lineFill, {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: timeline.querySelector('.lw-timeline__left'),
        start: 'top 60%',
        end: 'bottom 50%',
        scrub: 1,
      },
    });

    // Activate dots + swap preview images as steps enter viewport
    items.forEach(function (item, i) {
      ScrollTrigger.create({
        trigger: item,
        start: 'top 65%',
        onEnter: function () {
          dots[i].classList.add('is-active');
          swapPreview(i);
        },
        onLeaveBack: function () {
          dots[i].classList.remove('is-active');
          swapPreview(Math.max(0, i - 1));
        },
      });
    });

    function swapPreview(index) {
      if (!previewImgs.length) return;
      previewImgs.forEach(function (img, j) {
        if (j === index) {
          img.classList.add('is-active');
        } else {
          img.classList.remove('is-active');
        }
      });
    }

    // Timeline items: staggered entrance from left
    items.forEach(function (item) {
      var content = item.querySelector('.lw-timeline__content');
      if (!content) return;

      gsap.fromTo(content,
        { opacity: 0, x: -40, y: 20 },
        {
          opacity: 1, x: 0, y: 0,
          duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 75%' },
        }
      );
    });

    // Preview image entrance
    var previewBox = timeline.querySelector('.lw-timeline__preview');
    if (previewBox) {
      gsap.fromTo(previewBox,
        { opacity: 0, scale: 0.92, y: 30 },
        {
          opacity: 1, scale: 1, y: 0,
          duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: timeline, start: 'top 70%' },
        }
      );
    }
  }

  // ═══════════════════════════════════════════
  // 10. CASES — Horizontal scroll pinned
  // ═══════════════════════════════════════════
  function initCasesHorizontal() {
    var section = document.querySelector('[data-lw="cases-horizontal"]');
    var track = document.querySelector('[data-lw="cases-track"]');
    if (!section || !track) return;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var cards = track.children;
        if (!cards.length) return;

        var trackWidth = track.scrollWidth;
        var viewportWidth = window.innerWidth;
        var scrollDistance = trackWidth - viewportWidth + 80;

        if (scrollDistance <= 0) return;

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

        // Cards entrance animation
        var cardEls = track.querySelectorAll('.lw-case-card');
        gsap.fromTo(cardEls,
          { opacity: 0, y: 60, scale: 0.92 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.8, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 85%' },
          }
        );

        // Image parallax within each card
        cardEls.forEach(function (card) {
          var img = card.querySelector('.lw-case-card__img img');
          if (img) {
            gsap.set(img, { scale: 1.12 });
            gsap.to(img, {
              y: -30,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: function () { return '+=' + scrollDistance; },
                scrub: 1,
              },
            });
          }
        });

        // Tags pop in
        var tags = track.querySelectorAll('.lw-case-card__tag');
        tags.forEach(function (tag) {
          gsap.fromTo(tag,
            { opacity: 0, x: -20, scale: 0.8 },
            {
              opacity: 1, x: 0, scale: 1,
              duration: 0.6, ease: 'back.out(1.5)',
              scrollTrigger: { trigger: section, start: 'top 80%' },
            }
          );
        });
      });
    });
  }

  // ═══════════════════════════════════════════
  // 11. TESTIMONIALS — Splide slider + custom arrows + counter
  // ═══════════════════════════════════════════
  function initTestimonials() {
    var slider = document.getElementById('lwTestimonialsSlider');
    if (!slider || typeof Splide === 'undefined') return;

    var splideInstance = new Splide('#lwTestimonialsSlider', {
      type: 'fade',
      rewind: true,
      perPage: 1,
      pagination: false,
      arrows: false,
      autoplay: true,
      interval: 5000,
      speed: 800,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });

    // Custom arrow controls
    var prevBtn = document.getElementById('lwTestPrev');
    var nextBtn = document.getElementById('lwTestNext');
    var currentEl = document.getElementById('lwTestCurrent');
    var totalEl = document.getElementById('lwTestTotal');

    splideInstance.on('mounted', function () {
      var total = splideInstance.length;
      if (totalEl) totalEl.textContent = total < 10 ? '0' + total : total;
      updateCounter(0);
    });

    splideInstance.on('move', function (newIndex) {
      updateCounter(newIndex);
    });

    function updateCounter(index) {
      var num = index + 1;
      if (currentEl) currentEl.textContent = num < 10 ? '0' + num : num;
    }

    splideInstance.mount();

    if (prevBtn) prevBtn.addEventListener('click', function () { splideInstance.go('<'); });
    if (nextBtn) nextBtn.addEventListener('click', function () { splideInstance.go('>'); });

    // Section reveal
    var section = document.querySelector('.lw-testimonials');
    if (section) {
      var header = section.querySelector('.lw-testimonials__header');
      if (header) {
        gsap.fromTo(header,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 80%' },
          }
        );
      }

      // Stage entrance
      var stage = section.querySelector('.lw-testimonials__stage');
      if (stage) {
        gsap.fromTo(stage,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: stage, start: 'top 85%' },
          }
        );
      }

      // Decorative marks entrance
      var marks = section.querySelectorAll('.lw-testimonials__mark');
      marks.forEach(function (mark, i) {
        gsap.fromTo(mark,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 0.08, scale: 1,
            duration: 1.5, ease: 'power3.out', delay: 0.3 + i * 0.2,
            scrollTrigger: { trigger: section, start: 'top 80%' },
          }
        );
      });
    }
  }

  // ═══════════════════════════════════════════
  // 12. PRICING — two-column reveal
  // ═══════════════════════════════════════════
  function initPricingReveal() {
    var section = document.querySelector('.lw-pricing');
    if (!section) return;

    // Left column cascade
    var left = section.querySelector('.lw-pricing__left');
    if (left) {
      gsap.fromTo(Array.from(left.children),
        { opacity: 0, x: -40 },
        {
          opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%' },
        }
      );
    }

    // Price amount pop
    var amount = section.querySelector('.lw-pricing__amount');
    if (amount) {
      gsap.fromTo(amount,
        { scale: 0.5, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: section, start: 'top 70%' },
        }
      );
    }

    // Right features stagger
    var features = section.querySelectorAll('.lw-pricing__feature');
    if (features.length) {
      gsap.fromTo(features,
        { opacity: 0, x: 40 },
        {
          opacity: 1, x: 0,
          duration: 0.6, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: features[0], start: 'top 88%' },
        }
      );
    }
  }

  // ═══════════════════════════════════════════
  // 13. FAQ — smooth GSAP height animation (centered cards)
  // ═══════════════════════════════════════════
  function initFaqSmooth() {
    var items = document.querySelectorAll('.lw-faq-item');

    items.forEach(function (item) {
      var answer = item.querySelector('.lw-faq-item__a');
      var summary = item.querySelector('summary');
      if (!answer || !summary) return;

      answer.style.overflow = 'hidden';

      if (!item.open) {
        answer.style.height = '0px';
        answer.style.opacity = '0';
      }

      summary.addEventListener('click', function (e) {
        e.preventDefault();

        if (item.open) {
          gsap.to(answer, {
            height: 0, opacity: 0, duration: 0.4, ease: 'power3.inOut',
            onComplete: function () { item.open = false; },
          });
        } else {
          answer.style.height = '0px';
          answer.style.opacity = '0';
          item.open = true;
          var targetH = answer.scrollHeight;
          gsap.fromTo(answer,
            { height: 0, opacity: 0 },
            {
              height: targetH, opacity: 1, duration: 0.5, ease: 'power3.out',
              onComplete: function () { answer.style.height = 'auto'; },
            }
          );
        }
      });
    });

    // Header reveal
    var faqHeader = document.querySelector('.lw-faq__header');
    if (faqHeader) {
      gsap.fromTo(Array.from(faqHeader.children),
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: faqHeader, start: 'top 80%' },
        }
      );
    }

    // Cards stagger entrance
    var faqList = document.querySelector('.lw-faq__list');
    if (faqList) {
      gsap.fromTo(items,
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: faqList, start: 'top 80%' },
        }
      );
    }
  }

  // ═══════════════════════════════════════════
  // 14. CONTACT — cascade reveal
  // ═══════════════════════════════════════════
  function initContactCascade() {
    var left = document.querySelector('.lw-contact__left');
    if (left) {
      gsap.fromTo(Array.from(left.children),
        { opacity: 0, x: -40 },
        {
          opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: left, start: 'top 80%' },
        }
      );
    }

    var form = document.querySelector('.contact-form');
    if (form) {
      var els = form.querySelectorAll('.contact-form__group, .contact-form__row, .btn-main, .contact-form__note');
      gsap.fromTo(els,
        { opacity: 0, x: 60, rotation: 1 },
        {
          opacity: 1, x: 0, rotation: 0,
          duration: 0.7, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: form, start: 'top 80%' },
        }
      );
    }
  }

  // ═══════════════════════════════════════════
  // 15. FOOTER — bottom bar reveal (landing: top is hidden)
  // ═══════════════════════════════════════════
  function initFooterReveal() {
    var footer = document.querySelector('.footer');
    if (!footer) return;

    var bottom = footer.querySelector('.footer__bottom');
    if (bottom) {
      gsap.fromTo(bottom,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: footer, start: 'top 95%' },
        }
      );
    }
  }

  // ═══════════════════════════════════════════
  // MASTER INIT
  // ═══════════════════════════════════════════
  function initAll() {
    initCharSplit();
    initTypewriter();
    initHeroSecondary();
    initVelocityMarquee();
    initPainReveal();
    initManifestoReveal();
    initSolutionCards();
    initStatsDramatic();
    initTimeline();
    initCasesHorizontal();
    initTestimonials();
    initPricingReveal();
    initFaqSmooth();
    initContactCascade();
    initFooterReveal();
  }

  // Wait for loader (animations.js fires at 900ms, we fire at 950ms)
  function onPageReady() {
    setTimeout(initAll, 950);
  }

  if (document.readyState === 'complete') {
    onPageReady();
  } else {
    window.addEventListener('load', onPageReady);
  }

})();
