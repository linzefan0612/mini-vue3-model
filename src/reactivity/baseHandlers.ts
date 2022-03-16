/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:30:25
 * @LastEditTime: 2022-03-16 19:26:36
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\baseHandlers.ts
 *
 */
import { ReactiveEnum } from ".";
import { track, trigger } from "./effect";

function createdGetter(isReadonly = false) {
  return function (target, key, receiver) {
    if (key === ReactiveEnum.IS_REACTIVE) {
      return !isReadonly;
    }
    if (key === ReactiveEnum.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key, receiver);
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

const get = createdGetter();
const set = createdSetter();
const readonlyGet = createdGetter(true);

export const mutableHandles = {
  get,
  set,
};

export const readonlyHandles = {
  get: readonlyGet,
  set(target, key, value, receiver) {
    console.warn(`target:${target}是只读属性无法操作`, key);
    return true;
  },
};
