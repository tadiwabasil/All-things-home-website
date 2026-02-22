// site.js – enhanced interactions & smoothness

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initScrollEffects();
    initCartFunctionality();
    initNewsletterForm();
    initMobileMenu();
    initBackToTop();
    initImageLazyLoad();
    initAddToCartButtons();
});

// DARK MODE (with toggle)
function initDarkMode() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.getElementById('dark-mode-toggle');

    if (savedTheme === 'dark' || (!savedTheme && darkModeMediaQuery.matches)) {
        document.documentElement.classList.add('dark');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    darkModeMediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
        }
    });
}

// SCROLL REVEAL (sections fade in)
function initScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
    });

    // header shadow on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('shadow-lg', window.scrollY > 20);
    });
}

// CART BADGE (with animation)
function initCartFunctionality() {
    let cartCount = 2; // from initial badge
    const badge = document.querySelector('.absolute.-top-0.5.-right-0.5');

    window.addToCart = () => {
        cartCount++;
        if (badge) {
            badge.textContent = cartCount;
            badge.classList.add('scale-125');
            setTimeout(() => badge.classList.remove('scale-125'), 200);
        }
        showNotification('Item added to cart', 'success');
    };
}

// NEWSLETTER with validation
function initNewsletterForm() {
    const form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        if (/^\S+@\S+\.\S+$/.test(email)) {
            showNotification('✨ Thanks for subscribing!', 'success');
            form.reset();
        } else {
            showNotification('Please enter a valid email', 'error');
        }
    });
}

// MOBILE DRAWER
function initMobileMenu() {
    const trigger = document.getElementById('mobile-menu-trigger');
    const drawer = document.getElementById('mobile-drawer');
    const closeBtn = document.getElementById('close-drawer');
    if (!trigger || !drawer) return;

    trigger.addEventListener('click', () => {
        drawer.classList.remove('translate-x-full');
    });

    const closeDrawer = () => drawer.classList.add('translate-x-full');
    closeBtn?.addEventListener('click', closeDrawer);

    // close on outside click? we can also close when clicking a link
    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });
}

// BACK TO TOP
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 500);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// NOTIFICATION TOAST
function showNotification(message, type = 'default') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `notification-toast fixed bottom-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-50 text-sm font-medium backdrop-blur-md transition-all duration-500 translate-y-20 opacity-0 ${
        type === 'success' ? 'bg-primary/90 text-slate-900' :
        type === 'error' ? 'bg-red-500/90 text-white' : 'bg-slate-900/90 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    });
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// LAZY LOAD (images already loaded, but we can add effect)
function initImageLazyLoad() {
    const images = document.querySelectorAll('img');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
                observer.unobserve(entry.target);
            }
        });
    });
    images.forEach(img => observer.observe(img));
}

// ADD TO CART BUTTONS
function initAddToCartButtons() {
    document.querySelectorAll('.group button').forEach(btn => {
        if (btn.querySelector('.material-symbols-outlined')?.textContent.includes('add_shopping_cart')) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.addToCart?.();
                // optional: flying animation
                const icon = btn.querySelector('.material-symbols-outlined');
                icon?.classList.add('scale-150', 'text-primary');
                setTimeout(() => icon?.classList.remove('scale-150', 'text-primary'), 200);
            });
        }
    });
}

// Global exports
window.AllThingsHome = { showNotification };