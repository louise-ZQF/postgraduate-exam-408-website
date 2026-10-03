"""Protect published aliases and correct-option identity across actual source edits."""
from pathlib import Path
import hashlib, json, shutil, tempfile
from content_model import build
HERE=Path(__file__).resolve().parents[1]
helpers={ '__file__':str(HERE/'scripts/prepare_content.py') }
exec((HERE/'scripts/prepare_content.py').read_text().split('from content_model import build')[0],helpers)
with tempfile.TemporaryDirectory(prefix='408-content-') as directory:
    root=Path(directory);shutil.copytree(HERE/'source',root/'source')
    (root/'public/docs').mkdir(parents=True);(root/'public/assets').symlink_to(HERE/'public/assets',target_is_directory=True)
    def generate():build(root,helpers['specs'],helpers['clean'],helpers['convert'],helpers['prepare_images'],helpers['image_dimensions'])
    co=root/'source/408/02-计算机组成原理.md'
    co.write_text(co.read_text().replace('<!-- unit-id:co-number-representation -->','## 插入一个测试章节\n\n测试说明。\n\n<!-- unit-id:co-number-representation -->').replace('### 定点数的机器数转换','### 定点编码转换（条件与例子）'))
    ds=root/'source/408/01-数据结构.md';text=ds.read_text()
    old=json.loads((HERE/'public/units/01-数据结构.json').read_text())[0]
    text=text.replace("['A. O(log<sub>2</sub>n)', 'B. O(n<sup>1/2</sup>)', 'C. O(n)', 'D. O(n<sup>2</sup>)']", "['A. O(n)', 'B. O(n<sup>1/2</sup>)', 'C. O(log<sub>2</sub>n)', 'D. O(n<sup>2</sup>)']",1);ds.write_text(text)
    generate()
    history=json.loads((root/'public/anchor-map.json').read_text())
    assert history['02-计算机组成原理']['s-8']['target']=='co-number-representation'
    md=(root/'public/docs/02-计算机组成原理.md').read_text()
    assert 'id="s-8"' in md and 'data-target="co-number-representation"' in md
    units=json.loads((root/'public/units/01-数据结构.json').read_text())
    unit=next(x for x in units if x['questionId']==old['questionId'])
    assert unit['correctOptionId']==old['correctOptionId']
    assert next(x for x in unit['options'] if x['optionId']==unit['correctOptionId'])['letter']=='A'
    def snapshot():
        return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['source','public/docs','public/units'] for p in (root/folder).rglob('*') if p.is_file()}
    before=snapshot();generate();assert snapshot()==before,'内容生成必须幂等'
print('Source insertion, renamed heading, option reorder, and idempotence passed')
