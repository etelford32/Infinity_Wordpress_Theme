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
                if (window.innerWidth > 768 && navigation.classList.contains('is-open')) {
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
     */
    function initStickyHeader() {
        if (!header || !header.classList.contains('sticky-header')) return;

        let lastScrollTop = 0;
        let ticking = false;
        const headerHeight = header.offsetHeight;

        // Add padding to body to prevent content jump
        document.body.style.paddingTop = headerHeight + 'px';

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Add scrolled class when past header height
            if (scrollTop > headerHeight) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }

            // Hide/show header on scroll direction (optional enhancement)
            if (scrollTop > lastScrollTop && scrollTop > headerHeight * 2) {
                // Scrolling down
                header.classList.add('is-hidden');
            } else {
                // Scrolling up
                header.classList.remove('is-hidden');
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }
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

                // Account for sticky header height
                const headerOffset = header && header.classList.contains('sticky-header')
                    ? header.offsetHeight
                    : 0;

                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Set focus for accessibility
                targetElement.focus();
                if (document.activeElement !== targetElement) {
                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus();
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
