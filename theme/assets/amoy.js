document.addEventListener('DOMContentLoaded', function () {
  var moneyFmt;
  try { moneyFmt = new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'SAR', maximumFractionDigits: 0 }); } catch (e) { moneyFmt = null; }
  function money(cents){ var v = (cents||0)/100; return moneyFmt ? moneyFmt.format(v) : v.toLocaleString() + ' SAR'; }

  // Cart count sync
  function syncCart() {
    fetch('/cart.js').then(function(r){return r.json();}).then(function(cart){
      document.querySelectorAll('[data-cart-count]').forEach(function(el){
        el.textContent = cart.item_count;
        el.style.display = cart.item_count > 0 ? 'inline-flex' : 'none';
      });
    });
  }
  syncCart();

  // Toast helper
  function showToast(msg) {
    var t = document.getElementById('amoy-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('amoy-toast--visible');
    clearTimeout(t._tid);
    t._tid = setTimeout(function(){ t.classList.remove('amoy-toast--visible'); }, 2400);
  }
  var isAr = (document.documentElement.lang||'').indexOf('ar') === 0;
  var addedMsg = isAr ? 'تمت الإضافة إلى السلة' : 'Added to cart';
  var errMsg = isAr ? 'تعذّرت الإضافة إلى السلة، يرجى المحاولة مرة أخرى' : 'Sorry, this item could not be added to cart';

  // Add to cart (delegated)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    var variantId = btn.dataset.variantId;
    var qtyEl = btn.closest('[data-product-form]') && btn.closest('[data-product-form]').querySelector('[data-qty]');
    var qty = qtyEl ? parseInt(qtyEl.value) || 1 : 1;
    if (!variantId) return;
    btn.disabled = true;
    fetch('/cart/add.js', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({id: variantId, quantity: qty})
    }).then(function(r){
      return r.json().then(function(data){ return { ok: r.ok, data: data }; });
    }).then(function(res){
      if (res.ok) {
        syncCart();
        showToast(addedMsg);
      } else {
        showToast((res.data && res.data.description) ? res.data.description : errMsg);
      }
      btn.disabled = false;
    }).catch(function(){ showToast(errMsg); btn.disabled = false; });
  });

  // Qty steppers (delegated)
  document.addEventListener('click', function(e) {
    var step = e.target.closest('[data-qty-step]');
    if (!step) return;
    var input = step.closest('[data-qty-wrap]') && step.closest('[data-qty-wrap]').querySelector('[data-qty]');
    if (!input) return;
    var val = parseInt(input.value) || 1;
    var d = parseInt(step.dataset.qtyStep);
    input.value = Math.max(1, val + d);
  });

  // Product detail tabs
  document.addEventListener('click', function(e) {
    var tab = e.target.closest('[data-tab]');
    if (!tab) return;
    var panel = tab.dataset.tab;
    var container = tab.closest('[data-tabs-root]');
    if (!container) return;
    container.querySelectorAll('[data-tab]').forEach(function(t){ t.classList.toggle('is-active', t === tab); });
    container.querySelectorAll('[data-tab-panel]').forEach(function(p){ p.hidden = p.dataset.tabPanel !== panel; });
  });

  // Sort: auto-submit on change
  document.addEventListener('change', function(e){
    var sel = e.target.closest('[data-sort-select]');
    if (!sel) return;
    var form = sel.closest('form');
    if (form) form.submit();
  });

  // Mobile filter drawer
  function toggleFilters(open){
    var panel = document.querySelector('[data-filters]');
    var back = document.querySelector('[data-filter-backdrop]');
    var filterBtn = document.querySelector('[data-filter-open]');
    if (!panel) return;
    panel.classList.toggle('is-open', open);
    if (back) back.classList.toggle('is-open', open);
    if (filterBtn) filterBtn.classList.toggle('is-active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  document.addEventListener('click', function(e){
    if (e.target.closest('[data-filter-open]')) { toggleFilters(true); }
    if (e.target.closest('[data-filter-close]') || e.target.closest('[data-filter-backdrop]')) { toggleFilters(false); }
  });

  // Mobile nav menu
  document.addEventListener('click', function(e){
    if (e.target.closest('[data-menu-toggle]')) {
      var nav = document.querySelector('[data-mobile-nav]');
      var open = nav && !nav.classList.contains('is-open');
      if (nav) nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    if (e.target.closest('[data-menu-close]') || e.target.closest('[data-menu-backdrop]')) {
      var nav2 = document.querySelector('[data-mobile-nav]');
      if (nav2) nav2.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  // Product recommendations (cross-sell / upsell)
  var recsRoot = document.querySelector('[data-recs]');
  if (recsRoot) {
    var pid = recsRoot.dataset.productId;
    var addLabel = recsRoot.dataset.addLabel || '+ Add';
    function card(p){
      var img = p.featured_image ? p.featured_image : (p.images && p.images[0]) || '';
      var vid = p.variants && p.variants[0] ? p.variants[0].id : '';
      var type = p.type || '';
      return '<div class="amoy-card amoy-card--interactive amoy-recs__card">' +
        '<a href="' + p.url + '" class="amoy-card__media">' +
          (img ? '<img src="' + img + '" alt="' + (p.title||'').replace(/"/g,"") + '" loading="lazy" style="width:100%;height:100%;object-fit:contain">' : '') +
        '</a>' +
        '<div class="amoy-card__body">' +
          (type ? '<div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--steel)">' + type + '</div>' : '') +
          '<h3 class="amoy-recs__name"><a href="' + p.url + '" style="color:inherit">' + p.title + '</a></h3>' +
          '<div class="amoy-recs__row">' +
            '<span class="amoy-recs__price">' + money(p.price) + '</span>' +
            (vid ? '<button type="button" class="amoy-btn amoy-btn--secondary" style="padding:6px 12px;font-size:12px;border-radius:var(--radius-sm)" data-add-to-cart data-variant-id="' + vid + '">' + addLabel + '</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    function load(intent, blockSel, gridSel){
      fetch('/recommendations/products.json?product_id=' + pid + '&limit=4&intent=' + intent)
        .then(function(r){ return r.json(); })
        .then(function(data){
          var prods = (data && data.products) || [];
          if (!prods.length) return;
          var grid = recsRoot.querySelector(gridSel);
          var block = recsRoot.querySelector(blockSel);
          if (!grid || !block) return;
          grid.innerHTML = prods.map(card).join('');
          block.hidden = false;
        }).catch(function(){});
    }
    load('complementary', '[data-recs-complementary]', '[data-recs-complementary-grid]');
    load('related', '[data-recs-related]', '[data-recs-related-grid]');
  }

  // Cart upsell recommendations
  var cartRecs = document.querySelector('[data-cart-recs]');
  if (cartRecs) {
    var seed = cartRecs.dataset.seed;
    var addLabelC = cartRecs.dataset.addLabel || '+ Add';
    if (seed) {
      fetch('/recommendations/products.json?product_id=' + seed + '&limit=3&intent=related')
        .then(function(r){ return r.json(); })
        .then(function(data){
          var prods = (data && data.products) || [];
          if (!prods.length) return;
          var grid = cartRecs.querySelector('[data-cart-recs-grid]');
          grid.innerHTML = prods.map(function(p){
            var img = p.featured_image || (p.images && p.images[0]) || '';
            var vid = p.variants && p.variants[0] ? p.variants[0].id : '';
            return '<div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-subtle)">' +
              '<a href="' + p.url + '" style="width:54px;height:68px;border-radius:var(--radius-sm);overflow:hidden;flex:none;background:var(--mist);display:block">' + (img ? '<img src="' + img + '" alt="' + (p.title||'').replace(/"/g,"") + '" style="width:100%;height:100%;object-fit:cover">' : '') + '</a>' +
              '<div style="flex:1;min-width:0"><div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--text-heading);line-height:1.15">' + p.title + '</div><div style="font-size:13px;font-weight:700;margin-top:2px">' + money(p.price) + '</div></div>' +
              (vid ? '<button type="button" class="amoy-btn amoy-btn--secondary" style="padding:7px 12px;font-size:12px;border-radius:var(--radius-sm);white-space:nowrap" data-add-to-cart data-variant-id="' + vid + '">' + addLabelC + '</button>' : '') +
            '</div>';
          }).join('');
          cartRecs.hidden = false;
        }).catch(function(){});
    }
  }
});
