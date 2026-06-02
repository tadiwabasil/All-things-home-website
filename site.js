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

/* ===== Waitlist forms (hero + dedicated) =====
   Validates the email, then opens WhatsApp with a pre-filled message
   so the customer's email arrives in the business's WhatsApp inbox. */
const WHATSAPP_NUMBER = '263774412530'; // E.164 without the '+'

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

            // Build a clear, useful message for the business owner
            const lines = [
                "Hi All Things Home! 👋",
                "",
                "I'd like to join the waitlist for the online store launch.",
                "",
                `📧 Email: ${email}`,
                "",
                "Please add me to your early-access list and keep me posted.",
                "Thank you!"
            ];
            const message = encodeURIComponent(lines.join('\n'));
            const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

            // Remember locally so we can show a friendly note on repeat
            const isRepeat = stored.has(email);
            if (!isRepeat) {
                stored.add(email);
                try { localStorage.setItem('ath_waitlist', JSON.stringify([...stored])); } catch (_) {}
            }

            // Open WhatsApp in a new tab/app
            const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
            if (!win) {
                // popup blocked — fall back to same-tab navigation
                window.location.href = waUrl;
                return;
            }

            showNotification(
                isRepeat
                    ? "Opening WhatsApp to confirm your details…"
                    : "Opening WhatsApp — just tap send to join the list.",
                'success'
            );
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

/* ===== 3D Stage Rail =====
   - Cards rotate/scale based on horizontal distance from rail center
   - Inner image parallaxes opposite the offset (peeking-window feel)
   - Drag-to-scroll on desktop
   - Active card drives the big serif headline (crossfade swap)
   - Pagination dots + arrows + keyboard support */
