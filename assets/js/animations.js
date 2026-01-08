/**
 * Swami Cars Rental - Animation System
 * Handles scroll-triggered animations, counters, and motion effects
 */

(() => {
  'use strict';

  // Configuration
  const CONFIG = {
    thresholds: {
      default: 0.15,
      stagger: 0.25,
      sections: 0.3,
      counters: 0.6
    },
    rootMargin: '0px 0px -10% 0px',
    staggerDelay: 90, // ms
    counterDuration: 1200, // ms
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // State management
  const state = {
    observers: new Map(),
    animatedElements: new WeakSet(),
    isReady: false
  };

  // Utility functions
  const utils = {
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    easeOutCubic: (t) => {
      return 1 - Math.pow(1 - t, 3);
    },

    // Check if element is in viewport
    isInViewport: (element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  };

  // Animation controllers
  const animations = {
    // Reveal element with animation
    reveal: (element) => {
      if (state.animatedElements.has(element)) return;
      
      element.classList.add('is-visible');
      state.animatedElements.add(element);
      
      // Trigger custom event
      element.dispatchEvent(new CustomEvent('elementRevealed', { 
        bubbles: true,
        detail: { element }
      }));
    },

    // Animate counter from 0 to target
    animateCounter: (element) => {
      if (state.animatedElements.has(element)) return;

      const target = Number(element.dataset.target) || 0;
      const duration = CONFIG.counterDuration;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = utils.easeOutCubic(progress);
        const current = Math.floor(easedProgress * target);
        
        element.textContent = current;
        
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          state.animatedElements.add(element);
          element.dispatchEvent(new CustomEvent('counterComplete', { 
            bubbles: true,
            detail: { element, target }
          }));
        }
      };

      requestAnimationFrame(tick);
    },

    // Set stagger delays for child elements
    setStaggerDelays: (container, type) => {
      let targets = [];

      switch (type) {
        case 'cards':
          targets = container.querySelectorAll('.card-base');
          break;
        case 'steps':
          targets = container.querySelectorAll('.step-card');
          break;
        case 'cta':
          targets = container.querySelectorAll('.cta-cluster > *, .btn-base');
          break;
        case 'hero':
          targets = container.querySelectorAll('.hero-line, .subhead, .cta-row, .stats');
          break;
        default:
          targets = Array.from(container.children);
      }

      targets.forEach((target, index) => {
        target.style.transitionDelay = `${index * CONFIG.staggerDelay}ms`;
      });

      return targets;
    }
  };

  // Observer factory
  const createObserver = (callback, threshold = CONFIG.thresholds.default) => {
    if (!('IntersectionObserver' in window)) {
      return null;
    }

    return new IntersectionObserver(callback, {
      threshold,
      rootMargin: CONFIG.rootMargin
    });
  };

  // Initialize animation system
  const init = () => {
    if (state.isReady) return;

    // Remove no-js class and add motion-ready
    document.body.classList.remove('no-js');
    document.body.classList.add('motion-ready');

    // Handle reduced motion
    if (CONFIG.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }

    // Setup scroll-triggered animations
    setupScrollAnimations();
    
    // Setup counter animations
    setupCounterAnimations();
    
    // Setup section animations
    setupSectionAnimations();

    state.isReady = true;
    
    // Dispatch ready event
    document.dispatchEvent(new CustomEvent('animationSystemReady'));
  };

  // Setup scroll-triggered animations
  const setupScrollAnimations = () => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = createObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animations.reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, CONFIG.thresholds.default);

    if (observer) {
      animatedElements.forEach((el) => observer.observe(el));
      state.observers.set('scroll', observer);
    } else {
      // Fallback for browsers without IntersectionObserver
      animatedElements.forEach(animations.reveal);
    }
  };

  // Setup counter animations
  const setupCounterAnimations = () => {
    const counters = document.querySelectorAll('.counter[data-target]');
    
    const observer = createObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          animations.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, CONFIG.thresholds.counters);

    if (observer) {
      counters.forEach((el) => observer.observe(el));
      state.observers.set('counters', observer);
    } else {
      // Fallback
      counters.forEach((counter) => {
        if (!counter.dataset.animated) {
          counter.dataset.animated = 'true';
          animations.animateCounter(counter);
        }
      });
    }
  };

  // Setup section animations
  const setupSectionAnimations = () => {
    const sections = document.querySelectorAll('[data-section]');
    const animateGroups = document.querySelectorAll('[data-animate]');

    // Handle data-section elements
    const sectionObserver = createObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animations.reveal(entry.target);
        }
      });
    }, CONFIG.thresholds.sections);

    // Handle data-animate elements with stagger
    const groupObserver = createObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const type = entry.target.dataset.animate;
          animations.setStaggerDelays(entry.target, type);
          animations.reveal(entry.target);
          groupObserver.unobserve(entry.target);
        }
      });
    }, CONFIG.thresholds.stagger);

    if (sectionObserver) {
      sections.forEach((section) => sectionObserver.observe(section));
      state.observers.set('sections', sectionObserver);
    } else {
      sections.forEach(animations.reveal);
    }

    if (groupObserver) {
      animateGroups.forEach((group) => groupObserver.observe(group));
      state.observers.set('groups', groupObserver);
    } else {
      animateGroups.forEach((group) => {
        const type = group.dataset.animate;
        animations.setStaggerDelays(group, type);
        animations.reveal(group);
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    state.observers.forEach((observer) => {
      observer.disconnect();
    });
    state.observers.clear();
    state.isReady = false;
  };

  // Reinitialize on dynamic content changes
  const reinit = utils.debounce(() => {
    cleanup();
    init();
  }, 100);

  // Public API
  window.SwamiAnimations = {
    init,
    reinit,
    cleanup,
    reveal: animations.reveal,
    animateCounter: animations.animateCounter,
    setStaggerDelays: animations.setStaggerDelays,
    utils,
    CONFIG
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    init();
  }

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !state.isReady) {
      init();
    }
  });

  // Handle reduced motion preference changes
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionQuery.addEventListener('change', (e) => {
    CONFIG.reducedMotion = e.matches;
    if (e.matches) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  });

})();
