/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 14:15:42
 * @LastEditTime: 2022-03-12 18:27:12
 * @LastEditors: Lin zefan
 * @Description: 根入口
 * @FilePath: \mini-vue3\App.js
 *
 */

import { reactive } from "./core/reactivity/index.js";
import h from "./core/h.js";

export default {
  render(context) {
    return h(
      "div",
      { class: "father", id: "id" + context.state.count },
      String(context.state.count)
    );
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
