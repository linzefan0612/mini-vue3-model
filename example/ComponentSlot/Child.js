import { h, renderSlots } from "../../lib/mini-vue.esm.js";
export default {
  name: "Child",
  setup(props, context) {},
  render() {
    return h("div", {}, [
      h("div", {}, "child"),
      h("div", {}, [
        renderSlots(this.$slots, "header"),
        renderSlots(this.$slots, "default", {
          age: 18,
        }),
        renderSlots(this.$slots, "text"),
        renderSlots(this.$slots, "main", {
          content: "main的内容",
        }),
        renderSlots(this.$slots, "footer", {
          name: "foo",
        }),
      ]),
    ]);
  },
};
