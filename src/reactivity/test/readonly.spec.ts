import { readonly } from "..";

/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:03:54
 * @LastEditTime: 2022-03-16 18:13:38
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\readonly.spec.ts
 *
 */

describe("readonly", () => {
  /** 检测readonly
   * 1. readonly包装后的对象不等于初始对象
   * 2. 可以正常拿到Proxy set的值
   */
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
  });

  /** 检测readonly内部调用set
   * 1. 调用Proxy set会输出一个console.warn
   * 2. 校验是否成功输出console.warn
   */
  it("warn then call set", () => {
    console.warn = jest.fn();

    const u = readonly({
      age: 10,
    });
    u.age = 11;

    expect(console.warn).toBeCalled();
  });
});
