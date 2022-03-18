/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:11:07
 * @LastEditTime: 2022-03-18 18:20:17
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\effect.ts
 *
 */

import { extend } from "../shared";

// 当前活跃的effect实例
let activeEffect;
// 判断是否需要收集
let shouldTrack;
export class Effect {
  private _fn: any;
  scheduler?: Function | undefined;
  stopFlag = false;
  onStop?: () => void;
  // 收集所有的dep
  depMap = [];

  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  // 执行effect接收的fn
  run() {
    // 如果执行了stop，不会继续进行收集。
    if (this.stopFlag) {
      return this._fn();
    }
    // 保存当前实例，给track收集
    activeEffect = this;
    // 初始化收集状态
    shouldTrack = true;
    const result = this._fn();
    /** 看得见的思考
     * 1. fn调用(track)后，重置收集状态
     * 2. 避免下一轮fn(track的时候)，如果shouldTrack为true，还会被收集进去
     * 3. track内部判断了shouldTrack，所以要在track后重置收集状态
     */

    shouldTrack = false;
    return result;
  }

  /** 清除当前effect
   * 1. 把所有的dep存起来，再从dep中清除当前的effect
   * 2. 把当前effect从对应的dep中删除，触发依赖的时候就遍历不到该数据
   */
  stop() {
    this.onStop && this.onStop();
    // 避免多次调用
    if (!this.stopFlag) {
      cleanEffect(this);
      this.stopFlag = true;
    }
  }
}

function cleanEffect(effect) {
  effect.depMap.forEach((effects: any) => {
    effects.delete(effect);
  });
  effect.depMap.length = 0;
}

export function stop(runner) {
  runner.effect.stop();
}

export function isTracking() {
  // shouldTrack为true并且当前实例不为undefined，就会进行依赖收集
  return shouldTrack && activeEffect !== undefined;
}
// 收集依赖
const targetMap = new Map(); // 所有的依赖，触发依赖的时候会从这里面取
export function track(target, key) {
  if (!isTracking()) return;
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
  // 提取了收集函数
  trackEffect(dep);
}
export function trackEffect(dep) {
  // 收集当前不存在的实例
  !dep.has(activeEffect) && dep.add(activeEffect);
  // 收集当前的dep
  activeEffect.depMap.push(dep);
}

// 触发依赖
export function trigger(target, key) {
  let depMap = targetMap.get(target);
  let dep = depMap.get(key);
  triggerEffect(dep);
}
export function triggerEffect(dep) {
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
