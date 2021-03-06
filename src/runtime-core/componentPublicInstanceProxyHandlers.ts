/*
 * @Author: Lin zefan
 * @Date: 2022-03-23 17:52:57
 * @LastEditTime: 2022-04-09 10:43:19
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentPublicInstanceProxyHandlers.ts
 *
 */

import { hasOwn } from "../shared/index";

// 扩展的实例Map
const PublicInstanceMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    let { setupState, props } = instance;

    // 获取 setup 返回的数据
    if (hasOwn(setupState, key)) {
      return setupState[key];
    }
    // 获取props数据
    if (hasOwn(props, key)) {
      return props[key];
    }
    // 获取instance实例对象
    const publicGetter = PublicInstanceMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
