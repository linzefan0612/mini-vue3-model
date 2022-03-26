/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-03-26 10:17:50
 * @LastEditors: Lin zefan
 * @Description: 公用hook
 * @FilePath: \mini-vue3\src\shared\index.ts
 *
 */

export const extend = Object.assign;

export function isObject(obj) {
  return obj !== null && typeof obj === "object";
}

export function hasChanged(val, newVal) {
  return Object.is(val, newVal);
}

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}
