#!/usr/bin/env python3
"""Generate Arabic SEO translations and tags for AMOY products.

Input:  JSON dump of translatableResources(resourceType: PRODUCT) with
        translatableContent{key value digest} and translations(locale:"ar").
Output: seo/out/products_ar.json  — list of {id, translations:[...], tags:[...]}

Keyword strategy (Saudi Arabic search behaviour):
- "مانيكان" is the dominant spelling used by shoppers and competitors
  (Haraj, jst.sa, decor-wholesale, ksa-decor), so visible copy uses it
  instead of the formal "مجسّم".
- Visible copy is always spelled correctly. Common misspellings and dialect
  variants (مانكان، منيكان، مانيكين، نص مانيكان، راس مانيكان ...) go into
  product tags, which Shopify's on-site search indexes but the theme never
  displays.
"""
import json, re, sys, os

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), 'out', 'products_ar.json')

# code prefix -> (category, Arabic title core, uses sentence)
F_FULL_USES = 'مثالي لعرض العبايات والفساتين وملابس السهرة والأزياء النسائية اليومية في واجهات المحلات وصالات العرض والبوتيكات.'
F_SPORT_USES = 'مثالي لعرض الملابس الرياضية النسائية وملابس اليوغا والجري والأطقم الرياضية في محلات الرياضة والمولات.'
M_FULL_USES = 'مثالي لعرض الثياب والبدل الرسمية والملابس الرجالية الكاجوال في محلات الملابس الرجالية وصالات العرض.'
M_SPORT_USES = 'مثالي لعرض الملابس الرياضية الرجالية والأطقم الرياضية وملابس الجيم في محلات الرياضة والمولات.'
K_USES = 'مثالي لعرض ملابس الأطفال والملابس المدرسية وملابس العيد في محلات ملابس الأطفال والمولات.'

PRODUCTS = {
    'FA': ('female', 'مانيكان نسائي كامل بوجه تجريدي – وضعية وقوف', F_FULL_USES),
    'FD': ('female', 'مانيكان نسائي كامل – وضعية قياسية', F_FULL_USES),
    'FP': ('female', 'مانيكان نسائي كامل – وضعية اليد على الخصر', F_FULL_USES),
    'FS': ('female_sport', 'مانيكان نسائي رياضي كامل – وضعية رياضية', F_SPORT_USES),
    'FW': ('female', 'مانيكان نسائي كامل بمفاصل متحركة', F_FULL_USES),
    'FN': ('female', 'مانيكان نسائي كامل – وضعية وقوف قياسية', F_FULL_USES),
    'FB-01': ('bust', 'نصف مانيكان نسائي – صدر وجذع', 'مثالي لعرض البلايز والقمصان والملابس الداخلية والإكسسوارات على الطاولات والرفوف.'),
    'FB-02': ('bust', 'نصف مانيكان نسائي – من الصدر حتى الأرداف', 'مثالي لعرض البلايز والفساتين القصيرة والملابس الداخلية وملابس النوم على الطاولات والرفوف.'),
    'FQ-01': ('torso', 'جذع مانيكان نسائي مع الأكتاف', 'مثالي لعرض البلايز والقمصان والجاكيتات والملابس الداخلية في المحلات والبوتيكات.'),
    'FQ-02': ('torso', 'جذع مانيكان نسائي مع الأرجل', 'مثالي لعرض الأطقم الكاملة والجمبسوت والبناطيل والملابس الداخلية في المحلات والبوتيكات.'),
    'FQ-03': ('torso', 'جذع مانيكان نسائي', 'مثالي لعرض البلايز والقمصان والملابس الداخلية والإكسسوارات في المحلات والبوتيكات.'),
    'FH': ('head', 'رأس مانيكان نسائي مع الأكتاف', 'مثالي لعرض الطرح والشيلات والقبعات والنظارات والإكسسوارات والمجوهرات.'),
    'FL': ('leg', 'أرجل مانيكان نسائية لعرض البناطيل', 'مثالي لعرض البناطيل والجينز والليقنز والشورتات والتنانير.'),
    'FF': ('foot', 'قدم مانيكان نسائية لعرض الجوارب', 'مثالي لعرض الجوارب والشرابات والجوارب الطبية والإكسسوارات.'),
    'FR': ('hand', 'يد مانيكان نسائية لعرض القفازات والإكسسوارات', 'مثالي لعرض القفازات والساعات والأساور والخواتم والإكسسوارات.'),
    'MA': ('male', 'مانيكان رجالي كامل بوجه تجريدي – وضعية وقوف', M_FULL_USES),
    'MN': ('male', 'مانيكان رجالي كامل – وضعية قياسية', M_FULL_USES),
    'MS-01': ('male_sport', 'مانيكان رجالي رياضي كامل – وضعية رياضية', M_SPORT_USES),
    'MS-02': ('male_sport', 'مانيكان رجالي رياضي كامل – وضعية عضلية', M_SPORT_USES),
    'MQ': ('male_torso', 'نصف مانيكان رجالي – جذع', 'مثالي لعرض القمصان والتيشيرتات والجاكيتات والملابس الرجالية على الطاولات والرفوف.'),
    'KA': ('kids', 'مانيكان أطفال كامل – وضعية وقوف', K_USES),
    'KN': ('kids', 'مانيكان أطفال كامل – وضعية قياسية', K_USES),
    'KS': ('kids', 'مانيكان أطفال رياضي كامل', 'مثالي لعرض الملابس الرياضية للأطفال وملابس النادي والملابس المدرسية في محلات الأطفال.'),
    'KQ': ('kids_torso', 'نصف مانيكان أطفال – جذع', 'مثالي لعرض تيشيرتات وقمصان وملابس الأطفال على الطاولات والرفوف.'),
    'UR': ('hand', 'يد مانيكان للجنسين لعرض القفازات والإكسسوارات', 'مثالي لعرض القفازات والساعات والأساور والخواتم والإكسسوارات.'),
}

