/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-04-02 13:27:06
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

    const props = ref({
      foo: "foo",
      bar: "bar",
    });

    function patchProp1() {
      // 逻辑1: old !== new
      props.value.foo = "new-foo";
    }
    function patchProp2() {
      // 逻辑2: new === undefined || null, remove new
      props.value.bar = undefined;
    }
    function patchProp3() {
      // 逻辑3: old 存在，new 不存在，remove new
      props.value = {
        bar: "bar",
      };
    }
    return {
      counter,
      props,
      inc,
      patchProp1,
      patchProp2,
      patchProp3,
    };
  },
  render() {
    return h(
      "div",
      {
        // foo: this.props.foo,
        // bar: this.props.bar,
      },
      [
        h("div", {}, "" + this.counter),
        h("button", { onClick: this.inc }, "inc"),
        h("button", { onClick: this.patchProp1 }, "修改props"),
        h("button", { onClick: this.patchProp2 }, "删除props"),
        h("button", { onClick: this.patchProp3 }, "props重新赋值"),
      ]
    );
  },
};
