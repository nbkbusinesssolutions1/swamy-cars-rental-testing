const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const setReducedMotionClass = (matches) => {
  document.documentElement.classList.toggle('reduced-motion', matches);
};

setReducedMotionClass(prefersReducedMotionQuery.matches);
if (typeof prefersReducedMotionQuery.addEventListener === 'function') {
  prefersReducedMotionQuery.addEventListener('change', (event) => setReducedMotionClass(event.matches));
}

const manageOverscroll = () => {
  if (CSS && typeof CSS.supports === 'function' && CSS.supports('overscroll-behavior-y', 'none')) {
    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    return;
  }

  // Fallback: limit overscroll to specific containers instead of the whole document
  const scrollContainers = document.querySelectorAll('[data-scroll-lock]');
  scrollContainers.forEach((container) => {
    container.addEventListener(
      'touchmove',
      (event) => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtTop = scrollTop <= 0 && event.deltaY < 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight && event.deltaY > 0;
        if (isAtTop || isAtBottom) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  });
};

const setupHeaderScroll = () => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateHeader = () => {
    const scrollY = window.scrollY;
    const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
    
    if (scrollY > 100) {
      if (scrollDirection === 'down') {
        header.classList.add('hidden');
        header.classList.remove('shadow-enhance');
      } else {
        header.classList.remove('hidden');
        header.classList.add('shadow-enhance');
      }
    } else {
      header.classList.remove('hidden');
      header.classList.remove('shadow-enhance');
    }

    lastScrollY = scrollY;
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });
};

const closeMobileMenu = (btn, menu) => {
  menu.classList.add('hidden');
  menu.style.maxHeight = '0px';
  btn?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
};

const initNavToggles = () => {
  document.querySelectorAll('[data-nav-toggle]').forEach((toggleBtn) => {
    const menuId = toggleBtn.getAttribute('data-nav-toggle');
    const menu = document.getElementById(menuId);
    if (!menu) return;

    toggleBtn.setAttribute('aria-controls', menuId);
    toggleBtn.setAttribute('aria-expanded', 'false');

    if (!menu.hasAttribute('data-mobile-menu')) {
      menu.setAttribute('data-mobile-menu', 'true');
    }

    toggleBtn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
      const isOpen = !menu.classList.contains('hidden');
      toggleBtn.setAttribute('aria-expanded', isOpen.toString());
      document.body.classList.toggle('menu-open', isOpen);
      menu.style.maxHeight = isOpen ? `${menu.scrollHeight}px` : '0px';
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMobileMenu(toggleBtn, menu);
        link.blur();
      });
    });

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
        closeMobileMenu(toggleBtn, menu);
      }
    });
  });
};

const setActiveNavLink = () => {
  const currentPage = document.body.getAttribute('data-page');
  if (!currentPage) return;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('nav-link--active', link.dataset.nav === currentPage);
  });
};

const observeFloatingCta = () => {
  const floatingCta = document.querySelector('.floating-whatsapp');
  const footer = document.querySelector('footer');
  if (floatingCta && footer && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          floatingCta.classList.toggle('is-raised', entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(footer);
  }
};

const setupLazyImages = () => {
  const heroCandidates = Array.from(document.querySelectorAll('[data-section="hero"], #hero'));
  const heroImages = new Set(
    heroCandidates.flatMap((el) => Array.from(el.querySelectorAll('img')))
  );

  document.querySelectorAll('img').forEach((img) => {
    if (!heroImages.has(img) && !img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
};

const loadSharedFooter = () => {
  const footerMount = document.querySelector('[data-component="footer"]');
  if (!footerMount) return;

  fetch('components/footer.html')
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load footer: ${response.status}`);
      return response.text();
    })
    .then((html) => {
      footerMount.innerHTML = html;
      footerMount.dispatchEvent(new CustomEvent('footer:loaded', { bubbles: true }));
    })
    .catch((error) => console.error(error));
};

export const initSiteScripts = () => {
  manageOverscroll();
  setupHeaderScroll();
  initNavToggles();
  setActiveNavLink();
  observeFloatingCta();
  setupLazyImages();
  loadSharedFooter();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSiteScripts, { once: true });
} else {
  initSiteScripts();
}
