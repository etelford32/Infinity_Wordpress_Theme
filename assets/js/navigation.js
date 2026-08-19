/**
 * Infinity Theme Navigation
 *
 * Handles mobile menu toggle, sticky header, and back-to-top functionality.
 *
 * @package Infinity
 * @since 1.0.0
 */

(function() {
    'use strict';

    // DOM Elements
    const header = document.getElementById('masthead');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navigation = document.getElementById('site-navigation');
    const backToTopBtn = document.getElementById('back-to-top');

    // Measured by initStickyHeader; the collapsed height is what anchor
    // jumps need to clear, because the header is always collapsed by
    // the time the page has scrolled anywhere.
    let expandedHeight = 0;
    let collapsedHeight = 0;

    /**
     * Mobile Menu Toggle
     */
    function initMobileMenu() {
        if (!menuToggle || !navigation) return;

        menuToggle.addEventListener('click', function() {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

            // Toggle expanded state
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navigation.classList.toggle('is-open');
            menuToggle.classList.toggle('is-active');

            // Toggle body scroll lock
            document.body.classList.toggle('mobile-menu-open');

            // Trap focus in menu when open
            if (!isExpanded) {
                trapFocus(navigation);
            } else {
                releaseFocus();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navigation.classList.contains('is-open')) {
                closeMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (navigation.classList.contains('is-open') &&
                !navigation.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                // matches the drawer breakpoint in style.css section 12.0
                if (window.innerWidth >= 1024 && navigation.classList.contains('is-open')) {
                    closeMenu();
                }
            }, 250);
        });

        // Handle dropdown submenus on mobile
        const menuItemsWithChildren = navigation.querySelectorAll('.menu-item-has-children > a');
        menuItemsWithChildren.forEach(function(item) {
            // Create dropdown toggle button for mobile
            const dropdownToggle = document.createElement('button');
            dropdownToggle.className = 'dropdown-toggle';
            dropdownToggle.setAttribute('aria-expanded', 'false');
            dropdownToggle.setAttribute('aria-label', 'Toggle submenu');
            dropdownToggle.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

            item.parentNode.insertBefore(dropdownToggle, item.nextSibling);

            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !isExpanded);
                this.parentNode.classList.toggle('submenu-open');
            });
        });
    }

    function closeMenu() {
        menuToggle.setAttribute('aria-expanded', 'false');
        navigation.classList.remove('is-open');
        menuToggle.classList.remove('is-active');
        document.body.classList.remove('mobile-menu-open');
        releaseFocus();
    }

    /**
     * Focus Trap for Accessibility
     */
    let focusTrapElement = null;
    let firstFocusable = null;
    let lastFocusable = null;

    function trapFocus(element) {
        focusTrapElement = element;
        const focusableElements = element.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        firstFocusable = focusableElements[0];
        lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', handleFocusTrap);
        firstFocusable.focus();
    }

    function handleFocusTrap(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    function releaseFocus() {
        if (focusTrapElement) {
            focusTrapElement.removeEventListener('keydown', handleFocusTrap);
            focusTrapElement = null;
        }
        menuToggle.focus();
    }

    /**
     * Sticky Header
     *
     * Past the first inch of scroll the header collapses (see the
     * "Collapse on scroll" block in style.css), and sustained downward
     * scrolling tucks it away entirely until the reader heads back up.
     */
    function initStickyHeader() {
        if (!header || !header.classList.contains('sticky-header')) return;

        // Scroll needed before the header compacts, and the travel in
        // each direction before it tucks away or comes back. Working in
        // accumulated travel rather than per-frame deltas is what stops
        // it flickering when a trackpad wobbles.
        const COLLAPSE_AT = 28;
        const HIDE_TRAVEL = 90;
        const SHOW_TRAVEL = 60;

        let lastScrollTop = 0;
        let travel = 0;
        let ticking = false;

        function measure() {
            // The header overlays the page, so the body needs padding
            // equal to its EXPANDED height — measuring while collapsed
            // would let the top of the page slide underneath it. Drop
            // the state classes for the read, with transitions off so
            // we do not catch a half-finished animation.
            const wasScrolled = header.classList.contains('is-scrolled');
            const wasHidden = header.classList.contains('is-hidden');

            header.classList.add('is-measuring');
            header.classList.remove('is-scrolled', 'is-hidden');
            expandedHeight = header.offsetHeight;

            // The collapsed height is what anchor jumps have to clear,
            // since the header is always collapsed once you have
            // scrolled far enough for an anchor to matter.
            header.classList.add('is-scrolled');
            collapsedHeight = header.offsetHeight;

            if (!wasScrolled) {
                header.classList.remove('is-scrolled');
            }
            if (wasHidden) {
                header.classList.add('is-hidden');
            }
            // force a reflow so the restored state is not transitioned
            void header.offsetHeight;
            header.classList.remove('is-measuring');

            document.body.style.paddingTop = expandedHeight + 'px';
        }

        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const delta = scrollTop - lastScrollTop;

            if (scrollTop > COLLAPSE_AT) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }

            // Accumulate travel per direction, resetting on a turn
            travel = (delta > 0) ? Math.max(0, travel) + delta : Math.min(0, travel) + delta;

            // Never pull the header out from under an open menu, away
            // from whatever the keyboard is focused on inside it, or
            // while the reader is still near the top of the page.
            const pinned = document.body.classList.contains('mobile-menu-open')
                || header.contains(document.activeElement)
                || scrollTop <= expandedHeight;

            if (pinned || travel < -SHOW_TRAVEL) {
                header.classList.remove('is-hidden');
            } else if (travel > HIDE_TRAVEL) {
                header.classList.add('is-hidden');
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Re-measure whenever the header's own box can change: a resize
        // can cross the 1024px line where the header goes from one row
        // to two, and a late webfont changes its height without any
        // resize event at all.
        let resizeTimer = null;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(measure, 150);
        });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(measure);
        }

        measure();
        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        handleScroll();
    }

    /**
     * Back to Top Button
     */
    function initBackToTop() {
        if (!backToTopBtn) return;

        let ticking = false;
        const showThreshold = 300;

        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    if (window.pageYOffset > showThreshold) {
                        backToTopBtn.classList.add('is-visible');
                    } else {
                        backToTopBtn.classList.remove('is-visible');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Smooth scroll to top
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Keyboard support
        backToTopBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }

    /**
     * Smooth Scroll for Anchor Links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;

                e.preventDefault();

                // Clear the COLLAPSED header: by the time the smooth
                // scroll lands, the header has compacted, so offsetting
                // by its current expanded height would overshoot and
                // leave a gap above the target.
                const headerOffset = header && header.classList.contains('sticky-header')
                    ? (collapsedHeight || header.offsetHeight)
                    : 0;

                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Set focus for accessibility. preventScroll matters:
                // a plain focus() scrolls the target into view on its
                // own terms, which drags it back up under the fixed
                // header and undoes the offset we just applied.
                targetElement.focus({ preventScroll: true });
                if (document.activeElement !== targetElement) {
                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus({ preventScroll: true });
                }
            });
        });
    }

    /**
     * Initialize all navigation features
     */
    function init() {
        initMobileMenu();
        initStickyHeader();
        initBackToTop();
        initSmoothScroll();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
