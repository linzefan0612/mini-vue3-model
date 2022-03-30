/*
 * @Author: Lin zefan
 * @Date: 2022-03-27 12:03:47
 * @LastEditTime: 2022-03-30 21:45:42
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\helpers\renderSlots.ts
 *
 */

import { createdVNode, Fragment } from "../vnode";

export function renderSlots(slots, name = "default", props = {}) {
  /** 返回一个vnode
   * 1. 其本质和 h 是一样的
   * 2. 通过name取到对应的slots
   */
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function") {
      // 是一个函数，需要调用函数，并把当前作用域插槽的数据传过去，把调用结果渲染处理
      return createdVNode(Fragment, {}, slot(props));
    }
    // 不是函数，是h对象，或者h对象数组集合
    return createdVNode(Fragment, {}, slot);
  } else {
    return console.warn("没有找到对应的插槽");
  }
}
