# AMOY Custom — Wave 2 + 3 fixes + cart "sold out" fix

**Date:** 2026-07-03
**Target theme:** `AMOY Custom` — `gid://shopify/OnlineStoreTheme/159824969982` (UNPUBLISHED). Live "Horizon" theme was **not** touched.
**Method:** Shopify Admin API (`themeFilesUpsert` on the unpublished theme + store-data mutations).

> Note: the theme itself lives in Shopify, not in this git repo, so the edits below are applied directly to the Shopify theme. This file is only a written record of what changed.

---

## Cart "already sold out" error — FIXED (root cause was inventory data)

The error text `The product '… - White / Matte' is already sold out.` is Shopify's own `/cart/add.js`
422 response, which the theme faithfully surfaces as a toast. It fires when a variant is
inventory-**tracked** + policy **DENY** + 0 qty.

- All **41 products / 370 variants** now verified: `inventoryPolicy: CONTINUE`, untracked,
  `availableForSale: true` → the 422 can no longer occur. (Wave-1 bulk fix had already landed;
  FA-06 itself was already correct.)
- The one remaining outlier, **MA-04 White/Matte**, was still `tracked: true` — untracked it via
  `inventoryItemUpdate` so all variants are now uniform.

If the storefront still shows the message briefly, it's CDN/section cache — hard-refresh; the
underlying data is correct.

---

## Wave 2 — Unbreak pages

| # | Item | Status |
|---|------|--------|
| 5 | Search | Already fixed — `sections/main-search.liquid` (form + paginated results + empty state) exists and `templates/search.json` points to it; header has desktop + mobile search forms. Verified. |
| 6 | `/collections` list | Already fixed — `sections/main-list-collections.liquid` (collection grid) exists and `templates/list-collections.json` points to it. Verified. |
| 7 | Generic pages | Already fixed — `sections/main-page.liquid` renders `page.title` + `page.content`; `templates/page.json` points to it (so `/pages/certified` now renders its body). Verified. |
| 8 | Kids landing template | **FIXED** — set the **Kids Collection** (`kids-collection`) `templateSuffix` to `kids` via `collectionUpdate`, so `templates/collection.kids.json` now renders for the linked collection. |
| 12 | Blog pagination | Already fixed — `main-blog.liquid` skips the featured post by `article.id == featured_article.id` **and** only on `paginate.current_page == 1`, so no article disappears on page 2+. Verified. |

---

## Wave 3 — Trust & compliance

### #54 Unify public contact identity → `support@amoylimited.com`
- `templates/page.contact.json` — email `hello@` → **`support@`** (this was the live contact-page value); also upgraded showroom address to the full Jeddah address.
- `sections/amoy-contact.liquid` — schema default email → `support@`; also now renders `form.errors`, makes the email a `mailto:` link, adds a WhatsApp row, and rounds out the "Collection of interest" select with **Men** and **Display Forms & Accessories**.
- `sections/amoy-cta.liquid` — schema default `contact_line` → `support@`.
- Footer + homepage CTA already used `support@` (prior fix) — verified consistent.

### #30 Conversion furniture (all theme-side)
- **Announcement bar** — new `sections/amoy-announcement.liquid`, rendered above the header in `layout/theme.liquid`. Bilingual: "Made in Jeddah · Delivered across the Kingdom · Use code **WELCOME10** for 10% off your first order". Editable settings (show/hide, code, colours).
- **Header** — changed from `position:fixed` to `position:sticky` (and removed the compensating `#main-content` padding) so the announcement bar stacks cleanly above it **without** disturbing the existing sticky filter/cart offsets. (Aligns with audit #18.)
- **Newsletter / email capture** — added a `{% form 'customer' %}` signup (tagged `newsletter`) at the top of the footer.
- **Footer policy links** — auto-rendered from `shop.policies` (Privacy, Refund, Terms — and Shipping once added, see below).
- **Payment icons** — rendered from `shop.enabled_payment_types` via `payment_type_svg_tag`.
- **Social links** — schema-driven (Instagram / TikTok / Snapchat / X) — icons appear once the owner sets the URLs in the theme editor.
- **WhatsApp floating button** — fixed bottom-corner button (RTL-aware) linking to `wa.me/966547275228`, on every page.

### #55 Policies — PARTIALLY BLOCKED (needs owner, one manual step)
The connected app lacks the `write_legal_policies` scope, so policy text cannot be edited via API.
Current state: Privacy ✓, Refund ✓, Terms of Service ✓ exist, but **no Shipping policy**, and Refund/ToS
still contain `[INSERT …]` placeholders and the personal `faisal@amoylimited.com` address.

**Owner action — Shopify admin ▸ Settings ▸ Policies:**
1. **Add the Shipping policy** (ready-to-paste text below).
2. **Refund policy:** replace `[INSERT RETURN ADDRESS]` with the Jeddah showroom address; change the 3× `faisal@amoylimited.com` → `support@amoylimited.com`.
3. **Terms of Service:** fill `[INSERT TRADING NAME]` → AMOY Limited, `[INSERT BUSINESS ADDRESS]` → Jeddah address, `[INSERT BUSINESS PHONE NUMBER]` → +966 54 727 5228, the `[LINK]`s → the Privacy/Refund policy URLs, `faisal@` → `support@`, and supply the real CR + VAT numbers (`[INSERT BUSINESS REGISTRATION NUMBER]` / `[INSERT VAT NUMBER]`).

Once added, the footer's policy-links row picks them up automatically (no theme change needed).

#### Ready-to-paste Shipping policy
> AMOY Mannequins manufactures and delivers premium fiberglass mannequins and display forms across the Kingdom of Saudi Arabia. This Shipping Policy explains how and when your order is produced and delivered.
>
> **Made to order** — Most of our mannequins are hand-finished to your specified colour and finish after your order is confirmed. Typical production lead time is 7–15 business days depending on quantity, finish and current workshop volume. For large or bespoke orders we confirm an exact timeline before production begins.
>
> **Delivery across Saudi Arabia** — We deliver to Jeddah, Riyadh, Dammam and all other cities. Because mannequins are bulky items, delivery is arranged with specialist carriers and the cost depends on destination city and order size; delivery charges are quoted and confirmed at order confirmation. Questions before ordering: WhatsApp +966 54 727 5228.
>
> **Dispatch & transit** — Once produced and quality-checked, we hand your order to the carrier and notify you. Estimated in-Kingdom transit is 1–4 business days after dispatch. All delivery times are estimates and are not guaranteed; we are not liable for delays caused by carriers, weather or events outside our control.
>
> **Inspection on delivery** — Please inspect on delivery and contact support@amoylimited.com immediately if any item arrives damaged, defective or incorrect. Keep the original packaging and photograph any damage.
>
> **Title and risk of loss** — Title and risk of loss pass to you once we transfer the products to the carrier.
>
> **Contact** — support@amoylimited.com · +966 54 727 5228 (WhatsApp). Showroom & workshop: Al-Madinah Al-Munawwarah Rd, Ruwais 8278, Unit 2, Jeddah 23215, Kingdom of Saudi Arabia.

---

## Other store-side follow-ups (not blocking, from the audit)
- Notification email sender is still `faisal@amoylimited.com` (Settings ▸ Notifications) — switch to `support@` for a unified public identity (#54, admin-only).
- Translate the new announcement-bar / footer strings for Arabic via Translate & Adapt when doing the full i18n pass (Wave 7 / #22).
