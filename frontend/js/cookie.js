function initCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookies = document.getElementById('acceptCookies');
    const declineCookies = document.getElementById('declineCookies');

    if (!cookieBanner || !acceptCookies || !declineCookies) {
        console.error("Components for cookie banner not found in HTML. Please check IDs in cookie-banner.html");
        return;
    }

    if (!localStorage.getItem('cookieChoice')) {
        cookieBanner.style.display = 'block';
    } else {
        cookieBanner.style.display = 'none';
    }

    acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookieChoice', 'accepted');
        cookieBanner.style.display = 'none';
    });

    declineCookies.addEventListener('click', () => {
        localStorage.setItem('cookieChoice', 'declined');
        cookieBanner.style.display = 'none';
    });
}

export function loadCookieBanner() {
    return fetch('components/cookie-banner.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Файл не найден! Статус: ${response.status}`);
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
        .catch(err => console.error("Error loading cookie banner:", err));
}