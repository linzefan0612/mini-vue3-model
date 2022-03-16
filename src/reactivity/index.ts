/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:08:22
 * @LastEditTime: 2022-03-16 18:50:48
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\index.ts
 *
 */

import { mutableHandles, readonlyHandles } from "./baseHandlers";

export function reactive(raw) {
  return createdBaseHandler(raw, mutableHandles);
}

export function readonly(raw) {
  return createdBaseHandler(raw, readonlyHandles);
}

function createdBaseHandler(raw, baseHandler) {
  return new Proxy(raw, baseHandler);
}
