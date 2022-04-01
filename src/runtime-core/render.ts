/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-01 11:45:44
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */

import { isObject } from "../shared/index";
import { processComponent } from "./component";
import { processElement, processFragment, processTextNode } from "./element";
import { Fragment, TextNode } from "./vnode";

export function render(vnode, container) {
  // 根组件没有父级，所以是null
  patch(vnode, container, null);
}

export function patch(vnode, container, parentComponent) {
  if (!vnode) return;
  const { type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    case TextNode:
      processTextNode(vnode, container);
      break;

    default:
      if (isObject(type)) {
        // 是一个Component
        processComponent(vnode, container, parentComponent);
      } else if (typeof type === "string") {
        // 是一个element
        processElement(vnode, container, parentComponent);
      }
      break;
  }
}
