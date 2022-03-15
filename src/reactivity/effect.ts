/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:11:07
 * @LastEditTime: 2022-03-15 16:25:00
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\effect.ts
 *
 */

let activeEffect;
class Effect {
  // 声明私有_fn变量
  private _fn: any;
  // public scheduler 声明了一个公共的scheduler
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  // 运行
  run() {
    activeEffect = this;
    // 暴露调用return的值
    return this._fn();
  }
}

// 收集依赖

// 存储所有依赖
const targetMap = new Map();
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
  dep.add(activeEffect);
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

// 执行依赖
export function effect(fn, options: any = {}) {
  const { scheduler } = options;
  const _effect = new Effect(fn, scheduler);
  _effect.run();
  // 暴露effect，手动绑定this指向，否则外部的this就指向错误了
  return _effect.run.bind(_effect);
}
