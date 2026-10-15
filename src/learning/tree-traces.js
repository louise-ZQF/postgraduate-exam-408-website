import {recorder,binaryView,generalTree,row,flow} from './trace-kit.js'
const inorder=n=>!n||n.key==='NIL'?[]:[...inorder(n.left),n.key,...inorder(n.right)]
export function bst(name='查找与插入'){
 let root=null;const s={中序序列:[],当前:'—'},t=recorder({title:'二叉搜索树 · '+name,intro:'依次插入 5、3、7、2、4、6、8；查找并插入 1，或删除有两个孩子的 5。',condition:'关键字互异；左子树小于根，右子树大于根。删除有两个孩子的结点时，本例采用中序后继替代。',flow:flow('从根比较','目标小 → 左；大 → 右；相等 → 找到','插入：到空指针建叶；删除：按 0／1／2 个孩子处理','中序序列仍递增 → 结束')},s)
 const emit=(title,why,active=[])=>{s.中序序列=inorder(root);const view=binaryView(root);view.tree.active=view.tree.nodes.filter(n=>active.map(String).includes(n.label)).map(n=>n.id);t.add(title,why,view)}
 function insert(n,k){if(!n)return {id:'n'+k,key:k};if(k<n.key)n.left=insert(n.left,k);else n.right=insert(n.right,k);return n}
 for(const k of [5,3,7,2,4,6,8])root=insert(root,k);emit('初始 BST','先用中序递增检查这是一棵合法的二叉搜索树。')
 if(name==='查找与插入'){let n=root;while(n){s.当前=n.key;emit(`比较 1 与 ${n.key}`,`1<${n.key} → 转向左孩子。`,[n.key]);n=n.left}root=insert(root,1);emit('在空指针处插入 1','1 成为 2 的左孩子；插入时不会把它挂到任意空位。',[1])}
 else {let successor=root.right;while(successor.left){emit(`到 ${successor.key} 的左孩子`,'找右子树最小值，即根 5 的中序后继。',[successor.key]);successor=successor.left}const old=root.key;root.key=successor.key;emit(`用后继 ${successor.key} 替代 ${old}`,'接下来删除右子树中原来的后继结点；短暂出现重复键不是最终结果。',[root.key]);function del(n,k){if(k<n.key)n.left=del(n.left,k);else if(k>n.key)n.right=del(n.right,k);else return n.left||n.right;return n}root.right=del(root.right,successor.key);emit('删除原后继结点','后继没有左孩子，直接由其右孩子（可能为空）补位。')}
 emit('完成',`中序 ${s.中序序列.join(' → ')}。`);return t.finish()
}
export const avlNames=['LL：右旋','RR：左旋','LR：先左后右','RL：先右后左','删除后向上检查']
export function avl(name=avlNames[0]){
 const seeds={'LL：右旋':[3,2,1],'RR：左旋':[1,2,3],'LR：先左后右':[3,1,2],'RL：先右后左':[1,3,2],'删除后向上检查':[4,2,5,1,3]};let root=null
 const s={中序序列:[],平衡因子:{}},t=recorder({title:'AVL 平衡二叉树 · '+name,intro:'插入顺序 '+seeds[name].join(' → ')+(name.startsWith('删除')?'，随后删除 5。':'。'),condition:'平衡因子定义为左子树高度−右子树高度。旋转保持 BST 的中序顺序；删除后可能需要继续调整更高祖先。',flow:flow('先按 BST 插入／删除','从修改点向上更新高度','|BF|≤1 → 继续检查；|BF|>1 → 判断 LL／RR／LR／RL 并旋转','更新新子树根的高度 → 继续向上／结束')},s)
 const h=n=>n?1+Math.max(h(n.left),h(n.right)):0,bf=n=>h(n.left)-h(n.right)
 const emit=(title,why,active=[])=>{s.中序序列=inorder(root);s.平衡因子={};function visit(n){if(!n)return;s.平衡因子[n.key]=bf(n);n.note='BF='+bf(n);visit(n.left);visit(n.right)}visit(root);t.add(title,why,binaryView(root,active))}
 const right=n=>{const x=n.left;n.left=x.right;x.right=n;return x},left=n=>{const x=n.right;n.right=x.left;x.left=n;return x}
 function rebalance(n){if(!n)return n;if(bf(n)>1){if(bf(n.left)<0){n.left=left(n.left);s.动作='LR 第一步：左旋左孩子';emit(s.动作,'先把折线转成直线，下一步右旋原失衡根。',[n.key,n.left.key])}else s.动作='LL：右旋失衡根';n=right(n)}else if(bf(n)<-1){if(bf(n.right)>0){n.right=right(n.right);s.动作='RL 第一步：右旋右孩子';emit(s.动作,'先把折线转成直线，下一步左旋原失衡根。',[n.key,n.right.key])}else s.动作='RR：左旋失衡根';n=left(n)}return n}
 function insert(n,k){if(!n)return {key:k};if(k<n.key)n.left=insert(n.left,k);else n.right=insert(n.right,k);return n}
 emit('初始空树','还没有结点。')
 function fix(n){if(!n)return n;n.left=fix(n.left);n.right=fix(n.right);const old=n.key,factor=bf(n);if(Math.abs(factor)>1){s.失衡根=old;s.失衡因子=factor;emit(`发现 ${old} 失衡：BF=${factor}`,'先检查孩子向哪边偏，再决定单旋或双旋。',[old]);n=rebalance(n)}return n}
 for(const k of seeds[name]){root=insert(root,k);emit(`按 BST 插入 ${k}`,'先插入，再计算沿途祖先的平衡因子。',[k]);root=fix(root);emit('检查并恢复平衡','旋转后中序顺序保持，所有结点的高度差恢复到不超过 1。')}
 if(name.startsWith('删除')){root.right=null;emit('删除叶结点 5','右子树降低一层，根 4 的 BF 变成 2。',[4]);root=fix(root);emit('完成删除后的平衡调整','左孩子 BF=0，本例对根右旋；一般删除可能继续影响更高祖先。')}
 emit('结束',`中序 ${s.中序序列.join(' → ')}，最终每个 |BF|≤1。`);return t.finish()
}

