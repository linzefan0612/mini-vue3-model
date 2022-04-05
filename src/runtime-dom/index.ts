/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 16:53:01
 * @LastEditTime: 2022-04-05 13:22:20
 * @LastEditors: Lin ZeFan
 * @Description: dom渲染
 * @FilePath: \mini-vue3\src\runtime-dom\index.ts
 *
 */

import { createRenderer } from "../runtime-core/render";
import { isDom } from "../shared/index";

export function createElement(type) {
  return document.createElement(type);
}

const isEvents = (key: string = "") => {
  const reg = /^on[A-Z]/;
  if (reg.test(key)) {
    // onClick -> click
    return key.slice(2).toLocaleLowerCase();
  }
  return "";
};

export function patchProp(el, key, props) {
  const val = (props && props[key]) || null;
  /** 注册事件
   * 1. 判断是否on开头并包含一个大写字母开头
   * 2. 是的话，截取on后面的内容
   * 3. 注册元素事件
   */
  if (isEvents(key)) {
    el.addEventListener(isEvents(key), val);
  } else {
    // 如果当前的值是空的，那要把对应的行内属性删除
    if (val === undefined || val === null) {
      el.removeAttribute(key);
      return;
    }
    el.setAttribute(key, val);
  }
}

export function insert(el, parent, anchor) {
  /** 根据锚点插入到对应位置
   * 1. anchor为null默认插到尾部
   * 2. anchor不为空，则插到anchor对应的元素之前
   */
  parent.insertBefore(el, anchor || null);
}

export function selector(container) {
  return isDom(container);
}

export function setElementText(el, text) {
  el.textContent = text;
}

export function remove(child) {
  const parentNode = child.parentNode;
  parentNode && parentNode.removeChild(child);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  selector,
  setElementText,
  remove,
});

/**
 * 暴露 createApp，这个方法就是创建vue实例的方法
 * @param args 当前的根节点，一般是App.js
 */
export const createApp = (...args) => {
  return renderer.createApp(...args);
};

// runtime-core是底层逻辑，放到这边暴露出去
export * from "../runtime-core/index";
