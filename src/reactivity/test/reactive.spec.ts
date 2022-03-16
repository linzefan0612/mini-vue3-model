/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:46:54
 * @LastEditTime: 2022-03-16 15:44:51
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\reactive.spec.ts
 *
 */

import { reactive } from "../index";

describe("reactive", () => {
  it("it-reactive", () => {
    const initObj = { foo: 1 };
    const reactiveObj = reactive(initObj);
    // initObj 不等于 reactiveObj
    expect(reactiveObj).not.toBe(initObj);
  });
});