function initProductRail() {
    const rail = document.getElementById('product-rail');
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll('.stage-card'));
    if (!cards.length) return;

    const prev = document.getElementById('rail-prev');
    const next = document.getElementById('rail-next');
    const dotsWrap = document.getElementById('stage-dots');
    const headline = document.querySelector('.stage-headline');
    const titleEl = document.getElementById('stage-title');
    const counterEl = document.querySelector('.stage-counter');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MAX_ROT = 22;      // deg
    const MAX_SCALE_DROP = 0.18;
    const MAX_OPACITY_DROP = 0.55;

    /* ----- Dots ----- */
    if (dotsWrap) {
        cards.forEach((card, i) => {
            const dot = document.createElement('button');
            dot.className = 'stage-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Go to ${card.dataset.title || 'product ' + (i + 1)}`);
            dot.addEventListener('click', () => scrollToCard(i));
            dotsWrap.appendChild(dot);
        });
    }
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.stage-dot')) : [];

    /* ----- Initial title ----- */
    let activeIndex = 0;
    if (titleEl) titleEl.textContent = cards[0].dataset.title || '';

    /* ----- Per-frame transform update ----- */
    let raf = null;
    function update() {
        raf = null;
        const railRect = rail.getBoundingClientRect();
        const center = railRect.left + railRect.width / 2;
        const half = railRect.width / 2;

        let bestIndex = 0;
        let bestDist = Infinity;

        cards.forEach((card, i) => {
            const r = card.getBoundingClientRect();
            const cardCenter = r.left + r.width / 2;
            const raw = (cardCenter - center) / half;          // -1..1 roughly
            const t = Math.max(-1.4, Math.min(1.4, raw));
            const abs = Math.abs(t);

            if (!reduceMotion) {
                const rotY = -t * MAX_ROT;
                const scale = 1 - abs * MAX_SCALE_DROP;
                const opacity = 1 - abs * MAX_OPACITY_DROP;
                const z = -abs * 80;
                card.style.transform =
                    `translate3d(0, ${abs * 6}px, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
                card.style.opacity = opacity.toFixed(3);
                card.style.setProperty('--parallax', t.toFixed(3));
                card.style.setProperty('--shine', (t * 0.6).toFixed(3));
            }

            const focused = abs < 0.18;
            card.classList.toggle('is-focused', focused);

            const distFromCenter = Math.abs(cardCenter - center);
            if (distFromCenter < bestDist) {
                bestDist = distFromCenter;
                bestIndex = i;
            }
        });

        if (bestIndex !== activeIndex) setActive(bestIndex);
    }

    function schedule() {
        if (raf == null) raf = requestAnimationFrame(update);
    }

    /* ----- Active state (title + dots) ----- */
    function setActive(i) {
        activeIndex = i;
        dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
        if (counterEl) {
            const total = String(cards.length).padStart(2, '0');
            const cur = String(i + 1).padStart(2, '0');
            counterEl.textContent = `${cur} / ${total}`;
        }
        if (titleEl && headline) {
            const newTitle = cards[i].dataset.title || '';
            if (newTitle && newTitle !== titleEl.textContent) {
                headline.classList.add('is-swapping');
                setTimeout(() => {
                    titleEl.textContent = newTitle;
                    headline.classList.remove('is-swapping');
                }, 220);
            }
        }
    }

    /* ----- Scroll to a card by index ----- */
    function scrollToCard(i) {
        const card = cards[i];
        if (!card) return;
        const railRect = rail.getBoundingClientRect();
        const r = card.getBoundingClientRect();
        const delta = (r.left + r.width / 2) - (railRect.left + railRect.width / 2);
        rail.scrollBy({ left: delta, behavior: 'smooth' });
    }

    /* ----- Listeners ----- */
    rail.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    /* ----- Arrows ----- */
    prev?.addEventListener('click', () => scrollToCard(Math.max(0, activeIndex - 1)));
    next?.addEventListener('click', () => scrollToCard(Math.min(cards.length - 1, activeIndex + 1)));

    /* ----- Keyboard nav when rail is focused ----- */
    rail.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); scrollToCard(Math.min(cards.length - 1, activeIndex + 1)); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollToCard(Math.max(0, activeIndex - 1)); }
    });

    /* ----- Click any card to focus it ----- */
    cards.forEach((card, i) => {
        card.addEventListener('click', (e) => {
            if (rail.classList.contains('dragging')) { e.preventDefault(); return; }
            if (i !== activeIndex) scrollToCard(i);
        });
    });

    /* ----- Drag-to-scroll (mouse) ----- */
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    rail.addEventListener('mousedown', (e) => {
        isDown = true;
        moved = 0;
        startX = e.pageX;
        startScroll = rail.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        // small grace so click after a drag is suppressed
        if (moved > 6) {
            rail.classList.add('dragging');
            setTimeout(() => rail.classList.remove('dragging'), 50);
            // snap to nearest after a drag
            scrollToCard(activeIndex);
        } else {
            rail.classList.remove('dragging');
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const dx = e.pageX - startX;
        moved = Math.max(moved, Math.abs(dx));
        if (moved > 4) rail.classList.add('dragging');
        rail.scrollLeft = startScroll - dx;
    });

    /* ----- Autoplay ----- */
    const AUTOPLAY_MS = 4200;
    let autoplayTimer = null;
    let userPaused = false;
    let inView = false;

    function advance() {
        const nextIdx = (activeIndex + 1) % cards.length;
        scrollToCard(nextIdx);
    }
    function startAutoplay() {
        if (reduceMotion || userPaused || !inView) return;
        stopAutoplay();
        autoplayTimer = setInterval(advance, AUTOPLAY_MS);
    }
    function stopAutoplay() {
        if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }
    function pauseTemporarily() {
        stopAutoplay();
        // restart after a short idle window so user interaction takes priority
        clearTimeout(pauseTemporarily._t);
        pauseTemporarily._t = setTimeout(() => { if (!userPaused) startAutoplay(); }, 6000);
    }

    // pause on hover / focus / drag
    rail.addEventListener('mouseenter', () => { userPaused = true; stopAutoplay(); });
    rail.addEventListener('mouseleave', () => { userPaused = false; startAutoplay(); });
    rail.addEventListener('focusin',  () => { userPaused = true; stopAutoplay(); });
    rail.addEventListener('focusout', () => { userPaused = false; startAutoplay(); });
    // any manual interaction (dot, arrow, drag, click) defers the next tick
    [prev, next, ...dots].forEach(el => el?.addEventListener('click', pauseTemporarily));
    rail.addEventListener('mousedown', pauseTemporarily);
    rail.addEventListener('touchstart', pauseTemporarily, { passive: true });
    // pause when tab not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAutoplay(); else startAutoplay();
    });

    // only autoplay while the rail is on screen
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                inView = entry.isIntersecting;
                if (inView) startAutoplay(); else stopAutoplay();
            });
        }, { threshold: 0.25 });
        io.observe(rail);
    } else {
        inView = true;
    }

    /* ----- Initial paint ----- */
    requestAnimationFrame(() => {
        // place first card at center on load
        scrollToCard(0);
        schedule();
    });
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
