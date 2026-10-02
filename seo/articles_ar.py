#!/usr/bin/env python3
"""Normalise Arabic blog translations to the keyword people actually search.

Saudi shoppers search «مانيكان» far more than the formal «مجسّم», so every
form of مجسّم/مجسّمات (with any prefix/suffix) becomes مانيكان/مانيكانات.
Titles and meta fields are also stripped of harakat (search queries are typed
without them) and «فايبرجلاس» is written as the more-searched «فايبر جلاس».

Usage: articles_ar.py <translatableResources dump.json>  -> writes seo/out/articles_ar.json
"""
import json, re, sys, os

HARAKAT = re.compile(r'[ً-ْـ]')
WORD = re.compile(r'مجس[ً-ْ]*م(?!ة|[ً-ْ]*ة)')


def swap(s):
    s = WORD.sub('مانيكان', s)
    s = s.replace('فايبرجلاس', 'فايبر جلاس')
    return s


def clean_short(s):
    s = HARAKAT.sub('', swap(s))
    s = re.sub(r'\|\s*AMOY\s*$', '| أموي AMOY', s)
    return re.sub(r'\s+', ' ', s).strip()


def build(nodes):
    out = []
    for n in nodes:
        src = {c['key']: c for c in n['translatableContent']}
        trs = []
        for t in n['translations']:
            k = t['key']
            if k not in src:
                continue
            v = swap(t['value']) if k in ('body_html', 'summary_html') else clean_short(t['value'])
            if v != t['value']:
                trs.append({'locale': 'ar', 'key': k, 'value': v,
                            'translatableContentDigest': src[k]['digest']})
        if trs:
            out.append({'id': n['resourceId'], 't': trs})
    return out


if __name__ == '__main__':
    nodes = json.load(open(sys.argv[1]))['data']['translatableResources']['nodes']
    res = build(nodes)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
    json.dump(res, open(os.path.join(os.path.dirname(__file__), 'out', 'articles_ar.json'), 'w'), ensure_ascii=False)
    print(len(res), 'articles')
