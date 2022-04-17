/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-16 22:33:45
 * @LastEditTime: 2022-04-17 13:17:47
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transform.ts
 *
 */

import { NodeType } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createdRootCodegen(root);
  // 储存所有头部引入
  root.helpers = [...context.helpers.keys()];
}

function createTransformContext(root: any, options: any) {
  const { nodeTransforms = [] } = options;
  const context = {
    root,
    nodeTransforms: nodeTransforms || [],
    helpers: new Map(),
    helper(name: string) {
      this.helpers.set(name, 1);
    },
  };
  return context;
}

function traverseNode(node, context) {
  const { nodeTransforms } = context;

  for (let index = 0; index < nodeTransforms.length; index++) {
    const transform = nodeTransforms[index];
    transform(node, context);
  }

  // 在这里遍历整棵树的时候，将根据不同的 node 的类型存入不同的 helper
  switch (node.type) {
    case NodeType.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeType.ROOT:
    case NodeType.ELEMENT:
      // 只有在 ROOT 和 ELEMENT 才会存在 children
      traverseChildren(node, context);
      break;
    default:
      break;
  }
}

function traverseChildren(node: any, context: any) {
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context);
  }
}
function createdRootCodegen(root: any) {
  root.codegenNode = root.children[0];
}
