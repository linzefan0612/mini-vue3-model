/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-23 14:06:34
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transforms\transformElement.ts
 *
 */
import { NodeType } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeType.ELEMENT) {
    // 返回一个函数
    return () => {
      // 添加相关的helper
      context.helper(CREATE_ELEMENT_VNODE);

      // 中间处理层，处理 props 和 tag
      const { tag, props, children } = node;
      const vnodeTag = `'${tag}'`;
      const vnodeProps = props;
      const vnodeChildren = children;

      const vnodeElement = {
        type: NodeType.ELEMENT,
        tag: vnodeTag,
        props: vnodeProps,
        children: vnodeChildren,
      };

      node.codegenNode = vnodeElement;
    };
  }
}
