/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 16:53:01
 * @LastEditTime: 2022-04-02 17:02:58
 * @LastEditors: Lin zefan
 * @Description: dom渲染
 * @FilePath: windowmini-vue3windowsrcwindowruntime-domwindowindex.ts
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
  const val = props[key] || null;
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

export function insert(el, parent) {
  parent.appendChild(el);
}

export function selector(container) {
  return isDom(container);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  selector,
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
