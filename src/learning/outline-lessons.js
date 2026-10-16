import * as ds from './ds-traces.js'
import * as trees from './tree-traces.js'
import * as extra from './ds-extra-traces.js'
import * as os from './os-traces.js'
import * as sync from './os-sync-traces.js'
import * as co from './co-traces.js'
import * as net from './net-traces.js'
import * as protocols from './net-protocol-traces.js'
import * as support from './support-traces.js'
import {dijkstra} from './graph-models.js'
// PDF page is the 1-based file page; printed page = PDF page + 3.
// "支撑方法" belongs to the stated broad syllabus item; it is not claimed as a separately named item.
const D='01-数据结构',C='02-计算机组成原理',O='03-操作系统',N='04-计算机网络'
const spec=(id,doc,heading,title,pages,outline,options,make,scope='算法／计算方法')=>({id,doc,heading,title,pages,outline,options,make,scope})
export const outlineLessons=[
 spec('linear-ops',D,'线性表的应用','线性表操作',[1],'线性表的实现与应用',['顺序表插入','顺序表删除','单链表插入','单链表逆置','有序表合并'],ds.linearOps,'支撑方法'),
 spec('stack-queue',D,'栈','栈与队列应用',[2],'栈、队列和数组的应用',['括号匹配','中缀转后缀','后缀表达式求值','循环队列'],ds.stackQueue,'支撑方法'),
 spec('matrix-address',D,'矩阵','数组与压缩矩阵定位',[2],'多维数组的存储、特殊矩阵的压缩存储',['二维数组行优先','二维数组列优先','下三角压缩存储','三对角压缩存储'],support.matrixAddress),
 spec('string-match',D,'第四章 串','BF／KMP 与失配表',[4],'字符串模式匹配',ds.stringNames,ds.stringMatch),
 spec('tree-walk',D,'树和二叉树','二叉树遍历',[2],'二叉树的遍历',['先序遍历','中序遍历','后序遍历','层序遍历'],ds.traversal),
 spec('thread-tree',D,'线索二叉树','中序线索化',[2],'线索二叉树的基本概念和构造',undefined,()=>ds.traversal('中序线索化')),
 spec('forest-convert',D,'树和森林','森林转换与遍历',[2],'森林与二叉树的转换；树和森林的遍历',undefined,trees.forestConvert),
 spec('huffman',D,'哈夫曼树','Huffman 编码与 WPL',[2],'哈夫曼树和哈夫曼编码',undefined,ds.huffman),
 spec('heap-ops',D,'堆及其应用','堆的建立、插入、删除',[3],'堆及其应用',['自底向上建堆','插入并上浮','删除堆顶'],ds.heapOperation),
 spec('union-find',D,'并查集及其应用','按大小合并与路径压缩',[2],'并查集及其应用',undefined,ds.unionFind),
 spec('graph-walk',D,'图的遍历','DFS／BFS',[3],'深度优先搜索、广度优先搜索',['DFS 深度优先','BFS 广度优先'],extra.graphWalk),
 spec('search',D,'线性查找','顺序／分块／折半查找',[3],'顺序查找法、分块查找法、折半查找法',ds.searchNames,ds.searching),
 spec('bst',D,'二叉搜索树','BST 查找、插入与删除',[4],'二叉搜索树',['查找与插入','删除：后继替换'],trees.bst),
 spec('avl',D,'平衡二叉树','AVL 四类旋转与删除调整',[4],'平衡二叉树',trees.avlNames,trees.avl),
 spec('red-black',D,'红黑树','红黑树插入、删除修复',[4],'红黑树',['插入：变色与旋转','删除：黑结点修复','删除：红叶'],trees.redBlack),
 spec('b-tree',D,'B树','B 树查找、分裂、借位合并',[4],'B 树及其基本操作',['插入与分裂','查找 17','删除：借位与合并'],trees.bTree),
 spec('b-plus',D,'B+树','B+ 树查找与范围扫描',[4],'B+ 树的基本概念',undefined,trees.bPlus,'概念对应过程'),
 spec('hash',D,'散列查找','散列冲突与查找',[4],'散列表',['线性探测','平方探测','拉链法'],extra.hashing),
 spec('sort',D,'内部排序','大纲九种内部排序',[4],'直接／折半插入、起泡、选择、希尔、快速、堆、二路归并、基数排序',ds.sortNames,ds.sorting),
 spec('external-sort',D,'外部排序','外部排序三种关键方法',[4],'外部排序',['多路归并与败者树','置换选择生成初始段','最佳归并树'],extra.externalSort,'支撑方法'),
 spec('number-conversion',C,'定点数的机器数转换','数制与原反补转换',[6],'进位计数制及其相互转换；定点数的编码表示',['整数除基取余','小数乘基取整','补码与真值'],co.numberConversion),
 spec('integer-arithmetic',C,'定点数的加减法','补码加减、标志与移位',[6],'加减运算、运算电路与标志逻辑；移位运算',['补码加法与标志','补码减法与借位','算术／逻辑／循环移位'],co.arithmetic),
 spec('multiply-divide',C,'定点数的移位乘除法','逐位乘除运算',[6],'移位运算、乘除运算及乘除运算电路的基本结构',co.multiplyNames,co.multiplyDivide),
 spec('float-code',C,'IEEE754浮点数','IEEE 754 编码',[6],'IEEE 754 标准',undefined,()=>co.floating('IEEE 754 编码')),
 spec('float-add',C,'浮点数的加减法','对阶、相加、规格化与舍入',[6],'浮点数的加减运算',['浮点数加法','最近偶数舍入'],co.floating),
 spec('memory-organization',C,'多模块存储器','交叉编址与存储芯片扩展',[7],'多模块存储器；主存储器与 CPU 的连接',['低位交叉编址','高位交叉编址','芯片字位扩展'],co.memoryOrganization),
 spec('cache',C,'Cache块的替换算法','Cache 映射、替换与写策略',[7],'Cache 映射、主存块替换、写策略',['直接映射','二路组相联 LRU','二路组相联 FIFO','全相联 LRU','二路组相联 LFU','二路组相联 RAND','写回＋写分配','全写＋非写分配'],co.cache),
 spec('co-address',C,'CPU访存全过程','TLB、页表与缺页',[7],'页式虚拟存储器；TLB',['TLB 命中','TLB 未命中、页表命中','缺页与重启'],co.addressTranslation),
 spec('addressing',C,'数据的寻址方式','六种数据寻址',[8],'指令寻址与数据寻址方式',['立即寻址','直接寻址','间接寻址','寄存器寻址','寄存器间接','基址／变址寻址','PC 相对寻址'],co.addressing),
 spec('machine-process',C,'程序的机器级表示','循环与过程调用',[8],'循环语句、过程调用的机器级表示',['循环的机器级执行','过程调用与返回'],support.instructionProcess,'执行过程'),
 spec('microprogram',C,'微程序控制器的工作过程','微地址顺序与分支',[8],'微程序控制器',undefined,()=>support.instructionProcess('微程序顺序与分支'),'执行过程'),
 spec('interrupt',C,'异常和中断的响应流程','中断响应与恢复现场',[8,9],'异常和中断的响应过程；处理过程',undefined,()=>support.instructionProcess('中断响应与返回'),'执行过程'),
 spec('dma',C,'DMA方式','DMA 地址、计数与完成中断',[10],'DMA 方式',undefined,()=>support.instructionProcess('DMA 块传送'),'执行过程'),
 spec('scheduling',O,'基础调度算法','CPU 调度九种策略',[11],'调度的基本准则与典型调度算法',os.scheduleNames,os.scheduling),
 spec('mutex',O,'互斥的软件实现','软件互斥与原子锁',[12],'实现临界区互斥的基本方法',sync.mutexNames,sync.mutex),
 spec('sync',O,'经典同步问题','信号量、前驱与经典同步',[12],'信号量、管程、经典同步问题',sync.syncNames,sync.synchronization),
 spec('banker-multi',O,'死锁的避免（银行家算法）','多资源试分配与回滚',[12],'死锁避免',['允许请求','不安全请求'],os.bankerMulti),
 spec('deadlock-detect',O,'死锁的检测（资源分配图）','当前请求与死锁化简',[12],'死锁检测与解除',['有死锁','可以化简'],os.deadlock),
 spec('partition',O,'动态分区分配—顺序搜索算法','四种动态分区分配与回收',[12],'连续分配管理方式',['首次适应 FF','循环首次适应 NF','最佳适应 BF','最坏适应 WF','回收与相邻合并'],os.partitionAllocation),
 spec('buddy',O,'动态分区分配—索引搜索算法','伙伴分配与合并',[12],'连续分配管理方式',undefined,os.buddy,'支撑方法'),
 spec('page-advanced',O,'页面置换','OPT 与增强 Clock',[13],'页面置换算法',['OPT 最佳置换','增强 Clock'],sync.advancedPages),
 spec('os-address',O,'基本分页','分页、分段、段页式、多级页表',[12,13],'分页、分段、段页式管理方式',['TLB 命中','TLB 未命中、页表命中','基本分段','分段越界','段页式','二级页表','缺页与重启'],co.addressTranslation),
 spec('file-access',O,'文件的物理结构','连续、链接与多级索引寻址',[13],'文件的物理结构',['连续分配','链接分配','直接索引','一级索引','二级索引'],os.fileAccess),
 spec('free-space',O,'外存空闲空间管理','位示图、空闲链、成组链接',[14],'外存空闲空间管理方法',['位示图','空闲链表','成组链接'],os.freeSpace),
 spec('buffer-management',O,'缓冲管理','双缓冲事件过程',[14],'缓冲区管理',undefined,support.bufferManagement,'支撑方法'),
 spec('cdma',N,'信道划分','CDMA 相关解码',[17],'码分多址',undefined,net.cdma),
 spec('framing',N,'封装成帧','比特填充与字节转义',[16],'封装成帧',['零比特填充','字节填充'],net.framing),
 spec('crc',N,'循环冗余校验码 CRC','CRC 模 2 除法',[16],'差错控制：纠错编码、检错编码',undefined,net.crc),
 spec('hamming',N,'海明校验码','海明码构造与纠错',[16],'差错控制：纠错编码',undefined,()=>net.errorCode('海明码单比特纠错')),
 spec('parity',N,'奇偶校验码','奇偶校验',[16],'差错控制：检错编码',undefined,()=>net.errorCode('奇偶校验')),
 spec('checksum',N,'UDP检验','反码求和与校验和',[19],'UDP 校验',undefined,net.checksum),
 spec('stop-wait',N,'停止等待协议 SW','停止等待与重复帧去重',[17],'停止－等待协议',undefined,protocols.stopWait),
 spec('csma-cd',N,'随机访问 CSMA/CD','ALOHA 与 CSMA/CD 退避',[17],'ALOHA、CSMA、CSMA/CD',['纯 ALOHA','时隙 ALOHA','CSMA/CD 二进制指数退避'],net.mediumAccess),
 spec('csma-ca',N,'随机访问 CSMA/CA','CSMA/CA 冻结与恢复退避',[17],'CSMA/CA',undefined,()=>net.mediumAccess('CSMA/CA 冻结与恢复')),
 spec('switch-learning',N,'自学习功能','交换机自学习与转发',[17],'以太网交换机及其工作原理',undefined,net.switchLearning),
 spec('subnet',N,'变长子网划分 CIDR','子网、VLSM、聚合与最长匹配',[18],'IPv4 地址与 CIDR；路由与转发',['定长子网划分','VLSM 变长子网','CIDR 路由聚合','最长前缀匹配'],net.subnet),
 spec('fragmentation',N,'IP分片','IP 分片与偏移',[18],'IPv4 分组',undefined,net.fragmentation),
 spec('rip',N,'路由信息协议 RIP','距离向量更新与慢收敛',[18,19],'距离向量路由算法；RIP',['距离向量更新','坏消息慢传播'],protocols.distanceVector),
 spec('ospf',N,'开放最短路径优先协议 OSPF','链路状态信息上的 Dijkstra',[18,19],'链路状态路由算法；OSPF',undefined,()=>{const l=dijkstra();return {...l,title:'OSPF 核心计算 · Dijkstra',intro:'假设链路状态数据库已同步，以下图表示同一区域内的抽象代价图；逐步求根路由器的最短路径。'+l.intro,condition:'本演示只展开最短路径树计算；LSA 泛洪、邻接建立、区域与路由类型选择仍看正文。'+l.condition}}),
 spec('bgp',N,'边界网关协议 BGP','路径向量与 AS 检环',[19],'BGP 的基本工作原理',undefined,protocols.bgp,'概念对应过程'),
 spec('tcp-window',N,'TCP可靠传输','TCP 累计 ACK、流控与重传',[20],'TCP 可靠传输、流量控制',['累计确认与快重传','零窗口与探测'],protocols.tcpWindow),
 spec('tcp-congestion',N,'TCP拥塞控制','慢开始、避免、快重传与快恢复',[20],'TCP 拥塞控制',['超时：慢开始重启','重复 ACK：快恢复'],protocols.tcpCongestion),
 spec('rto',N,'TCP可靠传输','RTT 平滑、RTO 与退避',[20],'TCP 可靠传输',undefined,protocols.rto,'支撑方法'),
 ...[['arp','IP地址解析 ARP','ARP 解析下一跳',18],['dhcp','IP地址分配 DHCP','DHCP 四步分配',18],['dns','递归查询和迭代查询','DNS 递归与迭代',20],['tcp-open','三次握手','TCP 三次握手',20],['tcp-close','四次挥手','TCP 四次挥手',20],['nat','网络地址转换 NAT','NAT 端口转换',18]].map(([id,heading,name,page])=>spec(id,N,heading,name,[page],name,undefined,()=>protocols.protocolProcess(name),'协议过程'))
]
