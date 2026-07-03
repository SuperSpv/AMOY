# AMOY Custom Theme — Full Store Audit

**Store:** AMOY Mannequins — `store.amoylimited.com` (Saudi Arabia, SAR, Basic plan)
**Theme audited:** **AMOY Custom** — `gid://shopify/OnlineStoreTheme/159824969982` (UNPUBLISHED; live theme is currently "Horizon")
**Audit date:** 2026-07-03 · Audited by Fable (find-and-write only; fixes to be executed by other models)
**Snapshot:** full theme file snapshot in [`theme/`](theme/) (fetched 2026-07-03, reference copy)

> ⚠️ **Scope rule (per owner):** every fix — theme code, settings, templates — must be applied to the **"AMOY Custom" theme only**. Do not touch the live "Horizon" theme. AMOY Custom is unpublished, so `themeFilesUpsert` via the Shopify MCP is permitted on it. Store-data fixes (inventory, discounts, policies, metafields, collection template assignment) are store-level by nature and are marked **[STORE]** below.

---

## Context snapshot

- 41 active products (Female 14 + forms 13, Male 6, Kids 8), 39 with 9 variants (Color × Finish), 1 with 18, 1 with 1.
- 9 collections; blog "news" with 4 good SEO articles; pages: about / contact / certified.
- Locales: `en` (primary) + `ar` (published). Zero orders so far (pre-launch).
- Product-level SEO (titles, descriptions, bilingual alt text) is **already good** — the gaps are in the theme and store configuration.
- Design system (from `assets/amoy.css`): navy `#1C1B4D` primary, brass `#B08A22` accent, paper `#FBFBFD`, Cormorant Garamond display + Archivo sans, 1280px container, pill buttons.

---

## P0 — CRITICAL (store cannot sell until these are fixed)

### 1. "Proceed to checkout" button is broken
`theme/sections/main-cart.liquid` line ~75 uses `{{ routes.checkout }}` — **this route does not exist in Liquid**. It renders `href=""`, so the button just reloads the cart. Nobody can ever reach checkout.
**Fix:** link to `/checkout`, or better, wrap the cart in `<form action="{{ routes.cart_url }}" method="post">` and use `<button type="submit" name="checkout">`.

### 2. [STORE] Every product is unbuyable — 0 inventory + DENY policy
All variants of all 41 products have `inventoryQuantity: 0` with `inventoryPolicy: DENY`. `/cart/add.js` returns 422 for everything.
**Fix (pick per business model):** since mannequins are made-to-order, either set variants to *Continue selling when out of stock* (`inventoryPolicy: CONTINUE`), stop tracking inventory, or load real stock quantities at the Jeddah location.

### 3. Add-to-cart reports success on failure
`theme/assets/amoy.js` (`fetch('/cart/add.js')` handler) never checks `response.ok`. With today's 422s, customers see the "Added to cart ✓" toast while the cart stays empty.
**Fix:** check `r.ok` / parse the 422 `description`, show an error toast (bilingual), only show success on success.

### 4. No variant selector on the product page
Products have up to 9–18 variants (Color: White/Black/Other × Finish: Matte/Semi-Glossy/Glossy) but `theme/sections/main-product.liquid` renders **no option pickers** — `data-variant-id` is hardcoded to the first variant. Customers can only ever buy White/Matte. Five products (FB-01, FB-02, KQ-01, UR-01, FN-02/FN-03) also have **different prices per variant** (e.g. 390 vs 490 SAR) but the page shows only the minimum price — a mispricing risk.
**Fix:** render `product.options_with_values` as selects/swatches, update price + `data-variant-id` + availability on change (use `product.variants | json` or the `variants/:id` pattern). Show "From SAR X" on cards for multi-price products.

### 5. Search is broken (renders the collection section)
`theme/templates/search.json` renders `main-collection`, which depends on the `collection` object — nil on `/search`. Result: empty heading, "No products match these filters", and the query is ignored. There is also **no search input anywhere** in the theme (no header icon, no form).
**Fix:** create `sections/main-search.liquid` (form with `action="{{ routes.search_url }}"`, results loop over `search.results` with pagination, empty state), point `templates/search.json` to it, and add a search icon/input to `header.liquid`. Bonus: predictive search API.

