/* ============================================================
   ON WHITE CLINIC — Main JavaScript
   All interactivity & animations for the dental clinic site.
   Alive, fun, and buttery smooth.
   ============================================================ */
;(function () {
  'use strict'

  /* ----------------------------------------------------------
     1. SCROLL REVEAL (IntersectionObserver)
     Elements with .reveal or .reveal-scale get class "vis"
     once they enter the viewport. CSS handles the actual
     animation via animation-delay set as inline styles.
     ---------------------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  )

  document.querySelectorAll('.reveal, .reveal-scale').forEach(function (el) {
    revealObserver.observe(el)
  })

  /* ----------------------------------------------------------
     2. HEADER SCROLL — compact header + sticky CTA bar
     - Header gets "scrolled" class after 40px
     - Sticky bar becomes "visible" after 500px
     ---------------------------------------------------------- */
  var header = document.getElementById('header')
  var stickyBar = document.getElementById('stickyBar')

  window.addEventListener(
    'scroll',
    function () {
      var y = window.scrollY

      if (header) {
        header.classList.toggle('scrolled', y > 40)
      }

      if (stickyBar) {
        stickyBar.classList.toggle('visible', y > 500)
      }
    },
    { passive: true }
  )

  /* ----------------------------------------------------------
     3. MOBILE MENU — burger toggle
     Toggles "active" on burger + mobile menu, locks body
     scroll. Closes when any nav link is tapped.
     ---------------------------------------------------------- */
  var burger = document.getElementById('burger')
  var mobileMenu = document.getElementById('mobileMenu')

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('active')
      mobileMenu.classList.toggle('active')
      document.body.style.overflow = mobileMenu.classList.contains('active')
        ? 'hidden'
        : ''
    })

    // Close menu on any link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('active')
        mobileMenu.classList.remove('active')
        document.body.style.overflow = ''
      })
    })
  }

  /* ----------------------------------------------------------
     4. FAQ ACCORDION
     Only one item open at a time. Clicking an open item
     closes it. aria-expanded toggled for accessibility.
     ---------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-item__q')
    if (!btn) return

    btn.addEventListener('click', function () {
      var isActive = item.classList.contains('active')

      // Close every item first
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('active')
        var b = i.querySelector('.faq-item__q')
        if (b) b.setAttribute('aria-expanded', 'false')
      })

      // Re-open this one only if it was closed
      if (!isActive) {
        item.classList.add('active')
        btn.setAttribute('aria-expanded', 'true')
      }
    })
  })

  /* ----------------------------------------------------------
     5. SMOOTH SCROLL — anchor links
     Offsets by header height + 16px breathing room.
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = anchor.getAttribute('href')
      if (targetId === '#' || targetId.length < 2) return

      var target = document.querySelector(targetId)
      if (!target) return

      e.preventDefault()

      var headerHeight = header ? header.offsetHeight : 0
      var top =
        target.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        16

      window.scrollTo({ top: top, behavior: 'smooth' })
    })
  })

  /* ----------------------------------------------------------
     6. 3D CARD TILT — treatment cards (.t-card)
     Mouse position mapped to subtle perspective rotation.
     Springs back with a custom cubic-bezier on leave.
     ---------------------------------------------------------- */
  document.querySelectorAll('.t-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect()
      var x = (e.clientX - rect.left) / rect.width - 0.5   // -0.5 … 0.5
      var y = (e.clientY - rect.top) / rect.height - 0.5

      card.style.transform =
        'perspective(600px) rotateY(' +
        x * 10 +
        'deg) rotateX(' +
        -y * 10 +
        'deg) translateY(-8px)'
    })

    card.addEventListener('mouseleave', function () {
      card.style.transform = ''
      card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'

      setTimeout(function () {
        card.style.transition = ''
      }, 600)
    })
  })

  /* ----------------------------------------------------------
     7. PARALLAX ON HERO — image + floating cards
     Only active above 768px viewport width.
     Runs until scrollY exceeds 1.2x viewport height.
     ---------------------------------------------------------- */
  var heroImg = document.querySelector('.hero__img-wrap')
  var floatRating = document.querySelector('.hero__float--rating')
  var floatCases = document.querySelector('.hero__float--cases')

  window.addEventListener(
    'scroll',
    function () {
      if (window.innerWidth <= 768) return

      var y = window.scrollY
      if (y > window.innerHeight * 1.2) return

      if (heroImg) {
        heroImg.style.transform = 'translateY(' + y * 0.08 + 'px)'
      }
      if (floatRating) {
        floatRating.style.transform = 'translateY(' + y * -0.12 + 'px)'
      }
      if (floatCases) {
        floatCases.style.transform = 'translateY(' + y * -0.06 + 'px)'
      }
    },
    { passive: true }
  )

  /* ----------------------------------------------------------
     8. COUNTER ANIMATION — animate numbers on scroll
     Uses requestAnimationFrame for smooth 60fps counting.
     Easing: ease-out quart — 1 - (1 - t)^4
     Locale: es-ES for thousand separators (1.250, 3.400…)
     ---------------------------------------------------------- */
  var counterObserver = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return

        var el = entry.target
        observer.unobserve(el)

        var target = parseInt(el.getAttribute('data-count'), 10)
        if (isNaN(target)) return

        var prefix = el.getAttribute('data-prefix') || ''
        var suffix = el.getAttribute('data-suffix') || ''
        var duration = 2000
        var startTime = null

        function step(timestamp) {
          if (!startTime) startTime = timestamp
          var elapsed = timestamp - startTime
          var progress = Math.min(elapsed / duration, 1)

          // Ease-out quart
          var eased = 1 - Math.pow(1 - progress, 4)
          var current = Math.round(eased * target)

          el.textContent =
            prefix + current.toLocaleString('es-ES') + suffix

          if (progress < 1) {
            requestAnimationFrame(step)
          }
        }

        requestAnimationFrame(step)
      })
    },
    { threshold: 0.5 }
  )

  document.querySelectorAll('[data-count]').forEach(function (el) {
    counterObserver.observe(el)
  })

  /* ----------------------------------------------------------
     9. INSTAGRAM GRID HOVER — sibling dim effect
     Hovering one image dims all siblings to 0.5 opacity,
     making the hovered photo pop.
     ---------------------------------------------------------- */
  var instaImages = document.querySelectorAll('.insta__grid img')

  instaImages.forEach(function (img) {
    img.addEventListener('mouseenter', function () {
      instaImages.forEach(function (sibling) {
        if (sibling !== img) sibling.style.opacity = '0.5'
      })
    })

    img.addEventListener('mouseleave', function () {
      instaImages.forEach(function (sibling) {
        sibling.style.opacity = '1'
      })
    })
  })

  /* ----------------------------------------------------------
     10. SLIDER ARROWS — click to scroll, infinite loop
     Each arrow has data-slider pointing to the slider ID.
     Scrolls by one card width. Loops back to start/end.
     ---------------------------------------------------------- */
  document.querySelectorAll('.slider-arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sliderId = btn.getAttribute('data-slider')
      var slider = document.getElementById(sliderId)
      if (!slider) return

      var card = slider.querySelector('.t-card, .ba-card, .review-card')
      if (!card) return

      var scrollAmount = card.offsetWidth + 20
      var svgPath = btn.querySelector('path')
      var isLeft = svgPath && svgPath.getAttribute('d').indexOf('15') === 1

      if (isLeft) {
        if (slider.scrollLeft <= 10) {
          // At start — jump to end
          slider.scrollTo({ left: slider.scrollWidth, behavior: 'smooth' })
        } else {
          slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
        }
      } else {
        var maxScroll = slider.scrollWidth - slider.clientWidth
        if (slider.scrollLeft >= maxScroll - 10) {
          // At end — jump to start
          slider.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          slider.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
      }
    })
  })

  /* ----------------------------------------------------------
     11. SCROLL TO TOP — footer button
     ---------------------------------------------------------- */
  var scrollTopBtn = document.getElementById('scrollTop')
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
})()
