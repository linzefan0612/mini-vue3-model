import { h, createTextVNode } from "../../lib/mini-vue.esm.js";
import Child from "./Child.js";

export default {
  name: "App",
  setup() {},

  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        Child,
        {},
        {
          header: [h("div", {}, "header")],
          default: ({ age }) => [
            h("p", {}, "我是通过 slot 渲染出来的第一个元素 "),
            h("p", {}, "我是通过 slot 渲染出来的第二个元素"),
            h("p", {}, `我可以接收到 age: ${age}`),
          ],
          main: h("div", {}, "main"),
          footer: ({ name }) =>
            h("p", {}, "我是通过footer插槽 ，名字是：" + name),
          text: createTextVNode("我是个text node"),
        }
      ),
    ]);
  },
};
