/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:46:54
 * @LastEditTime: 2022-03-15 15:39:24
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\effect.spec.ts
 *
 */

import { effect } from "../effect";
import { reactive } from "../index";

describe("effect", () => {
  // 实现effect侦听
  it("it-effect", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  // 实现effect return runner
  it("return runner when call effect", () => {
    /** effect(fn) -> function(runner) -> fn -> return
     * effect会返回一个function，是它本身
     * function会返回effect return的数据
     */
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "return-effect";
    });
    expect(foo).toBe(11);
    // 是否返回了本身
    const r = runner();
    expect(foo).toBe(12);
    // 是否返回了effect的return数据
    expect(r).toBe("return-effect");
  });
});
