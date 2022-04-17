/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-17 13:31:25
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\__tests__\codegen.spec.ts
 *
 */
// import { generate } from "../src/codegen";

import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { codegen } from "../src/codegen";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformElement } from "../src/transforms/transformElement";
// import { transformText } from "../src/transforms/transformText";

test("text", () => {
  const template = "hi";
  const ast = baseParse(template);
  transform(ast);
  const code = codegen(ast);
  expect(code).toMatchSnapshot();
});

test("interpolation", () => {
  const template = "{{message}}";
  const ast = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression],
  });
  const code = codegen(ast);
  expect(code).toMatchSnapshot();
});

test("simple element", () => {
  const template = "<div></div>";
  const ast = baseParse(template);
  transform(ast, {
    // 加入处理插件
    nodeTransforms: [transformElement],
  });
  const code = codegen(ast);
  expect(code).toMatchSnapshot();
});

// test("element and interpolation", () => {
//   const ast = baseParse("<div>hi,{{msg}}</div>");
//   transform(ast, {
//     nodeTransforms: [transformElement, transformText, transformExpression],
//   });

//   const { code } = generate(ast);
//   expect(code).toMatchSnapshot();
// });
