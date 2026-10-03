export const subjects = ['数据结构', '计算机组成原理', '操作系统', '计算机网络']
const subjectAliases = [['数据结构','数据结构','DS'],['计算机组成原理','计算机组成原理','计组','CO'],['操作系统','操作系统','OS'],['计算机网络','计算机网络','计网','CN']]
const synonymGroups = [['写回','回写'],['快表','TLB'],['缺页','page fault'],['缓存','Cache','高速缓存'],['死锁','deadlock'],['虚拟内存','虚拟存储','virtual memory'],['信号量','semaphore'],['后备缓冲','后备缓冲器','victim cache'],['最小生成树','MST'],['先来先服务','FCFS'],['最近最少使用','LRU'],['先进先出','FIFO'],['往返时间','RTT'],['磁盘调度','磁盘调度算法']]
export const normalize = text => String(text || '').toLowerCase().replace(/\s+/g,'')
const escapeRE = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
export function parseQuery(query) {
  let rest=query.trim(); const chips=[]; let subject=null; const years=[]
  for(const [name,...aliases] of subjectAliases) {
    for(const alias of aliases.sort((a,b)=>b.length-a.length)) {
      const re = /[a-z]/i.test(alias) ? new RegExp(`(^|[^a-z])(${escapeRE(alias)})(?=$|[^a-z])`,'i') : new RegExp(escapeRE(alias))
      const match=rest.match(re)
      if(match) { subject=name; const raw=match[2] || match[0]; chips.push({kind:'subject',label:name,raw}); rest=rest.replace(re, match[2] ? match[1] : ' '); break }
    }
    if(subject) break
  }
  rest=rest.replace(/(?<![a-z0-9])(20\d{2})(?:年)?(?![a-z0-9])/gi,(raw,year)=>{years.push(Number(year));chips.push({kind:'year',label:year+' 年',raw});return ' '})
  // A confirmed multiword synonym must be treated as one term.
  const phrases=[]
  for(const group of synonymGroups) for(const alias of group.filter(x=>x.includes(' '))) {
    const re=new RegExp(escapeRE(alias),'ig')
    if(re.test(rest)){phrases.push(group);rest=rest.replace(re,' ')}
  }
  const terms=rest.split(/\s+/).filter(Boolean).map(t=>synonymGroups.find(g=>g.some(a=>normalize(a)===normalize(t))) || [t])
  return {subject,years:[...new Set(years)],terms:[...phrases,...terms],chips}
}
export function queryTerms(query) {return parseQuery(query).terms.flat()}
const prepared=new WeakMap()
function fields(r) {
  if(!prepared.has(r))prepared.set(r,{title:normalize(r.title),path:normalize((r.path || [r.section]).join(' ')),text:normalize(r.text+' '+(r.summary || ''))})
  return prepared.get(r)
}
export function searchRecords(records, query, scope='全部', subject='全部') {
  const parsed=parseQuery(query); const groups=parsed.terms.map(g=>g.map(normalize))
  if(!query.trim())return []
  const filtered=records.filter(r=>(scope==='全部'||r.type===scope)&&((parsed.subject || (subject==='全部'?null:subject))===null || r.subject===(parsed.subject || subject))&&(!parsed.years.length||parsed.years.includes(r.year)))
  const avg=Math.max(1,filtered.reduce((n,r)=>n+fields(r).text.length,0)/Math.max(1,filtered.length))
  const dfs=groups.map(g=>filtered.reduce((n,r)=>n+Number(Object.values(fields(r)).some(f=>g.some(t=>f.includes(t)))),0))
  const found=[]
  for(const r of filtered) {
    const f=fields(r)
    if(!groups.every(g=>Object.values(f).some(s=>g.some(t=>s.includes(t)))))continue
    let score=0
    groups.forEach((g,index)=>{
      const idf=Math.log(1+(filtered.length-dfs[index]+.5)/(dfs[index]+.5))
      const hits=(field)=>Math.max(...g.map(t=>Math.min(8,field.split(t).length-1)))
      const tf=hits(f.text), denom=tf+1.2*(.25+.75*f.text.length/avg)
      score+=idf*(tf?tf*2.2/denom:0)+4*hits(f.title)+1.5*hits(f.path)
    })
    // On a concept query, show the actual rule before incidental appearances in an exercise.
    if(r.type==='知识点'&&!parsed.years.length)score+=8
    found.push({...r,score})
  }
  found.sort((a,b)=>b.score-a.score||a.text.length-b.text.length)
  const merged=new Map()
  for(const r of found) {
    const key=r.type==='知识点' ? r.doc+'#'+r.sectionId : r.doc+'#'+r.anchor
    const existing=merged.get(key)
    if(existing){existing.otherHits.push(r);if(existing.kind==='heading' && r.kind!=='heading'){existing.anchor=r.anchor;existing.text=r.text;existing.kind=r.kind}}
    else merged.set(key,{...r,text:r.kind==='heading'?(r.summary || r.text):r.text,otherHits:[]})
  }
  return [...merged.values()]
}
export function snippet(text, query) {
  const needles=queryTerms(query);const lower=text.toLowerCase();const positions=needles.map(n=>lower.indexOf(n.toLowerCase())).filter(i=>i>=0)
  const at=positions.length?Math.min(...positions):0;const start=Math.max(0,at-60),end=Math.min(text.length,at+200)
  return (start?'…':'')+text.slice(start,end)+(end<text.length?'…':'')
}

const decoded = new WeakMap()
export function decodeIndex(data,docs,type) {
  if(decoded.has(data))return decoded.get(data)
  if(data.schema!==2 || !Array.isArray(data.records))throw new Error('索引版本已更新，请刷新页面。')
  const records=data.records.map(([di,si,anchor,kind,title,text,year,stemLength])=>{
    const doc=docs[di],section=doc.sections[si]
    return {doc:doc.id,subject:doc.subject,group:doc.group,type,anchor,kind,title:title||section.title,text,year,stem:stemLength?text.slice(0,stemLength):'',section:section.title,sectionId:section.anchor,path:section.path,topicId:section.topicId}
  })
  decoded.set(data,records);return records
}
