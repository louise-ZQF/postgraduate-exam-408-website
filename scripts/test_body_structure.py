"""Audit full prose coverage, resource retention, questions and deep links.

The user authorized replacing all prose, superseding the old preservation test.
"""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parents[1]
review = json.loads((root / 'CONTENT_REWRITE_REVIEW.json').read_text())
catalog = json.loads((root / 'public/catalog.json').read_text())
expected = {'01': 45, '02': 130, '03': 114, '04': 98, '14': 37, '15': 14, '16': 18}
count = resources = redirects = 0

def units(text):
    return {m[1]: m[2].strip() for m in re.finditer(
        r'^<!-- unit-id:([\w-]+) -->\n([\s\S]*?)(?=^<!-- unit-id:|\Z)', text, re.M)}

for doc, audit in review['documents'].items():
    prefix = doc.split('-')[0]
    source = root / 'source' / ('408' if prefix < '05' else 'supplements') / (doc + '.md')
    text = source.read_text()
    blocks = units(text)
    sections = next(d for d in catalog['docs'] if d['id'] == doc)['sections']
    headings = [s for s in sections if s['level'] > 1]
    assert len(headings) == expected[prefix]
    assert [s['anchor'] for s in headings] == [s['anchor'] for s in audit['sections']]
    assert [u for u, t in blocks.items() if re.match(r'^#{1,4} ', t)] == audit['headingAnchors']
    generated = (root / 'public/docs' / (doc + '.md')).read_text()
    for section in audit['sections']:
        paragraphs = [blocks[u] for u in section['paragraphs']]
        assert sum(len(p) for p in paragraphs) >= 65, (doc, section['title'])
        assert all(not p.startswith(('#', '|', '<details')) for p in paragraphs)
        order = list(blocks)
        start = order.index(section['anchor'])
        stop = next((i for i in range(start + 1, len(order)) if blocks[order[i]].startswith('#')), len(order))
        assert all(start < order.index(u) < stop for u in section['paragraphs'])
        assert all('id="' + u + '"' in generated for u in section['paragraphs'])
        count += 1
    for entry in audit['preservedResources']:
        assert hashlib.sha256(blocks[entry['anchor']].encode()).hexdigest() == entry['sha256'], (doc, entry['anchor'])
        resources += 1
    for old in audit['replacedParagraphAnchors']:
        assert old not in blocks, (doc, old, 'old prose left in place')
        target = catalog['redirects'][doc][old]
        assert target['doc'] == doc and target['anchor'] in audit['headingAnchors']
        assert 'id="' + old + '"' in generated, (doc, old, 'bookmark missing')
        redirects += 1
    assert not re.search(r'^\*\*(基本概念|规则与说明|对照与计算|操作步骤|代码与实现|计算公式|例子)\*\*$', text, re.M)

assert len(review['documents']) == 7 and count == 456
for path, digest in review['questionSources'].items():
    assert hashlib.sha256((root / path).read_bytes()).hexdigest() == digest, path + ': question source changed'
assert len(review['questionSources']) == 11
print(f'Full rewrite: {count} sections, {resources} original technical resources, {redirects} old prose links; all question sources unchanged')
