import { reactive } from "../reactive";
import { effect } from "../effect";
import { isRef, proxyRefs, ref, unRef } from "../ref";

describe("ref", () => {
  /** 看得见的思考
   * 1. ref对象的值包在value
   * 2. ref的数据也要收集，触发侦听，做双向绑定
   * 3. 做缓存，重新赋值时判断值是否相等
   */
  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    /** 思考
     * 1. 依赖ref的数据发生变动，对应也要变动
     * 2. ref要触发effect，才能侦听到数据变化
     */
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    /** 思考
     * 1. ref做缓存，要加个标识
     */
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  /** 看得见的思考
   * 1. ref支持基本类型和引用类型
   * 2. ref可以深度侦听数据变化
   */
  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  /** 看得见的思考
   * 1. 给ref实例一个固定标识
   * 2. 如果能取到该标识证明就是ref对象
   */
  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  /** 看得见的思考
   * 1. 可以利用isRef判断
   * 2. 如果是ref对象，则返回ref.value，否则直接返回原值
   */
  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  /** 看得见的思考
   * 1. get，获取的时候主要考虑是ref对象还是普通对象，可以借助unRef
   * 2. set，更新要考虑是普通对象还是ref，要保持响应
   *  2.1 如果普通对象，则更新.value的值
   *  2.2 如果是ref，则直接替换即可
   */
  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "xiaohong",
    };
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("xiaohong");

    (proxyUser as any).age = 20;
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
