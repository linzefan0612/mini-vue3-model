import { isReactive, shallowReactive } from "..";
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
