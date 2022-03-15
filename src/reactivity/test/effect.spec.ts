/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:46:54
 * @LastEditTime: 2022-03-15 19:24:29
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\effect.spec.ts
 *
 */

import { effect, stop } from "../effect";
import { reactive } from "../index";

describe("effect", () => {
  // 实现effect侦听
  it("effect", () => {
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

  // 实现scheduler
  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();

    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    // 验证了scheduler被调用了一次
    expect(scheduler).toHaveBeenCalledTimes(1);
    // 有scheduler，优先调用了scheduler，不会走fn
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  // 实现effect的stop功能
  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    // 使用了stop，删除了当前依赖
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  // 实现effect的stop回调通知
  it("onStop", () => {
    const onStop = jest.fn();
    const runner = effect(() => {}, {
      onStop,
    });

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
