/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 10:40:19
 * @LastEditTime: 2022-04-17 13:31:01
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
  }
}

function genExpression(node, context) {
  // 处理 SIMPLE_EXPRESSION
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const { push } = context;
  push(`_${HelperNameMapping[TO_DISPLAY_STRING]}(`);
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
  const { push } = context;
  const { tag } = node;
  push(`_${HelperNameMapping[CREATE_ELEMENT_VNODE]}('${tag}')`);
}

function createCodeGenContext() {
  const context = {
    code: "",
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
