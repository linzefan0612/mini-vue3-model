/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 16:22:33
 * @LastEditTime: 2022-03-31 18:35:07
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\index.ts
 *
 */

export * from "./createdApp";
export { h } from "./h";
export { renderSlots } from "./helpers/renderSlots";
export { createTextVNode } from "./vnode";
export { getCurrentInstance } from "./component";
export { provide, inject } from "./apiInject";
