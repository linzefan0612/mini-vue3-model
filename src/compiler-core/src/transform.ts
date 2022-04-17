/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-16 22:33:45
 * @LastEditTime: 2022-04-17 16:18:02
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
  const exitFns: any = [];
  for (let index = 0; index < nodeTransforms.length; index++) {
    const transform = nodeTransforms[index];
    const exitFn = transform(node, context);
    // 收集退出函数
    if (exitFn) exitFns.push(exitFn);
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

  let i = exitFns.length;
  // 执行所有的退出函数
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node: any, context: any) {
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context);
  }
}
function createdRootCodegen(root: any) {
  const child = root.children[0];
  // 在这里进行判断，如果说 children[0] 的类型是 ELEMENT，那么直接修改为 child.codegenNode
  if (child.type === NodeType.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}
