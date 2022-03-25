/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 17:32:00
 * @LastEditTime: 2022-03-25 20:30:08
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
    const val = props[key];
    /** 注册事件
     * 1. 判断是否on开头并包含一个大写字母开头
     * 2. 是的话，截取on后面的内容
     * 3. 注册元素事件
     */
    if (isEvents(key)) {
      el.addEventListener(isEvents(key), val);
    } else {
      el.setAttribute(key, val);
    }
  }
  // 设置元素内容
  mountChildren(children, el, container);
}
function isEvents(key: string = "") {
  const reg = /^on[A-Z]/;
  if (reg.test(key)) {
    // onClick -> click
    return key.slice(2).toLocaleLowerCase();
  }
  return "";
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
