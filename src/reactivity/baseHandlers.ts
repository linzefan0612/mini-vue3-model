/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:30:25
 * @LastEditTime: 2022-03-17 12:27:30
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\baseHandlers.ts
 *
 */
import { ReactiveEnum } from ".";
import { track, trigger } from "./effect";

function createdGetter(isReadonly = false) {
  return function (target, key, receiver) {
    // 判断是否为reactive
    if (key === ReactiveEnum.IS_REACTIVE) {
      return !isReadonly;
    }
    // 判断是否为readonly
    if (key === ReactiveEnum.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key, receiver);
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

// 可变动的
export const mutableHandles = {
  get,
  set,
};

// 只读的
export const readonlyHandles = {
  get: readonlyGet,
  set(target, key, value, receiver) {
    // 给一个警告
    console.warn(`${key}是只读的，因为被readonly包裹了`, target);
    return true;
  },
};
