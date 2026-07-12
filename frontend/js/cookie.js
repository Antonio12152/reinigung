function initCookieBanner() {
    const cookieBannerContainer = document.getElementById('cookie-banner');
    if (!cookieBannerContainer) {
        console.error('Cookie banner container not found');
        return;
    }

    const cookieBanner = cookieBannerContainer.querySelector('.cookie-banner');
    const acceptCookies = cookieBannerContainer.querySelector('#acceptCookies');
    const declineCookies = cookieBannerContainer.querySelector('#declineCookies');

    if (!cookieBanner || !acceptCookies || !declineCookies) {
        console.error('Cookie banner elements not found');
        return;
    }

    const cookieChoice = localStorage.getItem('cookieChoice');
    if (!cookieChoice) {
        cookieBanner.classList.add('show');
    }

    acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookieChoice', 'accepted');
        cookieBanner.classList.remove('show');
    });

    declineCookies.addEventListener('click', () => {
        localStorage.setItem('cookieChoice', 'declined');
        cookieBanner.classList.remove('show');
    });
}

export function loadCookieBanner() {
    return fetch('components/cookie-banner.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Datei nicht gefunden. Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            const container = document.getElementById('cookie-banner');
            if (container) {
                container.innerHTML = html;
                initCookieBanner();
            }
        })
        .catch(err => console.error('Fehler beim Laden des Cookie-Banners:', err));
}