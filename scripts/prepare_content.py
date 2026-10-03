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
    text = re.sub(r'\\([.()])', r'\1', text)
    text = text.replace('\\*','*').replace('**',' ').replace('__',' ')
    text = re.sub(r'(?m)^\s*>\s?', ' ', text)
    for command, readable in [('log','log'),('lg','lg'),('ln','ln'),('Theta','Θ'),('Omega','Ω'),('theta','θ'),('times','×'),('cdot','·'),('leq','≤'),('geq','≥'),('le','≤'),('ge','≥'),('sim','～'),('approx','≈'),('to','→'),('in','∈')]:
        text = re.sub(r'\\'+command+r'(?![A-Za-z])', lambda m: readable, text)
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

from content_model import build
build(HERE, specs, clean, convert, prepare_images, image_dimensions)
