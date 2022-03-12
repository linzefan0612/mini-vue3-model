/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 14:12:29
 * @LastEditTime: 2022-03-12 16:39:59
 * @LastEditors: Lin zefan
 * @Description: 公用js
 * @FilePath: \mini-vue3\core\index.js
 *
 */
import { effectWatch } from "./reactivity/index.js";
import { mountElement } from "./renderer/index.js";

export function createApp(rootComponent) {
  return {
    mount(rootElement) {
      if (typeof rootElement === "string") {
        rootElement = document.querySelector(rootElement);
      }

      const context = rootComponent.setup();

      effectWatch(() => {
        const vnode = rootComponent.render(context);
        mountElement(vnode, rootElement);
      });
    },
  };
}
