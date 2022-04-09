/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-04-09 10:57:05
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */

import { isNumber } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";

export const TextNode = Symbol("TextNode");
export const Fragment = Symbol("Fragment");

/**
 * @description: 转换根组件为vnode
 * @param {*} type 根组件(App)
 * @param {*} props 组件的props
 * @param {*} children 组件嵌套的子组件
 * @return {vnode}
 */
export function createdVNode(type, props?, children?) {
  // 将根组件转换为vnode，再将其暴露
  const vnode = {
    type,
    props,
    children,
    key: props?.key,
  };

  return vnode;
}

// 创建一个textNode节点
export function createTextVNode(text) {
  return createdVNode(TextNode, {}, text);
}

export function getShapeFlags(type) {
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.COMPONENT;
}
export function getChildrenShapeFlags(children) {
  return typeof children === "string" || isNumber(children)
    ? ShapeFlags.TEXT_CHILDREN
    : typeof children === "object"
    ? ShapeFlags.ARRAY_CHILDREN
    : "";
}