### 6. /collections (list-collections) is broken the same way
`theme/templates/list-collections.json` also renders `main-collection` → blank page. Worse: the PDP "Back to shop" link (`routes.collections_url`) points *to this broken page*.
**Fix:** new `sections/main-list-collections.liquid` looping over `collections`, or point the template at a collection grid of the 4 real navigation collections.

### 7. Generic pages render a contact form instead of their content
`theme/templates/page.json` uses the `amoy-contact` section, which never outputs `page.content`. Live impact: **/pages/certified** (linked in the footer as "AMOY Certified") shows a quote form; its actual body text is never rendered anywhere.
**Fix:** create `sections/main-page.liquid` (`{{ page.title }}` + `{{ page.content }}` in AMOY DS typography), set it in `page.json`.

---

## P1 — HIGH (logic & data mismatches)

### 8. [STORE] Kids landing template is never used
`templates/collection.kids.json` exists, but the *Kids Collection* has `templateSuffix: null`, so it renders the default grid. **Fix:** set the collection's theme template to `kids` in admin (Online Store ▸ collection ▸ Theme template). Note: this assignment applies per-theme when AMOY Custom is published — verify after publishing.

### 9. Hardcoded filter chips don't match real product tags
`theme/sections/main-collection.liquid` (Gender/Category/Style groups) links tags `Male`, `Female`, `Sport`, `Athletic`, `Posed`, `Standard Standing` — but the catalog uses `Men`, `Women`, `Kids`, `sport pose`, `posed`, `standing pose`. 6 of 8 chips lead to **empty collections**.
**Fix:** delete the hardcoded groups and rely on the native `collection.filters` loop already present (configure filters in the Search & Discovery app **[STORE]**), or align chip tags with real tags.

### 10. Sort dropdown wipes active filters
The sort `<form>` contains only `sort_by`; submitting drops any active filter/tag params. **Fix:** echo current query params as hidden inputs (loop over `request.params` or at least filter params), or apply sort via JS URL merge.

### 11. Price filter is display-only
The `price_range` case in `main-collection.liquid` prints the range but renders **no min/max inputs**. **Fix:** proper `filter.min_value/max_value` number inputs inside the filter form.

### 12. Blog pagination hides one article per page
`main-blog.liquid` skips `forloop.first` whenever `show_featured` is on, but the featured article is `blog.articles.first` computed globally — on page 2+ the first article *of that page* silently disappears. **Fix:** skip `article.id == featured_article.id` instead, and only within page 1.

### 13. [STORE] "Volume discounts on 4+" promised but not configured
PDP says "volume discounts on 4+", cart says "Volume discounts apply on 4+ units" — the store's only discount is code `Welcome – 10% off first order`. **Fix:** create an automatic quantity discount (e.g. 4+ units → 10%; 10+ → "request a quote"), or remove the claim. Also surface the WELCOME code on-site (announcement bar) — right now nothing tells customers it exists.

### 14. Cart upsell "Add" doesn't refresh the cart page
On `/cart`, adding a recommended product only updates the header count (`syncCart`) — line items and totals go stale, and the qty +/- links (which use `forloop.index` line numbers) can then target the **wrong line**. **Fix:** re-render/reload the cart after a rec add on the cart page; prefer `line: item.key` over index for `/cart/change`.

### 15. Broken JSON-LD (Organization + Product)
`theme/layout/theme.liquid`: Organization `logo` outputs `"https:"` because `settings.share_image` **doesn't exist** in `settings_schema.json`. Product offer price uses `divided_by: 100.0` (emits `890.0`), image array is `[]` when no image, and no `priceValidUntil`/`AggregateOffer` for multi-price products.
**Fix:** add a `share_image` (or `logo_square`) image setting; use `| money_without_currency | remove: ','` or `price | divided_by: 100.0 | round: 2`; omit empty image arrays; consider `AggregateOffer` (lowPrice/highPrice) for the 5 multi-price products.

