/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-17 13:16:34
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transforms\transformElement.ts
 *
 */
import { NodeType } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeType.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE);
  }
}
