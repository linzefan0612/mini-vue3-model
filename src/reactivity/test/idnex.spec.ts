/*
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:32:06
 * @LastEditTime: 2022-03-14 15:41:11
 * @LastEditors: Lin zefan
 * @Description: 单元测试
 * @FilePath: \mini-vue3\src\reactivity\test\idnex.spec.ts
 *
 */
import { add } from "../index";

it("init", () => {
  expect(add(1, 3)).toBe(4);
});
