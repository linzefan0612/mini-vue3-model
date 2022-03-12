/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 11:11:39
 * @LastEditTime: 2022-03-12 15:38:26
 * @LastEditors: Lin zefan
 * @Description: 响应库
 * @FilePath: \mini-vue3\core\reactivity\index.js
 *
 */

let currentEffect;
class Dep {
  constructor() {
    this.effect = new Set();
  }
  //   收集依赖
  depend() {
    currentEffect && this.effect.add(currentEffect);
  }
  //   触发依赖
  notice() {
    this.effect.forEach((effect) => {
      effect();
    });
  }
}

// 对象代理集合
const targetMap = new Map();

function setDep(target, key) {
  // 从整个target集合中取出当前操作的dep集合
  let depMaps = targetMap.get(target);
  // 如果没有，把当前数据set进target集合
  if (!depMaps) {
    depMaps = new Map();
    targetMap.set(target, depMaps);
  }
  // 从当前dep集合取出当前操作的数据
  let dep = depMaps.get(key);
  // 如果没有数据，把当前的操作数据set进dep集合
  if (!dep) {
    dep = new Dep();
    depMaps.set(key, dep);
  }
  return dep;
}

/**
 * @description: 实现reactive
 * @param {Object} 代理数据
 * @return {Proxy} Proxy对象
 */
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const dep = setDep(target, key);
      dep.depend();
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      const dep = setDep(target, key);
      const result = Reflect.set(target, key, value); 
      dep.notice();
      return result;
    },
  });
}

/**
 * @description: 实现effect
 * @param {function} 侦听reactive对象
 */
export function effectWatch(effect) {
  // 收集依赖
  currentEffect = effect;
  effect();
  currentEffect = null;
}