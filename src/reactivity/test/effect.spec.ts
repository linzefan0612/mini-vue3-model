/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:46:54
 * @LastEditTime: 2022-03-17 15:42:56
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\test\effect.spec.ts
 *
 */

import { effect, stop } from "../effect";
import { reactive } from "../index";

describe("effect", () => {
  /** 实现effect侦听
   * 1. effect初始化会直接调用
   * 2. reactive包裹的参数发生变动，effect会再次执行
   */
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

  /** runner
   * 1. effect会返回一个function，是它本身
   * 2. function 会返回effect return的数据
   */
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

  /** 实现scheduler
   * 1.effect接收一个option，里面有一个scheduler
   * 2.存在scheduler，优先调用scheduler，否则调用fn
   */
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

  /** 实现effect的stop功能
   * 1. 调用stop，要把stop传入的effect清除
   * 2. 调用stop清除effect后，失去响应
   * 3. 重新调用effect，恢复响应
   */
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

    /** 看得见的思考
     * 1. obj.prop = 3 只触发了set
     * 2. obj.prop++ 等于 obj.prop = obj.prop + 1 ，会触发get把依赖收集，所以set的时候又有了。
     * 3. 所以要在track的时候加个收集标识，判断是否触发stop，触发就不应该track。
     */
    obj.prop = 3;
    expect(dummy).toBe(2);

    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(4);
  });

  /** 实现effect的stop回调通知
   * 调用stop后并且存在onStop，则调用onStop
   */
  it("onStop", () => {
    const onStop = jest.fn();
    const runner = effect(() => {}, {
      onStop,
    });

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
