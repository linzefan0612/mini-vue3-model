/*
 * @Author: Lin zefan
 * @Date: 2022-03-17 18:23:36
 * @LastEditTime: 2022-04-20 21:02:47
 * @LastEditors: Lin ZeFan
 * @Description: ref
 * @FilePath: \mini-vue3\src\reactivity\ref.ts
 *
 */
import { reactive } from "./reactive";
import { isObject, hasChanged } from "../shared";
import { isTracking, trackEffect, triggerEffect } from "./effect";

class RefImpl {
  _dep: any;
  private _value: any;
  // ref对象标识
  __v_isRef = true;
  constructor(value) {
    /**
     * 1. 需要判断value是基本类型还是引用类型
     * 2. 引用类型需要用reactive包裹，做到深度侦听
     */
    this._value = convert(value);
    this._dep = new Set();
  }

  get value() {
    /** 思考
     * 1. get要收集依赖
     */
    isTracking() && trackEffect(this._dep);
    return this._value;
  }

  set value(newVal) {
    /** 思考
     * 1. 先判断新老值，值不相等再做更新
     * 2. 更新ref.value
     * 3. 更新依赖的值
     */

    if (hasChanged(this._value, newVal)) return;
    this._value = convert(newVal);
    triggerEffect(this._dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(ref) {
  return new RefImpl(ref);
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(ref) {
  return new Proxy(ref, {
    get(target, key) {
      // 需要判断target是ref对象还是其他，ref帮忙提取.value
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      /** 思考
       * 1. 新老值对比，如果老值是ref，新值不是，那应该是更新老值的.value
       * 2. 如果新值是ref，直接替换即可
       */
      if (isRef(target[key]) && !isRef(value)) {
        target[key].value = value;
        return target;
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