### 16. Theme settings are decorative — they do nothing
`color_primary`, `color_accent`, `color_background`, `type_header_font`, `logo_width` are defined in `config/settings_schema.json` but **never referenced** in any liquid/CSS — palette and fonts are hardcoded in `amoy.css`. Editor changes have zero effect.
**Fix:** emit CSS custom properties from settings in `theme.liquid` (`:root { --accent: {{ settings.color_accent }}; … }`) and consume them, or delete the dead settings to avoid a false sense of control.

### 17. Two conflicting design-token palettes (design-system violation)
`assets/amoy-blog.css` **redefines `:root`** with a different scale: brass `#B89455` vs brand `#B08A22`, navy-900 `#0E0E26` vs `#0F0E2D`, different slate/steel greys, its own font stack — and it's loaded by `main-blog`, `main-article`, **and `amoy-latest-blogs` (on the homepage)**, so the off-brand tokens override `amoy.css` across the whole homepage and blog. It also `@import`s Google Fonts a second time (render-blocking, duplicate download). The page loader (`snippets/amoy-loader.liquid`) hardcodes the off-brand brass `#B89455` too.
**Fix:** single source of tokens in `amoy.css`; strip `:root` and `@import` from `amoy-blog.css` (keep only component styles, namespaced); loader uses `--brass-500: #B08A22` / `--navy-700`.

### 18. Header styles defined twice, contradicting each other
`amoy.css` says `.amoy-header{position:sticky;height:76px}` (+ unused `--header-h`); `sections/header.liquid` inline-overrides with `position:fixed;height:96px` (74px mobile). Sticky offsets elsewhere (`.amoy-filters top:112px`, cart summary `top:96px`) don't track the mobile height.
**Fix:** one definition, driven by `--header-h`, and reuse the token for every sticky offset.

---

## P2 — Missing templates, files & i18n

19. **No customer account entry point.** New customer accounts are configured (customer-account menu exists) but the header has no login/account link. Add an account icon → `routes.account_url`.
20. **Missing `templates/gift_card.liquid`** — gift-card emails would land on a broken page.
21. **Missing `templates/password.json`** + section — if the store is ever password-protected, the page is unstyled default.
22. **Arabic is published but the theme can't speak it.** No `locales/ar.json`; `en.default.json` has only ~12 keys; only **5 of 32 sections** (header, footer, main-product, main-cart, main-collection) have hardcoded `is_ar` ternaries — all other sections and all JSON-template copy (hero, why, how-it-works, CTAs, blog, contact form labels, 404, grace/kids pages) render **English to Arabic shoppers**.
    **Fix (proper i18n):** move every hardcoded string (both languages) into `{{ 'key' | t }}` with full `en.default.json` + new `ar.json`; translate section-settings content via Translate & Adapt **[STORE]**. Delete the `is_ar` pattern.
23. **Dead files:** `sections/amoy-grace-collection.liquid` (superseded by the split grace sections) and `sections/amoy-specs-finishes.liquid` are referenced by no template — delete or wire up.
24. **Nav menus ignored.** The theme hardcodes header/footer links instead of `linklists`. The admin "Main menu" (Home/Catalog/Contact) does nothing. Hardcoded footer link `/collections/sport` exists ✓, but `Women`, `Men`, `Display Forms & Accessories` collections (real, populated) are **linked from nowhere**. **Fix:** render `linklists['main-menu']` / a footer menu, and update the menus **[STORE]** to include all 4 core collections.

---

## P3 — UI/UX

