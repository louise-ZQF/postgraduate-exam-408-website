export function readBlock(source,id){
  const marker='<!-- unit-id:'+id+' -->\n',start=source.indexOf(marker)
  if(start<0)throw Error('这段内容已经移动，请刷新页面后重新编辑；草稿仍已保留。')
  const body=start+marker.length,next=source.indexOf('\n\n<!-- unit-id:',body)
  return {start:body,end:next<0?source.length:next,raw:source.slice(body,next<0?source.length:next).trimEnd()}
}
export function mergeEdits(source,edits){
  for(const [id,edit] of Object.entries(edits)){
    const block=readBlock(source,id)
    if(block.raw===edit.value.trimEnd())continue
    if(block.raw!==edit.base.trimEnd())throw Error('同一段内容已有更新，已停止发布以免覆盖；请导出草稿，刷新后对照修改。')
    source=source.slice(0,block.start)+edit.value.trimEnd()+source.slice(block.end)
  }
  return source.endsWith('\n')?source:source+'\n'
}
export const encodeUTF8=text=>{const bytes=new TextEncoder().encode(text);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary)}
export const decodeUTF8=text=>new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g,'')),c=>c.charCodeAt(0)))
export function validateEdit(value,base){
  if(!value.trim())throw Error('内容不能为空；如果要删除，请明确编辑为你的替代说明。')
  if(value.includes('<!-- unit-id:'))throw Error('请只编辑正文，不要加入内容定位标记。')
  if(base.startsWith('<question>')&&(!value.startsWith('<question>')||!value.trimEnd().endsWith('</question>')))throw Error('请保留题目开头和结尾的 question 标签。')
}
