from pathlib import Path
import ast, html, json, re, shutil

HERE = Path(__file__).resolve().parents[1]
SOURCE = HERE / 'source' / '408'
SUPPLEMENTS = HERE / 'source' / 'supplements'
if not SOURCE.exists():
    raise SystemExit('缺少 source/408 源资料')
PUBLIC = HERE / 'public'
DOCS = PUBLIC / 'docs'
ASSETS = PUBLIC / 'assets'
DOCS.mkdir(parents=True, exist_ok=True)
ASSETS.mkdir(parents=True, exist_ok=True)

specs = [
 ('01-数据结构', '知识体系', '数据结构'),
 ('02-计算机组成原理', '知识体系', '计算机组成原理'),
 ('03-操作系统', '知识体系', '操作系统'),
 ('04-计算机网络', '知识体系', '计算机网络'),
 ('05-数据结构基础题型', '小题', '数据结构'),
 ('06-计组基础题型', '小题', '计算机组成原理'),
 ('07-操作系统基础题型', '小题', '操作系统'),
 ('08-计网基础题型', '小题', '计算机网络'),
 ('09-数据结构强化题型', '大题', '数据结构'),
 ('10-计组强化题型', '大题', '计算机组成原理'),
 ('11-操作系统强化题型', '大题', '操作系统'),
 ('12-计网强化题型', '大题', '计算机网络'),
 ('14-数据结构错题补充', '错题补充', '数据结构'),
 ('15-计算机组成原理错题补充', '错题补充', '计算机组成原理'),
 ('16-操作系统错题补充', '错题补充', '操作系统'),
]

