import { isReactive, isReadonly, reactive, readonly, isProxy } from "..";

/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:03:54
 * @LastEditTime: 2022-03-20 11:08:50
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\readonly.spec.ts
 *
 */

describe("readonly", () => {
  /** 检测readonly
   * 1. 是否为只读
   * 2. 检测是否为reactive、readonly对象
   */
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const state = reactive({
      foo: 1,
      bar: { baz: 2 },
    });
    const wrapped = readonly(original);
    wrapped.foo++;
    expect(wrapped.foo).toBe(1);
    wrapped.bar.baz++;
    expect(wrapped.bar.baz).toBe(2);
    expect(wrapped).not.toBe(original);
    // 检测是否为reactive对象
    expect(isReactive(state)).toBe(true);
    // 检测是否为readonly对象
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    // 判断是否为readonly对象
    expect(isProxy(wrapped)).toBe(true);
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
