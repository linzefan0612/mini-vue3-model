import { isReadonly, shallowReadonly } from "..";

describe("shallowReadonly", () => {
  /** shallowReadonly
   * 1. 浅层做readonly代理，所有首层引用为只读
   * 2. 不做深度readonly转换
   * 3. 深层的对象操作还是可以,但不是双向绑定
   */
  it("happy path", () => {
    const state = shallowReadonly({
      foo: 1,
      bar: { baz: 2 },
    });
    state.foo++;
    expect(state.foo).toBe(1);
    state.bar.baz++;
    expect(state.bar.baz).toBe(3);
    expect(isReadonly(state.bar)).toBe(false);
    expect(isReadonly(state)).toBe(true);
  });
});
