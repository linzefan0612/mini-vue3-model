/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-09 10:42:20
 * @LastEditTime: 2022-04-09 11:09:20
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\example\componentUpdate\App.js
 *
 */
// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref } from "../../lib/mini-vue.esm.js";
import Child from "./Child.js";

export default {
  name: "App",
  setup() {
    const msg = ref(120);
    const count = ref(1111);
    window.msg = msg;

    const changeChildProps = () => {
      msg.value += 10;
    };
    const changeCount = () => {
      count.value++;
    };

    return { msg, count, changeChildProps, changeCount };
  },

  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        "button",
        {
          onClick: this.changeChildProps,
        },
        "change child props"
      ),
      h(Child, {
        msg: this.msg,
      }),
      h(
        "button",
        {
          onClick: this.changeCount,
        },
        "change count"
      ),
      h("p", {}, this.count),
    ]);
  },
};
