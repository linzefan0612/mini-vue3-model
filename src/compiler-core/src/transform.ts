/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-16 22:33:45
 * @LastEditTime: 2022-04-16 23:09:37
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transform.ts
 *
 */

export function transform(root, options) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
}

function createTransformContext(root: any, options: any) {
  const { nodeTransforms = [] } = options;
  const context = {
    root,
    nodeTransforms: nodeTransforms || [],
  };
  return context;
}

function traverseNode(node, context) {
  const { nodeTransforms } = context;

  for (let index = 0; index < nodeTransforms.length; index++) {
    const transform = nodeTransforms[index];
    transform(node);
  }

  traverseChildren(node, context);
}

function traverseChildren(node: any, context: any) {
  const { children } = node;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i], context);
    }
  }
}
