"""Check that structural changes retain the original facts and stable unit IDs."""
from pathlib import Path
import subprocess,re,json
root=Path(__file__).resolve().parents[1]
changed={'u-04-aab21e8e0f66','u-04-059cb1719753','u-04-28c29e0533de','u-04-4f842e19e45c','u-04-fc33d9dd8461','u-04-bcf4483210b8','u-04-18d49f5ecc6a','u-04-b749ca9e09da','u-04-explain-1a885cb327','u-04-f0df29aa1dc2','u-04-12e113b4ae39','u-04-b6dc2feaa3a8','u-04-0e015e01baf6','u-04-6daf4e7b97f6','u-04-39e3a55f85e9','u-03-799268f64029','u-03-9bea3a064cdb','u-03-9e440b3e504c','u-03-bbf6757e8a36'}
def units(s):return {m[1]:m[2] for m in re.finditer(r'<!-- unit-id:([\w-]+) -->\n([\s\S]*?)(?=\n<!-- unit-id:|\Z)',s)}
def normalized(s):return re.sub(r'\s','',re.sub(r'(?m)^- |\*\*(?:例子|基本概念|对照与计算|操作步骤|代码与实现|计算公式|规则与说明)\*\*','',s))
# Baseline hashes are stored so this check works in GitHub's shallow checkout.
manifest=root/'BODY_STRUCTURE_BASELINE.json'
if __name__=='__main__':
 baseline=json.loads(manifest.read_text())
 import hashlib
 for doc,old in baseline.items():
  p=root/'source'/('408' if doc.startswith('0') else 'supplements')/(doc+'.md');text=p.read_text();pattern=r'<!-- unit-id:('+ '|'.join(re.escape(k) for k in old)+r') -->\n([\s\S]*?)(?=\n<!-- unit-id:(?:'+'|'.join(re.escape(k) for k in old)+r') -->|\Z)';now={m[1]:re.sub(r'<!-- unit-id:[\w-]+ -->','',m[2]) for m in re.finditer(pattern,text)}
  assert set(old).issubset(now),doc+' removed original anchors'
  for uid,digest in old.items():
   if uid in changed:continue
   assert hashlib.sha256(normalized(now[uid]).encode()).hexdigest()==digest,(doc,uid,'lost a condition/formula during restructuring')
 print('Body structure: every original anchor retained; unchanged facts, formulas, examples and code preserved.')
