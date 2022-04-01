/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-04-01 13:48:26
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\provide-inject\App.js
 *
 */

import { h, provide, inject } from "../../lib/mini-vue.esm.js";

export default {
  name: "Provider",
  render() {
    return h("div", {}, [h("div", {}, "Provider"), h(Provider2)]);
  },
  setup() {
    // 在上层 provide
    provide("foo", "foo");
  },
};

const Provider2 = {
  name: "Provider2",
  render() {
    return h("div", {}, [h("div", {}, `Provider2:${this.foo}`), h(Provider3)]);
  },
  setup() {
    provide("foo", "foo2");
    return {
      // 在下层 inject
      foo: inject("foo"),
    };
  },
};
const Provider3 = {
  name: "Provider3",
  render() {
    return h("div", {}, [
      h("div", {}, `Provider3:${this.foo}`),
      h("div", {}, `Provider3-baseFoo:${this.baseFoo}`),
      h("div", {}, `Provider3-baseBar:${this.baseBar}`),
      h(Consumer),
    ]);
  },
  setup() {
    provide("foo", "foo3");
    const baseFoo = inject("baseFoo", "base");
    const baseBar = inject("baseBar", () => "bar");
    return {
      // 在下层 inject
      foo: inject("foo"),
      baseFoo,
      baseBar,
    };
  },
};

const Consumer = {
  name: "Consumer",
  render() {
    return h("div", {}, "Consumer: " + `inject foo: ${this.foo}`);
  },
  setup() {
    return {
      // 在下层 inject
      foo: inject("foo"),
    };
  },
};
