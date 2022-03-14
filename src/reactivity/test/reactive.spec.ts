/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:46:54
 * @LastEditTime: 2022-03-14 19:55:35
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\reactive.spec.ts
 *
 */

import { reactive } from "../index";

describe("reactive", () => {
  // init
  it("it-reactive", () => {
    const initObj = { foo: 1 };
    const reactiveObj = reactive(initObj);
    expect(reactiveObj).not.toBe(initObj);
  });
  // update
});
