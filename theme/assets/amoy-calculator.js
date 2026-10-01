/* AMOY retail display mannequin calculator.
   The estimation model is a deliberately simple planning model (not an
   industry standard); every assumption is a named constant below. All
   wording is read from the section's JSON strings, which come from the
   theme locale files, so the tool is fully translated on /ar. */
(function () {
  'use strict';

  var ASSUMPTIONS = {
    SQM_PER_FLOOR_FORM: 45,
    WINDOW_FORMS_PER_BAY: { minimal: 1, standard: 2, statement: 3 },
    WINDOW_FULL_BODY_SHARE: 0.8,
    FLOOR_FULL_BODY_SHARE: { women: 0.5, men: 0.45, kids: 0.6 },
    FEATURE_ZONE_FORMS: { entrance: 2, promo: 2, fitting: 1 },
    CATEGORY_WEIGHT: { primary: 1, secondary: 0.55, off: 0 },
    MIN_FLOOR_FORMS_PER_CATEGORY: 1,
    RANGE_TOLERANCE: 0.15
  };
  var CATEGORY_KEYS = ['women', 'men', 'kids'];
  var STEPS = 4;
  var WINDOWS_MIN = 0;
  var WINDOWS_MAX = 20;

  function fill(template, values) {
    return String(template || '').replace(/\[(\w+)\]/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  /* Split a pool of forms across categories by weight, preserving the total. */
  function distribute(pool, weights, keys) {
    var out = {};
    var sum = keys.reduce(function (a, k) { return a + weights[k]; }, 0);
    if (sum <= 0 || pool <= 0) {
      keys.forEach(function (k) { out[k] = 0; });
      return out;
    }
    var assigned = 0;
    keys.forEach(function (k, i) {
      if (i === keys.length - 1) {
        out[k] = pool - assigned;
      } else {
        out[k] = Math.round((pool * weights[k]) / sum);
        assigned += out[k];
      }
    });
    return out;
  }

  function calculate(input) {
    var A = ASSUMPTIONS;
    var keys = CATEGORY_KEYS.filter(function (k) { return input.categories[k] !== 'off'; });
    var windowPool = input.windowBays * A.WINDOW_FORMS_PER_BAY[input.windowAmbition];
    var zoneForms = input.featureZones.reduce(function (a, z) { return a + (A.FEATURE_ZONE_FORMS[z] || 0); }, 0);
    var floorPool = Math.ceil(input.storeSizeSqm / A.SQM_PER_FLOOR_FORM) + zoneForms;

    var weights = {};
    keys.forEach(function (k) { weights[k] = A.CATEGORY_WEIGHT[input.categories[k]]; });
    var windowSplit = distribute(windowPool, weights, keys);
    var floorSplit = distribute(floorPool, weights, keys);

    var categories = keys.map(function (key) {
      var w = Math.max(0, windowSplit[key] || 0);
      var f = Math.max(A.MIN_FLOOR_FORMS_PER_CATEGORY, floorSplit[key] || 0);
      var windowFullBody = Math.round(w * A.WINDOW_FULL_BODY_SHARE);
      var windowTorso = w - windowFullBody;
      var floorFullBody = Math.round(f * A.FLOOR_FULL_BODY_SHARE[key]);
      var floorTorso = f - floorFullBody;
      return {
        key: key,
        windowTotal: w,
        floorTotal: f,
        fullBody: windowFullBody + floorFullBody,
        torso: windowTorso + floorTorso,
        total: w + f
      };
    });

    var fullBody = categories.reduce(function (a, c) { return a + c.fullBody; }, 0);
    var torso = categories.reduce(function (a, c) { return a + c.torso; }, 0);
    var total = fullBody + torso;
    return {
      total: total,
      totalLow: Math.max(1, Math.floor(total * (1 - A.RANGE_TOLERANCE))),
      totalHigh: Math.ceil(total * (1 + A.RANGE_TOLERANCE)),
      fullBody: fullBody,
      torso: torso,
      windowTotal: categories.reduce(function (a, c) { return a + c.windowTotal; }, 0),
      floorTotal: categories.reduce(function (a, c) { return a + c.floorTotal; }, 0),
      categories: categories
    };
  }

  function initCalculator(root) {
    if (!root || root._amoyCalc) return;
    root._amoyCalc = true;

    var S = {};
    try { S = JSON.parse(root.querySelector('[data-calc-strings]').textContent); } catch (e) { S = {}; }

    var form = root.querySelector('[data-calc-form]');
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-calc-step]'));
    var bars = Array.prototype.slice.call(root.querySelectorAll('[data-calc-progress] span'));
    var progress = root.querySelector('[data-calc-progress]');
    var nav = root.querySelector('[data-calc-nav]');
    var backBtn = root.querySelector('[data-calc-back]');
    var nextBtn = root.querySelector('[data-calc-next]');
    var submitBtn = root.querySelector('[data-calc-submit]');
    var loading = root.querySelector('[data-calc-loading]');
    var result = root.querySelector('[data-calc-result]');
    var needCategory = root.querySelector('[data-calc-need-category]');
    var windowsInput = root.querySelector('[data-calc-windows-input]');
    var waLink = root.querySelector('[data-calc-whatsapp]');
    var waBase = waLink ? waLink.getAttribute('href') : '';
    var current = 1;
    var lastSummary = '';

    steps.forEach(function (step, i) {
      var count = step.querySelector('[data-calc-step-count]');
      if (count) count.textContent = fill(S.stepOf, { current: i + 1, total: STEPS });
    });

    function checked(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }

    function labelOf(name, value) {
      var el = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
      return el ? el.getAttribute('data-label') || value : value;
    }

    function readInput() {
      var windows = parseInt(windowsInput.value, 10);
      if (isNaN(windows)) windows = 0;
      windows = Math.min(WINDOWS_MAX, Math.max(WINDOWS_MIN, windows));
      windowsInput.value = windows;
      var categories = {};
      CATEGORY_KEYS.forEach(function (k) { categories[k] = checked('cat_' + k) || 'off'; });
      return {
        storeSizeSqm: parseInt(checked('size') || '180', 10),
        windowBays: windows,
        windowAmbition: checked('ambition') || 'standard',
        categories: categories,
        featureZones: Array.prototype.slice.call(form.querySelectorAll('input[name="zones"]:checked')).map(function (el) { return el.value; })
      };
    }

    function hasCategory() {
      return CATEGORY_KEYS.some(function (k) { return checked('cat_' + k) && checked('cat_' + k) !== 'off'; });
    }

    function scrollToPanel() {
      var top = form.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        var header = document.querySelector('.amoy-header--sticky');
        var offset = header ? header.getBoundingClientRect().height + 16 : 16;
        window.scrollTo({ top: window.pageYOffset + top - offset, behavior: 'smooth' });
      }
    }

    function showStep(n, focus) {
      current = n;
      steps.forEach(function (step) { step.hidden = Number(step.getAttribute('data-calc-step')) !== n; });
      bars.forEach(function (bar, i) { bar.classList.toggle('is-done', i < n); });
      backBtn.disabled = n === 1;
      nextBtn.hidden = n === STEPS;
      submitBtn.hidden = n !== STEPS;
      updateCategoryState();
      if (focus) {
        var title = steps[n - 1].querySelector('.amoy-calc__step-title');
        if (title) title.focus({ preventScroll: true });
        scrollToPanel();
      }
    }

    function updateCategoryState() {
      var ok = current !== 3 || hasCategory();
      nextBtn.disabled = !ok;
      if (needCategory) needCategory.hidden = ok;
    }

    function setMode(mode) {
      var isForm = mode === 'form';
      steps.forEach(function (step) { if (!isForm) step.hidden = true; });
      progress.hidden = mode === 'result';
      nav.hidden = !isForm;
      loading.hidden = mode !== 'loading';
      result.hidden = mode !== 'result';
    }

    function buildSummary(input, r) {
      var zones = input.featureZones.map(function (z) { return labelOf('zones', z); });
      var sep = document.documentElement.dir === 'rtl' ? '، ' : ', ';
      var lines = [
        S.summaryTitle,
        '',
        fill(S.summaryStore, { value: labelOf('size', String(input.storeSizeSqm)) }),
        fill(S.summaryWindows, { count: input.windowBays, level: labelOf('ambition', input.windowAmbition) }),
        fill(S.summaryZones, { value: zones.length ? zones.join(sep) : S.summaryNone }),
        fill(S.summaryTotal, { low: r.totalLow, high: r.totalHigh }),
        fill(S.summarySplit, { full: r.fullBody, torso: r.torso })
      ];
      r.categories.forEach(function (c) {
        lines.push(fill(S.summaryCategory, { label: (S.categories || {})[c.key] || c.key, full: c.fullBody, torso: c.torso }));
      });
      lines.push('', S.summaryClosing, window.location.href.split('#')[0]);
      return lines.join('\n');
    }

    function render(input, r) {
      var out = function (name, scope) { return (scope || result).querySelector('[data-calc-out="' + name + '"]'); };
      out('range').textContent = r.totalLow + '–' + r.totalHigh;
      out('lead').textContent = fill(S.resultLead, { window: r.windowTotal, floor: r.floorTotal });
      result.querySelector('.amoy-calc__cards [data-calc-out="full"]').textContent = r.fullBody;
      result.querySelector('.amoy-calc__cards [data-calc-out="torso"]').textContent = r.torso;

      var byKey = {};
      r.categories.forEach(function (c) { byKey[c.key] = c; });
      CATEGORY_KEYS.forEach(function (k) {
        var row = result.querySelector('[data-calc-row="' + k + '"]');
        if (!row) return;
        var c = byKey[k];
        row.hidden = !c;
        if (!c) return;
        out('split', row).textContent = fill(S.rowSplit, { window: c.windowTotal, floor: c.floorTotal });
        out('full', row).textContent = c.fullBody;
        out('torso', row).textContent = c.torso;
      });
      out('total').textContent = r.total;

      out('method-floor').textContent = fill(S.methodFloor, { sqm: ASSUMPTIONS.SQM_PER_FLOOR_FORM });
      out('method-window').textContent = fill(S.methodWindow, {
        count: ASSUMPTIONS.WINDOW_FORMS_PER_BAY[input.windowAmbition],
        level: labelOf('ambition', input.windowAmbition)
      });

      root.querySelectorAll('[data-calc-shop-link]').forEach(function (link) {
        var key = link.getAttribute('data-calc-shop-link');
        link.hidden = key === 'forms' ? r.torso === 0 : !byKey[key];
      });

      lastSummary = buildSummary(input, r);
      try { window.sessionStorage.setItem('amoy_calc_summary', lastSummary); } catch (e) {}
      if (waLink) waLink.setAttribute('href', waBase + '?text=' + encodeURIComponent(lastSummary));
    }

    function run() {
      var input = readInput();
      if (!hasCategory()) { showStep(3, true); return; }
      setMode('loading');
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(function () {
        render(input, calculate(input));
        setMode('result');
        result.focus({ preventScroll: true });
        scrollToPanel();
      }, reduce ? 0 : 650);
    }

    backBtn.addEventListener('click', function () { if (current > 1) showStep(current - 1, true); });
    nextBtn.addEventListener('click', function () {
      if (current === 3 && !hasCategory()) { updateCategoryState(); return; }
      if (current < STEPS) showStep(current + 1, true);
    });
    submitBtn.addEventListener('click', run);

    form.addEventListener('change', function (e) {
      if (e.target === windowsInput) readInput();
      updateCategoryState();
    });
    form.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      e.preventDefault();
      if (!result.hidden || !loading.hidden) return;
      if (current < STEPS) nextBtn.click(); else run();
    });

    root.querySelectorAll('[data-calc-windows]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = parseInt(windowsInput.value, 10) || 0;
        windowsInput.value = Math.min(WINDOWS_MAX, Math.max(WINDOWS_MIN, n + parseInt(btn.getAttribute('data-calc-windows'), 10)));
      });
    });

    root.querySelector('[data-calc-edit]').addEventListener('click', function () {
      setMode('form');
      showStep(1, true);
    });
    root.querySelector('[data-calc-restart]').addEventListener('click', function () {
      form.reset();
      setMode('form');
      showStep(1, true);
    });

    var copyBtn = root.querySelector('[data-calc-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var done = function () {
          var toast = document.getElementById('amoy-toast');
          if (!toast) return;
          toast.textContent = S.copied;
          toast.classList.add('amoy-toast--visible');
          clearTimeout(toast._tid);
          toast._tid = setTimeout(function () { toast.classList.remove('amoy-toast--visible'); }, 2600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lastSummary).then(done, function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = lastSummary;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    }

    setMode('form');
    showStep(1, false);
  }

  function initAll(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-calculator]'), initCalculator);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });

  window.AmoyCalculator = { calculate: calculate, ASSUMPTIONS: ASSUMPTIONS };
})();
