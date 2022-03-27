/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-03-26 12:29:28
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\helloWorld\App.js
 *
 */

import { h } from "../../lib/mini-vue.esm.js";

const Foo = {
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("子组件调用emit/add");
      emit(
        "add",
        {
          a: 1,
        },
        2
      );
    };

    const addCount = () => {
      console.log("子组件调用emit/add-count");
      emit("add-count", 2);
    };

    return {
      emitAdd,
      addCount,
    };
  },
  render() {
    return h("div", {}, [
      h(
        "button",
        {
          onClick: this.emitAdd,
        },
        "emit为add"
      ),
      h(
        "button",
        {
          onClick: this.addCount,
        },
        "emit为add-count"
      ),
    ]);
  },
};
export default {
  name: "App",
  setup() {
    const onAdd = (...arg) => {
      console.log("父组件接收到emit/add", arg);
    };
    const onAddCount = (...arg) => {
      console.log("父组件接收到emit/add-count", arg);
    };
    return {
      onAdd,
      onAddCount,
    };
  },

  render() {
    return h("div", {}, [
      h(Foo, {
        onAdd: this.onAdd,
        onAddCount: this.onAddCount,
      }),
    ]);
  },
};
