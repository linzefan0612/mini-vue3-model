/*
 * @Author: Lin ZeFan
 * @Date: 2022-03-18 17:22:23
 * @LastEditTime: 2022-04-20 21:02:37
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\src\reactivity\test\computed.spec.ts
 * 
 */
import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
    const value = reactive({
      foo: 1,
    });

    const getter = computed(() => {
      return value.foo;
    });

    // value.foo = 2;

    expect(getter.value).toBe(1);
  });

  it("should compute lazily", () => {
    const value = reactive({
      foo: 1,
    });
    const getter = jest.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute again
    /** 思考
     * 1. 这里触发cValue的get，但要验证getter只调用了一次？
     * 2. 所以要考虑做缓存，只有set的时候，才去再次执行computed接收的fn
     * 3. 加一个缓存标识
     */
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed
    /** 思考
     * 1. 这里重新赋值触发了set，会触发trigger -> effect
     * 2. 触发set把缓存的标识重置
     */
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
