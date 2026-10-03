export const REVIEW_KEY='kaoyan-408-review-v2'
export const LEGACY_KEY='kaoyan-408-favorites-v1'
export function migrateLegacy(list, maps) {
  return list.map(item=>{
    const mapped=maps[item.doc]?.[item.anchor]
    const text=(item.text || '').replace(/\s+/g,'')
    const proof=(mapped?.text || '').replace(/\s+/g,'')
    const verified=mapped?.target && item.title===mapped.title && (!text || (!mapped.sectionFallback && proof.includes(text)))
    const anchor=verified?mapped.target:item.anchor
    return {...item,id:item.doc+'#'+anchor,anchor,needsRelocation:!verified,status:'due',reviewCount:0,lastReviewedAt:null,nextReviewAt:Date.now(),history:[]}
  })
}
export function scheduleReview(item,status,reason='',now=Date.now()) {
  const interval=status==='mastered'?14:status==='familiar'?3:1
  return {...item,status,reviewCount:(item.reviewCount || 0)+1,lastReviewedAt:now,nextReviewAt:now+interval*86400000,reason,history:[...(item.history || []),{at:now,status,reason}].slice(-100)}
}
export function validateImport(value,docIds) {
  const list=Array.isArray(value)?value:value?.items
  if(!Array.isArray(list)||list.length>10000)throw new Error('文件不是有效的复习清单')
  return list.map(item=>{
    if(!item || typeof item.doc!=='string'||!docIds.has(item.doc)||typeof item.anchor!=='string'||!/^[-\w]+$/.test(item.anchor)||typeof item.title!=='string')throw new Error('文件包含无效的资料或定位信息')
    const date=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null
    return {id:item.doc+'#'+item.anchor,doc:item.doc,anchor:item.anchor,title:item.title.slice(0,500),text:String(item.text || '').slice(0,1000),addedAt:date(item.addedAt)||Date.now(),status:['due','familiar','mastered'].includes(item.status)?item.status:'due',reviewCount:Math.max(0,Math.min(100000,Number(item.reviewCount)||0)),lastReviewedAt:date(item.lastReviewedAt),nextReviewAt:date(item.nextReviewAt)||Date.now(),reason:String(item.reason || '').slice(0,1000),history:Array.isArray(item.history)?item.history.slice(-100).map(x=>({at:date(x.at),status:['due','familiar','mastered'].includes(x.status)?x.status:'due',reason:String(x.reason || '').slice(0,1000)})):[],needsRelocation:Boolean(item.needsRelocation)}
  })
}
export function createReviewStore(storage,notify=()=>{}) {
  let memory=null, writable=true
  function read(key,fallback) {try {return JSON.parse(storage.getItem(key)||JSON.stringify(fallback))}catch{writable=false;notify('浏览器存储无法读取，请导出本次复习记录；已有数据未被覆盖。');return fallback}}
  return {
    init(maps) {
      memory=read(REVIEW_KEY,null)
      if(memory!==null && (!Array.isArray(memory)||memory.some(x=>!x||typeof x.doc!=='string'||typeof x.anchor!=='string'||typeof x.title!=='string'))){writable=false;memory=[];notify('复习数据格式损坏，原记录未覆盖，请从备份恢复。')}
      else if(memory===null){const legacy=read(LEGACY_KEY,[]);if(!Array.isArray(legacy)){writable=false;memory=[];notify('旧收藏格式无法读取，原记录未覆盖。')}else{memory=migrateLegacy(legacy.filter(x=>x&&typeof x.doc==='string'&&typeof x.anchor==='string'),maps);this.save(memory)}}
      return memory
    },
    list(){return memory || []},
    save(items){memory=items;if(!writable){notify('原存储无法读取，本次记录仅保留在页面，请导出备份。');return false}try{storage.setItem(REVIEW_KEY,JSON.stringify(items));return true}catch{notify('浏览器存储不可用，本次记录仅保留在当前页面，请导出备份。');return false}},
  }
}
