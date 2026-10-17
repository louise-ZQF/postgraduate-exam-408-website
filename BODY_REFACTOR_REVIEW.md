# 正文结构重构

四科知识正文和三份错题补充统一拆开混杂长段：先保留定义，独立规则分条，步骤沿用编号列表，比较用表，算例与概念分开。具体调整数量见 BODY_REFACTOR_REVIEW.json；这份记录表示结构调整，不表示所有段落都已重新撰写。

RIP、OSPF、ICMP 和死锁概念/预防共 19 个原始单元另行重写，补充工作原因、条件解释与对照表；其他单元通过基线检查确认事实、代码、公式及原始锚点未丢失。题库题干、选项与答案不作批量改写。

格式参考：https://liangbohan.github.io/postgraduate-exam-website/#/knowledge/operating-systems/os-section-deadlock

协议核对来源：RIP https://www.rfc-editor.org/rfc/rfc2453 ，OSPF https://www.rfc-editor.org/rfc/rfc2328 ，ICMP https://www.rfc-editor.org/rfc/rfc792 。参考页只用于研究讲解层级，不直接复制其正文；死锁检测仍使用当前请求可满足性，不能用已分配量代替当前请求量。
