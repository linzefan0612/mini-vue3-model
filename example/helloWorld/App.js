/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-03-23 17:43:05
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\helloWorld\App.js
 *
 */

import { h } from "../../lib/mini-vue.esm.js";

export default {
  name: "App",
  setup() {
    return {
      ctx: "hello word",
    };
  },

  render() {
    window.self = this;
    return h("div", { id: "father", class: ["a", "b"] }, [
      h("h1", {}, "标题"),
      h("h2", {}, this.ctx),
    ]);
  },
};
