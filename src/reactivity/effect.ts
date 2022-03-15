/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:11:07
 * @LastEditTime: 2022-03-15 19:28:55
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\effect.ts
 *
 */

import { extend } from "../shared";

let activeEffect;
class Effect {
  // 所有Effect
  deps = [];
  active = true;
  onStop?: () => void;
  private _fn: any;
  // public scheduler?: Function | undefined;
  constructor(fn, public scheduler?: Function | undefined) {
    this._fn = fn;
  }

  // 运行
  run() {
    activeEffect = this;
    // 暴露调用return的值
    return this._fn();
  }

  // 清除当前依赖
  stop() {
    if (this.active) {
      cleanEffect(this);
      this.onStop && this.onStop();
      this.active = false;
    }
  }
}

function cleanEffect(effect) {
  effect.deps.forEach((dep: any) => {
    // 清除当前依赖
    dep.delete(effect);
  });
}

// 收集依赖
const targetMap = new Map(); // 存储所有依赖
export function track(target, key) {
  // 根据对象获取对应targetMap
  let depMap = targetMap.get(target);
  // 初始化的时候是空的，要手动new一个空的进去
  if (!depMap) {
    depMap = new Map();
    targetMap.set(target, depMap);
  }
  // 根据对应depMap获取对应的dep，并且添加当前实例
  let dep = depMap.get(key);
  // 初始化的时候是空的，要手动new一个空的进去
  if (!dep) {
    dep = new Set();
    depMap.set(key, dep);
  }
  if (!activeEffect) return;
  dep.add(activeEffect);
  // 保存当前dep实例
  activeEffect.deps.push(dep);
}
// 触发依赖
export function trigger(target, key) {
  let depMap = targetMap.get(target);
  let dep = depMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
      return;
    }
    effect.run();
  }
}

// 清除依赖
export function stop(runner) {
  runner.effect.stop();
}

// 执行依赖
export function effect(fn, options: any = {}) {
  const { scheduler, onStop } = options;
  const _effect = new Effect(fn, scheduler);
  _effect.run();
  // 讲options对象都添加到_effect实例
  extend(_effect, options);
  // 暴露effect，手动绑定this指向，否则外部的this就指向错误了
  const runner: any = _effect.run.bind(_effect);
  // 把当前effect存起来
  runner.effect = _effect;
  return runner;
}
