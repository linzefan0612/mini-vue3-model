import { isReadonly, readonly, shallowReadonly } from "..";

describe("shallowReadonly", () => {
  /** 检测readonly
   * 1. 是否为只读
   * 2. 检测是否为reactive、readonly对象
   */
  it("happy path", () => {
    const state = shallowReadonly({
      foo: 1,
      bar: { baz: 2 },
    });

    expect(isReadonly(state.bar)).toBe(false);
    expect(isReadonly(state)).toBe(true);
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
