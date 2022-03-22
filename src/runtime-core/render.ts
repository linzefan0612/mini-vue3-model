/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-03-22 17:33:25
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */

import { isObject } from "../shared/index";
import { processComponent } from "./component";
import { processElement } from "./element";

export function render(vnode, container) {
  patch(vnode, container);
}

export function patch(vnode, container) {
  if (isObject(vnode.type)) {
    // 是一个Component
    processComponent(vnode, container);
  } else if (typeof vnode.type === "string") {
    // 是一个element
    processElement(vnode, container);
  }
}
