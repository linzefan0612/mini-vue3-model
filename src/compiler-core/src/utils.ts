/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 16:03:37
 * @LastEditTime: 2022-04-17 16:34:18
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\utils.ts
 *
 */

import { NodeType } from "./ast";

export const isString = (val) => val && typeof val === "string";

export const isArray = (val) => val && Array.isArray(val);

export function isText(node) {
  return node.type === NodeType.TEXT || node.type === NodeType.INTERPOLATION;
}
