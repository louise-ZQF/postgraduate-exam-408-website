export const clone=v=>structuredClone(v)
export function recorder(meta,state){
 const frames=[]
 const add=(title,why,view={},extra={})=>frames.push(clone({title,why,state,view,...extra}))
 const finish=()=>({kind:'trace',...meta,frames,formula:meta.formula||'',compare:meta.compare||[['执行约定',meta.condition]]})
 return {state,frames,add,finish}
}
export const row=(label,items,active=[],notes=[])=>({label,items:items.map((v,i)=>({text:String(v??'空'),current:active.includes(i),note:notes[i]||''}))})
export const arrayView=(label,items,active=[],notes=[])=>({rows:[row(label,items,active,notes)]})
export function binaryView(root,active=[]){
 const nodes=[]
 function visit(n){if(!n||n.key==='NIL')return;const children=[n.left,n.right].map(c=>c&&c.key!=='NIL'?String(c.id??c.key):null);nodes.push({id:String(n.id??n.key),label:String(n.key),color:n.color,children:children.some(Boolean)?children:[],note:n.note||''});visit(n.left);visit(n.right)}
 visit(root);return {tree:{nodes,root:root?String(root.id??root.key):null,binary:true,active:active.map(String)}}
}
export function generalTree(root,active=[]){
 const nodes=[]
 function visit(n){if(!n)return;nodes.push({id:String(n.id),label:n.label??n.keys.join(' · '),children:(n.children||[]).map(c=>String(c.id)),note:n.note||''});(n.children||[]).forEach(visit)}
 visit(root);return {tree:{nodes,root:root?String(root.id):null,active:active.map(String)}}
}
export const flow=(...steps)=>steps.join('\n↓\n')
