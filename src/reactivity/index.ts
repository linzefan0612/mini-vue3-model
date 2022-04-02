/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:08:22
 * @LastEditTime: 2022-04-02 13:05:11
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\index.ts
 *
 */
import { isObject } from "../shared/index";
import {
  mutableHandles,
  readonlyHandles,
  shallowReadonlyHandles,
  shallowReactiveHandles,
} from "./baseHandlers";

export const enum ReactiveEnum {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

function createdBaseHandler(raw, baseHandler) {
  if (!isObject(raw)) {
    console.warn(`Proxy的代理必须是一个对象，${raw}不是一个对象`);
  }
  return new Proxy(raw, baseHandler);
}

export function reactive(raw) {
  return createdBaseHandler(raw, mutableHandles);
}

export function readonly(raw) {
  return createdBaseHandler(raw, readonlyHandles);
}

export function shallowReactive(raw) {
  return createdBaseHandler(raw, shallowReactiveHandles);
}

export function shallowReadonly(raw) {
  return createdBaseHandler(raw, shallowReadonlyHandles);
}

export function isReadonly(raw) {
  // 双取反是为了兼容返回undefined
  return !!raw[ReactiveEnum.IS_READONLY];
}

export function isReactive(raw) {
  // 双取反是为了兼容返回undefined
  return !!raw[ReactiveEnum.IS_REACTIVE];
}

export function isProxy(raw) {
  // 双取反是为了兼容返回undefined
  return isReadonly(raw) || isReactive(raw);
}
