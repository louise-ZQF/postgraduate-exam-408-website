# 408 内容恢复与纠错记录

2026-10-03：按照用户的最新要求，撤销对四科知识讲解的整章精简与改写，恢复至大幅删减之前的 a080ca0 版本。原来的完整讲解、长表格、步骤、代码、配图和动图均已恢复，只在已确认错误的具体位置修改句子、数值或公式，不以更换总结为理由删除其他内容。

知识体系页面只呈现知识讲解；原先嵌入的 189 个练习题移至“小题”中的知识配套题目，题型搜索仍独立区分选择题与综合题。题目正文、选项及资料已有答案保留，旧题目链接与收藏转向新位置。原有 361 个知识标题对应的定位 ID 保留，题型资料与自有错题补充保留。

原文与恢复稿已逐份比较：去除定位标记和空白后，四科非题目正文与 a080ca0 原文应用已记录的纠错后的文本完全一致；没有另外删减或替换正确内容。具体的局部改动逐项列在 [CONTENT_CORRECTIONS.json](./CONTENT_CORRECTIONS.json)。恢复后共引用 487 份图片素材，页面保留图片与动图的原内容；配图可打开原图查看。

## 保留的纠错范围

主要纠正倍增循环从0开始、三角循环次数、顺序表按值与按序号查询、循环单链表头部操作、2012中缀题括号、Prim/Floyd步骤、AVL旋转方向及希尔/快排复杂度条件；计组中纠正字长与总线宽度的混同、移码偏置条件、补码全1的整数/小数区别、IEEE下溢、Cache策略的绝对化、MMU职责、NEG/MUL形式、超标量CPI和总线频率计算；操作系统中纠正线程模型、等待时间、Peterson条件、筷子下标、信号量负值、连续分配与装入的混同、页表项地址、文件映射与删除时机；计网中纠正CRC“未检错”与“无错”的混同、私网地址、广播域、DHCPv6、RIP更新、FTP端口、HTTP连接性、FIN与拥塞窗口增长，以及错贴到HTTP题后的解析。各处保留原来的表格和上下文，只修改错误部分。

自有错题补充此前只修改了条件缺失和等待时间定义，这些纠错继续保留。未核验的题目答案仍标注待复核；本次没有以“所有题目有答案”代替逐题核验，也没有重新判定所有图题。

## 已核对的主要依据

AVL方向参考 [Cornell AVL讲义](https://www.cs.cornell.edu/courses/cs312/2008sp/lectures/lec_avl.html)，排序和最短路参考 [Princeton Algorithms](https://algs4.cs.princeton.edu/cheatsheet/)与[最短路章节](https://algs4.cs.princeton.edu/44sp/)；2012中缀题对照[新余学院提供的原卷](https://www.xit.edu.cn/_upload/article/files/c1/ce/26986f79493495bbaacba9738587/aa16fad1-1b4a-443d-8371-f1ca40cfaf76.pdf)。

浮点下溢参考 [Oracle数值计算文档](https://docs.oracle.com/cd/E37069_01/html/E39019/z4000ac019677.html)，指令语义参考 [Intel指令手册 Volume 2](https://cdrdv2-public.intel.com/774492/325383-sdm-vol-2abcd.pdf)，RISC长度条件参考 [RISC-V规范](https://docs.riscv.org/reference/isa/v20240411/unpriv/intro.html)。死锁安全性与检测参考 [Cornell CS4410讲义](https://www.cs.cornell.edu/courses/cs4410/2011su/slides/lecture10.pdf)与[UIC死锁讲义](https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/7_Deadlocks.html)，文件删除语义参考 [Linux unlink手册](https://man7.org/linux/man-pages/man2/unlink.2.html)。

TCP与FIN参考 [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)，经典拥塞控制参考 [RFC 5681](https://www.rfc-editor.org/rfc/rfc5681.html)，DHCP参考 [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131.html)。这些来源用于此前已经查证的具体纠错，没有用新网站的总结整体替换原文。

## 来源

原资料来自 [yyx-dev/yyx-dev.github.io](https://github.com/yyx-dev/yyx-dev.github.io/tree/325bdaa/docs/408)，另包含用户自有错题整理。此前审查曾参考 [liangbohan/postgraduate-exam-website及贡献者](https://github.com/liangbohan/postgraduate-exam-website/tree/f22f7e431b3afc876e6d198d94cf7f8ce3ec26de)，其知识内容采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本次恢复原讲解，撤销整章替换，保留已确认的纠错与来源记录。
