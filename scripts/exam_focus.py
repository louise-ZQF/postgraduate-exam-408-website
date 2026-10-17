"""Compile explicitly authored exam summaries; missing or duplicate sections fail the build."""
from pathlib import Path
import html,json,re

def normalized(value):
    return re.sub(r'\s+', '', html.unescape(re.sub(r'[`*]|<[^>]*>', '', value)))

def build_exam_focus(root):
    root=Path(root)
    catalog=json.loads((root/'public/catalog.json').read_text())['docs']
    out=root/'public/exam-focus';out.mkdir(exist_ok=True)
    coverage=[]
    for doc in catalog:
        if doc['group'] not in ('知识体系','错题补充'):continue
        path=root/'source/exam-focus'/f"{doc['id']}.txt"
        authored={}
        for line_no,line in enumerate(path.read_text().splitlines(),1):
            if not line.strip():continue
            fields=line.split('|')
            if len(fields)!=2 or any(not part.strip() for part in fields):raise ValueError(f'{path.name}:{line_no}: expected title|key')
            key=normalized(fields[0])
            if key in authored:raise ValueError(f'{path.name}: duplicate {key}')
            authored[key]={'key':fields[1].strip()}
        used=set();entries=[]
        for sec in doc['sections']:
            if sec['level']==1:continue
            title=normalized(sec['title'])
            scoped=normalized('/'.join(sec['path'][-2:]))
            key=scoped if scoped in authored else title
            if key not in authored:raise ValueError(f"{doc['id']}: missing exam summary for {scoped}")
            if key in used:raise ValueError(f"{doc['id']}: reused summary {key}; qualify duplicate titles with their parent")
            used.add(key)
            entries.append({'anchor':sec['anchor'],'title':sec['title'],'path':sec['path'][1:],'level':sec['level'],**authored[key]})
        extra=set(authored)-used
        if extra:raise ValueError(f"{doc['id']}: unused summaries {sorted(extra)}")
        data={'doc':doc['id'],'entries':entries}
        (out/f"{doc['id']}.json").write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
        coverage.append({'document':doc['id'],'sections':len(entries),'summaries':len(used),'missing':[]})
    (root/'EXAM_FOCUS_COVERAGE.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
    print(f"Exam focus: {sum(x['summaries'] for x in coverage)} individually authored summaries across {len(coverage)} documents; no missing sections")
