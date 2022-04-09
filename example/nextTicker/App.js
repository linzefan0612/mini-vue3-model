/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-09 13:18:11
 * @LastEditTime: 2022-04-09 13:20:05
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\example\nextTicker\App.js
 * 
 */
import { h } from "../../lib/mini-vue.esm.js";
import NextTicker from "./NextTicker.js";

export default {
  name: "App",
  setup() {},

  render() {
    return h("div", { tId: 1 }, [h("p", {}, "主页"), h(NextTicker)]);
  },
};
