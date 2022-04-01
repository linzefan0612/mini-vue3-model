/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-04-01 15:33:08
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */

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
    // shapeFlags: getShapeFlags(type),
  };
  // 还要对于 children 进行处理
  // if (typeof children === "string") {
  //   // 或运算符，vnode.shapeFlags | ShapeFlags.TEXT_CHILDREN
  //   // 这里其实非常巧妙，例如我们现在是 0001，0001 | 0100 = 0101
  //   vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
  // } else if (Array.isArray(children)) {
  //   // 这里也是同理
  //   vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
  // }
  return vnode;
}

// 创建一个textNode节点
export function createTextVNode(text) {
  return createdVNode(TextNode, {}, text);
}

// export function getShapeFlags(type) {
//   return typeof type === "string"
//     ? ShapeFlags.ELEMENT
//     : ShapeFlags.STATEFUL_COMPONENT;
// }
export function getShapeFlags(type) {
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.COMPONENT;
}
export function getChildrenShapeFlags(children) {
  return typeof children === "string"
    ? ShapeFlags.TEXT_CHILDREN
    : ShapeFlags.ARRAY_CHILDREN;
}
