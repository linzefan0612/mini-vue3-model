/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:08:22
 * @LastEditTime: 2022-03-17 11:10:26
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\index.ts
 *
 */
import { mutableHandles, readonlyHandles } from "./baseHandlers";

export const enum ReactiveEnum {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

function createdBaseHandler(raw, baseHandler) {
  return new Proxy(raw, baseHandler);
}

export function reactive(raw) {
  return createdBaseHandler(raw, mutableHandles);
}

export function readonly(raw) {
  return createdBaseHandler(raw, readonlyHandles);
}

export function isReadonly(raw) {
  // 双取反是为了兼容返回undefined
  return !!raw[ReactiveEnum.IS_READONLY];
}

export function isReactive(raw) {
  // 双取反是为了兼容返回undefined
  return !!raw[ReactiveEnum.IS_REACTIVE];
}
