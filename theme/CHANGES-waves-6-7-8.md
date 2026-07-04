# AMOY Custom — Waves 6, 7, 8 (applied)

Target theme: `gid://shopify/OnlineStoreTheme/159824969982` ("AMOY Custom", unpublished).
Live "Horizon" theme untouched. Files in `theme/` mirror exactly what was pushed via the
Shopify theme MCP (`themeFilesUpsert`).

## Wave 6 — Revenue
- **#41 Price ranges** — "From SAR X" now on featured-products cards (was flat min price)
  and retained on collection cards.
- **#42 Anchor pricing** — `compare_at_price` strikethrough renders on collection cards,
  featured cards, and PDP (with a brass "Save" badge); PDP variant JS updates the
  compare/save on option change. Renders only when a compare-at is set (store to set values).
- **#43 Volume tiers** — PDP tier table (1–3 / 4–9 = 10% off / 10+ = request a quote),
  computed from unit price.
- **#28 Sold-out** — featured & collection cards and the PDP button now respect
  `product.available`; multi-variant cards link to the PDP instead of blind-adding variant 1.
- **#47 Cart recs seed** — seeds from the last-added line (`cart.items.last`) not the first.
- **#48 Cart rec add** — `amoy.js` reloads the cart page after a recommendation add so line
  items/totals refresh; cart qty/remove links switched from fragile `line=` index to `id=item.key`.
- **#49 Progress bar** — cart summary shows "Add N more to unlock 10% off" with a brass
  progress bar, and an "unlocked" state at 4+ units.
- **Store: automatic discount** "Volume — 10% off 4+ units" created & ACTIVE
  (`DiscountAutomaticNode/1862542655742`) — backs the 4+ / progress-bar / tier claims.

## Wave 7 — i18n (#22)
- Added `locales/ar.json` (was missing) and expanded `locales/en.default.json` from ~12 keys
  to a full UI key set (general/announcement/cart/products/tiers/collection/contact).
- Fixed the remaining English-only strings in `amoy-featured-products` (Shop all / Options /
  + Add / Sold out / arrows).
- RTL + Arabic font wiring already present in `layout/theme.liquid` (wave 4).

### Residual (documented, not risk-pushed)
Shopper-facing Arabic already renders across the reviewed sections via the theme's inline
`is_ar` bilingual pattern. Migrating every section from `is_ar` to `{{ 'key' | t }}` is
optional architectural cleanup; the new locale files give it a base. Section-**setting**
copy (hero/why/CTA headings) is merchant-entered and must be localized via Translate & Adapt.

## Wave 8 — Messaging (#51–#53)
No Admin API for notification templates or automations — delivered as an implementation
spec: see `../WAVE-8-MESSAGING.md`.
