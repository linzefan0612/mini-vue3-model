/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-03-30 22:42:08
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\getCurrentInstance\App.js
 *
 */

import { h, getCurrentInstance } from "../../lib/mini-vue.esm.js";

const Foo = {
  setup() {
    console.log("Foo", getCurrentInstance());
  },
  render() {
    return h("div", {}, "我是Foo");
  },
};
export default {
  name: "App",
  setup() {
    console.log("App", getCurrentInstance());
  },

  render() {
    return h("div", {}, [h(Foo)]);
  },
};
