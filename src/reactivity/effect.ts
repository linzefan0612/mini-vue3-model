/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:11:07
 * @LastEditTime: 2022-03-16 17:28:07
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\effect.ts
 *
 */

import { extend } from "../shared";

// 当前活跃的effect实例
let activeEffect;
class Effect {
  private _fn: any;
  scheduler?: Function | undefined;
  stopFlag = true;
  onStop?: () => void;
  // 收集所有的dep
  depMap = [];
  constructor(fn) {
    this._fn = fn;
  }

  // 执行effect接收的fn
  run() {
    activeEffect = this;
    // return 执行结果
    return this._fn();
  }

  /** 清除当前effect
   * 1. 把所有的dep存起来，再从dep中清除当前的effect
   * 2. 把当前effect从对应的dep中删除，触发依赖的时候就遍历不到该数据
   */
  stop() {
    this.onStop && this.onStop();
    // 避免多次调用
    if (this.stopFlag) {
      cleanEffect(this);
    }
  }
}

function cleanEffect(effect) {
  effect.depMap.forEach((effects: any) => {
    effects.delete(effect);
  });
  effect.stopFlag = false;
}

export function stop(runner) {
  runner.effect.stop();
}

// 收集依赖
const targetMap = new Map(); // 所有的依赖，触发依赖的时候会从这里面取
export function track(target, key) {
  let depMap = targetMap.get(target);
  if (!depMap) {
    depMap = new Map();
    targetMap.set(target, depMap);
  }
  let dep = depMap.get(key);
  if (!dep) {
    dep = new Set();
    depMap.set(key, dep);
  }
  dep.add(activeEffect);
  // 收集当前的dep
  activeEffect.depMap.push(dep);
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

export function effect(fn, option: any = {}) {
  const _effect = new Effect(fn);
  // 初始化执行
  _effect.run();
  
  // 添加所有option属性
  extend(_effect, option);

  // 实现runner
  const runner: any = _effect.run.bind(_effect);
  // 把当前effect实例加到runner
  runner.effect = _effect;
  return runner;
}
