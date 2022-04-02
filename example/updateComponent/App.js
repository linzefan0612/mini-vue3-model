/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-04-02 11:11:34
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\updateComponent\App.js
 *
 */

import { h, ref } from "../../lib/mini-vue.esm.js";

export default {
  setup() {
    const counter = ref(1);
    function inc() {
      counter.value += 1;
    }
    return {
      counter,
      inc,
    };
  },
  render() {
    return h("div", {}, [
      h("div", {}, "" + this.counter),
      h("button", { onClick: this.inc }, "inc"),
    ]);
  },
};
