/**
 * OUTBOUND BATU MALANG - JAVASCRIPT INTERACTIONS
 * Sticky Header, Mobile Menu, Filter Tabs, Counter Animation, FAQ Accordion, Lightbox & WhatsApp Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header
  const header = document.querySelector('.site-header');
  if (header) {
    let isScrolled = false;
    window.addEventListener('scroll', () => {
      const shouldScroll = window.scrollY > 40;
      if (shouldScroll !== isScrolled) {
        isScrolled = shouldScroll;
        header.classList.toggle('scrolled', isScrolled);
      }
    }, { passive: true });
  }

  // 2. Mobile Menu Toggle & Dropdown Handling
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const dropdownItem = document.querySelector('.nav-item.dropdown');
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  
  if (mobileToggle && navLinks) {
    const closeMobileMenu = () => {
      navLinks.classList.remove('mobile-active');
      document.body.style.overflow = '';
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    };

    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      const isExpanded = navLinks.classList.contains('mobile-active');
      document.body.style.overflow = isExpanded ? 'hidden' : '';
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (isExpanded) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu when clicking standard nav links (not dropdown toggle)
    document.querySelectorAll('.nav-link:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });

    // Close menu when clicking dropdown sub-items
    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        closeMobileMenu();
        if (dropdownItem) dropdownItem.classList.remove('is-open');
      });
    });

    // Toggle dropdown submenu on mobile/click
    if (dropdownToggle && dropdownItem) {
      dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdownItem.classList.toggle('is-open');
        const isOpen = dropdownItem.classList.contains('is-open');
        dropdownToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdownItem && !dropdownItem.contains(e.target)) {
        dropdownItem.classList.remove('is-open');
        if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active nav link on scroll (Scrollspy) using IntersectionObserver - Zero reflow!
  const trackedSections = document.querySelectorAll('section[id]');
  const mainNavLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
  if ('IntersectionObserver' in window && trackedSections.length > 0) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          mainNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}` || (id === 'beranda' && (href === '#beranda' || href === 'index.html'))) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    trackedSections.forEach(sec => navObserver.observe(sec));
  }

  // Scroll to Top Button Interaction (throttled with passive scroll & state check)
  const btnScrollTop = document.getElementById('btnScrollTop');
  if (btnScrollTop) {
    let isBtnVisible = false;
    window.addEventListener('scroll', () => {
      const shouldBeVisible = window.scrollY > 320;
      if (shouldBeVisible !== isBtnVisible) {
        isBtnVisible = shouldBeVisible;
        btnScrollTop.classList.toggle('visible', isBtnVisible);
      }
    }, { passive: true });

    btnScrollTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 3. Stats Counter Animation (Single rAF loop to avoid main thread blocking)
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const animateCounters = () => {
    const startTime = performance.now();
    const duration = 1400; // ms
    const counters = Array.from(statNumbers).map(counter => ({
      el: counter,
      target: parseInt(counter.getAttribute('data-target'), 10) || 0
    }));

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      counters.forEach(c => {
        const val = Math.floor(ease * c.target);
        c.el.textContent = val.toLocaleString('id-ID');
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        counters.forEach(c => {
          c.el.textContent = c.target.toLocaleString('id-ID');
        });
      }
    };
    requestAnimationFrame(step);
  };

  const statsSection = document.querySelector('.hero-stats-bar');
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          observer.unobserve(statsSection);
          // Defer counter animation until main thread is idle to maximize FCP & LCP score
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => animateCounters(), { timeout: 2000 });
          } else {
            setTimeout(animateCounters, 800);
          }
        }
      });
    }, { threshold: 0.2 });

    observer.observe(statsSection);
  }

  // 4. Package Filtering
  const filterBtns = document.querySelectorAll('.package-filters .filter-btn');
  const packageCards = document.querySelectorAll('.package-card');
  const packagesGrid = document.querySelector('.packages-grid');
  let filterTimeout = null;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      // Cancel any active animation timeout to prevent lag or stuck states
      if (filterTimeout) clearTimeout(filterTimeout);

      if (packagesGrid) {
        packagesGrid.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        packagesGrid.style.opacity = '0';
        packagesGrid.style.transform = 'scale(0.98)';

        filterTimeout = setTimeout(() => {
          packageCards.forEach(card => {
            const category = card.getAttribute('data-category') || '';
            if (filterValue === 'all' || category.includes(filterValue)) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
            // Clear any lingering inline styles
            card.style.opacity = '';
            card.style.transform = '';
          });

          packagesGrid.style.opacity = '1';
          packagesGrid.style.transform = 'scale(1)';
        }, 150);
      }
    });
  });

  // 5. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Toggle current item with clean read-then-write batching
      if (!isActive) {
        // READ first before mutating other items
        const targetHeight = answer.scrollHeight;

        // WRITE: close others
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
            const otherBtn = otherItem.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // WRITE: expand clicked item
        item.classList.add('active');
        answer.style.maxHeight = targetHeight + 'px';
        question.setAttribute('aria-expanded', 'true');
      } else {
        item.classList.remove('active');
        answer.style.maxHeight = null;
        question.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // 6. Gallery Lightbox Modal
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  if (lightboxModal && lightboxImg) {
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const captionTitle = item.querySelector('.gallery-caption h3, .gallery-caption h4');
        const captionSub = item.querySelector('.gallery-caption p');

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.innerHTML = `<strong>${captionTitle ? captionTitle.textContent : ''}</strong> - ${captionSub ? captionSub.textContent : ''}`;
        lightboxModal.classList.add('active');
      });
    });

    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
    };

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // 7. Booking & WhatsApp Pre-filled Links
  const orderButtons = document.querySelectorAll('.btn-order-package');
  const defaultPhoneNumber = '6282211221909'; // Representative WhatsApp number

  orderButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const packageName = btn.getAttribute('data-package') || 'Paket Outbound Batu';
      const text = encodeURIComponent(`Halo Tim Outbound Batu Malang, saya tertarik untuk konsultasi dan booking *${packageName}*. Boleh minta info detail rundown, ketersediaan tanggal, dan proposal penawarannya? Terima kasih.`);
      window.open(`https://wa.me/${defaultPhoneNumber}?text=${text}`, '_blank');
    });
  });
});
