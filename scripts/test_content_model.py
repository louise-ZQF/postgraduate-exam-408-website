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
    collision_text='检查隐式段落不得抢占后面的显式 ID。'
    reserved='u-02-'+hashlib.sha256((collision_text+'1').encode()).hexdigest()[:12]
    co.write_text(co.read_text()+'\n\n'+collision_text+'\n\n<!-- unit-id:'+reserved+' -->\n显式保留的另一个段落。\n')
    ds=root/'source/408/17-数据结构知识配套题目.md';text=ds.read_text()
    old=json.loads((HERE/'public/units/17-数据结构知识配套题目.json').read_text())[0]
    text=text.replace("['A. O(log<sub>2</sub>n)', 'B. O(n<sup>1/2</sup>)', 'C. O(n)', 'D. O(n<sup>2</sup>)']", "['A. O(n)', 'B. O(n<sup>1/2</sup>)', 'C. O(log<sub>2</sub>n)', 'D. O(n<sup>2</sup>)']",1);ds.write_text(text)
    generate()
    history=json.loads((root/'public/anchor-map.json').read_text())
    assert history['02-计算机组成原理']['s-8']['target']=='co-number-representation'
    md=(root/'public/docs/02-计算机组成原理.md').read_text()
    assert 'id="s-8"' in md and 'data-target="co-number-representation"' in md
    editable=json.loads((root/'public/editable/02-计算机组成原理.json').read_text())['blocks']
    assert editable[reserved]['raw']=='显式保留的另一个段落。'
    assert next(uid for uid,b in editable.items() if b['raw']==collision_text)!=reserved
    catalog=json.loads((root/'public/catalog.json').read_text())
    assert catalog['redirects']['03-操作系统']['u-03-69f59c273b6e']=={'doc':'03-操作系统','anchor':'s-03-d1e32d367735'}
    for name,group,_ in helpers['specs']:
        if group!='知识体系':continue
        blocks=json.loads((root/('public/editable/'+name+'.json')).read_text())['blocks']
        for block in blocks.values():
            if '<details' in block['raw']:
                assert '</details>' in block['raw'] and '<img' in block['raw'], '图示折叠区域必须是完整单元'
                assert '<!-- unit-id:' not in block['raw'], '不在折叠区域中插入其他单元'
    units=json.loads((root/'public/units/17-数据结构知识配套题目.json').read_text())
    unit=next(x for x in units if x['questionId']==old['questionId'])
    assert unit['correctOptionId']==old['correctOptionId']
    assert next(x for x in unit['options'] if x['optionId']==unit['correctOptionId'])['letter']=='A'
    def snapshot():
        return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['source','public/docs','public/units'] for p in (root/folder).rglob('*') if p.is_file()}
    before=snapshot();generate();assert snapshot()==before,'内容生成必须幂等'
print('Source insertion, renamed heading, option reorder, ID collision, illustration units, old knowledge links, and idempotence passed')
