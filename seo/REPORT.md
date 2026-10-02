# Arabic SEO — what was changed

Store: store.amoylimited.com (Arabic at `/ar`). Theme work targets **AMOY Custom** (theme `159824969982`, currently unpublished).

## 1. Keyword strategy

Saudi shoppers search with the colloquial loanword **«مانيكان»**, not the formal «مجسّم». Competitors that rank (jst.sa, decor-wholesale, ksa-decor, Haraj listings) all use مانيكان. The site was rewritten around these terms:

| Intent | Main keywords used in visible copy |
|---|---|
| Category head terms | مانيكان، مانيكانات، مانيكان عرض ملابس، مانيكان للمحلات |
| Gender / type | مانيكان نسائي، مانيكان رجالي، مانيكان أطفال، نصف مانيكان، جذع عرض، مانيكان كامل |
| Material | مانيكان فايبر جلاس (written «فايبر جلاس», the more searched spelling) |
| Commercial | سعر المانيكان، أسعار المانيكانات، شراء مانيكان، مانيكانات بالجملة، مانيكانات للبيع |
| Local | السعودية، الرياض، جدة، الدمام، مكة، المدينة |
| Use case | مانيكان عبايات، عرض العبايات، مانيكان رياضي، ملابس داخلية |

**Misspellings and variants** are never in visible headings or titles.
- They live in hidden product **tags**, so on-site search finds them.
- Collection pages and one blog guide also carry one natural «تُكتب أيضًا» sentence.

Variants covered in tags: مانكان، منيكان، مانيكين، مانكين، منكان، مانكانات، منيكانات، ملكان، عارضة ازياء، دميه عرض، فيبر جلاس، فايبرجلاس، فيبرجلاس، مجسم/مجسمات عرض.

Per-category variants are also covered, such as مانيكان حريمي، مانيكان نسائى، مانكان نسائي.

## 2. Changes made (live now — Arabic content translations)

These are store data, so they are already live on the published theme as well:

- **Products (all):** new Arabic title, SEO title and meta description built around «مانيكان + type + code | أموي AMOY».
  - Body now opens with a keyword intro and a «الاستخدامات المناسبة» section.
  - Body ends with internal links to the women/men/kids collections, the calculator and the contact page.
  - Harakat were removed from titles and meta.
  - Arabic and misspelling tags were added for on-site search.
- **Collections:** women, men, kids, display forms, Grace and the rest.
  - Arabic titles, H1s, SEO titles and meta descriptions.
  - Long descriptions with H2 sections, an FAQ, and an «also written as» sentence.
- **Pages:** home/shop SEO, FAQ (bilingual, with FAQPage JSON-LD), about, contact, calculator, certified.
  - The broken FAQ footer link is fixed.
- **Menus / navigation:** wording unified to مانيكان.
- **Blog (30 articles):**
  - Every Arabic title, summary, SEO title and meta description now uses «مانيكان/مانيكانات» instead of «مجسّم».
  - Harakat removed; «فايبر جلاس» spelling.
  - The 4 evergreen guides had only a short Arabic summary as their body. They now have full Arabic versions with tables, an FAQ and FAQPage JSON-LD, each targeting one money query:
    - أين تشتري مانيكان في السعودية
    - مانيكان فايبر جلاس أم بلاستيك
    - كيف تختار المانيكان المناسب لمحلك
    - كم سعر المانيكان في السعودية
- **Header/footer (both themes):**
  - Announcement bar now reads «مانيكانات صُنعت في جدة…».
  - Footer tagline lists مانيكان نسائي ورجالي وأطفال ونصف مانيكان.
  - Footer bottom note: «مانيكانات عرض فاخرة لكل واجهة».
- **AMOY Custom theme translations:** this theme had *no* Arabic template translations. The full set was copied over (home, collection, product, page and other templates, plus header and footer groups) so it is not English-only when published.

## 3. Theme code changes (AMOY Custom only — take effect when it is published)

Files are in `theme/`, uploaded to theme `159824969982` and checked by MD5.

- `layout/theme.liquid`
  - The title suffix is no longer duplicated. Arabic titles already end in «أموي AMOY», and the suffix is now localized (`أموي AMOY` on `/ar`).
  - `og:site_name` and the fallback `og:title` are localized.
- `snippets/structured-data.liquid`
  - New **WebSite** schema with a Sitelinks SearchAction and alternateName (أموي، AMOY، AMOY Mannequins).
  - **Store** schema:
    - localized name;
    - alternateName;
    - homepage uses the localized meta description instead of the English shop description;
    - localized URL.
  - **Product** schema: adds url, mpn, material (فايبر جلاس on Arabic pages), category, countryOfOrigin, itemCondition and seller.
  - New **BreadcrumbList** on product, collection and article pages (الرئيسية › collection › product).
- `sections/amoy-hero.liquid` and `sections/amoy-why.liquid`: these images had no `alt`. They now get Arabic keyword alt text on `/ar` and English alt text elsewhere.

## 4. To do in Shopify admin (cannot be done through the API)

1. **Publish AMOY Custom** when it is ready. Section 3 only goes live after that.
2. In **Google Search Console**, add the domain property and submit `https://store.amoylimited.com/sitemap.xml`. Shopify includes the `/ar` URLs and hreflang automatically.
3. Optional: under **Settings → Markets / Languages**, keep Arabic published for Saudi Arabia. Consider making Arabic the default language for the KSA market.
4. Optional next content step: the remaining 26 blog article bodies are full Arabic translations that still use «مجسّم» inside the text. Titles and meta are already switched. Running `python3 seo/articles_ar.py <dump.json>` produces the body payloads that swap the word throughout.

## 5. Scripts in `seo/`

| Script | Purpose |
|---|---|
| `gen_products.py` | Arabic product titles, meta, body and tags |
| `collections_ar.py` | Collection, shop and page Arabic copy |
| `faq_page.py` | Bilingual FAQ page and FAQPage JSON-LD |
| `articles_ar.py` | Swap مجسّم → مانيكان in blog translations |
| `blog_guides_ar.py` | Full Arabic bodies for the 4 buying guides |
| `out/` | Generated payloads that were applied |
