/*
 * @Author: Lin zefan
 * @Date: 2022-03-26 11:27:22
 * @LastEditTime: 2022-03-26 13:04:08
 * @LastEditors: Lin zefan
 * @Description: emit
 * @FilePath: \mini-vue3\src\runtime-core\componentEmit.ts
 *
 */

import { handlerEventName } from "../shared/index";

export function emit({ props }, event, ...arg) {
  /**
   * 1. event 为当前emit触发的事件名
   * 2. 根据事件名去找到props注册的对应事件，进行调用
   * 3. arg是emit接收的数据
   */
  const handler = props[handlerEventName(event)];
  handler && handler(...arg);
}
