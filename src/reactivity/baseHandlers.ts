/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:30:25
 * @LastEditTime: 2022-04-02 13:05:39
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
    /** 嵌套转换判断, 思考
     * 1. 如果shallow为true，那就不进行深度转换
     * 2. 没有被深度转换的,是一个普通对象,不会二次转换
     * 3. 即没有readonly深度拦截, 没有reactive的深度对象响应(没有被收集)
     */
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
const shallowReactiveGet = createdGetter(false, true);
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

export const shallowReactiveHandles = extend({}, mutableHandles, {
  get: shallowReactiveGet,
});
