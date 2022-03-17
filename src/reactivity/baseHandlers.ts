/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:30:25
 * @LastEditTime: 2022-03-17 17:44:46
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\baseHandlers.ts
 *
 */
import { reactive, ReactiveEnum, readonly } from ".";
import { extend, isObject } from "../shared";
import { track, trigger } from "./effect";

function createdGetter(isReadonly = false, shallow = false) {
  return function (target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    // 判断是否为reactive
    if (key === ReactiveEnum.IS_REACTIVE) {
      return !isReadonly;
    }
    // 判断是否为readonly
    if (key === ReactiveEnum.IS_READONLY) {
      return isReadonly;
    }
    // 嵌套判断
    if (isObject(res) && !shallow) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    // 如果是readonly，不会进行收集
    !isReadonly && track(target, key);

    return res;
  };
}

function createdSetter() {
  return function (target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver);
    trigger(target, key);
    return res;
  };
}

// 避免多次创建，这里直接用变量接收~
const get = createdGetter();
const set = createdSetter();
const readonlyGet = createdGetter(true);
const shallowReadonlyGet = createdGetter(true, true);

export const mutableHandles = {
  get,
  set,
};

export const readonlyHandles = {
  get: readonlyGet,
  set(target, key, value, receiver) {
    // 给一个警告
    console.warn(`${key}是只读的，因为被readonly包裹了`, target);
    return true;
  },
};

export const shallowReadonlyHandles = extend({}, readonlyHandles, {
  get: shallowReadonlyGet,
});
