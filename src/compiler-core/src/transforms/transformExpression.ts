/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-17 12:19:33
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transforms\transformExpression.ts
 *
 */
import { NodeType } from "../ast";

// 处理多层包装
export function transformExpression(node) {
  if (node.type === NodeType.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

function processExpression(node) {
  node.content = `_ctx.${node.content}`;

  return node;
}
