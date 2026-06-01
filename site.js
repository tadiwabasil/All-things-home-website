// All Things Home — coming soon teaser
// Interactions, reveal animations, waitlist, theme.

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initHeaderScroll();
    initRevealOnScroll();
    initMobileMenu();
    initBackToTop();
    initWaitlistForms();
    initProductRail();
    initProgressBar();
});

/* ===== Theme toggle (no-flash bootstrapped in <head>) ===== */
function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    toggle?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    mq.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
        }
    });
}

/* ===== Header gets shadow once you scroll past the announcement bar ===== */
function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;
    let ticking = false;
    const update = () => {
        header.classList.toggle('scrolled', window.scrollY > 8);
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
}

/* ===== Reveal on scroll using IntersectionObserver ===== */
function initRevealOnScroll() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !items.length) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(el => io.observe(el));
}

/* ===== Mobile drawer ===== */
function initMobileMenu() {
    const trigger = document.getElementById('mobile-menu-trigger');
    const drawer = document.getElementById('mobile-drawer');
    const closeBtn = document.getElementById('close-drawer');
    if (!trigger || !drawer) return;

    const open = () => {
        drawer.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        drawer.classList.add('translate-x-full');
        document.body.style.overflow = '';
    };

    trigger.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !drawer.classList.contains('translate-x-full')) close();
    });
}

/* ===== Back to top ===== */
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    let ticking = false;
    const update = () => {
        btn.classList.toggle('visible', window.scrollY > 600);
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===== Waitlist forms (hero + dedicated) ===== */
function initWaitlistForms() {
    const forms = document.querySelectorAll('#hero-waitlist, #waitlist-form');
    const stored = new Set(JSON.parse(localStorage.getItem('ath_waitlist') || '[]'));

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="email"]');
            const email = (input.value || '').trim().toLowerCase();

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                shake(input);
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            if (stored.has(email)) {
                showNotification("You're already on the list — see you Autumn 2026.", 'default');
                form.reset();
                return;
            }
            stored.add(email);
            try { localStorage.setItem('ath_waitlist', JSON.stringify([...stored])); } catch (_) {}

            showNotification("You're on the list. We'll be in touch.", 'success');
            form.reset();
        });
    });
}

function shake(el) {
    if (!el) return;
    el.animate(
        [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(0)' },
        ],
        { duration: 360, easing: 'ease-out' }
    );
    el.focus();
}

/* ===== Product rail arrows ===== */
function initProductRail() {
    const rail = document.getElementById('product-rail');
    const prev = document.getElementById('rail-prev');
    const next = document.getElementById('rail-next');
    if (!rail) return;

    const step = () => Math.round(rail.clientWidth * 0.8);
    prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
}

/* ===== Animated build-progress bar ===== */
function initProgressBar() {
    const bar = document.getElementById('progress-bar');
    const count = document.getElementById('progress-count');
    if (!bar) return;

    const target = 72;
    const animate = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            bar.style.width = target + '%';
            return;
        }
        let current = 0;
        const start = performance.now();
        const duration = 1600;
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            current = Math.round(eased * target);
            bar.style.width = current + '%';
            if (count) count.textContent = current + '%';
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate();
                io.disconnect();
            }
        });
    }, { threshold: 0.4 });
    io.observe(bar);
}

/* ===== Notification toast ===== */
function showNotification(message, type = 'default') {
    document.querySelector('.notification-toast')?.remove();

    const toast = document.createElement('div');
    const palette =
        type === 'success' ? 'bg-primary text-slate-900' :
        type === 'error'   ? 'bg-red-500 text-white' :
                             'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
    toast.className = `notification-toast fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full z-[80] text-sm font-medium transition-all duration-500 translate-y-8 opacity-0 ${palette}`;
    toast.style.maxWidth = 'calc(100vw - 2rem)';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-8', 'opacity-0');
    });
    setTimeout(() => {
        toast.classList.add('translate-y-8', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3200);
}

window.AllThingsHome = { showNotification };
