'use strict';
import { loadCookieBanner } from './cookie.js';
import { initBooking } from './booking.js';
import './forms.js';

const components = [
    {
        id: 'header',
        path: 'components/header.html',
        callback: toggleTheme
    },
    {
        id: 'footer',
        path: 'components/footer.html'
    },
    {
        id: 'cookie-banner',
        path: 'components/cookie-banner.html'
    },
    {
        id: 'booking-calendar',
        path: 'components/booking-calendar.html',
        callback: initBooking
    },
    {
        id: 'contact-form',
        path: 'components/contact-form.html'
    },
    {
        id: 'service-form',
        path: 'components/service-form.html',
        callback: initServiceForm
    }
];

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    if (!themeToggle) {
        console.error("Button #themeToggle not found in header.html!");
        return;
    }

    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark-theme');

        if (html.classList.contains('dark-theme')) {
            themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        } else {
            themeToggle.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
        }
    });
}

function initServiceForm() {
    console.log('✅ Service form initialized');
}

async function loadComponent(id, path, callback = null) {
    try {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const element = document.getElementById(id);

        if (!element) {
            console.warn(`#${id} not found`);
            return;
        }

        element.innerHTML = html;

        if (callback) {
            callback();
        }

    } catch (error) {
        console.error(`Failed loading ${path}`, error);
    }
}

const init = async () => {
    console.log('🚀 Starting application initialization...');

    for (const component of components) {
        await loadComponent(
            component.id,
            component.path,
            component.callback
        );
    }

    loadCookieBanner();
    
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true
        });
    }

    console.log('✅ Application initialized successfully');
};

document.addEventListener("DOMContentLoaded", () => {
    init();
});