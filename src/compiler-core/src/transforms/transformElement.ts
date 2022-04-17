/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-17 16:07:26
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transforms\transformElement.ts
 *
 */
import { NodeType } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeType.ELEMENT) {
    // 添加相关的helper
    context.helper(CREATE_ELEMENT_VNODE);

    // 中间处理层，处理 props 和 tag
    const vnodeTag = node.tag;
    const vnodeProps = node.props;

    const { children } = node;
    let vnodeChildren = children;

    const vnodeElement = {
      type: NodeType.ELEMENT,
      tag: vnodeTag,
      props: vnodeProps,
      children: vnodeChildren,
    };

    node.codegenNode = vnodeElement;
  }
}
