import { reactive } from "..";
import { effect } from "../effect";
import { isRef, ref, unRef } from "../ref";

describe("ref", () => {
  /** 看得见的思考
   * 1. ref对象的值包在value
   * 2. ref的数据也要收集，触发侦听
   * 3. 重新赋值时判断值是否相等
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
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  /** 看得见的思考
   * 1. ref支持基本类型和引用类型
   * 2. ref可以深度侦听数据变化，所以内部得
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

  it.skip("proxyRefs", () => {
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
   * 2. 如果是true，则返回ref.value，否则直接返回原值
   */
  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
});
