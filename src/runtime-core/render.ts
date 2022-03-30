/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-03-30 22:06:37
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
  patch(vnode, container);
}

export function patch(vnode, container) {
  if (!vnode) return;
  const { type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case TextNode:
      processTextNode(vnode, container);
      break;

    default:
      if (isObject(type)) {
        // 是一个Component
        processComponent(vnode, container);
      } else if (typeof type === "string") {
        // 是一个element
        processElement(vnode, container);
      }
      break;
  }
}


