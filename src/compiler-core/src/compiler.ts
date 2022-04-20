/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-20 20:47:43
 * @LastEditTime: 2022-04-20 20:49:25
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\compiler.ts
 *
 */

import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";

// 暴露编译方法
export function baseCompile(template: string) {
  const ast = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });
  const code = generate(ast);
  return {
    code,
  };
}
