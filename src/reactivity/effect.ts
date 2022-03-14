/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 19:59:06
 * @LastEditTime: 2022-03-14 20:55:01
 * @LastEditors: Lin zefan
 * @Description: effect
 * @FilePath: \mini-vue3\src\reactivity\effect.ts
 *
 */

// 当前的实例
let activeEffect;
class Effect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}

// 收集依赖
const targetMaps = new Map();
export function track(target, key) {
  // 获取当前操作的target合集，初始化没有，set一个默认的进去
  let depsMap = targetMaps.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMaps.set(target, depsMap);
  }
  // 获取当前操作的
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

// 触发依赖
export function trigger(target, key) {
  // 获取当前操作的dep，遍历执行
  let depsMap = targetMaps.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}

export function effect(fn) {
  const _effect = new Effect(fn);
  _effect.run();
}
