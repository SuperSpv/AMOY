# Wave 8 — Messaging & Automations (AMOY Design System)

**Scope:** Audit items #51–#53. These are **admin-only** tasks — the Shopify Admin API
cannot read or write notification email templates or marketing automations, so they
cannot be pushed via the theme MCP. This document is the implementation spec to apply
by hand in the Shopify admin. All work is store-level (applies once "AMOY Custom" is
published; email templates are theme-independent).

## Design tokens (email-safe)

| Token | Value | Use |
|-------|-------|-----|
| Navy (primary) | `#1C1B4D` | Header band, headings |
| Brass (accent) | `#B08A22` | Buttons, links, dividers |
| Paper | `#FBFBFD` | Background |
| Ink | `#1a1a2e` | Body text |
| Display font | Cormorant Garamond → **Georgia** (email fallback) | Headings |
| Body font | Archivo → **Arial/Helvetica** (email fallback) | Body |

- Logo: `logo-amoy-white.png` on the navy header band.
- Footer (every template): `support@amoylimited.com` · `+966 54 727 5228` ·
  WhatsApp `https://wa.me/966547275228` · Jeddah, KSA.
- Bilingual: stack an English block then an Arabic (RTL) block, using
  `dir="rtl"` on the Arabic table cell. Keep tables ≤600px, inline styles only.

---

## #51 — Notification email templates
**Settings ▸ Notifications ▸ Customize (each template ▸ Edit code).**
Replace the default Shopify markup with the DS above. Priority order:

1. **Order confirmation** — hero "Thank you, {{ customer.first_name }}", order table,
   brass CTA "View your order", volume-tier reminder ("Reordering 4+? 10% applies
   automatically"), WhatsApp support line.
2. **Shipping confirmation** — tracking button in brass, delivery-across-KSA note.
3. **Abandoned checkout** — navy header, "You left these behind", product thumbnails,
   brass "Complete your order" button, first-time WELCOME10 code block.
4. **Contact-us / Customer account welcome** — brand intro, showroom + WhatsApp CTA.

> Tip: build one master table (header band + footer) and paste it into each template so
> they stay consistent. Send a test to `support@amoylimited.com` and preview on mobile.

---

## #52 — Marketing automations
**Marketing ▸ Automations ▸ Create automation** (Shopify Email). None exist today.

| Automation | Trigger | Timing | Notes |
|-----------|---------|--------|-------|
| Abandoned checkout | Checkout started, not completed | +1h, then +24h | Include WELCOME10 for first-time buyers |
| Welcome series | Newsletter subscribe | +0h, +3d | **Requires the email-capture form (#30).** Intro + best-sellers |
| Browse abandonment | Viewed product, no cart | +4h | Single reminder |
| Post-delivery follow-up | Order fulfilled | +5d | Ask for a Google review; surface the 4+ volume tier for reorders |

All emails use the same DS tokens as #51.

---

## #53 — Quote-request handling & sender identity (#54)

- **Contact-form auto-reply:** Shopify Inbox / email rule → "Thanks, our team will
  quote within one business day." Add the WhatsApp deep link as the primary channel:
  `https://wa.me/966547275228?text=Hi%20AMOY%2C%20I%27d%20like%20a%20quote`
- **Unify sender identity:** the site currently mixes `support@`, `hello@`, and
  `faisal@`. Pick **`support@amoylimited.com`** as the single public address and set it
  in **Settings ▸ Notifications ▸ Sender email** (verify the domain), and confirm the
  theme's `amoy-contact` / `amoy-cta` sections already use it.

---

## Related theme changes already shipped (waves 6–7)
The revenue plumbing these messages reference is now live on **AMOY Custom**:
- Automatic discount **"Volume — 10% off 4+ units"** (active) backs the 4+ claim.
- PDP volume-tier table, cart volume-progress bar, and announcement-bar WELCOME10.
- `locales/ar.json` added so Arabic email/notification keys have a base to sync with
  Translate & Adapt.
