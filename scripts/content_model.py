"""Persistent source IDs, whole questions, independently typed search records."""
from pathlib import Path
import ast, hashlib, html, json, re

def build(here, specs, clean, convert, prepare_images, image_dimensions):
    public=here/'public'; asset=public/'assets'; source=here/'source'
    history_file=source/'anchor-history.json'
    # Freeze the deployed numbering ONCE; subsequent insertions never renumber aliases.
    if not history_file.exists():
        old=json.loads((public/'search-index.json').read_text())
        history={}
        for r in old:
            history.setdefault(r['doc'],{})[r['anchor']]={'title':r['title'],'text':r['text'],'target':None}
    else: history=json.loads(history_file.read_text())
    option_file=source/'question-options.json'
    option_registry=json.loads(option_file.read_text()) if option_file.exists() else {}
    reviews_file=source/'answer-reviews.json'; reviews=json.loads(reviews_file.read_text()) if reviews_file.exists() else {}
    moves_path=source/'question-moves.json';moves=json.loads(moves_path.read_text()) if moves_path.exists() else [];redirects={}
    moved_targets={m['anchor'] for m in moves}
    for move in moves:
        redirects.setdefault(move['origin'],{})[move['anchor']]={'doc':move['doc'],'anchor':move['anchor']}
        for alias,old in history.get(move['origin'],{}).items():
            if old.get('target')==move['anchor']:redirects[move['origin']][alias]={'doc':move['doc'],'anchor':move['anchor']}
    used=set(); records=[]; catalog=[]; count_images=set()
    def key(prefix, value): return prefix+'-'+hashlib.sha256(value.encode()).hexdigest()[:12]
    def register(proposed):
        if proposed in used: raise ValueError('重复的内容 ID: '+proposed)
        used.add(proposed); return proposed
    def plain_question_starts(body):
        starts=[]; fence=None; analysis=False; pre=False; offset=0
        for line in body.splitlines(True):
            if re.match(r'^:::\s*\w',line): analysis=True
            elif line.strip()==':::': analysis=False
            if re.match(r'^\s*(```|~~~)',line): fence=None if fence else True
            if '<pre' in line:pre=True
            if not analysis and not fence and not pre and re.match(r'^(?:【例\d+|\d+\\?\.\s)',line): starts.append(offset)
            if '</pre>' in line:pre=False
            offset+=len(line)
        return starts
    def split_questions(raw):
        def split(m):
            body=m.group(1); starts=plain_question_starts(body)
            if len(starts)<2:return m.group(0)
            prefix=body[:starts[0]]
            return prefix+'\n'+ '\n\n'.join('<question>\n'+body[a:b].strip()+'\n</question>' for a,b in zip(starts,starts[1:]+[len(body)]))
        return re.sub(r'<question>(.*?)</question>',split,raw,flags=re.S)
    def tokenize(raw):
        tokens=[]; block=[]; pending_id=None; fence=None; pre=False; question=False; math=False
        def flush():
            nonlocal block,pending_id
            if block:
                text='\n'.join(block).strip()
                if text:tokens.append((pending_id,text))
                block=[];pending_id=None
        for line in raw.splitlines():
            if not (question or fence or pre or math):
                m=re.match(r'^<!-- unit-id:([\w-]+) -->$',line.strip())
                if m:flush();pending_id=m.group(1);continue
                if not line.strip():flush();continue
                if re.match(r'^#{1,4}\s',line):flush();block=[line];flush();continue
            block.append(line)
            if '<question>' in line:question=True
            if '</question>' in line:question=False;flush();continue
            if question:continue
            fm=re.match(r'^\s*(`{3,}|~{3,})',line)
            if fm:fence=None if fence else fm.group(1)
            if '<pre' in line and '</pre>' not in line:pre=True
            if '</pre>' in line:pre=False
            if line.strip()=='$$':math=not math
        flush();return tokens
    chapter_keys={'数据结构':['绪论','线性表','栈','串','树','图','查找','排序'], '计算机组成原理':['概述','数据','存储','指令','中央处理器','总线','输入输出'], '操作系统':['概述','进程','内存','文件','输入输出'], '计算机网络':['概述','物理','数据链路','网络层','运输','应用']}
    def topic(subject,path):
        s=' '.join(path).replace('I/O','输入输出').replace('CPU','中央处理器').replace('处理机','中央处理器').replace('I-O','输入输出').replace('传输层','运输').replace('运输层','运输').replace('主存','存储').replace('存储器','存储').replace('死锁','进程').replace('同步','进程')
        for t in chapter_keys[subject]:
            if t in s:return subject+':'+t
        return subject+':概述'
    for name,group,subject in specs:
        directory=source/('supplements' if group=='错题补充' else '408'); file=directory/(name+'.md')
        raw=split_questions(file.read_text()); tokens=tokenize(raw); out=[]; updated=[]; sections=[]; local=[]; units=[]; path=[]; section=None
        occurrence={}; docprefix=name.split('-')[0]
        for explicit, text in tokens:
            q=text.startswith('<question>')
            if q:
                inner=re.sub(r'^<question>\s*|\s*</question>$','',text)
                inside=re.search(r'<!-- unit-id:([\w-]+) -->',inner)
                if inside:explicit=inside.group(1);inner=re.sub(r'<!-- unit-id:[\w-]+ -->\s*','',inner)
                text='<question>\n'+inner.strip()+'\n</question>'
            hm=re.match(r'^(#{1,4})\s+(.+)$',text)
            title=clean(re.sub(r'\s*\{\.[^}]+\}\s*$','',hm.group(2))) if hm else ''
            identity=clean(text)[:240]
            occurrence[identity]=occurrence.get(identity,0)+1
            prefix=('q' if q else 's' if hm else 'u')+'-'+docprefix
            default=key(prefix,identity+str(occurrence[identity]))
            if hm and name.startswith('02-') and title=='定点数的机器数转换':default='co-number-representation'
            uid=register(explicit or default)
            updated.append('<!-- unit-id:'+uid+' -->\n'+text)
            if hm:
                level=len(hm.group(1));path=path[:level-1];path.append(title)
                section={'title':title,'anchor':uid,'level':level,'path':path.copy(),'topicId':topic(subject,path)}
                sections.append(section)
                if group in ('小题','大题') and level==1:text='# '+subject+group
                out.append('<a id="'+uid+'"></a>\n\n'+text)
                local.append({'doc':name,'subject':subject,'group':group,'type':'知识点','kind':'heading','section':title,'title':title,'anchor':uid,'sectionId':uid,'path':path.copy(),'topicId':section['topicId'],'text':title,'summary':''})
                continue
            converted=prepare_images(convert(text));plain=clean(converted)
            if not plain and not re.search(r'<img|!\[',converted):continue
            sec=section or {'title':subject,'anchor':uid,'path':[subject],'topicId':topic(subject,[subject])}
            record={'doc':name,'subject':subject,'group':group,'type':'知识点','kind':'formula' if '$' in text else 'concept','section':sec['title'],'title':sec['title'],'anchor':uid,'sectionId':sec['anchor'],'path':sec['path'],'topicId':sec['topicId'],'text':plain}
            if q:
                # Solutions are a single unit; never detach the answer from its stem/options.
                start=re.search(r'<div\s+class="exam-answer"|^:::\s*(?:analysis|answer)\b|^解析[:：]',inner,re.M)
                stem=inner[:start.start()] if start else inner
                solution=inner[start.start():] if start else ''
                option_sets=[]
                for match in re.finditer(r'<options\s+:options="([^"]+)"[^>]*/>',stem):
                    try:
                        arr=ast.literal_eval(html.unescape(match.group(1)))
                        labeled=[re.match(r'^([A-H])[.．、]\s*(.*)$',str(x),re.S) for x in arr]
                        if len(labeled)>=2 and all(labeled) and len({x[1] for x in labeled})==len(labeled):option_sets.append(labeled)
                    except (ValueError,SyntaxError):pass
                selected=option_sets[-1] if option_sets else []
                opts=[];saved=option_registry.get(uid,{});old_options=saved.get('options',saved);option_counts={}
                for m in selected:
                    opttext=clean(m[2]);option_counts[opttext]=option_counts.get(opttext,0)+1;optkey=opttext+'#'+str(option_counts[opttext]);oid=old_options.get(optkey) or (old_options.get(opttext) if option_counts[opttext]==1 else None) or key('o',uid+optkey)
                    opts.append({'optionId':oid,'text':opttext,'letter':m[1]})
                option_map={};seen_options={}
                for x in opts:
                    seen_options[x['text']]=seen_options.get(x['text'],0)+1
                    option_map[x['text']+'#'+str(seen_options[x['text']])]=x['optionId']
                correct=re.search(r'class="exam-answer".*?<strong>\s*([A-H])\s*</strong>|(?:正确答案|答案)\s*[:：为]\s*(?:\*\*)?([A-H])\b',solution,re.S)
                letter=next((x for x in correct.groups() if x),None) if correct else None
                correct_id=next((x['optionId'] for x in opts if x['letter']==letter),None)
                answer_signature=hashlib.sha256(solution.encode()).hexdigest()
                if saved.get('answerSignature')==answer_signature and saved.get('correctOptionId') in [x['optionId'] for x in opts]:correct_id=saved['correctOptionId']
                ambiguous=len({x['text'] for x in opts})!=len(opts)
                if ambiguous:correct_id=None
                option_registry[uid]={'options':option_map,'correctOptionId':correct_id,'answerSignature':answer_signature}
                year_match=re.search(r'(?:【例\d+\s*|\()(20\d{2})',stem)
                year=int(year_match[1]) if year_match else None
                label=clean(convert(stem.split('\n',1)[0]))[:110] or sec['title']+'练习'
                kind='choice' if opts else 'comprehensive';record.update(type='小题' if opts else '大题',kind=kind,title=label,year=year,stem=clean(convert(stem)))
                source_path=file.relative_to(here).as_posix();line=1 # assigned after writing persistent source below
                src='https://github.com/louise-ZQF/postgraduate-exam-408-website/blob/main/'+source_path
                original=re.search(r'href="(https://[^"]+)"',solution)
                status='ambiguous' if ambiguous else 'provided' if solution.strip() else 'missing'
                unit={'questionId':uid,'options':opts,'correctOptionId':correct_id,'answerStatus':status,'reviewedAt':None,'source':src,'originalSource':original[1] if original else None,'year':year,'title':label,'topicId':sec['topicId'],'stem':clean(convert(stem)),'explanation':clean(convert(solution))}
                proof=reviews.get(uid,{})
                if proof.get('proofHash')==hashlib.sha256((unit['stem']+'\n'+unit['explanation']).encode()).hexdigest():
                    unit['answerStatus']=proof['status'];unit['reviewedAt']=proof['reviewedAt'];unit['reviewMethod']=proof['method'];unit['reviewEvidence']=proof.get('evidence')
                units.append(unit)
                converted='<div class="study-question" id="'+uid+'" data-question-id="'+uid+'">\n\n<div class="question-stem">\n\n'+prepare_images(convert(stem))+'\n\n</div>\n\n<div class="question-solution">\n\n'+prepare_images(convert(solution))+'\n\n</div>\n\n</div>'
            else:converted='<div class="study-unit" id="'+uid+'">\n\n'+converted+'\n\n</div>'
            # A context label is deliberately not a claim to describe all pixels of a diagram.
            img_context=subject+' · '+record['title']+'配图，打开原图查看细节'
            converted=re.sub(r'<img\b(?![^>]*\balt=)',lambda m:'<img alt="'+html.escape(img_context,quote=True)+'"',converted)
            out.append(converted);local.append(record)
        updated_text='\n\n'.join(updated)+'\n';file.write_text(updated_text)
        for unit in units:
            line=updated_text[:updated_text.index('<!-- unit-id:'+unit['questionId']+' -->')].count('\n')+1
            unit['source']+='#L'+str(line)
        # Real summaries for headings, with chapter context rather than title-only hits.
        for i,r in enumerate(local):
            if r['kind']=='heading':
                body=[]
                for following in local[i+1:]:
                    if following['kind']=='heading' and len(following['path'])<=len(r['path']):break
                    if following['type']=='知识点' and following['kind']!='heading':body.append(following['text'])
                    if len(body)>=2:break
                r['summary']=' '.join(body)[:650]
        # Initial old-to-new matching uses the frozen title/text, not today's traversal numbers.
        old=history.get(name,{})
        current_anchors={r['anchor'] for r in local}
        for value in old.values():
            if value.get('target') not in current_anchors and value.get('target') not in moved_targets:value['target']=None
        old_headings=[(a,v) for a,v in old.items() if a.startswith('s-')]
        section_targets={}
        for (a,v),s in zip(old_headings,sections):
            if not v['target'] and v['title']==s['title']:v['target']=s['anchor']
            if v['target']:section_targets[v['title']]=v['target']
        for a,v in old.items():
            if v['target']:continue
            candidates=[r for r in local if r['kind']!='heading' and r['section']==v['title'] and clean(v['text']) in r['text']]
            if candidates:v['target']=candidates[0]['anchor']
            else:v['target']=section_targets.get(v['title']);v['sectionFallback']=True
        aliases={}
        for alias,v in old.items():
            if v['target']:aliases.setdefault(v['target'],[]).append(alias)
        generated='\n\n'.join(out)
        for target,old_ids in aliases.items():
            tags=''.join('<span class="legacy-anchor" data-target="'+target+'" id="'+a+'"></span>' for a in old_ids)
            generated=generated.replace('id="'+target+'"','id="'+target+'"',1) # insert siblings BEFORE target
            generated=re.sub(r'(<(?:a|div)\b[^>]*\bid="'+re.escape(target)+r'"[^>]*>)',lambda m:tags+'\n'+m[1],generated,count=1)
        for rel in re.findall(r'(?:src=["\']|!\[[^]]*\]\()\.?/([^"\')]+)',generated):
            rel=rel.split('#')[0]
            if not (asset/rel).is_file():raise ValueError('素材不存在: '+name+' / '+rel)
            count_images.add(rel)
        (public/'docs'/(name+'.md')).write_text(generated+'\n')
        (public/'units').mkdir(exist_ok=True)
        (public/'units'/(name+'.json')).write_text(json.dumps(units,ensure_ascii=False,separators=(',',':')))
        catalog.append({'id':name,'group':group,'type':group if group in ('小题','大题') else '知识点','subject':subject,'title':subject if group=='知识体系' else subject+' · 知识配套题目' if name.startswith(('17-','18-')) else subject+' · '+group,'label':subject+'（知识配套）' if name.startswith(('17-','18-')) else subject,'sections':sections,'source':'https://github.com/louise-ZQF/postgraduate-exam-408-website/blob/main/'+file.relative_to(here).as_posix()})
        records.extend(local)
    def save(path,data):path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    save(history_file,history);save(option_file,option_registry)
    save(public/'anchor-map.json',history);save(public/'targets.json',{doc['id']:[r['anchor'] for r in records if r['doc']==doc['id']] for doc in catalog});save(public/'catalog.json',{'schema':2,'docs':catalog,'redirects':redirects})
    save(public/'search-index.json',records)
    doc_indexes={d['id']:i for i,d in enumerate(catalog)}
    section_indexes={d['id']:{s['anchor']:i for i,s in enumerate(d['sections'])} for d in catalog}
    for t,f in [('知识点','search-v2-knowledge.json'),('小题','search-v2-small.json'),('大题','search-v2-big.json')]:
        compact=[]
        for r in records:
            if r['type']!=t:continue
            if r['kind']=='heading' and not r['summary']:continue
            compact.append([doc_indexes[r['doc']],section_indexes[r['doc']].get(r['sectionId'],0),r['anchor'],r['kind'],r['title'] if r['title']!=r['section'] else '',r.get('summary') or r['text'],r.get('year'),len(r.get('stem',''))])
        save(public/f,{'schema':2,'records':compact})
    print(f'{len(catalog)} documents, {len(records)} semantic records, {sum(r["kind"] in ("choice","comprehensive") for r in records)} questions, {len(count_images)} referenced images')