25. **Full-screen loader on every page view** (`snippets/amoy-loader.liquid`): covers content until `window.load`, killing perceived speed, LCP, and repeat navigation. Show once per session (`sessionStorage`) or remove; never block content on asset load.
26. **PDP gallery is fake.** Thumbnails have `cursor:pointer` but no click handler (no swap JS), max 3 thumbs, and grey placeholder boxes render when a product has <3 images — which is almost always, since **40 of 41 products have exactly 1 image [STORE: shoot more angles]**. Fix: hide placeholder thumbs, add swap logic, support >3 images.
27. **Cart page H1 says "Checkout"** — it's the cart. Rename ("Your cart / سلتك").
28. **No sold-out handling.** `product.available` is never checked; the button always says "Add to cart" (locale key `products.sold_out` exists, unused). Card "+ Add" buttons add the first variant of multi-variant products silently — link to PDP instead when `product.variants.size > 1`.
29. **Contact form swallows errors** — `form.errors` never rendered; a failed submit looks like nothing happened. Also the "Collection of interest" select omits Men and Display Forms.
30. **Missing conversion furniture:** no announcement bar (use it for WELCOME code + "Made in Jeddah · KSA-wide delivery"), no newsletter/email-capture form (prereq for automations), no policy links in footer, no payment icons (mada/Visa/Apple Pay matter in KSA), no social links, no WhatsApp floating button (WhatsApp is the primary KSA B2B channel — it's buried in the footer).
31. **No breadcrumbs** on PDP/collection; PDP back-link goes to broken `/collections` (see #6).
32. **Accessibility:** `.amoy-visually-hidden` class used but never defined in CSS; mobile nav/filter drawers have no focus trap or `aria-expanded`; rec cards inject unescaped `p.title` into `innerHTML` (use `textContent` or escape); several `image_tag` calls missing alt (amoy-hero, amoy-why, amoy-collections, amoy-about, amoy-featured-products).
33. **Client logos (Adidas, Next, Debenhams)** — verify permission to display these trademarks with a "trusted by" claim before launch.
34. **Inconsistent stat formatting** in hero: "13+" vs "+25" — pick one convention (and localize digits for ar).

---

## P4 — SEO

35. **Homepage has no meta description** (`page_description` is empty on index) and og:image exists only on product/article pages. Add a homepage description + global `share_image` fallback og:image (ties into #15).
36. **No hreflang alternates** for en/ar — add `<link rel="alternate" hreflang>` loops over `localization.available_languages` in `theme.liquid` (and `x-default`).
37. **Missing schema:** BreadcrumbList (after #31), LocalBusiness (huge local-SEO win — Jeddah showroom address, geo, opening hours, `+966547275228`), Article on blog posts, FAQPage (the "What can be customized?" accordions are ready-made FAQ content), CollectionPage/ItemList on collections.
38. **[STORE] 4 collections have no SEO title/description:** Women, Men, Kids, Display Forms & Accessories (the others are done). All 9 collections lack a collection image (used for og:image).
39. **Performance = SEO:** kill the loader (#25), dedupe font loading (#17), add explicit `width`/`height` to `image_tag`s to stop CLS, `loading="lazy"` below the fold (mostly done ✓), consider self-hosting the two Google Font families.
40. **Content:** blog foundation is strong (4 keyword-targeted posts ✓). Add Arabic versions of the 4 posts (searches like "مانيكان للبيع" / "مانيكانات الرياض" are the local volume); interlink PDPs ↔ relevant posts ("What do mannequins cost?" → pricing guide link on PDPs).

---

## P5 — Pricing improvements

41. **Show price ranges.** 5 products have variant price spreads (FB-01/FB-02 390–490, KQ-01 390–450, UR-01 120–150, FN-02/FN-03 890–950) — cards and PDP must show "From SAR 390" / live variant price (part of #4).
42. **No anchor pricing anywhere** — `compare_at_price` is unset on all 41 products and the theme never renders it. For launch: set compare-at on hero SKUs + render a sale badge/strikethrough (theme + **[STORE]**).
43. **Tiered volume pricing** to back the "4+" promise (#13): automatic discount 4+ → e.g. 8–10%; surface the tier table on the PDP ("1–3: SAR 890 · 4–9: SAR 810 · 10+: request a quote") — that last tier feeds the existing bulk-quote CTA, which is good.
44. **[STORE] Shipping is opaque.** "Delivery: quoted on confirmation" adds checkout friction — publish flat KSA city-tier rates (Jeddah / Riyadh–Dammam / other) or a free-delivery threshold (e.g. orders over SAR 3,000), then advertise it in the announcement bar and a cart progress bar.
45. **Bundles:** "Complete the display" is already the recs heading — formalize it: mannequin + kids torso + head form bundles at 5–8% off (automatic discount on combination, or a bundle app later).

---

## P6 — Cross-sell / upsell gaps

46. Theme already fetches `related` + `complementary` recommendations on PDP and cart ✓ — but **complementary returns nothing until pairs are configured** in the Search & Discovery app **[STORE]**: map full-body mannequins ↔ display forms (heads, busts, leg/sock/glove forms are natural attachments).
47. Cart recs seed only from the **first** cart item — seed from the last-added or highest-value line.
48. Cart-page rec add is broken-ish (#14) — fix that first, then the loop works.
49. Add a **free-shipping / volume-discount progress bar** in cart ("Add 1 more unit for 10% off") — highest-leverage upsell given the 4+ tier.
50. No post-purchase / thank-you page upsell — on Basic plan, add a "Complete the display" collection link + WhatsApp CTA to the order status page via Additional scripts, or skip until Plus.

---

## P7 — Message templates & automations (AMOY Mannequins Design System)

The Admin API cannot read notification templates or marketing automations, so these need a manual pass in admin — the defaults are **unbranded Shopify templates** and are *not* using the AMOY DS:

51. **Settings ▸ Notifications ▸ Customize email templates:** apply the DS — navy `#1C1B4D` header band with `logo-amoy-white.png`, brass `#B08A22` buttons/links, Archivo body / Cormorant headings (email-safe fallback: Georgia), bilingual EN + AR blocks (RTL-safe tables), footer: support@amoylimited.com · +966 54 727 5228 · WhatsApp link · Jeddah address. Priority templates: Order confirmation, Shipping confirmation, Abandoned checkout, Contact-us auto-reply (if using Shopify Inbox), Customer account welcome.
52. **Marketing ▸ Automations — currently none visible; create:** (a) Abandoned checkout (1h + 24h, include WELCOME code for first-timers), (b) Welcome series on newsletter signup — requires the signup form from #30, (c) Browse abandonment, (d) Post-delivery follow-up asking for a Google review + offering the 4+ volume tier for reorders. All in Shopify Email with the same DS tokens.
53. **Quote-request handling:** contact form submissions go to email only — set an auto-reply, and add a WhatsApp deep link (`wa.me/966547275228?text=...`) as the primary follow-up channel.
54. **Unify sender/contact identity [STORE + theme]:** the site currently mixes `support@` (footer, grace/kids CTAs), `hello@` (contact page, CTA schema default), and `faisal@` (store account). Pick one public address (suggest `support@amoylimited.com`), update `amoy-contact` default, `amoy-cta` contact_line, and the sender email in Settings ▸ Notifications.

---

## P8 — Policies & trust [STORE]

55. **Only a Privacy Policy exists.** No Refund/Return policy, no Terms of Service, no Shipping policy — required for Saudi e-commerce compliance (and they auto-link in checkout). Write them (bilingual), then add footer links (#30). The privacy policy is also the unedited Shopify boilerplate with `{{ placeholders }}` — review and localize.
56. **Trust signals for KSA B2B:** CR (commercial registration) number + VAT number in footer, Saudi Business Center / maroof reference if available, payment method icons, physical showroom block with map on the contact page.

---

## Suggested execution order for fixer models

| Wave | Items | Where |
|------|-------|-------|
| 1 — Unblock selling | #1 #2 #3 #4 | theme + store |
| 2 — Unbreak pages | #5 #6 #7 #8 #12 | theme |
| 3 — Trust & compliance | #55 #54 #30 (policies, footer, announcement bar, email capture) | store + theme |
| 4 — Design-system & UX | #17 #18 #16 #25 #26 #27 #28 #29 | theme |
| 5 — SEO | #15 #35 #36 #37 #38 #39 | theme + store |
| 6 — Revenue | #13 #41–#50 (pricing, discounts, cross-sell config) | store + theme |
| 7 — i18n | #22 (ar.json + t-filter refactor) | theme |
| 8 — Messaging | #51–#53 (notifications + automations, AMOY DS) | admin (manual) |

**Reminder for every wave:** target theme `gid://shopify/OnlineStoreTheme/159824969982` ("AMOY Custom") — never the published theme.
