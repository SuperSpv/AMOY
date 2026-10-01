#!/usr/bin/env python3
"""Bilingual FAQ page content (EN body + AR translation) with FAQPage JSON-LD.

Facts used here come from the store's own policies and product data:
delivery within Saudi Arabia only, 7-10 business days (Shipping Policy);
7-day returns, custom-made items excluded (Return Policy); fiberglass,
made in Jeddah, custom colours/finishes, wholesale from 10 units (products).
"""
import json, html

EN = [
    ("What are AMOY mannequins made of?",
     "Every AMOY mannequin is made from high-quality fiberglass: durable, lightweight and heat-resistant, with a tempered-glass base on full-body models."),
    ("Where are AMOY mannequins made?",
     "Our mannequins are manufactured and hand-finished in our workshop in Jeddah, Saudi Arabia."),
    ("Do you deliver across Saudi Arabia?",
     "Yes. We deliver within the Kingdom of Saudi Arabia only — Riyadh, Jeddah, Dammam, Makkah, Madinah and all other cities. Estimated delivery is 7 to 10 business days."),
    ("Can I choose the colour and finish?",
     "Yes. Choose white, black or any custom colour to match your brand, in a matte, semi-glossy or glossy finish."),
    ("Do you offer wholesale prices?",
     "Yes. For 10 units or more, contact us for wholesale pricing and project quotes."),
    ("Which mannequin is best for displaying abayas?",
     "A full-body female mannequin in a straight standing pose (such as the FN and FA models) shows the full drape and length of an abaya."),
    ("Should I choose a full mannequin or a half mannequin?",
     "Full-body mannequins suit windows and complete looks. Half mannequins (torso and bust forms) suit tables, shelves and small spaces for tops and lingerie."),
    ("How many mannequins does my store need?",
     "It depends on your floor area, window bays and clothing categories. Use our free mannequin calculator for an estimate."),
    ("What is your return policy?",
     "You can request a return within 7 days of delivery for unused items in their original packaging. Custom-made items are not returnable unless defective. See our Return Policy for details."),
    ("How do I request a quote?",
     "Send us your quantities, preferred models, finish and delivery city through the contact page or WhatsApp, and our team will reply with a quote."),
]

AR = [
    ("مما تُصنع مانيكانات أموي AMOY؟",
     "تُصنع جميع مانيكانات أموي من الفايبر جلاس عالي الجودة: متين وخفيف الوزن ومقاوم للحرارة، مع قاعدة من الزجاج المقوى في الموديلات الكاملة."),
    ("أين تُصنع مانيكانات أموي؟",
     "تُصنع مانيكاناتنا وتُشطب يدويًا في ورشتنا بمدينة جدة في المملكة العربية السعودية."),
    ("هل يوجد توصيل لجميع مدن السعودية؟",
     "نعم، نوصل داخل المملكة العربية السعودية فقط — الرياض وجدة والدمام ومكة والمدينة وجميع المدن الأخرى. مدة التوصيل التقديرية من 7 إلى 10 أيام عمل."),
    ("هل يمكن اختيار لون المانيكان والتشطيب؟",
     "نعم، اختر الأبيض أو الأسود أو أي لون يناسب هوية متجرك، بتشطيب مطفي أو نصف لامع أو لامع."),
    ("هل تتوفر أسعار جملة للمانيكانات؟",
     "نعم، عند طلب 10 قطع أو أكثر تواصل معنا للحصول على أسعار الجملة وعروض أسعار المشاريع."),
    ("ما أفضل مانيكان لعرض العبايات؟",
     "المانيكان النسائي الكامل بوضعية وقوف مستقيمة (مثل موديلات FN وFA) يُظهر انسدال العباية وطولها بالكامل."),
    ("هل أختار مانيكان كامل أم نصف مانيكان؟",
     "المانيكان الكامل مناسب للواجهات والإطلالات الكاملة، أما نصف المانيكان (الجذع والصدر) فمناسب للطاولات والرفوف والمساحات الصغيرة لعرض البلايز والملابس الداخلية."),
    ("كم مانيكان يحتاج محل الملابس؟",
     "يعتمد العدد على مساحة المتجر وعدد واجهات العرض وأقسام الملابس. استخدم حاسبة عدد المانيكانات المجانية للحصول على تقدير."),
    ("ما سياسة الإرجاع؟",
     "يمكنك طلب الإرجاع خلال 7 أيام من التسليم للمنتجات غير المستخدمة وبعبوتها الأصلية. المنتجات المصنوعة حسب الطلب غير قابلة للإرجاع إلا إذا كانت معيبة. راجع سياسة الإرجاع للتفاصيل."),
    ("كيف أطلب عرض سعر؟",
     "أرسل لنا الكمية والموديلات والتشطيب ومدينة التوصيل عبر صفحة التواصل أو واتساب، وسيرد فريقنا بعرض السعر."),
]


def build(items, lang, intro, links_html):
    parts = [intro]
    for q, a in items:
        parts.append(f'<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>')
    parts.append(links_html)
    ld = {
        '@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': lang,
        'mainEntity': [{'@type': 'Question', 'name': q,
                        'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in items],
    }
    parts.append('<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>')
    return ''.join(parts)


EN_BODY = build(
    EN, 'en',
    '<p>Answers to the questions retailers ask most about AMOY fiberglass mannequins in Saudi Arabia.</p>',
    '<p>Still have a question? <a href="/pages/contact">Contact us</a> or try the '
    '<a href="/pages/mannequin-calculator">mannequin calculator</a>.</p>')

AR_BODY = build(
    AR, 'ar',
    '<p>إجابات أكثر الأسئلة شيوعًا عن <strong>مانيكانات عرض الملابس</strong> من أموي AMOY في السعودية — '
    'المانيكان النسائي والرجالي والأطفال ونصف المانيكان.</p>',
    '<p>لديك سؤال آخر؟ <a href="/ar/pages/contact">تواصل معنا</a> أو جرّب '
    '<a href="/ar/pages/mannequin-calculator">حاسبة عدد المانيكانات</a>، وتصفح '
    '<a href="/ar/collections/women">مانيكان نسائي</a> و<a href="/ar/collections/men">مانيكان رجالي</a> '
    'و<a href="/ar/collections/kids">مانيكان أطفال</a>.</p>')

if __name__ == '__main__':
    print(json.dumps({'en': EN_BODY, 'ar': AR_BODY}, ensure_ascii=False))
