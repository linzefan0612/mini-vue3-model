<!--
 * @Author: Lin zefan
 * @Date: 2022-03-15 14:38:12
 * @LastEditTime: 2022-04-16 23:11:18
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\README.md
 *
-->
<!-- [CN](README.md) / [EN](README_EN.md) -->

# How

基于 vue3 源码实现一个 TDD mini 版的 vue<br>

参考项目: [mini-vue](https://github.com/cuixiaorui/mini-vue) <br>

实现过程记录：[传送门](https://juejin.cn/column/6975739941984665630)

## Tasking

### runtime-core

- [x] 支持组件类型
- [x] 支持 element 类型
- [x] 初始化 props
- [x] setup 可获取 props 和 context
- [x] 支持 component emit
- [x] 支持 proxy
- [x] 可以在 render 函数中获取 setup 返回的对象
- [x] nextTick 的实现
- [x] 支持 getCurrentInstance
- [x] 支持 provide/inject
- [x] 支持最基础的 slots
- [x] 支持 Text 类型节点
- [x] 支持 $el api

### reactivity

目标是用自己的 reactivity 支持现有的 demo 运行

- [x] reactive 的实现
- [x] ref 的实现
- [x] readonly 的实现
- [x] computed 的实现
- [x] track 依赖收集
- [x] trigger 触发依赖
- [x] 支持 isReactive
- [x] 支持嵌套 reactive
- [ ] 支持 toRaw
- [x] 支持 effect.scheduler
- [x] 支持 effect.stop
- [x] 支持 isReadonly
- [x] 支持 isProxy
- [x] 支持 shallowReadonly
- [x] 支持 shallowReactive
- [x] 支持 proxyRefs

### compiler-core

- [x] 解析插值
- [x] 解析 element
- [x] 解析 text

### runtime-dom

- [x] 支持 custom renderer
