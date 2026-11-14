(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function status(category) {
    return CookieConsent.acceptedCategory(category) ? 'granted' : 'denied';
  }

  // Zdarzenie aktualizacji zgody dla GTM: cookie_consent_update
  function syncConsent(source) {
    var analytics = status('analytics');
    var marketing = status('marketing');

    gtag('consent', 'update', {
      analytics_storage: analytics,
      ad_storage: marketing,
      ad_user_data: marketing,
      ad_personalization: marketing
    });

    var payload = {
      event: 'cookie_consent_update',
      consent_analytics: analytics,
      consent_marketing: marketing,
      consent_source: source
    };
    window.dataLayer.push(payload);
    console.debug('[dataLayer]', payload);
  }

  var host = location.hostname;

  CookieConsent.run({
    mode: 'opt-in',
    revision: 1,
    autoShow: true,
    hideFromBots: false,
    disablePageInteraction: false,
    cookie: { name: 'cc_cookie', expiresAfterDays: 182 },

    guiOptions: {
      consentModal: { layout: 'box inline', position: 'bottom left', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false }
    },

    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {
        autoClear: {
          cookies: [{ name: /^_ga/ }, { name: /^_cl(ck|sk)$/ }],
          reloadPage: true
        }
      },
      marketing: {
        autoClear: {
          cookies: [{ name: '_fbp' }, { name: '_fbc' }],
          reloadPage: true
        }
      }
    },

    onConsent: function () { syncConsent('initial'); },
    onChange: function () { syncConsent('change'); },

    language: {
      default: 'pl',
      translations: {
        pl: {
          consentModal: {
            title: 'Zgoda na pomiar',
            description: 'To strona projektu edukacyjnego. Za Twoją zgodą uruchamiamy Google Analytics 4 i Microsoft Clarity (analityka) oraz Meta Pixel (marketing). Bez zgody działają tylko elementy niezbędne. Wybór zmienisz w każdej chwili w stopce strony.',
            acceptAllBtn: 'Akceptuję wszystkie',
            acceptNecessaryBtn: 'Odrzucam wszystkie',
            showPreferencesBtn: 'Wybieram sam(a)',
            footer: '<a href="#o-stronie">O stronie i pomiarze</a>'
          },
          preferencesModal: {
            title: 'Ustawienia zgód',
            acceptAllBtn: 'Akceptuję wszystkie',
            acceptNecessaryBtn: 'Odrzucam wszystkie',
            savePreferencesBtn: 'Zapisz mój wybór',
            closeIconLabel: 'Zamknij',
            serviceCounterLabel: 'usługa|usługi',
            sections: [
              {
                title: 'Twoje wybory',
                description: 'Analityka i marketing to osobne zgody. Każde narzędzie uruchamiamy dopiero po zgodzie na jego kategorię. Do żadnego narzędzia nie trafia treść formularza, imię, e-mail ani telefon.'
              },
              {
                title: 'Niezbędne <span class="pm__badge">Zawsze włączone</span>',
                description: 'Zapamiętanie Twojego wyboru (cookie cc_cookie, 6 miesięcy). Google Tag Manager ładuje się zawsze, ale sam nie zapisuje cookies i uruchamia narzędzia wyłącznie zgodnie z tym wyborem.',
                linkedCategory: 'necessary'
              },
              {
                title: 'Analityka',
                description: 'Google Analytics 4 – statystyki odwiedzin, kliknięć i zgłoszeń. Microsoft Clarity – mapy kliknięć i nagrania sesji z zamaskowanymi polami formularza.',
                linkedCategory: 'analytics',
                cookieTable: {
                  headers: { name: 'Cookie', domain: 'Domena', desc: 'Opis' },
                  body: [
                    { name: '_ga, _ga_*', domain: host, desc: 'Google Analytics 4 – rozróżnienie użytkowników i sesji (do 2 lat).' },
                    { name: '_clck, _clsk', domain: host, desc: 'Microsoft Clarity – identyfikator użytkownika i sesji (do 1 roku).' }
                  ]
                }
              },
              {
                title: 'Marketing',
                description: 'Meta Pixel – pomiar zgłoszeń i tworzenie grup remarketingowych na Facebooku i Instagramie.',
                linkedCategory: 'marketing',
                cookieTable: {
                  headers: { name: 'Cookie', domain: 'Domena', desc: 'Opis' },
                  body: [
                    { name: '_fbp, _fbc', domain: host, desc: 'Meta Pixel – identyfikacja przeglądarki i kliknięcia reklamy (do 90 dni).' }
                  ]
                }
              },
              {
                title: 'Więcej informacji',
                description: 'Szczegóły znajdziesz w sekcji <a href="#o-stronie">O stronie i pomiarze</a>.'
              }
            ]
          }
        }
      }
    }
  });
})();
