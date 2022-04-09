/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-09 10:42:20
 * @LastEditTime: 2022-04-09 10:48:36
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\example\componentUpdate\Child.js
 *
 */
import { h } from "../../lib/mini-vue.esm.js";
export default {
  name: "Child",
  setup(props, { emit }) {},
  render(proxy) {
    return h("div", {}, [h("div", {}, "child-" + this.$props.msg)]);
  },
};
