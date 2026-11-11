/* ==========================================================================
   CRUZ BLANCA DE VALLECAS — Main JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --- Nav scroll effect --- */
    const nav = document.querySelector('.nav');
    if (nav) {
        const onScroll = () => {
            nav.classList.toggle('scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* --- Mobile menu --- */
    const hamburger = document.querySelector('.nav__hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';

            // Stagger mobile links
            if (isOpen) {
                const links = mobileMenu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta');
                links.forEach((link, i) => {
                    link.style.transitionDelay = `${150 + i * 80}ms`;
                });
            }
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* --- Scroll reveal --- */
    const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
    if (reveals.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        reveals.forEach(el => observer.observe(el));
    }

    /* --- Counter animation --- */
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => counterObserver.observe(el));
    }

    function animateCounter(el) {
        const target = parseFloat(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const isDecimal = target % 1 !== 0;
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            el.textContent = prefix + (isDecimal ? current.toFixed(2) : Math.round(current)) + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /* --- Tabs --- */
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.closest('[data-tab-group]') || btn.parentElement.parentElement;
            const tabId = btn.dataset.tab;

            // Deactivate all
            group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

            // Activate clicked
            btn.classList.add('active');
            const panel = group.querySelector(`[data-panel="${tabId}"]`);
            if (panel) panel.classList.add('active');
        });
    });

    /* --- Lightbox --- */
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = lightbox?.querySelector('.lightbox__img');
    const lightboxClose = lightbox?.querySelector('.lightbox__close');

    document.querySelectorAll('[data-lightbox]').forEach(item => {
        item.addEventListener('click', () => {
            if (lightbox && lightboxImg) {
                const src = item.dataset.lightbox || item.querySelector('img')?.src;
                if (src) {
                    lightboxImg.src = src;
                    lightbox.classList.add('open');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) {
                closeLightbox();
            }
        });
    }

    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    /* --- Active nav link based on current page --- */
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link, .mobile-menu__link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    /* --- Smooth scroll for anchor links --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

});
