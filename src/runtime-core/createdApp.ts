/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:49:41
 * @LastEditTime: 2022-04-01 18:27:30
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\createdApp.ts
 *
 */

import { isDom } from "../shared/index";
import { createdVNode } from "./vnode";

// 创建一个Vue实例
export function createAppAPI(renderer, selector) {
  return function createApp(rootComponent) {
    return {
      // 暴露一个mount方法
      mount(rootContainer) {
        /**
         * 1. 将根组件(rootComponent)转换为vnode
         * 2. 再通过render函数将vnode渲染到mount接收的容器(rootContainer)中
         */
        const vnode = createdVNode(rootComponent);
        renderer(
          vnode,
          selector ? selector(rootContainer) : isDom(rootContainer)
        );
      },
    };
  };
}
