/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 14:15:42
 * @LastEditTime: 2022-03-12 14:32:55
 * @LastEditors: Lin zefan
 * @Description: 根入口
 * @FilePath: \mini-vue3\App.js
 *
 */

import { reactive } from "./core/reactivity/index.js";

export default {
  render(context) {
    const div = document.createElement("div");
    div.innerText = context.state.count;
    return div;
  },
  setup() {
    const state = reactive({
      count: 1,
    });
    window.state = state;
    return {
      state,
    };
  },
};
