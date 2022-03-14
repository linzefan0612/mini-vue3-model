/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:31:42
 * @LastEditTime: 2022-03-14 21:01:16
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\index.ts
 *
 */

import { track, trigger } from "./effect";

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      // 先设置，再收集依赖
      const res = Reflect.get(target, key, receiver);
      track(target, key);
      return res;
    },
    set(target, key, value, receiver) {
      // 先更新，再触发依赖
      const res = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return res;
    },
  });
}
