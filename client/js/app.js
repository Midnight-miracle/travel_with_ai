'use strict';

/**
 * App shell behavior shared by every page:
 * highlights the current nav link, wires the mobile hamburger
 * menu, and stamps the footer year.
 */

(function () {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach((a) => {
    const target = a.getAttribute('href').split('/').pop();
    if (target === here) a.classList.add('active');
  });

  // --- Hamburger menu (mobile / tablet) ---
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');

  if (toggle && nav) {
    const close = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Close after choosing a destination
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