FULL_BODY = {'female', 'female_sport', 'male', 'male_sport', 'kids'}

PRODUCT_TYPE = {
    'Female Mannequin': 'مانيكان نسائي',
    'Male Mannequin': 'مانيكان رجالي',
    'Kids Mannequin': 'مانيكان أطفال',
    'Display Form': 'نصف مانيكان وقطع عرض',
}

COLLECTION_LINKS = (
    '<p>تصفح أيضًا: <a href="/ar/collections/women">مانيكان نسائي</a> · '
    '<a href="/ar/collections/men">مانيكان رجالي</a> · '
    '<a href="/ar/collections/kids">مانيكان أطفال</a> · '
    '<a href="/ar/collections/display-forms-accessories">نصف مانيكان وقطع العرض</a> · '
    '<a href="/ar/pages/mannequin-calculator">حاسبة عدد المانيكانات</a></p>'
)

# --- tags -----------------------------------------------------------------
TAGS_COMMON = [
    'مانيكان', 'مانيكانات', 'مانيكان عرض ملابس', 'مانيكان فايبر جلاس',
    'دمية عرض', 'دمية عرض ملابس', 'عارضة أزياء', 'مجسم عرض ملابس',
    'مانيكان جدة', 'مانيكان الرياض', 'مانيكان الدمام', 'مانيكان السعودية',
    'مانيكان للبيع', 'مانيكان جملة', 'أموي',
    # misspellings / dialect variants (search only, never shown)
    'مانكان', 'منيكان', 'مانيكين', 'مانكين', 'منكان', 'مانكانات', 'منيكانات',
    'ملكان', 'عارضة ازياء', 'دميه عرض', 'فيبر جلاس', 'فايبرجلاس', 'فيبرجلاس',
    'مجسمات عرض',
]
TAGS = {
    'female': ['مانيكان نسائي', 'مانيكان نسائي كامل', 'مانيكان حريمي', 'مانيكان بنات',
               'مانيكان عبايات', 'مانيكان فساتين', 'مانيكان نسائى', 'مانكان نسائي',
               'منيكان نسائي', 'مانيكان حريمى', 'مانيكان كامل'],
    'female_sport': ['مانيكان نسائي', 'مانيكان رياضي', 'مانيكان رياضي نسائي', 'مانيكان حريمي',
                     'مانيكان نسائى', 'مانكان رياضي', 'مانيكان كامل'],
    'male': ['مانيكان رجالي', 'مانيكان رجالي كامل', 'مانيكان ثياب', 'مانيكان ثوب',
             'مانيكان شباب', 'مانيكان رجالى', 'مانكان رجالي', 'منيكان رجالي', 'مانيكان كامل'],
    'male_sport': ['مانيكان رجالي', 'مانيكان رياضي', 'مانيكان رياضي رجالي',
                   'مانيكان رجالى', 'مانكان رياضي', 'مانيكان كامل'],
    'kids': ['مانيكان أطفال', 'مانيكان اطفال', 'مانيكان طفل', 'مانيكان ولادي',
             'مانيكان بناتي', 'مانكان اطفال', 'منيكان اطفال', 'مانيكان اطفال كامل'],
    'kids_torso': ['مانيكان أطفال', 'مانيكان اطفال', 'نصف مانيكان اطفال', 'نص مانيكان اطفال',
                   'جذع مانيكان'],
    'bust': ['نصف مانيكان', 'نص مانيكان', 'نصف مانيكان نسائي', 'نص مانيكان نسائي',
             'صدر مانيكان', 'جذع مانيكان', 'مانيكان صدر', 'مانيكان لانجري', 'مانيكان بدون راس'],
    'torso': ['نصف مانيكان', 'نص مانيكان', 'جذع مانيكان', 'جذع مانيكان نسائي',
              'مانيكان بدون راس', 'مانيكان بدون رأس', 'مانيكان نسائي'],
    'male_torso': ['نصف مانيكان', 'نص مانيكان', 'نصف مانيكان رجالي', 'نص مانيكان رجالي',
                   'جذع مانيكان', 'مانيكان رجالي', 'مانيكان قمصان'],
    'head': ['رأس مانيكان', 'راس مانيكان', 'راس مانيكان نسائي', 'مانيكان راس',
             'راس مانيكان للطرح', 'راس مانيكان شيلات', 'راس عرض', 'رأس عرض'],
    'leg': ['رجل مانيكان', 'أرجل مانيكان', 'ارجل مانيكان', 'رجول مانيكان',
            'مانيكان بناطيل', 'مانيكان بنطلون', 'مانيكان جينز', 'نصف مانيكان سفلي'],
    'foot': ['قدم مانيكان', 'رجل مانيكان', 'مانيكان شرابات', 'مانيكان جوارب', 'مانيكان شراب'],
    'hand': ['يد مانيكان', 'ايد مانيكان', 'كف مانيكان', 'مانيكان يد', 'مانيكان قفازات',
             'مانيكان ساعات', 'مانيكان اكسسوارات'],
}

