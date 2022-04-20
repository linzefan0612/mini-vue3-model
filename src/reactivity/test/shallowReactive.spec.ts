/*
 * @Author: Lin ZeFan
 * @Date: 2022-03-20 11:24:38
 * @LastEditTime: 2022-04-20 21:02:40
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\src\reactivity\test\shallowReactive.spec.ts
 * 
 */
import { isReadonly, shallowReadonly } from "../reactive";

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
