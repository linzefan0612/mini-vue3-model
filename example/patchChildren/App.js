/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-04 11:44:08
 * @LastEditTime: 2022-04-04 12:33:16
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\example\patchChildren\App.js
 *
 */

import { h } from "../../lib/mini-vue.esm.js";
import ArrayToText from "./ArrayToText.js";
import TextToNewText from "./TextToNewText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";

export default {
  setup() {
    return {};
  },
  render() {
    return h("div", {}, [
      h("div", {}, "3种情况变化"),
      // h(ArrayToText),
      // h(TextToNewText),
      // h(TextToArray),
      h(ArrayToArray),
    ]);
  },
};
