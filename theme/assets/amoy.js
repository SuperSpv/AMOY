/* AMOY Custom — storefront behaviour.
   Design rules:
   - No user-facing strings in here. Everything comes from window.amoyStrings,
     which theme.liquid fills from the locale files.
   - No HTML built from JSON. Cart and recommendation markup is rendered by
     Liquid and fetched through Shopify's Section Rendering API.
   - No hardcoded URLs. Routes come from window.amoyRoutes so the theme keeps
     working under /ar and other market prefixes. */
(function () {
  'use strict';

  var S = window.amoyStrings || {};
  var R = window.amoyRoutes || {};
  var CFG = window.amoySettings || {};

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function toast(message) {
    var el = document.getElementById('amoy-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('amoy-toast--visible');
    clearTimeout(el._tid);
    el._tid = setTimeout(function () { el.classList.remove('amoy-toast--visible'); }, 2600);
  }

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var lastFocused = null;

  function trapFocus(container) {
    lastFocused = document.activeElement;
    var nodes = $$(FOCUSABLE, container);
    if (nodes.length) nodes[0].focus();
    container._trap = function (e) {
      if (e.key !== 'Tab') return;
      var list = $$(FOCUSABLE, container);
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    container.addEventListener('keydown', container._trap);
  }

  function releaseFocus(container) {
    if (container && container._trap) container.removeEventListener('keydown', container._trap);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; }

  var cartDrawerId = 'cart-drawer';

  function updateCartCount(count) {
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      if (count > 0) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function replaceCartDrawer(html) {
    var incoming = new DOMParser().parseFromString(html, 'text/html');
    var fresh = incoming.querySelector('[data-cart-drawer]');
    var current = $('[data-cart-drawer]');
    if (!fresh || !current) return;
    var wasOpen = current.classList.contains('is-open');
    current.replaceWith(fresh);
    if (wasOpen) fresh.classList.add('is-open');
  }

  function openCartDrawer() {
    var drawer = $('[data-cart-drawer]');
    if (!drawer) return false;
    drawer.classList.add('is-open');
    lockScroll(true);
    trapFocus(drawer);
    return true;
  }

  function closeCartDrawer() {
    var drawer = $('[data-cart-drawer]');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    lockScroll(false);
    releaseFocus(drawer);
  }

  function refreshCart(openAfter) {
    return fetch(R.cart + '.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        if (CFG.cartType !== 'drawer') return cart;
        return fetch(R.cart + '?section_id=' + cartDrawerId)
          .then(function (r) { return r.text(); })
          .then(function (html) {
            replaceCartDrawer(html);
            if (openAfter) openCartDrawer();
            return cart;
          });
      });
  }

  function addToCart(payload, button) {
    if (button) { button.disabled = true; button.classList.add('is-loading'); }
    return fetch(R.cartAdd + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) {
          var msg = (res.data && res.data.description) || S.addError;
          toast(msg);
          return { ok: false, message: msg };
        }
        return refreshCart(CFG.cartType === 'drawer').then(function () {
          if (CFG.cartType !== 'drawer') toast(S.addedToCart);
          return { ok: true };
        });
      })
      .catch(function () { toast(S.addError); return { ok: false, message: S.addError }; })
      .then(function (res) {
        if (button) { button.disabled = false; button.classList.remove('is-loading'); }
        return res;
      });
  }

  function changeLine(line, quantity) {
    return fetch(R.cartChange + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        if (document.body.classList.contains('template-cart')) { window.location.reload(); return; }
        return refreshCart(false);
      });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;

    var quickAdd = t.closest('[data-add-to-cart]');
    if (quickAdd) {
      e.preventDefault();
      var id = quickAdd.dataset.variantId;
      if (id) addToCart({ items: [{ id: id, quantity: 1 }] }, quickAdd);
      return;
    }

    var step = t.closest('[data-qty-step]');
    if (step) {
      var wrap = step.closest('[data-qty-wrap]');
      var input = wrap && wrap.querySelector('[data-qty]');
      if (input) {
        var min = parseInt(input.min, 10) || 1;
        var inc = parseInt(input.step, 10) || 1;
        var next = (parseInt(input.value, 10) || min) + parseInt(step.dataset.qtyStep, 10) * inc;
        input.value = Math.max(min, next);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    var lineBtn = t.closest('[data-cart-qty]');
    if (lineBtn) {
      e.preventDefault();
      changeLine(parseInt(lineBtn.dataset.cartQty, 10), parseInt(lineBtn.dataset.qtyValue, 10));
      return;
    }

    if (t.closest('[data-cart-drawer-open]')) {
      if (CFG.cartType === 'drawer' && openCartDrawer()) e.preventDefault();
      return;
    }
    if (t.closest('[data-cart-drawer-close]')) { closeCartDrawer(); return; }

    if (t.closest('[data-menu-toggle]')) {
      var nav = $('[data-mobile-nav]');
      if (!nav) return;
      var opening = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', opening);
      t.closest('[data-menu-toggle]').setAttribute('aria-expanded', String(opening));
      lockScroll(opening);
      if (opening) trapFocus(nav); else releaseFocus(nav);
      return;
    }
    if (t.closest('[data-menu-close]')) {
      var nav2 = $('[data-mobile-nav]');
      if (nav2) nav2.classList.remove('is-open');
      var tg = $('[data-menu-toggle]');
      if (tg) tg.setAttribute('aria-expanded', 'false');
      lockScroll(false);
      releaseFocus(nav2);
      return;
    }

    if (t.closest('[data-filter-open]')) { toggleFilters(true); return; }
    if (t.closest('[data-filter-close]') || t.closest('[data-filter-backdrop]')) { toggleFilters(false); return; }

    $$('[data-dropdown][open]').forEach(function (d) {
      if (!d.contains(t)) d.removeAttribute('open');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeCartDrawer();
    var nav = $('[data-mobile-nav].is-open');
    if (nav) {
      nav.classList.remove('is-open');
      var toggle = $('[data-menu-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      lockScroll(false);
      releaseFocus(nav);
    }
    toggleFilters(false);
    $$('[data-dropdown][open]').forEach(function (d) { d.removeAttribute('open'); });
  });

  function toggleFilters(open) {
    var panel = $('[data-filters]');
    if (!panel) return;
    var backdrop = $('[data-filter-backdrop]');
    var btn = $('[data-filter-open]');
    panel.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    if (btn) { btn.classList.toggle('is-active', open); btn.setAttribute('aria-expanded', String(open)); }
    lockScroll(open);
  }

  document.addEventListener('change', function (e) {
    var cartQty = e.target.closest('[data-cart-qty-input]');
    if (cartQty) {
      var qty = parseInt(cartQty.value, 10);
      if (isNaN(qty) || qty < 0) qty = 0;
      changeLine(parseInt(cartQty.dataset.cartQtyInput, 10), qty);
      return;
    }
    var select = e.target.closest('[data-sort-select], [data-localization-submit]');
    if (!select) return;
    var form = select.closest('form');
    if (form) form.submit();
  });

  /* Language: remember an explicit choice so the Arabic auto-redirect in
     theme.liquid respects it on later visits. */
  var LOC = window.amoyLocale || {};
  document.addEventListener('click', function (e) {
    var langBtn = e.target.closest('.amoy-lang__btn[name="language_code"]');
    if (langBtn && LOC.remember) LOC.remember(langBtn.value);
  }, true);

  /* A shopper who types an Arabic search on the English store gets the
     Arabic results page (and the Arabic store from then on). */
  var ARABIC_CHARS = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.getAttribute('role') !== 'search') return;
    if (!LOC.arSearch || LOC.current === 'ar') return;
    var q = form.querySelector('input[name="q"]');
    if (!q || !ARABIC_CHARS.test(q.value || '')) return;
    form.setAttribute('action', LOC.arSearch);
    if (LOC.remember) LOC.remember('ar');
  }, true);

  /* Contact form: pick up an estimate sent from the mannequin calculator. */
  function prefillContactFromCalculator() {
    var target = document.querySelector('[data-calculator-prefill]');
    if (!target || target.value) return;
    var summary = null;
    try { summary = window.sessionStorage.getItem('amoy_calc_summary'); } catch (err) {}
    if (summary) target.value = summary;
  }

  function showMedia(root, mediaId) {
    $$('[data-media-id]', root).forEach(function (el) {
      el.classList.toggle('is-active', el.dataset.mediaId === mediaId);
    });
  }

  function initProductForm(root) {
    var form = $('[data-product-form]', root) || root.querySelector('form.amoy-product-form');
    if (!form || form._init) return;
    form._init = true;

    var variantInput = $('[data-variant-input]', form);
    var picker = $('[data-variant-picker]', form);
    var dataEl = $('[data-variant-data]', form);
    var submitBtn = $('[data-add-to-cart-submit]', form);
    var errorEl = $('[data-form-error]', form);
    var sectionEl = root.closest('[id^="shopify-section-"]');
    var sectionId = sectionEl ? sectionEl.id.replace('shopify-section-', '') : null;

    if (picker && dataEl && variantInput) {
      var variants = [];
      try { variants = JSON.parse(dataEl.textContent); } catch (err) { variants = []; }

      /* Options are compared by position (data-option-index), never by their
         text, so the picker works when option names are translated. */
      var selectedOptions = function () {
        return $$('.amoy-variant-group', picker).map(function (group) {
          var checked = group.querySelector('input:checked');
          return checked ? parseInt(checked.getAttribute('data-option-index'), 10) : null;
        });
      };

      var findVariant = function (options) {
        for (var i = 0; i < variants.length; i++) {
          var v = variants[i];
          var match = true;
          for (var j = 0; j < options.length; j++) {
            if (options[j] !== null && v.options[j] !== options[j]) { match = false; break; }
          }
          if (match) return v;
        }
        return null;
      };

      var applyVariant = function (variant) {
        if (!variant) {
          if (submitBtn) {
            submitBtn.disabled = true;
            var lbl0 = submitBtn.querySelector('.amoy-btn__label');
            if (lbl0) lbl0.textContent = S.unavailable || S.soldOut;
          }
          return;
        }

        variantInput.value = variant.id;

        if (submitBtn) {
          submitBtn.disabled = !variant.available;
          var lbl = submitBtn.querySelector('.amoy-btn__label');
          if (lbl) lbl.textContent = variant.available ? S.addToCart : S.soldOut;
        }

        if (window.history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', variant.id);
          window.history.replaceState({}, '', url.toString());
        }

        $$('.amoy-variant-group', picker).forEach(function (group) {
          var checked = group.querySelector('input:checked');
          var label = group.querySelector('[data-option-value]');
          if (checked && label) label.textContent = checked.value;
        });

        if (variant.featured_media && variant.featured_media.id) {
          showMedia(root, String(variant.featured_media.id));
        }

        if (sectionId) {
          fetch(window.location.pathname + '?variant=' + variant.id + '&section_id=' + sectionId)
            .then(function (r) { return r.text(); })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var freshPrice = doc.querySelector('[data-price-block]');
              var currentPrice = $('[data-price-block]', root);
              if (freshPrice && currentPrice) currentPrice.innerHTML = freshPrice.innerHTML;
              var freshSku = doc.querySelector('[data-variant-sku]');
              var currentSku = $('[data-variant-sku]', root);
              if (freshSku && currentSku) currentSku.textContent = freshSku.textContent;
            })
            .catch(function () {});
        }
      };

      picker.addEventListener('change', function () {
        applyVariant(findVariant(selectedOptions()));
      });
    }

    form.addEventListener('submit', function (e) {
      if (!window.fetch) return;
      e.preventDefault();
      if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
      var formData = new FormData(form);
      var payload = { items: [{ id: formData.get('id'), quantity: parseInt(formData.get('quantity'), 10) || 1 }] };

      var props = {};
      formData.forEach(function (value, key) {
        if (key.indexOf('properties[') === 0) props[key.slice(11, -1)] = value;
        if (key === 'selling_plan') payload.items[0].selling_plan = value;
      });
      if (Object.keys(props).length) payload.items[0].properties = props;

      addToCart(payload, submitBtn).then(function (res) {
        if (res && !res.ok && errorEl) { errorEl.textContent = res.message; errorEl.hidden = false; }
      });
    });
  }

  function initGallery(root) {
    var gallery = $('[data-gallery]', root);
    if (!gallery || gallery._init) return;
    gallery._init = true;
    gallery.addEventListener('click', function (e) {
      var thumb = e.target.closest('[data-thumb]');
      if (!thumb) return;
      showMedia(root, thumb.dataset.mediaId);
      $$('[data-thumb]', gallery).forEach(function (x) { x.classList.toggle('is-active', x === thumb); });
    });
  }

  function initRecommendations() {
    var host = $('[data-recommendations]');
    if (!host || host._init) return;
    host._init = true;
    var productId = host.dataset.productId;
    var limit = host.dataset.limit || 4;
    var intents = (host.dataset.intents || 'related').split(',');

    intents.forEach(function (intent) {
      if (!intent.trim()) return;
      var url = (R.recommendations || '/recommendations/products') + '?section_id=product-recommendations&product_id=' +
        encodeURIComponent(productId) + '&limit=' + encodeURIComponent(limit) +
        '&intent=' + encodeURIComponent(intent.trim());
      fetch(url)
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var block = doc.querySelector('.amoy-recs');
          if (block) host.appendChild(block);
        })
        .catch(function () {});
    });
  }

  function initCartUpsell() {
    var host = $('[data-cart-recs]');
    if (!host || host._init) return;
    host._init = true;
    var seed = host.dataset.seed;
    if (!seed) return;
    var limit = host.dataset.limit || 3;
    fetch((R.recommendations || '/recommendations/products') + '?section_id=product-recommendations&product_id=' +
      encodeURIComponent(seed) + '&limit=' + encodeURIComponent(limit) + '&intent=related')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var grid = doc.querySelector('.amoy-recs__grid');
        var target = $('[data-cart-recs-grid]', host);
        if (grid && target && grid.children.length) {
          target.innerHTML = grid.innerHTML;
          host.removeAttribute('hidden');
        }
      })
      .catch(function () {});
  }

  function initCarousels(root) {
    $$('[data-carousel]', root || document).forEach(function (wrap) {
      if (wrap._carousel) return;
      wrap._carousel = true;
      var track = $('[data-carousel-track]', wrap);
      if (!track) return;
      var prev = $('[data-carousel-prev]', wrap);
      var next = $('[data-carousel-next]', wrap);
      var rtl = document.documentElement.dir === 'rtl';

      function update() {
        var max = track.scrollWidth - track.clientWidth;
        var pos = Math.abs(track.scrollLeft);
        wrap.classList.toggle('can-scroll-start', pos > 4);
        wrap.classList.toggle('can-scroll-end', pos < max - 4);
      }
      function step(dir) {
        var amount = Math.round(track.clientWidth * 0.75) * dir * (rtl ? -1 : 1);
        track.scrollBy({ left: amount, behavior: 'smooth' });
      }
      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      if (prev) prev.addEventListener('click', function () { step(-1); });
      if (next) next.addEventListener('click', function () { step(1); });
      update();
    });
  }

  function initAnnouncement() {
    var bar = $('[data-announcement]');
    if (!bar || bar._init || !bar.dataset.autorotate) return;
    bar._init = true;
    var items = $$('[data-announce-item]', bar);
    if (items.length < 2) return;
    var i = 0;
    setInterval(function () {
      items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, parseInt(bar.dataset.autorotate, 10) || 6000);
  }

  function init(scope) {
    var root = scope || document;
    $$('[data-product-root]', root).forEach(function (el) {
      initProductForm(el);
      initGallery(el);
    });
    initRecommendations();
    initCartUpsell();
    initAnnouncement();
    initCarousels(root);
    if (!scope) {
      updateCartCountFromServer();
      prefillContactFromCalculator();
    }
  }

  function updateCartCountFromServer() {
    fetch(R.cart + '.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartCount(cart.item_count); })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
  document.addEventListener('shopify:section:select', function (e) {
    if (e.target.querySelector('[data-cart-drawer]')) openCartDrawer();
  });
  document.addEventListener('shopify:section:deselect', function (e) {
    if (e.target.querySelector('[data-cart-drawer]')) closeCartDrawer();
  });
})();
