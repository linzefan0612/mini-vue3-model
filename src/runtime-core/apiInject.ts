/*
 * @Author: Lin zefan
 * @Date: 2022-03-31 18:34:20
 * @LastEditTime: 2022-04-01 13:56:43
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\apiInject.ts
 *
 */

import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance = getCurrentInstance() as any;
  if (currentInstance) {
    let { providers } = currentInstance;
    const parentProviders =
      currentInstance.parent && currentInstance.parent.providers;
    /** 初始化判断
     * 1. 根组件没有parent，这个判断不会走
     * 2. 判断当前providers与父级providers是否相等，相等即初始化
     */
    if (providers === parentProviders) {
      /** 初始化组件providers
       * 1. 通过Object.create创建一个新对象，避免引用导致的问题
       * 2. 通过Object.create传入父组件数据，Object.create内部会挂载prototype
       * 3. 当前组件获取不到数据，可以通过prototype向上级寻找（原型链）
       */
      providers = currentInstance.providers = Object.create(parentProviders);
    }
    providers[key] = value;
  }
}
export function inject(key, defaultVal) {
  const currentInstance = getCurrentInstance() as any;
  if (currentInstance) {
    /**
     * 1. 获取的是父元素的providers，而不是自身
     * 2. 所以我们需要把父组件实例注入到实例对象
     */
    const { providers } = currentInstance.parent;
    // 支持默认值，string | array
    if (!providers[key] && defaultVal) {
      if (typeof defaultVal === "function") {
        return defaultVal();
      }
      return defaultVal;
    }
    return providers[key];
  }
}
