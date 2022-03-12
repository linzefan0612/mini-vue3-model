/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 14:12:29
 * @LastEditTime: 2022-03-12 19:21:27
 * @LastEditors: Lin zefan
 * @Description: 公用js
 * @FilePath: \mini-vue3\core\index.js
 *
 */
import { effectWatch } from "./reactivity/index.js";
import { mountElement, diff } from "./renderer/index.js";

export function createApp(rootComponent) {
  return {
    mount(rootElement) {
      if (typeof rootElement === "string") {
        rootElement = document.querySelector(rootElement);
      }
      const context = rootComponent.setup();
      
      // 是否首次渲染
      let initFlag = false;
      let preVnode = null;
      effectWatch(() => {
        const vnode = rootComponent.render(context);
        if (!initFlag) {
          console.log("首次渲染");
          rootElement.innerHTML = "";
          initFlag = true;
          preVnode = vnode;
          mountElement(vnode, rootElement);
        } else {
          console.log("更新视图");
          diff(preVnode, vnode);
        }
      });
    },
  };
}
