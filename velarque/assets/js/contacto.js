/* ============================================
   VELARQUE — Contacto JS
   Form validation + contact block reveals
   ============================================ */

(function () {
  'use strict';

  // --- CONTACT BLOCK STAGGER REVEAL ---
  const blocks = document.querySelectorAll('.contact-block');
  if (blocks.length) {
    const blockObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const siblings = entry.target.parentElement.querySelectorAll('.contact-block');
          siblings.forEach((block, i) => {
            setTimeout(() => block.classList.add('visible'), i * 150);
          });
          blockObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    blockObserver.observe(blocks[0]);
  }

  // --- FORM VALIDATION ---
  const form = document.getElementById('contactForm');
  if (!form) return;

  function showError(field, message) {
    clearError(field);
    field.classList.add('error');
    const el = document.createElement('span');
    el.className = 'contact-form__error';
    el.textContent = message;
    field.parentElement.appendChild(el);
  }

  function clearError(field) {
    field.classList.remove('error');
    const existing = field.parentElement.querySelector('.contact-form__error');
    if (existing) existing.remove();
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Float select label when value is chosen
  const servicio = form.querySelector('#servicio');
  if (servicio) {
    servicio.addEventListener('change', () => {
      if (servicio.value) {
        servicio.classList.add('has-value');
      } else {
        servicio.classList.remove('has-value');
      }
    });
  }

  // Clear errors on input
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => clearError(field));
    field.addEventListener('change', () => clearError(field));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nombre = form.querySelector('#nombre');
    const email = form.querySelector('#email');
    const servicio = form.querySelector('#servicio');
    const mensaje = form.querySelector('#mensaje');

    if (!nombre.value.trim()) {
      showError(nombre, 'El nombre es obligatorio.');
      valid = false;
    }

    if (!email.value.trim()) {
      showError(email, 'El email es obligatorio.');
      valid = false;
    } else if (!validateEmail(email.value.trim())) {
      showError(email, 'Introduce un email válido.');
      valid = false;
    }

    if (!servicio.value) {
      showError(servicio, 'Selecciona un servicio.');
      valid = false;
    }

    if (!mensaje.value.trim()) {
      showError(mensaje, 'Cuéntanos sobre tu proyecto.');
      valid = false;
    }

    if (valid) {
      // Simulated success — replace with real endpoint in production
      const btn = form.querySelector('.btn-main');
      btn.innerHTML = '<span>Mensaje enviado ✓</span>';
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.7';
      form.querySelectorAll('input, select, textarea').forEach(f => {
        f.disabled = true;
      });
    }
  });

})();