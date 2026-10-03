import {mergeEdits,encodeUTF8,decodeUTF8,validateEdit} from './edit-model.js'
const REPO='louise-ZQF/postgraduate-exam-408-website',API='https://api.github.com/repos/'+REPO
let enabled=false,host,doc,bundle,drafts={},active='',trigger,token='',storage,render,base,notice
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const key=id=>'408-content-drafts-v1:'+id
function save(){try{storage.setItem(key(doc.id),JSON.stringify(drafts));status('草稿已保存在本机；尚未发布到网站。')}catch{status('本机存储不可用，请导出草稿避免丢失。')}}
function status(text){host.querySelector('[data-edit-status]').textContent=text}
function error(text){const p=host.querySelector('[data-editor-error]');p.textContent=text;p.focus()}
function previewMarkdown(raw){
  const decoder=document.createElement('textarea')
  return raw.replace(/<options\s+:options="([^"]+)"[^>]*\/>/g,(_,encoded)=>{
    decoder.innerHTML=encoded;const arr=[];const expression=decoder.value
    for(const m of expression.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g))arr.push((m[1]??m[2]).replace(/\\n/g,'\n').replace(/\\(['"\\])/g,'$1'))
    return '\n\n'+arr.map(s=>'- '+s).join('\n')+'\n\n'
  }).replace(/<frac\b([^>]*)\/>/g,(_,attrs)=>{const a=Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));return '$'+(a.left?'\\text{'+a.left+'}=':'')+'\\dfrac{\\text{'+(a.num||'')+'}}{\\text{'+(a.den||'')+'}}$'})
    .replace(/<\/?(?:question|syllabus|tip|warn|add|num|v|x|thd)[^>]*>/g,'')
    .replace(/<(\/?)(emp|mono)>/g,(_,slash,tag)=>'<'+slash+(tag==='emp'?'strong':'code')+'>')
    .replace(/^:::[ \t]*(?:stress|info|tip|warning|danger|analysis|answer|details)(?:[ \t]+([^\n]*))?[ \t]*$/gm,(_,title)=>'\n**'+(title||'解析')+'**\n').replace(/^:::\s*$/gm,'')
    .replace(/\s*\{\.[^}]+\}\s*$/gm,'')
}
function showPreview(){try{render(previewMarkdown(host.querySelector('#edit-text').value),base,host.querySelector('[data-edit-preview]'))}catch(e){error(e.message)}}
function persistInput(){if(!active)return;const value=host.querySelector('#edit-text').value,original=bundle.blocks[active].raw;const prior=drafts[active];if(value===original&&!prior?.published)delete drafts[active];else drafts[active]={base:prior?.base??original,value};save()}
function open(id,button){host.querySelector('#content-editor').classList.remove('publish-only');active=id;trigger=button;host.querySelector('#edit-text').value=drafts[id]?.value??bundle.blocks[id].raw;host.querySelector('[data-editor-error]').textContent='';host.querySelector('[data-edit-title]').textContent='编辑当前内容';host.querySelector('#content-editor').showModal();host.querySelector('#edit-text').focus();showPreview()}
function applyDrafts(){for(const [id,edit] of Object.entries(drafts)){const el=document.getElementById(id);if(!el)continue;const button=el.querySelector('[data-edit-block]');render(previewMarkdown(edit.value),base,el);if(button)el.prepend(button);el.classList.add('has-draft')}}
function decorate(){for(const [id] of Object.entries(bundle.blocks)){const el=document.getElementById(id);if(!el||el.querySelector('[data-edit-block]'))continue;const b=document.createElement('button');b.type='button';b.className='action block-edit';b.dataset.editBlock=id;b.textContent='编辑这一段';el.prepend(b)}host.querySelector('#article-body').classList.toggle('editing-content',enabled)}
async function request(path,options={}){const response=await fetch(API+path,{signal:AbortSignal.timeout(30000),...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});if(!response.ok){if(response.status===401||response.status===403)throw Error('GitHub 授权无效或权限不足，请使用该仓库的 Contents 读写授权。');if(response.status===409)throw Error('资料刚刚被更新，已保留草稿，请稍后重新发布。');throw Error('GitHub 请求失败（'+response.status+'），草稿仍保留。')}return response.json()}
async function publish(){
  const publishingDoc=doc.id;const edits=structuredClone(Object.fromEntries(Object.entries(drafts).filter(([,edit])=>!edit.published)));if(!Object.keys(edits).length){error('当前页面没有待发布的修改。');return}
  const input=host.querySelector('#github-edit-token');token=input.value.trim()||token;input.value='';if(!token){error('发布需要 GitHub 授权，请先填写下方授权凭据；草稿不受影响。');host.querySelector('#github-edit-token').focus();return}
  const button=host.querySelector('[data-edit-publish]');button.disabled=true
  try{
    for(const [id,edit] of Object.entries(edits)){validateEdit(edit.value,bundle.blocks[id]?.raw||edit.base);const check=document.createElement('div');render(previewMarkdown(edit.value),base,check);if(check.querySelector('.katex-error'))throw Error('修改中有无法显示的数学公式，请先修正公式后发布。')}
    status('正在保存到 GitHub…')
    const path='/contents/'+bundle.path.split('/').map(encodeURIComponent).join('/'),file=await request(path+'?ref=main')
    const source=decodeUTF8(file.content),updated=mergeEdits(source,edits)
    if(updated===source){status('这些修改已经保存在 GitHub，请等待网站更新。');return}
    const result=await request(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Edit '+doc.title+' from website',branch:'main',sha:file.sha,content:encodeUTF8(updated)})})
    if(doc.id!==publishingDoc){notice('之前页面的修改已保存到 GitHub，网站正在更新。');return}
    for(const [id,edit] of Object.entries(edits)){if(drafts[id]?.value===edit.value){drafts[id]={...edit,base:edit.value,published:true};bundle.blocks[id].raw=edit.value;bundle.blocks[id].markdown=previewMarkdown(edit.value)}}
    save();status('已保存到 GitHub，网站与搜索正在自动更新；这段内容在本机已显示。');host.querySelector('[data-editor-error]').textContent='';host.querySelector('[data-edit-result]').innerHTML='<a target="_blank" rel="noopener noreferrer" href="'+esc(result.commit.html_url)+'">查看保存记录 ↗</a> · <a target="_blank" rel="noopener noreferrer" href="https://github.com/'+REPO+'/actions">查看网站发布进度 ↗</a>'
  }catch(e){error(e.message);status('未发布成功；草稿仍保留。')}finally{button.disabled=false}
}
export async function mountEditor(options){
  enabled=false;host=options.host;doc=options.doc;render=options.render;base=options.base;storage=options.storage;notice=options.notice;bundle=null;active=''
  try{drafts=JSON.parse(storage.getItem(key(doc.id))||'{}')}catch{drafts={}}
  host.querySelector('#toggle-editor').addEventListener('click',async e=>{
    const button=e.currentTarget;button.disabled=true
    try{bundle??=await options.load();enabled=!enabled;button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'退出编辑':'编辑模式';decorate();applyDrafts();host.querySelector('[data-edit-bar]').hidden=!enabled;status(Object.values(drafts).some(edit=>!edit.published)?'本机有草稿，保存到网站后其他设备才能看到。':Object.keys(drafts).length?'修改已保存到 GitHub，等待网站更新。':'点击正文旁的“编辑这一段”开始修改。')}
    catch(err){notice('编辑资料加载失败：'+err.message)}finally{button.disabled=false}
  })
  const mount=document.createElement('div');mount.innerHTML=`<div class="edit-bar" data-edit-bar hidden><span data-edit-status role="status"></span><button class="action" data-edit-export>导出草稿</button><button class="action" data-edit-open-publish>保存到网站</button></div><dialog id="content-editor" aria-labelledby="content-edit-title"><div class="dialog-head"><h2 id="content-edit-title" data-edit-title>编辑当前内容</h2><button class="action" data-edit-close>关闭</button></div><p class="editor-help">普通文字直接修改；公式使用 $…$，图片与题目标签请保留。输入会自动保存草稿。</p><p data-editor-error role="alert" tabindex="-1"></p><div class="editor-grid"><div><label for="edit-text">内容</label><textarea id="edit-text" spellcheck="false" aria-describedby="content-edit-hint"></textarea><p id="content-edit-hint">支持 Markdown 表格、代码与数学公式。</p></div><div><h3>效果预览</h3><div class="markdown" data-edit-preview></div></div></div><div class="editor-actions"><button class="action" data-edit-preview-button>刷新预览</button><button class="action" data-edit-apply>应用草稿</button><button class="action" data-edit-revert>撤销本段草稿</button></div><details class="editor-auth"><summary>发布到网站</summary><p>首次发布：<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">创建 GitHub 授权</a>，只选择 postgraduate-exam-408-website 仓库，赋予 Contents 读写权限。凭据只在当前页面内存使用，关闭页面后需重新输入。<a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noopener noreferrer">授权说明</a></p><label for="github-edit-token">GitHub 授权凭据</label><input id="github-edit-token" type="password" autocomplete="off" placeholder="github_pat_…"><button class="action" data-edit-publish>保存当前页面的修改到网站</button><p data-edit-result role="status"></p></details></dialog>`;host.append(mount)
  const dialog=host.querySelector('#content-editor'),text=host.querySelector('#edit-text');let timer
  text.addEventListener('input',()=>{persistInput();clearTimeout(timer);timer=setTimeout(showPreview,450)})
  host.querySelector('[data-edit-close]').onclick=()=>{dialog.close();trigger?.focus()}
  dialog.addEventListener('cancel',()=>queueMicrotask(()=>trigger?.focus()))
  host.querySelector('[data-edit-preview-button]').onclick=showPreview
  host.querySelector('[data-edit-apply]').onclick=()=>{try{validateEdit(text.value,bundle.blocks[active].raw);showPreview();if(host.querySelector('[data-edit-preview] .katex-error'))throw Error('数学公式无法显示，请先修正。');persistInput();applyDrafts();decorate();dialog.close();trigger?.focus()}catch(e){error(e.message)}}
  host.querySelector('[data-edit-revert]').onclick=()=>{text.value=bundle.blocks[active].raw;delete drafts[active];save();showPreview();const el=document.getElementById(active);render(bundle.blocks[active].markdown,base,el);el.classList.remove('has-draft');decorate()}
  host.querySelector('[data-edit-publish]').onclick=publish
  host.querySelector('[data-edit-open-publish]').onclick=()=>{active='';dialog.classList.add('publish-only');text.value='';host.querySelector('[data-editor-error]').textContent='';host.querySelector('[data-edit-title]').textContent='保存修改到网站';dialog.showModal();host.querySelector('.editor-auth').open=true;host.querySelector('#github-edit-token').focus()}
  host.querySelector('[data-edit-export]').onclick=()=>{const blob=new Blob([JSON.stringify({doc:doc.id,drafts},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=doc.id+'-编辑草稿.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  host.addEventListener('click',e=>{const button=e.target.closest('[data-edit-block]');if(button&&bundle)open(button.dataset.editBlock,button)},{signal:options.signal})
  if(Object.keys(drafts).length)notice('本页有编辑草稿，开启“编辑模式”可继续修改或发布。')
}