export function redBlack(name='插入：变色与旋转'){
 const nil={key:'NIL',color:'B'};nil.left=nil;nil.right=nil;nil.parent=nil;let root=nil,record=true
 const s={中序序列:[],操作:'—'},t=recorder({title:'红黑树 · '+name,intro:'NIL 空叶统一为黑；插入 7、3、18、10、22、8、11、26、2、6、13。删除情形在该树上分别删除 8 或 13。',condition:'红结点不能有红孩子，每条到 NIL 的路径黑高相同；根为黑。下图不重复画每个 NIL，删除修复时 x 可代表黑色 NIL。',flow:flow('先按 BST 插入／删除，记录原颜色','插入：父红？\n├─ 叔红 → 变色并向上\n└─ 叔黑 → 必要时转直线，再旋转祖父并变色','删除黑结点：处理替代位置的额外黑\n├─ 红兄弟 → 旋转转成黑兄弟\n├─ 黑兄弟且孩子全黑 → 兄弟染红，额外黑上移\n└─ 有红侄 → 必要时先旋兄弟，再旋父并变色','根染黑，黑高与红结点约束恢复')},s)
 const emit=(title,why,active=[])=>{if(!record)return;s.中序序列=inorder(root);t.add(title,why,binaryView(root===nil?null:root,active))}
 function rot(x,leftward){const y=leftward?x.right:x.left;if(leftward){x.right=y.left;if(y.left!==nil)y.left.parent=x;y.left=x}else{x.left=y.right;if(y.right!==nil)y.right.parent=x;y.right=x}y.parent=x.parent;if(x.parent===nil)root=y;else if(x===x.parent.left)x.parent.left=y;else x.parent.right=y;x.parent=y;emit(`${leftward?'左':'右'}旋 ${x.key}`,`新的局部根为 ${y.key}；旋转保留中序键序，颜色需按修复规则另行调整。`,[x.key,y.key])}
 function insert(k){const z={key:k,color:'R',left:nil,right:nil,parent:nil};let y=nil,x=root;while(x!==nil){y=x;x=k<x.key?x.left:x.right}z.parent=y;if(y===nil)root=z;else if(k<y.key)y.left=z;else y.right=z;emit(`插入红结点 ${k}`,'新点染红，先避免增加路径黑高；若父也红，需要修复。',[k]);x=z
  while(x.parent.color==='R'){const left=x.parent===x.parent.parent.left;let uncle=left?x.parent.parent.right:x.parent.parent.left;if(uncle.color==='R'){x.parent.color=uncle.color='B';x.parent.parent.color='R';x=x.parent.parent;emit('父、叔染黑，祖父染红','红红冲突向祖父方向上移，不立即保证根已黑。',[x.key])}else{if(x===(left?x.parent.right:x.parent.left)){x=x.parent;rot(x,left)}x.parent.color='B';x.parent.parent.color='R';emit('叔黑：父与祖父变色','直线型旋转祖父后恢复局部黑高。',[x.parent.key,x.parent.parent.key]);rot(x.parent.parent,!left)}}root.color='B';emit('本次插入修复完成','根重新染黑，红结点的孩子均为黑色。')
 }
 const transplant=(u,v)=>{if(u.parent===nil)root=v;else if(u===u.parent.left)u.parent.left=v;else u.parent.right=v;v.parent=u.parent}
 function remove(k){let z=root;while(z!==nil&&z.key!==k)z=k<z.key?z.left:z.right;let y=z,old=y.color,x
  if(z.left===nil){x=z.right;transplant(z,z.right)}else if(z.right===nil){x=z.left;transplant(z,z.left)}else{y=z.right;while(y.left!==nil)y=y.left;old=y.color;x=y.right;if(y.parent===z)x.parent=y;else{transplant(y,y.right);y.right=z.right;y.right.parent=y}transplant(z,y);y.left=z.left;y.left.parent=y;y.color=z.color}
  s.操作=`删除 ${k}，移走位置原色 ${old==='B'?'黑':'红'}`;emit('BST 删除完成，检查黑高','若移走的是黑结点，替代位置需要处理额外的黑。',[x.key])
  if(old==='B')while(x!==root&&x.color==='B'){
   const left=x===x.parent.left;let w=left?x.parent.right:x.parent.left
   if(w.color==='R'){w.color='B';x.parent.color='R';emit('红兄弟转黑兄弟','先交换父兄颜色，再旋转父结点。',[w.key,x.parent.key]);rot(x.parent,left);w=left?x.parent.right:x.parent.left}
   if(w.left.color==='B'&&w.right.color==='B'){if(w!==nil)w.color='R';x=x.parent;emit('黑兄弟与两个黑侄：向上合并额外黑','兄弟染红，额外黑移到父；父若原本为红，最后染黑即可。',[x.key])}
   else {const far=left?w.right:w.left,near=left?w.left:w.right;if(far.color==='B'){near.color='B';w.color='R';emit('远侄黑、近侄红：先旋兄弟','先转换成远侄为红的情况。',[w.key]);rot(w,!left);w=left?x.parent.right:x.parent.left}w.color=x.parent.color;x.parent.color='B';(left?w.right:w.left).color='B';emit('远侄红：旋父并消去额外黑','兄弟继承父色，父与远侄染黑。',[w.key,x.parent.key]);rot(x.parent,left);x=root}
  }x.color='B';root.color='B';emit('删除修复完成','最终重新满足红黑树约束。')
 }
 emit('初始空树','根尚不存在；每个空位置视为黑色 NIL。')
 if(name.startsWith('删除'))record=false
 for(const k of [7,3,18,10,22,8,11,26,2,6,13])insert(k)
 record=true;if(name.startsWith('删除')){emit('已构造初始红黑树','接下来只演示删除过程。');remove(name.includes('红叶')?13:8)}
 s.操作='完成';emit('结束',`中序 ${inorder(root).join(' → ')}；图中红／黑文字与填色同步。`);return t.finish()
}

