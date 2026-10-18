/*
 * Google Analytics 4 for the public pages of commuteads.com.
 *
 * GA_MEASUREMENT_ID is the "G-…" id of the commuteads.com web stream
 * (Google Analytics → Admin → Data streams). Empty = analytics off: nothing
 * is loaded and caTrack() does nothing.
 *
 * Loaded only on public pages (home, advertise, contact, media kit, legal).
 * Never on login, dashboard, admin, passenger or scan pages.
 *
 * Conversions recorded:
 *   generate_lead   {form: 'prebook_home' | 'prebook_advertise' | 'contact'}
 *                   sent by the forms after a successful submit
 *   whatsapp_click  a click on any wa.me link
 *   email_click     a click on any mailto: link
 * No form contents (names, phones, emails) are ever sent to Google.
 */
(function () {
    var GA_MEASUREMENT_ID = '';

    window.caTrack = function () {};
    if (!GA_MEASUREMENT_ID) return;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

    window.caTrack = function (name, params) {
        try { gtag('event', name, params || {}); } catch (e) { /* never break the page */ }
    };

    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.indexOf('https://wa.me/') === 0) window.caTrack('whatsapp_click', { page: location.pathname });
        else if (href.indexOf('mailto:') === 0) window.caTrack('email_click', { page: location.pathname });
    }, true);
})();