META_NOUN = {
    'female': 'مانيكان نسائي', 'female_sport': 'مانيكان نسائي رياضي',
    'male': 'مانيكان رجالي', 'male_sport': 'مانيكان رجالي رياضي',
    'kids': 'مانيكان أطفال',
}


def lookup(code):
    if code in PRODUCTS:
        return PRODUCTS[code]
    return PRODUCTS[code.split('-')[0]]


def clean(s):
    # remove shadda and other harakat: shoppers type without diacritics
    s = re.sub('[ً-ْ]', '', s)
    s = s.replace('الفايبرجلاس', 'الفايبر جلاس').replace('فايبرجلاس', 'فايبر جلاس')
    s = s.replace('مجسمات', 'مانيكانات').replace('مجسم', 'مانيكان')
    return s


def main():
    data = json.load(open(SRC))
    out = []
    for node in data['data']['translatableResources']['nodes']:
        content = {c['key']: c for c in node['translatableContent']}
        ar = {t['key']: t['value'] for t in node['translations']}
        en_title = content['title']['value']
        m = re.search(r'\(([A-Z]{2}-\d{2})(?: / ([A-Z]{2}-\d{2}))?\)\s*$', en_title)
        code = m.group(1)
        code_label = code if not m.group(2) else f'{code} / {m.group(2)}'
        cat, core, uses = lookup(code)
        title = f'{core} ({code_label})'

        # feature phrase from the existing Arabic intro
        old_body = ar['body_html']
        fm = re.search(r'ومن أبرز مميزاته[اـ]* (.+?)\. يُصنَّع', old_body)
        feature = clean(fm.group(1)) if fm else ''

        if cat in FULL_BODY:
            intro = (f'<p><strong>{title}</strong> من <strong>أموي AMOY</strong> هو مانيكان عرض ملابس فاخر '
                     f'مصنوع من الفايبر جلاس عالي الجودة'
                     + (f'، ومن أبرز مميزاته {feature}' if feature else '') + '. ')
        else:
            intro = (f'<p><strong>{title}</strong> من <strong>أموي AMOY</strong> قطعة عرض فاخرة '
                     f'مصنوعة من الفايبر جلاس عالي الجودة'
                     + (f'، ومن أبرز مميزاتها {feature}' if feature else '') + '. ')
        intro += (f'يُصنع في جدة بالمملكة العربية السعودية، وصُمم الموديل <strong>{code_label}</strong> '
                  'ليتحمل الاستخدام اليومي في محلات الملابس والبوتيكات والمولات في جدة والرياض والدمام '
                  'ومكة والمدينة وسائر مدن المملكة والخليج.</p>')

        if code == 'FN-02':
            # this product has its own intro with model chooser — keep it, just clean
            body = clean(old_body)
            body = re.sub(r'^<p>.*?</p>', '', body, count=1, flags=re.S)
            intro = (f'<p><strong>{title}</strong> من <strong>أموي AMOY</strong> يتيح لك الاختيار بين '
                     'موديلين من الأكثر مبيعًا — <strong>FN-02</strong> و<strong>FN-03</strong>. كلاهما '
                     'مانيكان نسائي كامل من الفايبر جلاس عالي الجودة بوضعية وقوف محايدة تناسب الأزياء '
                     'النسائية اليومية والعبايات والفساتين. يُصنع في جدة ليتحمل الاستخدام اليومي في محلات '
                     'الملابس والمولات في جدة والرياض والدمام وسائر مدن المملكة والخليج.</p>')
        else:
            body = clean(old_body)
            body = re.sub(r'^<p>.*?</p>', '', body, count=1, flags=re.S)

        if cat not in FULL_BODY and uses.startswith('مثالي '):
            uses = 'مثالية ' + uses[len('مثالي '):]
        uses_html = f'<h3>الاستخدامات المناسبة</h3><p>{uses}</p>'
        body = body.replace('href="/pages/contact"', 'href="/ar/pages/contact"')
        new_body = intro + uses_html + body + COLLECTION_LINKS

        meta_title = f'{core} {code_label} | أموي AMOY'
        if len(meta_title) > 58:
            meta_title = f'{core} {code_label} | أموي'
        meta_desc = (f'{core} ({code_label}) من الفايبر جلاس، صناعة سعودية من أموي AMOY. '
                     'ألوان وتشطيبات حسب الطلب وتوصيل لكل المملكة. اطلب عرض سعر.')

        new = {
            'title': title,
            'body_html': new_body,
            'product_type': PRODUCT_TYPE[content['product_type']['value']],
            'meta_title': meta_title,
            'meta_description': meta_desc,
        }
        translations = [
            {'locale': 'ar', 'key': k, 'value': v,
             'translatableContentDigest': content[k]['digest']}
            for k, v in new.items()
        ]
        tags = list(dict.fromkeys(TAGS_COMMON + TAGS[cat] + [code_label.replace(' / ', ' ')]))
        out.append({'id': node['resourceId'], 'code': code_label, 'cat': cat,
                    'translations': translations, 'tags': tags})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
    print(len(out), 'products written to', OUT)


if __name__ == '__main__':
    main()
