'use strict';
import { loadCookieBanner } from './cookie.js';
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
        id: 'contact-form',
        path: 'components/contact-form.html'
    },

    {
        id: 'service-form',
        path: 'components/service-form.html'
    }
];

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    if (!themeToggle) {
        console.error("Button #themeToggle not found in header.html!");
        return;
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');

        if (body.classList.contains('dark-theme')) {
            themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        } else {
            themeToggle.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
        }
    });
}

async function loadComponent(id, path, callback = null) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const element = document.getElementById(id);

        if (!element) {
            console.warn(`#${id} not found. Don't worry, it's probably intentional.`);
            return;
        }

        element.innerHTML = html;

        if (callback) callback();

    } catch (error) {
        console.error(`Failed loading ${path}:`, error);
    }
}
const init = async () => {
    for (const component of components) {
        await loadComponent(
            component.id,
            component.path,
            component.callback
        );
    }

    loadCookieBanner();
    AOS.init({
        duration: 1000,
        once: true
    });
}

document.addEventListener("DOMContentLoaded", () => {
    init();
});