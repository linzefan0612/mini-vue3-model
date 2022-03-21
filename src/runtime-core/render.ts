/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-03-21 22:10:06
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */

import { processComponent } from "./component";

export function render(vnode, container) {
  // 调用patch方法，里面会判断vnode类型
  patch(vnode, container);
}

export function patch(vnode, container) {
  // TODO，先处理Component类型，Element类型稍后做
  processComponent(vnode, container);
}
