/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-03-26 10:21:52
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\helloWorld\App.js
 *
 */

import { h } from "../../lib/mini-vue.esm.js";

const Foo = {
  setup(props) {
    console.log("Foo-->props", props);
    props.foo = "foo2";
  },
  render() {
    return h("div", {}, this.foo || "undefined");
  },
};
export default {
  name: "App",
  setup() {},

  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "father",
        class: ["a", "b"],
        onClick() {
          this.ctx = "hello word 修改";
        },
        onMousedown() {
          console.log("onMousedown");
        },
      },
      [
        h("h1", {}, "标题"),
        h(Foo, {
          foo: "foo",
        }),
      ]
    );
  },
};
