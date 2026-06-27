/**
 * BULADEV + ASA shared frontend behavior.
 * Vanilla JavaScript only. No build process or external framework required.
 */

// Add a class early so reveal effects only run when JavaScript is available.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = document.querySelector('#siteHeader');
  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNav = document.querySelector('#primaryNav');

  // Sticky header shadow provides visual separation after scrolling.
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Accessible mobile navigation.
  if (menuToggle && primaryNav) {
    const closeMenu = () => {
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      primaryNav.classList.remove('is-open');
      body.classList.remove('nav-open');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.classList.toggle('is-active', !isOpen);
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      primaryNav.classList.toggle('is-open', !isOpen);
      body.classList.toggle('nav-open', !isOpen);
    });

    primaryNav.querySelectorAll('a:not(.has-dropdown > a)').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  // Service dropdown works by click on touch/mobile and remains hover-enabled on desktop.
  document.querySelectorAll('.has-dropdown > .nav-link').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (window.matchMedia('(max-width: 900px)').matches) {
        event.preventDefault();
        const parent = trigger.closest('.has-dropdown');
        const isOpen = parent.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      }
    });
  });

  // Reusable FAQ accordion. Multiple items can remain open for easy comparison.
  document.querySelectorAll('[data-accordion] .accordion-item').forEach(item => {
    const button = item.querySelector('button');
    if (!button) return;
    button.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Portfolio filter: hides nonmatching cards without modifying page URLs.
  const filterRoot = document.querySelector('[data-project-filter]');
  const projectCards = document.querySelectorAll('.project-card[data-category]');
  if (filterRoot && projectCards.length) {
    filterRoot.querySelectorAll('button[data-filter]').forEach(button => {
      button.addEventListener('click', () => {
        filterRoot.querySelectorAll('button').forEach(item => item.classList.remove('is-active'));
        button.classList.add('is-active');
        const filter = button.dataset.filter;
        projectCards.forEach(card => {
          card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.category !== filter);
        });
      });
    });
  }

  // Lightweight reveal animation. IntersectionObserver avoids scroll-event overhead.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }


  // Requested homepage number animation for the visible 20+ and 100% counters.
  // Uses IntersectionObserver so counters start only when the section enters view.
  const counters = document.querySelectorAll('[data-counter]');
  const runCounter = counter => {
    const endValue = Number(counter.dataset.counter || 0);
    const suffix = counter.dataset.counterSuffix || '';
    const duration = 1200;
    const startTime = performance.now();

    const update = currentTime => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = `${Math.round(endValue * eased)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = `${endValue}${suffix}`;
        counter.classList.add('counter-finished');
      }
    };

    requestAnimationFrame(update);
  };

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.35 });

      counters.forEach(counter => counterObserver.observe(counter));
    } else {
      counters.forEach(runCounter);
    }
  }

  // Current year remains accurate without manual footer updates.
  document.querySelectorAll('[data-current-year]').forEach(node => {
    node.textContent = new Date().getFullYear();
  });

  // Front-end validation message. The form then submits to the configured provider.
  const projectForm = document.querySelector('[data-project-form]');
  if (projectForm) {
    projectForm.addEventListener('submit', event => {
      if (!projectForm.checkValidity()) {
        event.preventDefault();
        projectForm.reportValidity();
        return;
      }
      const submit = projectForm.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending Request…';
      }
    });
  }
});

/**
 * Optional integrations are configured in assets/js/site-config.js.
 * Blank values remain hidden, so unapproved social profiles or map locations
 * are never displayed to visitors.
 */
document.addEventListener('DOMContentLoaded', () => {
  const config = window.BULADEV_SITE_CONFIG || {};
  const social = config.social || {};
  const labels = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    youtube: 'YouTube'
  };

  document.querySelectorAll('[data-social-links]').forEach(container => {
    const approvedLinks = Object.entries(labels)
      .filter(([key]) => typeof social[key] === 'string' && social[key].trim())
      .map(([key, label]) => ({ label, url: social[key].trim() }));

    if (!approvedLinks.length) return;

    const fragment = document.createDocumentFragment();
    approvedLinks.forEach(({ label, url }) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = label;
      fragment.appendChild(link);
    });
    container.appendChild(fragment);
    container.hidden = false;
  });

  // A confirmed Google Maps embed URL turns the service-area panel into a live map.
  const mapContainer = document.querySelector('[data-map-container]');
  const mapUrl = typeof config.googleMapsEmbedUrl === 'string'
    ? config.googleMapsEmbedUrl.trim()
    : '';
  if (mapContainer && mapUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = mapUrl;
    iframe.title = 'BULADEV and ASA Construction service location map';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    mapContainer.replaceChildren(iframe);
    mapContainer.classList.add('has-live-map');
  }

  // Secure any approved external link that opens a new browsing context.
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.rel = 'noopener noreferrer';
  });
});
