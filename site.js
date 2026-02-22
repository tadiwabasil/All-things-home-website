// All Things Home - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initDarkMode();
    initScrollEffects();
    initCartFunctionality();
    initNewsletterForm();
    initLazyLoading();
    initMobileMenu();
});

// Dark Mode Toggle
function initDarkMode() {
    // Check for saved preference or system preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || (!savedTheme && darkModeMediaQuery.matches)) {
        document.documentElement.classList.add('dark');
    }

    // Optional: Add toggle button functionality
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // Listen for system theme changes
    darkModeMediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });
}

// Scroll Effects & Animations
function initScrollEffects() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections for fade-in animation
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
    });

    // Sticky header shadow on scroll
    let lastScroll = 0;
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('shadow-lg');
        } else {
            header.classList.remove('shadow-lg');
        }

        lastScroll = currentScroll;
    });
}

// Shopping Cart Functionality
function initCartFunctionality() {
    let cartCount = 2; // Initial count from HTML
    const cartBadge = document.querySelector('.material-symbols-outlined[data-badge]');
    const addToCartButtons = document.querySelectorAll('.group button');

    addToCartButtons.forEach(button => {
        if (button.querySelector('.material-symbols-outlined')?.textContent === 'add_shopping_cart') {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart();
            });
        }
    });

    function addToCart() {
        cartCount++;
        updateCartBadge();
        showNotification('Item added to cart!');
    }

    function updateCartBadge() {
        const badge = document.querySelector('.absolute.top-1.right-1');
        if (badge) {
            badge.textContent = cartCount;
            badge.classList.add('scale-125');
            setTimeout(() => badge.classList.remove('scale-125'), 200);
        }
    }

    // Remove item from cart (for future use)
    window.removeFromCart = function() {
        if (cartCount > 0) {
            cartCount--;
            updateCartBadge();
        }
    };
}

// Newsletter Form Handling
function initNewsletterForm() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;

            if (validateEmail(email)) {
                // Simulate API call
                showNotification('Thank you for subscribing!', 'success');
                form.reset();
            } else {
                showNotification('Please enter a valid email address.', 'error');
            }
        });
    }
}

// Email Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Lazy Loading Images
function initLazyLoading() {
    const images = document.querySelectorAll('div[data-alt]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const div = entry.target;
                // Add loaded class for any additional styling
                div.classList.add('loaded');
                observer.unobserve(div);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Mobile Menu Toggle
function initMobileMenu() {
    // Create mobile menu button if it doesn't exist
    const nav = document.querySelector('nav');
    const header = document.querySelector('header > div');

    // Mobile menu button (hidden on desktop)
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors';
    mobileMenuBtn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
    mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');

    // Insert before utility icons
    const utilityIcons = document.querySelector('.flex.items-center.gap-6');
    if (utilityIcons && !document.querySelector('.md\\:hidden.p-2')) {
        header.insertBefore(mobileMenuBtn, utilityIcons);
    }

    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('hidden');
        nav.classList.toggle('absolute');
        nav.classList.toggle('top-20');
        nav.classList.toggle('left-0');
        nav.classList.toggle('w-full');
        nav.classList.toggle('bg-background-light');
        nav.classList.toggle('dark:bg-background-dark');
        nav.classList.toggle('p-6');
        nav.classList.toggle('shadow-lg');
        nav.classList.toggle('flex-col');
        nav.classList.toggle('gap-4');
    });
}

// Notification System
function showNotification(message, type = 'default') {
    // Remove existing notifications
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification-toast fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl transform translate-y-20 opacity-0 transition-all duration-300 z-50 ${
        type === 'success' ? 'bg-primary text-slate-900' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-slate-900 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.remove('translate-y-20', 'opacity-0');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Product Quick View (placeholder for future functionality)
window.openQuickView = function(productId) {
    console.log('Opening quick view for product:', productId);
    // Implementation for quick view modal
};

// Search Functionality (placeholder)
window.handleSearch = function(query) {
    console.log('Searching for:', query);
    // Implementation for search
};

// Export functions for global access
window.AllThingsHome = {
    addToCart: () => {
        const event = new Event('click');
        document.querySelector('.group button')?.dispatchEvent(event);
    },
    showNotification,
    toggleDarkMode: () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
};