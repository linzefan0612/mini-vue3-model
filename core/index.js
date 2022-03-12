/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 14:12:29
 * @LastEditTime: 2022-03-12 15:31:18
 * @LastEditors: Lin zefan
 * @Description: 公用js
 * @FilePath: \mini-vue3\core\index.js
 *
 */
import { effectWatch } from "./reactivity/index.js";

export function createApp(rootComponent) {
  return {
    mount(rootElement) {
      if (typeof rootElement === "string") {
        rootElement = document.querySelector(rootElement);
      }

      const context = rootComponent.setup();

      effectWatch(() => {
        const element = rootComponent.render(context);
        rootElement.append(element);
      });
    },
  };
}
