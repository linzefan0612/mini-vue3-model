/*
 * @Author: Lin zefan
 * @Date: 2022-03-27 11:18:29
 * @LastEditTime: 2022-03-27 14:18:07
 * @LastEditors: Lin zefan
 * @Description: 初始化slot
 * @FilePath: \mini-vue3\src\runtime-core\componentSlot.ts
 *
 */

export function initSlots(instance, children) {
  normalizeSlotObject(children, instance.slots);
}

function normalizeSlotObject(children, slots) {
  for (const key in children) {
    if (Object.prototype.hasOwnProperty.call(children, key)) {
      const value = children[key];

      if (typeof value === "function") {
        /**
         * 1. 如果是一个函数，那初始化的时候就返回一个函数
         * 2. props为作用域插槽的值，在renderSlots函数中会传递过来
         */
        const handler = (props) => normalizeSlotValue(value(props));
        slots[key] = handler;
      } else {
        // 不是函数，是一个是h对象，或者h对象数组集合
        slots[key] = normalizeSlotValue(value);
      }
    }
  }
}

function normalizeSlotValue(slots: any): any {
  // 统一转换为数组，因为children接收的是一个数组
  return Array.isArray(slots) ? slots : [slots];
}
