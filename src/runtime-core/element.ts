/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 17:32:00
 * @LastEditTime: 2022-04-01 11:30:00
 * @LastEditors: Lin zefan
 * @Description: 处理dom
 * @FilePath: \mini-vue3\src\runtime-core\element.ts
 *
 */

import { patch } from "./render";

// ---------------------Element创建流程----------------------
export function processElement(vnode, container, parentComponent) {
  mountElement(vnode, container, parentComponent);
}
function isEvents(key: string = "") {
  const reg = /^on[A-Z]/;
  if (reg.test(key)) {
    // onClick -> click
    return key.slice(2).toLocaleLowerCase();
  }
  return "";
}

function mountElement(vnode, container, parentComponent) {
  const { type, props, children } = vnode;
  // 创建根元素、将dom元素挂载到实例
  const el = (vnode.$el = document.createElement(type));
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

  // 设置children
  if (typeof children === "string") {
    el.textContent = children;
    // 数组，可能存在多个子元素
  } else if (Array.isArray(children)) {
    mountChildren(children, el, parentComponent);
  }

  container.append(el);
}

function mountChildren(children, container, parentComponent) {
  children.forEach((h) => {
    patch(h, container, parentComponent);
  });
}

// 创建一个Fragment节点
export function processFragment(vnode: any, container: any, parentComponent) {
  mountChildren(vnode.children, container, parentComponent);
}

// 创建一个TextNode节点
export function processTextNode(vnode: any, container: any) {
  const textNode = document.createTextNode(vnode.children);
  container.append(textNode);
}
