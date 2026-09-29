# AMOY Custom theme: mobile-fit changes

Copies of the files changed in the unpublished **AMOY Custom** Shopify theme
(`gid://shopify/OnlineStoreTheme/159824969982`) so the phone-sizing changes can be reviewed.

- `assets/amoy-responsive.css` (new): a fluid sizing layer loaded after `amoy.css`. It swaps fixed
  pixel gutters, section padding, headings, hero/media heights and card sizes for `clamp()` values,
  so everything scales with the screen width from 320px phones up to desktop.
- `layout/theme.liquid`: one new line that loads `amoy-responsive.css`.
- `sections/amoy-hero|about|contact|clients|grace-hero|kids-hero|specs-finishes.liquid`: the
  fixed inline sizes (padding, font sizes, min-heights) are now `clamp()` values. The specs
  swatch grid uses `grid-column:1/-1` so it no longer breaks on narrow screens.