def clean(text):
    text = re.sub(r'<!--.*?-->', ' ', text, flags=re.S)
    text = re.sub(r'</?(?:img|div|span|sub|sup|br|p|table|tr|td|th|blockquote|pre|code|strong|em|u|a)[^>]*>', ' ', text, flags=re.I)
    text = re.sub(r'!\[([^]]*)\]\([^)]*\)', r' \1 ', text)
    text = html.unescape(text)
    text = text.replace('\\*','*').replace('**',' ').replace('__',' ')
    text = re.sub(r'(?m)^\s*>\s?', ' ', text)
    text = re.sub(r'\$+|\\[a-zA-Z]+|[`{}|#]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def options(match):
    encoded = re.sub(r'&lt;?', '&amp;lt;', match.group(1))
    encoded = re.sub(r'&gt;?', '&amp;gt;', encoded)
    raw = html.unescape(encoded)
    try:
        arr = ast.literal_eval(raw)
        if not isinstance(arr, list): return ''
        code_choices = []
        for value in arr:
            # Some source choices wrap C in presentation-only spans.
            choice = re.sub(r'</?span\b[^>]*>', '', str(value), flags=re.I).strip()
            label = re.match(r'^([A-Z])\.\s*(.+)$', choice, flags=re.S)
            if not label or '->' not in label.group(2) or ';' not in label.group(2):
                code_choices = []
                break
            code_choices.append((label.group(1), label.group(2).strip()))
        if code_choices and len(code_choices) == len(arr):
            cards = []
            for label, code in code_choices:
                # Break only between statements, preserving their original order and logic.
                code = re.sub(r'\b(if|while)\(', r'\1 (', code)
                code = re.sub(r'[ \t]*(==|!=|<=|>=|&&|\|\|)[ \t]*', r' \1 ', code)
                code = re.sub(r'(?<![!<>=])=(?!=)', ' = ', code)
                code = re.sub(r'\s*([{}])\s*', r'\n\1\n', code)
                code = re.sub(r';\s*(?=\S)', ';\n', code)
                lines = [line.strip() for line in code.splitlines() if line.strip()]
                depth = 0
                formatted = []
                for line in lines:
                    if line.startswith('}'):
                        depth = max(0, depth - 1)
                    formatted.append('  ' * depth + line)
                    if line.endswith('{'):
                        depth += 1
                cards.append(f'<div class="code-option" role="listitem"><span class="code-option-label">{label}</span><pre><code>{html.escape(chr(10).join(formatted))}</code></pre></div>')
            return '\n<div class="code-options" role="list">\n' + '\n'.join(cards) + '\n</div>\n'
        # A block boundary keeps statement lists (Ⅰ–Ⅳ) separate from A–D choices.
        return '\n<!-- option-set -->\n\n' + '\n'.join('- ' + str(x) for x in arr) + '\n'
    except (SyntaxError, ValueError):
        return '\n' + raw + '\n'

def convert(raw):
    raw = re.sub(r'<options\s+:options="([^"]+)"[^>]*/>', options, raw)
    raw = re.sub(r'</?(?:question|syllabus|tip|warn|add|num|v|x|thd)[^>]*>', '', raw)
    for a,b in [('emp','strong'),('mono','code')]:
        raw = raw.replace(f'<{a}>',f'<{b}>').replace(f'</{a}>',f'</{b}>')
    raw = re.sub(r'^:::[ \t]*(?:stress|info|tip|warning|danger|analysis|answer|details)(?:[ \t]+([^\n]*))?[ \t]*$', lambda m: '\n**' + (m.group(1) or '解析').strip() + '**\n' if m.group(1) else '\n**解析**\n', raw, flags=re.M)
    raw = re.sub(r'^:::\s*$', '', raw, flags=re.M)
    raw = re.sub(r'\s*\{\.[^}]+\}\s*$', '', raw, flags=re.M)
    return raw

def image_dimensions(path):
    with path.open('rb') as image:
        header=image.read(24)
    if header.startswith(b'\x89PNG\r\n\x1a\n'):
        return int.from_bytes(header[16:20],'big'),int.from_bytes(header[20:24],'big')
    if header.startswith((b'GIF87a',b'GIF89a')):
        return int.from_bytes(header[6:8],'little'),int.from_bytes(header[8:10],'little')
    return None

def prepare_images(content):
    def decorate(match):
        tag=match.group(0)
        source=re.search(r'\bsrc=["\']\./([^"\']+)["\']',tag)
        if not source: return tag
        path=ASSETS/source.group(1)
        if not path.is_file(): return tag
        dimensions=image_dimensions(path)
        if not dimensions: return tag
        width,height=dimensions
        return tag[:-1].rstrip().rstrip('/')+f' width="{width}" height="{height}" loading="lazy" decoding="async" />'
    return re.sub(r'<img\b[^>]*>',decorate,content,flags=re.I)

def add_search_marker(line, anchor):
    marker = f'<span class="content-anchor" id="{anchor}"></span>'
    if re.match(r'^\s*(?:`{3,}|~{3,}|<pre\b)',line,flags=re.I):
        return marker+'\n\n'+line
    if line.lstrip().startswith('|'):
        position = line.index('|') + 1
        return line[:position] + marker + line[position:]
    quote = re.match(r'^(\s*>\s*)',line)
    if quote:
        return line[:quote.end()] + marker + line[quote.end():]
    bullet = re.match(r'^(\s*(?:[-*+]\s+|\d+[.)]\s+))', line)
    if bullet:
        return line[:bullet.end()] + marker + line[bullet.end():]
    return marker + line

records=[]; docs=[]; copied=set(); missing=[]
for name, group, subject in specs:
    source_dir = SUPPLEMENTS if group == '错题补充' else SOURCE
    raw = (source_dir / f'{name}.md').read_text(encoding='utf-8')
    for rel in re.findall(r'(?:src=["\']|!\[[^]]*\]\()\.?/([^"\')]+)', raw):
        rel = rel.split('#')[0]
        path = (source_dir / rel).resolve()
        if source_dir.resolve() not in path.parents or not path.is_file():
            if (ASSETS/rel).is_file():
                copied.add(rel); continue
            missing.append((name,rel)); continue
        if rel not in copied:
            target=ASSETS/rel; target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(path,target); copied.add(rel)
    content = prepare_images(convert(raw))
    if group in ('小题','大题'):
        content = re.sub(r'^#\s+[^\n]+',f'# {subject}{group}',content,count=1,flags=re.M)
    sections=[]; current_title=subject; heading_no=0; block_no=[0]; pending=[]; out=[]
    record_type = group if group in ('小题', '大题') else '知识点'
    def flush():
        if not pending: return
        plain=clean('\n'.join(out[i] for i in pending))
        if plain:
            block_no[0]+=1
            anchor=f'p-{block_no[0]}'
            out[pending[0]]=add_search_marker(out[pending[0]],anchor)
            local_records.append({'doc':name,'section_no':heading_no,'anchor_no':block_no[0],'text':plain})
        pending.clear()
    local_records=[]; fence=None; in_pre=False
    for line in content.splitlines():
        marker=re.match(r'^\s*(`{3,}|~{3,})',line)
        if fence:
            out.append(line); pending.append(len(out)-1)
            if marker and marker.group(1)[0]==fence[0] and len(marker.group(1))>=fence[1]:
                fence=None; flush()
            continue
        if in_pre:
            out.append(line); pending.append(len(out)-1)
            if '</pre>' in line.lower(): in_pre=False; flush()
            continue
        if marker:
            flush(); fence=(marker.group(1)[0],len(marker.group(1)))
            out.append(line); pending.append(len(out)-1)
            continue
        if re.match(r'^\s*<pre\b',line,flags=re.I):
            flush(); in_pre='</pre>' not in line.lower()
            out.append(line); pending.append(len(out)-1)
            if not in_pre: flush()
            continue
        m=re.match(r'^(#{1,4})\s+(.+?)\s*$',line)
        if m:
            flush(); heading_no+=1
            current_title=clean(m.group(2)) or subject
            current_anchor=f's-{heading_no}'
            sections.append({'title':current_title,'anchor':current_anchor,'level':len(m.group(1))})
            local_records.append({'doc':name,'section_no':heading_no,'anchor_no':-heading_no,'text':current_title})
            out.append(f'<a id="{current_anchor}"></a>')
            out.append(line)
            continue
        if not line.strip() or re.match(r'^\s*\|\s*[:\-]+(?:\s*\|\s*[:\-]+)*\s*\|?\s*$',line):
            flush(); out.append(line); continue
        if line.lstrip().startswith('|'):
            flush(); out.append(line); pending.append(len(out)-1); flush(); continue
        out.append(line); pending.append(len(out)-1)
    flush()
    records.extend(local_records)
    (DOCS/f'{name}.md').write_text('\n'.join(out),encoding='utf-8')
    source_url = (f'https://github.com/louise-ZQF/postgraduate-exam-408-website/blob/main/source/supplements/{name}.md'
                  if group == '错题补充' else
                  f'https://github.com/yyx-dev/yyx-dev.github.io/blob/325bdaa/docs/408/{name}.md')
    docs.append({'id':name,'group':group,'type':record_type,'subject':subject,'title':subject if group=='知识体系' else subject+' · '+group,'sections':sections,'source':source_url})
(PUBLIC/'catalog.json').write_text(json.dumps({'docs':docs},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
doc_indexes={doc['id']:i for i,doc in enumerate(docs)}
for record_type,filename in (('知识点','search-knowledge.json'),('小题','search-small.json'),('大题','search-big.json')):
    compact_records=[[doc_indexes[r['doc']],r['section_no'],r['anchor_no'],r['text']]
                     for r in records if docs[doc_indexes[r['doc']]]['type']==record_type]
    (PUBLIC/filename).write_text(json.dumps(compact_records,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'{len(docs)} documents, {len(records)} search records, {len(copied)} images; missing references: {len(missing)}')
if missing: print('Missing examples:',missing[:8])
