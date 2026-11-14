(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  function track(event, params) {
    var payload = Object.assign({ event: event }, params || {});
    window.dataLayer.push(payload);
    console.debug('[dataLayer]', payload);
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function focusTarget(target) {
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (!target.matches('a, button, input, select, textarea, [tabindex]')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  }

  // Kotwice obsługujemy bez zmiany adresu URL (brak #hash = brak dodatkowych page_view z historii)
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    if (link.dataset.ctaId) {
      track('cta_click', {
        cta_id: link.dataset.ctaId,
        cta_text: link.textContent.trim().replace(/\s+/g, ' '),
        cta_location: link.dataset.ctaLocation,
        cta_target: link.getAttribute('href').slice(1)
      });
    }

    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    focusTarget(target);
  });

  // section_view: ≥50% sekcji (lub ≥50% ekranu przy wysokich sekcjach) widoczne nieprzerwanie przez 1 s
  var VIEW_MS = 1000;
  var trackedSections = document.querySelectorAll('[data-track-section]');

  if ('IntersectionObserver' in window && trackedSections.length) {
    var timers = {};
    var thresholds = [];
    for (var t = 0; t <= 20; t++) thresholds.push(t / 20);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        var id = el.dataset.trackSection;
        var viewportH = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
        var required = Math.min(entry.boundingClientRect.height, viewportH) * 0.5;
        var visible = entry.isIntersecting && entry.intersectionRect.height >= required;

        if (visible && !timers[id]) {
          timers[id] = setTimeout(function () {
            observer.unobserve(el);
            track('section_view', {
              section_id: id,
              section_name: el.dataset.sectionName,
              visible_ms: VIEW_MS
            });
          }, VIEW_MS);
        } else if (!visible && timers[id]) {
          clearTimeout(timers[id]);
          delete timers[id];
        }
      });
    }, { threshold: thresholds });

    trackedSections.forEach(function (el) { observer.observe(el); });
  }

  // Formularz demonstracyjny
  var form = document.getElementById('lead-form');
  if (!form) return;

  var summary = document.getElementById('form-summary');
  var success = document.getElementById('form-success');
  var resetBtn = document.getElementById('form-reset');
  var formInfo = { form_id: form.dataset.formId, form_name: form.dataset.formName };
  var started = false;
  var submitted = false;

  var validators = {
    name: function (v) {
      v = v.trim();
      if (!v) return 'Podaj imię.';
      if (v.length < 2) return 'Imię musi mieć co najmniej 2 znaki.';
      if (!/^[\p{L}][\p{L}\s'’-]*$/u.test(v)) return 'Imię może zawierać tylko litery, spację, myślnik lub apostrof.';
      return '';
    },
    email: function (v) {
      v = v.trim();
      if (!v) return 'Podaj adres e-mail.';
      if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(v)) return 'Wpisz adres e-mail w formacie nazwa@domena.pl.';
      return '';
    },
    phone: function (v) {
      if (!v.trim()) return 'Podaj numer telefonu.';
      var digits = v.replace(/[\s()-]/g, '').replace(/^(\+48|0048)/, '');
      if (!/^\d{9}$/.test(digits)) return 'Numer telefonu musi mieć 9 cyfr, np. 600 100 200.';
      return '';
    },
    bike_type: function (v) { return v ? '' : 'Wybierz rodzaj roweru.'; },
    district: function (v) { return v ? '' : 'Wybierz dzielnicę odbioru.'; },
    notes: function (v) { return v.length > 500 ? 'Uwagi mogą mieć maksymalnie 500 znaków.' : ''; },
    demo_ack: function (v, el) { return el.checked ? '' : 'Zaznacz, że rozumiesz demonstracyjny charakter formularza.'; }
  };

  var fields = Object.keys(validators).map(function (name) { return form.elements[name]; });

  function setError(el, message) {
    var wrapper = el.closest('.field');
    var errorEl = document.getElementById(el.id + '-error');
    wrapper.classList.toggle('has-error', !!message);
    if (message) {
      el.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
      errorEl.hidden = false;
    } else {
      el.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  function validate(el) {
    var message = validators[el.name](el.value, el);
    setError(el, message);
    return !message;
  }

  function onFirstInteraction() {
    if (started) return;
    started = true;
    track('form_start', formInfo);
  }

  form.addEventListener('input', onFirstInteraction);
  form.addEventListener('change', onFirstInteraction);

  fields.forEach(function (el) {
    el.addEventListener('blur', function () {
      if (el.value || submitted) validate(el);
    });
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validate(el);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitted = true;

    var invalid = fields.filter(function (el) { return !validate(el); });

    if (invalid.length) {
      summary.innerHTML = '';
      var heading = document.createElement('p');
      heading.textContent = invalid.length === 1
        ? 'Popraw 1 pole, aby wysłać zgłoszenie:'
        : 'Popraw pola (' + invalid.length + '), aby wysłać zgłoszenie:';
      var list = document.createElement('ul');
      invalid.forEach(function (el) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + el.id;
        a.textContent = el.dataset.label;
        li.appendChild(a);
        list.appendChild(li);
      });
      summary.append(heading, list);
      summary.hidden = false;
      invalid[0].focus();

      track('form_error', Object.assign({}, formInfo, {
        error_fields: invalid.map(function (el) { return el.name; }).join(','),
        error_count: invalid.length
      }));
      return;
    }

    summary.hidden = true;
    track('generate_lead', Object.assign({}, formInfo, { lead_type: 'przeglad_sezonowy' }));

    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    fields.forEach(function (el) { setError(el, ''); });
    summary.hidden = true;
    started = false;
    submitted = false;
    success.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
})();
