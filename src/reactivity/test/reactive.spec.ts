/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:46:54
 * @LastEditTime: 2022-03-17 17:55:30
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\reactive.spec.ts
 *
 */

import { isReactive, reactive, isProxy } from "../index";

describe("reactive", () => {
  it("it-reactive", () => {
    const initObj = { foo: 1 };
    const reactiveObj = reactive(initObj);
    expect(reactiveObj).not.toBe(initObj);

    // 判断是否为reactive对象
    expect(isProxy(reactiveObj)).toBe(true);
  });

  /** 检测嵌套的对象是否也为reactive对象
   *
   */
  test("nested reactive", () => {
    const initObj = {
      foo: 1,
      obj: {
        foo: 1,
      },
      arr: [{ bar: 2 }],
    };
    const observe = reactive(initObj);
    expect(isReactive(observe.obj)).toBe(true);
    expect(isReactive(observe.arr)).toBe(true);
  });
});
