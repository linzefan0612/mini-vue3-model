/*
 * @Author: Lin zefan
 * @Date: 2022-03-18 17:23:33
 * @LastEditTime: 2022-03-18 18:28:34
 * @LastEditors: Lin zefan
 * @Description: 实现 computed
 * @FilePath: \mini-vue3\src\reactivity\computed.ts
 *
 */

import { Effect } from "./effect";

class ComputedRefImpl {
  private _dirty: boolean = true;
  private _value: any;
  private _effect: Effect;
  constructor(getter) {
    /** 思考
     * 1. 需要借助effect的进行依赖收集，这里我们直接用effect的类
     * 2. 借助scheduler来重置_dirty，加上!this._dirty判断避免多次执行。
     */
    this._effect = new Effect(getter, () => {
      !this._dirty && (this._dirty = true);
    });
  }

  get value() {
    /** 思考
     * 1. 这里用了_dirty做缓存判断，什么时候需要更新呢？
     * 2. 依赖的缓存数据更新时，就需要把_dirty重置，更新value的值
     * 3. 借助scheduler来重置_dirty
     */
    // 缓存
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }

    return this._value;
  }
}
export function computed(getter) {
  return new ComputedRefImpl(getter);
}
