/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 14:15:42
 * @LastEditTime: 2022-03-12 16:39:11
 * @LastEditors: Lin zefan
 * @Description: 根入口
 * @FilePath: \mini-vue3\App.js
 *
 */

import { reactive } from "./core/reactivity/index.js";
import h from "./core/h.js";

export default {
  render(context) {
    return h("div", { class: "father" }, [
      h("div", { class: "222" }, "222"),
      h("div", { class: "333" }, [
        h("div", { class: "3331" }, "3331"),
        h("div", { class: "3323" }, "3323"),
      ]),
    ]);
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
