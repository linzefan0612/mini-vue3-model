/*
 * @Author: Lin zefan
 * @Date: 2022-03-17 18:23:36
 * @LastEditTime: 2022-03-17 19:04:00
 * @LastEditors: Lin zefan
 * @Description: ref
 * @FilePath: \mini-vue3\src\reactivity\ref.ts
 *
 */

import { reactive } from ".";
import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffect, triggerEffect } from "./effect";

class RefIpl {
  private _value: any;
  dep: Set<unknown>;
  private _rawValue: any;
  constructor(value) {
    this._value = convert(value);
    this._rawValue = value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    // 如果是对象，用reactive包裹，否则直接返回
    return this._value;
  }
  set value(newValue) {
    // 判等，若相等不更新
    if (hasChanged(this._rawValue, newValue)) return;
    // 更新固定值
    this._rawValue = newValue;
    // 更新value
    this._value = convert(newValue);
    triggerEffect(this.dep);
  }
}
function trackRefValue(ref) {
  isTracking() && trackEffect(ref.dep);
}
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefIpl(value);
}
