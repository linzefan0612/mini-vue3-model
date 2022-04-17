/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 10:40:19
 * @LastEditTime: 2022-04-17 16:32:08
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\codegen.ts
 *
 */

import { NodeType } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  HelperNameMapping,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";
import { isArray, isString } from "./utils";

export function codegen(ast) {
  const context = createCodeGenContext();
  const { push } = context;

  // 处理头部函数引入
  if (ast.helpers.length) {
    genFunctionPreamble(ast, context);
  }

  const funcName = "render";
  push(`export `);
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${funcName}(${signature}) { `);

  push(`return `);
  genNode(ast.codegenNode, context);
  push(` }`);
  return context.code;
}

function genNode(node, context) {
  // 根据 node 的类型进行不同的处理
  switch (node.type) {
    case NodeType.TEXT:
      genText(node, context);
      break;
    case NodeType.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeType.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeType.ELEMENT:
      genElement(node, context);
      break;
    case NodeType.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
  }
}

function genExpression(node, context) {
  // 处理 SIMPLE_EXPRESSION
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  // 前面处理插值类型的时候，真正的值是包在content.content里的
  // { type: NodeType.INTERPOLATION, content: { type: NodeType.SIMPLE_EXPRESSION, content: 'message'} }
  genNode(node.content, context);
  push(`)`);
}

function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  // push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}')`);
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  // 批量处理 tag，props 和 children，优化空值情况
  genNodeList(genNullable([tag, props, children]), context);
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    /** 处理node list
     * 1. 如果是text，直接拼接
     * 2. 如果是数组，遍历数组，把每一项再通过 genNode 检测类型
     * 3. 如果是对象，给 genNode 检测类型
     */
    if (isString(node)) {
      push(node);
    } else if (isArray(node)) {
      for (let j = 0; j < node.length; j++) {
        const n = node[j];
        genNode(n, context);
      }
    } else {
      genNode(node, context);
    }
    // 遍历完，加上分隔符
    i < nodes.length - 1 && push(", ");
  }
}

function genNullable(args) {
  // 把undefined、null，转为 “null”
  return args.map((arg) => arg || "null");
}

function genCompoundExpression(node, context) {
  const { children } = node;
  const { push } = context;
  // 对 children 进行遍历
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    // 如果是 string，也就是我们手动添加的 +
    if (isString(child)) {
      // 直接 push
      push(child);
    } else {
      // 否则还是走 genNode
      genNode(child, context);
    }
  }
}

function createCodeGenContext() {
  const context = {
    code: "",
    helper(key) {
      return `_${HelperNameMapping[key]}`;
    },
    push(source: string) {
      context.code += source;
    },
    addLine() {
      context.code += "\n";
    },
  };
  return context;
}
function genFunctionPreamble(ast: any, context) {
  // 引入都来自 Vue
  const VueBinding = "Vue";
  const { push, addLine } = context;
  // 因为是Symbol，需要用映射表匹配
  const aliasHelper = (s) =>
    `${HelperNameMapping[s]} as _${HelperNameMapping[s]}`;
  // 处理头部引入
  push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinding}`);
  addLine();
}
