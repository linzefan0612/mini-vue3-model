/*
 * @Author: Lin zefan
 * @Date: 2022-03-23 17:52:57
 * @LastEditTime: 2022-03-23 22:42:31
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentPublicInstanceProxyHandlers.ts
 *
 */

// 扩展的实例Map
const PublicInstanceMap = {
  $el: (i) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    let { setupState } = instance;
    // 获取 setup 返回的数据
    if (key in setupState) {
      return setupState[key];
    }
    // 获取instance实例对象
    const publicGetter = PublicInstanceMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
