const KEY='408-reader-view-v1'
const DEFAULTS={leftCollapsed:false,rightCollapsed:false,zoom:100}
function normalize(value){
 const p=value&&typeof value==='object'?value:{}
 return {leftCollapsed:p.leftCollapsed===true,rightCollapsed:p.rightCollapsed===true,zoom:typeof p.zoom==='number'&&Number.isFinite(p.zoom)?Math.min(200,Math.max(80,Math.round(p.zoom/10)*10)):100}
}

export function createReaderView(storage,notice){
 let prefs={...DEFAULTS},warned=false
 try{prefs=normalize(JSON.parse(storage.getItem(KEY)||'null'))}catch{}
 const save=()=>{try{storage.setItem(KEY,JSON.stringify(prefs))}catch{if(!warned){warned=true;notice('阅读设置暂时无法保存，当前页面仍可使用。')}}}
 return {mount(host,{signal,openDialog,closeDialog}){
  const reader=host.querySelector('.reader'),content=host.querySelector('.reader-content'),bar=host.querySelector('.reading-bar')
  const left=host.querySelector('#reader-nav'),right=host.querySelector('#reader-outline')
  const smallLeft=matchMedia('(max-width:850px)'),smallRight=matchMedia('(max-width:1280px)')
  const toggleButtons=[...host.querySelectorAll('[data-reader-panel]')]
  const zoomOut=host.querySelector('[data-reader-zoom="out"]'),zoomIn=host.querySelector('[data-reader-zoom="in"]'),reset=host.querySelector('[data-reader-zoom="reset"]')
  function refresh(){
   left.hidden=smallLeft.matches||prefs.leftCollapsed;right.hidden=smallRight.matches||prefs.rightCollapsed
   reader.classList.toggle('has-reader-left',!left.hidden);reader.classList.toggle('has-reader-right',!right.hidden)
   content.style.zoom=String(prefs.zoom/100)
   for(const button of toggleButtons){
    const isLeft=button.dataset.readerPanel==='left',compact=(isLeft?smallLeft:smallRight).matches
    const panel=isLeft?left:right,dialog=host.querySelector(isLeft?'#nav-dialog':'#toc-dialog')
    const expanded=compact?dialog.open:!panel.hidden
    const label=compact?(isLeft?'资料导航':'本文目录'):(expanded?'收起':'展开')+(isLeft?'左栏':'右栏')
    button.querySelector('span').textContent=label;button.setAttribute('aria-label',label)
    button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-controls',compact?dialog.id:panel.id)
    if(compact)button.setAttribute('aria-haspopup','dialog');else button.removeAttribute('aria-haspopup')
   }
   reset.textContent=prefs.zoom+'%';reset.setAttribute('aria-label',`当前缩放 ${prefs.zoom}%，恢复 100%`)
   zoomOut.disabled=prefs.zoom===80;zoomIn.disabled=prefs.zoom===200
  }
  // Keep the paragraph or diagram at the top of the reading viewport in place.
  // Changing classes/zoom must not rebuild the article or reset an exercise.
  function change(update){
   const bounds=content.getBoundingClientRect(),top=document.querySelector('.site-header').getBoundingClientRect().bottom+20
   const at=document.elementFromPoint(Math.max(12,Math.min(innerWidth-12,bounds.left+Math.min(70,bounds.width/2))),top)
   const anchor=content.contains(at)?at.closest('.study-unit,.study-question,.learning-lab,[data-section]'):null
   const before=anchor?.getBoundingClientRect().top
   update();refresh();save()
   if(anchor)requestAnimationFrame(()=>{if(!signal.aborted&&anchor.isConnected)window.scrollBy({top:anchor.getBoundingClientRect().top-before,behavior:'instant'})})
  }
  bar.addEventListener('click',e=>{
   const button=e.target.closest('button');if(!button)return
   if(button.dataset.readerPanel){
    const isLeft=button.dataset.readerPanel==='left',compact=(isLeft?smallLeft:smallRight).matches
    if(compact){openDialog(isLeft?'nav-dialog':'toc-dialog',button);refresh()}
    else change(()=>{const key=isLeft?'leftCollapsed':'rightCollapsed';prefs[key]=!prefs[key]})
   }
   if(button.dataset.readerZoom){
    change(()=>{prefs.zoom=button.dataset.readerZoom==='reset'?100:Math.min(200,Math.max(80,prefs.zoom+(button.dataset.readerZoom==='in'?10:-10)))})
    host.querySelector('[data-reader-zoom-status]').textContent=`阅读缩放 ${prefs.zoom}%`
    if(button.disabled)reset.focus({preventScroll:true})
   }
  },{signal})
  host.querySelector('#nav-dialog').addEventListener('click',e=>{if(e.target.closest('a'))closeDialog(e.currentTarget)},{signal})
  for(const dialog of host.querySelectorAll('#nav-dialog,#toc-dialog'))dialog.addEventListener('close',refresh,{signal})
  const resize=()=>{
   for(const [query,id] of [[smallLeft,'nav-dialog'],[smallRight,'toc-dialog']]){const d=host.querySelector('#'+id);if(!query.matches&&d.open)closeDialog(d)}
   refresh()
  }
  smallLeft.addEventListener('change',resize,{signal});smallRight.addEventListener('change',resize,{signal})
  const height=new ResizeObserver(()=>document.documentElement.style.setProperty('--reading-bar-height',Math.ceil(bar.getBoundingClientRect().height)+'px'))
  height.observe(bar);signal.addEventListener('abort',()=>{height.disconnect();document.documentElement.style.removeProperty('--reading-bar-height')},{once:true})
  refresh()
 }}
}
