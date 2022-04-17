/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 12:10:36
 * @LastEditTime: 2022-04-17 13:11:36
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\runtimeHelpers.ts
 *
 */

export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");

export const HelperNameMapping = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_ELEMENT_VNODE]: "createElementVNode",
};