export function bTree(name='插入与分裂'){
 let serial=0,root={id:String(serial++),keys:[],children:[]},record=name==='插入与分裂';const s={中序键:[],操作:'—'},t=recorder({title:'B 树 · '+name,intro:'四阶 B 树，每个结点最多 3 个关键字，非根至少 1 个；插入 10、20、5、6、12、30、7、17。',condition:'本例使用最小度 t=2 的四阶 B 树。插入前分裂满孩子；删除前补足只有 t−1 个键的孩子，属于合法的自顶向下方案。其他阶数或先溢出后分裂按题设执行。',flow:flow('在当前结点内定位关键字或下降分支','插入：满结点分裂，中间键上移\n删除：下行孩子键数不足则借位或合并','内部删除用前驱／后继替换；叶上删除目标','根为空且有孩子 → 唯一孩子成为新根；检查占用与叶层一致')},s)
 function keys(n){return n.keys.flatMap((k,i)=>[...(n.children[i]?keys(n.children[i]):[]),k]).concat(n.children[n.keys.length]?keys(n.children[n.keys.length]):[])}
 const emit=(title,why,active=[])=>{if(!record)return;s.中序键=keys(root);t.add(title,why,generalTree(root,active))}
 function split(p,i){const n=p.children[i],z={id:String(serial++),keys:n.keys.splice(2),children:n.children.length?n.children.splice(2):[]},mid=n.keys.pop();p.keys.splice(i,0,mid);p.children.splice(i+1,0,z);emit(`分裂满结点，中间键 ${mid} 上移`,'原结点与新结点分别保留两侧键；孩子指针同时按范围分开。',[p.id,n.id,z.id])}
 function insert(k){if(root.keys.length===3){root={id:String(serial++),keys:[],children:[root]};split(root,0)}let n=root;while(n.children.length){let i=0;while(i<n.keys.length&&k>n.keys[i])i++;if(n.children[i].keys.length===3){split(n,i);if(k>n.keys[i])i++}n=n.children[i]}n.keys.push(k);n.keys.sort((a,b)=>a-b);emit(`在叶结点插入 ${k}`,'保持结点内键递增；叶的层次不变。',[n.id])}
 function merge(p,i){const a=p.children[i],b=p.children[i+1],k=p.keys.splice(i,1)[0];a.keys.push(k,...b.keys);a.children.push(...b.children);p.children.splice(i+1,1);emit(`合并两个孩子与分隔键 ${k}`,'兄弟都无余量时合并；父关键字数减少 1。',[p.id,a.id]);return a}
 function del(n,k){let i=0;while(i<n.keys.length&&n.keys[i]<k)i++
  if(i<n.keys.length&&n.keys[i]===k){if(!n.children.length){n.keys.splice(i,1);emit(`从叶删除 ${k}`,'目标键移除。',[n.id]);return}if(n.children[i].keys.length>=2){let p=n.children[i];while(p.children.length)p=p.children.at(-1);const x=p.keys.at(-1);n.keys[i]=x;emit(`前驱 ${x} 替换 ${k}`,'随后在左孩子中删除原前驱。',[n.id]);del(n.children[i],x)}else if(n.children[i+1].keys.length>=2){let p=n.children[i+1];while(p.children.length)p=p.children[0];const x=p.keys[0];n.keys[i]=x;emit(`后继 ${x} 替换 ${k}`,'随后在右孩子中删除原后继。',[n.id]);del(n.children[i+1],x)}else del(merge(n,i),k);return}
  if(!n.children.length)return
  if(n.children[i].keys.length===1){const c=n.children[i],left=n.children[i-1],right=n.children[i+1];if(left&&left.keys.length>=2){c.keys.unshift(n.keys[i-1]);n.keys[i-1]=left.keys.pop();if(left.children.length)c.children.unshift(left.children.pop());emit('向左兄弟借位，经父键轮换','父分隔键下放到孩子，兄弟最大键上移；非叶还需迁移孩子指针。',[n.id,c.id,left.id])}else if(right&&right.keys.length>=2){c.keys.push(n.keys[i]);n.keys[i]=right.keys.shift();if(right.children.length)c.children.push(right.children.shift());emit('向右兄弟借位，经父键轮换','父分隔键下放，右兄弟最小键上移。',[n.id,c.id,right.id])}else if(right)merge(n,i);else{merge(n,i-1);i--}}
  del(n.children[i],k)
 }
 emit('初始空树','还没有关键字。');for(const k of [10,20,5,6,12,30,7,17])insert(k)
 record=true;if(name!=='插入与分裂')emit('初始四阶 B 树','各非根结点占用合法，所有叶同层。')
 if(name==='查找 17'){let n=root;while(n){let i=0;while(i<n.keys.length&&17>n.keys[i])i++;s.操作=`在 [${n.keys}] 定位`;emit(s.操作,i<n.keys.length&&n.keys[i]===17?'结点内命中 17，查找成功。':`进入第 ${i} 个孩子对应的键范围。`,[n.id]);if(n.keys[i]===17)break;n=n.children[i]}}
 if(name.startsWith('删除'))for(const k of [6,7,5,10,12,20,30,17]){del(root,k);if(!root.keys.length&&root.children.length){root=root.children[0];emit('根收缩','原根为空，仅剩一个孩子，树高降低一层。')}emit(`删除 ${k} 完成`,'进入下一次删除前，B 树重新满足占用要求。')}
 emit('结束',`剩余键：${keys(root).join('，')||'空树'}。`);return t.finish()
}
export function bPlus(){
 const leaves=[{id:'L',keys:[10,20],children:[],note:'叶 → 中叶'},{id:'M',keys:[30,40],children:[],note:'叶 → 右叶'},{id:'R',keys:[50,60],children:[],note:'叶 → 空'}],root={id:'root',keys:[20,40,60],children:leaves},s={范围:'[25,55]',结果:[],当前:'根索引'},t=recorder({title:'B+ 树 · 叶层范围扫描',intro:'采用子树最大键作索引的三阶 B+ 树，查找范围 [25,55]。根键 20、40、60；数据记录都在叶层。',condition:'对应大纲“B+ 树基本概念”；只展开查找与叶链扫描。上层命中索引也必须到叶层取记录，不新增插入／删除平衡细节。',flow:flow('沿索引定位下界所在叶','在叶中跳过小于下界的记录','沿叶链顺序扫描\n├─ 键≤上界 → 收集\n└─ 键>上界或叶链结束 → 停止')},s)
 const emit=(title,why,id)=>t.add(title,why,{...generalTree(root,[id]),rows:[row('范围内结果',s.结果)]})
 emit('从根索引定位','第一个不小于 25 的索引键是 40，进入中叶。','root');for(const leaf of leaves.slice(1)){s.当前=leaf.keys.join(',');for(const key of leaf.keys){if(key>55){emit(`遇到 ${key}>55，停止`,'后续叶记录不会更小，范围扫描结束。',leaf.id);return t.finish()}s.结果.push(key);emit(`读取叶记录 ${key}`,'数据来自叶层，沿叶链继续。',leaf.id)}}return t.finish()
}
export function forestConvert(){
 const original={id:'forest',label:'森林',children:[{id:'A',label:'A',children:[{id:'B',label:'B',children:[]},{id:'C',label:'C',children:[{id:'D',label:'D',children:[]}]}]},{id:'E',label:'E',children:[{id:'F',label:'F',children:[]}]}]},nodes=Object.fromEntries('ABCDEF'.split('').map(key=>[key,{key}])),s={规则:'左孩子、右兄弟',已转换:[]},t=recorder({title:'森林转二叉树 · 左孩子右兄弟',intro:'森林有两棵树：A 的孩子为 B、C，C 的孩子为 D；E 的孩子为 F。图中“森林”仅为显示用的虚拟根。',condition:'每个结点的左指针接第一个孩子，右指针接下一个兄弟；多棵树的根也按右兄弟相连。保留结点，不把虚拟根计入结果。',flow:flow('保留到第一个孩子的左链接','同一父结点的兄弟依次用右链接连接','各棵树的根按右链接连接','检查先根／先序以及后根／中序的对应关系')},s)
 t.add('原森林','先辨认父子关系和兄弟关系。',generalTree(original))
 for(const [a,side,b] of [['A','left','B'],['B','right','C'],['C','left','D'],['E','left','F'],['A','right','E']]){nodes[a][side]=nodes[b];s.已转换.push(`${a}.${side==='left'?'左':'右'}→${b}`);const children=new Set(Object.values(nodes).flatMap(n=>[n.left?.key,n.right?.key]).filter(Boolean)),roots=Object.values(nodes).filter(n=>!children.has(n.key)),parts=roots.map(n=>binaryView(n,[a,b]).tree),tree={binary:true,root:roots[0].key,roots:roots.map(n=>n.key),nodes:parts.flatMap(v=>v.nodes),active:[a,b]};t.add(`${a} 的${side==='left'?'左孩子':'右兄弟'}指向 ${b}`,'左边表示第一个孩子，右边表示下一个兄弟；尚未接入的结点仍列在图中。',{tree})}
 s.先根对应二叉先序='A→B→C→D→E→F';s.后根对应二叉中序='B→D→C→A→F→E';t.add('转换完成','森林先根序列对应转换后二叉树先序，森林后根序列对应二叉树中序。',binaryView(nodes.A));return t.finish()
}
