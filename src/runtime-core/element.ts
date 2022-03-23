/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 17:32:00
 * @LastEditTime: 2022-03-23 17:33:15
 * @LastEditors: Lin zefan
 * @Description: 处理dom
 * @FilePath: \mini-vue3\src\runtime-core\element.ts
 *
 */

import { patch } from "./render";

// ---------------------Element创建流程----------------------
export function processElement(vnode, container) {
  const { type, props, children } = vnode;
  // 创建根元素
  const el = document.createElement(type);
  // 将dom元素挂载到实例
  vnode.$el = el;
  // 设置行内属性
  for (const key in props) {
    el.setAttribute(key, props[key]);
  }
  // 设置元素内容
  mountChildren(children, el, container);
}
function mountChildren(children, el, container) {
  // 普通字符串，就直接插入元素
  if (typeof children === "string") {
    el.textContent = children;
    // 数组，可能存在多个子元素
  } else if (Array.isArray(children)) {
    children.forEach((h) => {
      patch(h, el);
    });
  }
  container.append(el);
}
