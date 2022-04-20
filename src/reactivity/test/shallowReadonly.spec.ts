/*
 * @Author: Lin ZeFan
 * @Date: 2022-03-17 17:36:02
 * @LastEditTime: 2022-04-20 21:02:02
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\src\reactivity\test\shallowReadonly.spec.ts
 * 
 */
import { isReactive, shallowReactive } from "../reactive";
import { effect } from "../effect";

describe("shallowReactive", () => {
  /** shallowReactive
   * 1. 浅层做reactive代理，所有首层引用是双向绑定的
   * 2. 不做深度reactive转换
   * 3. 深层的对象操作还是可以,但不是双向绑定
   */
  it("happy path", () => {
    const state = shallowReactive({
      foo: 1,
      bar: { baz: 2 },
    });
    let num = 0;
    let baz = 0;
    effect(() => {
      num = state.foo;
      baz = state.bar.baz;
    });
    expect(isReactive(state.bar)).toBe(false);
    expect(baz).toBe(2);
    state.foo += 2;
    expect(num).toBe(3);
    state.bar.baz++;
    expect(baz).toBe(2);
  });
});
