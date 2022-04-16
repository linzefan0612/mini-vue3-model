/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-16 23:08:05
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\__tests__\transform.spec.ts
 *
 */
import { NodeType } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
describe("Compiler: transform", () => {
  // test("should change text content", () => {
  //   const ast = baseParse("<div>hi</div>");
  //   transform(ast);
  //   expect(ast.children[0].children[0].content).toEqual("hi mini-vue");
  // });

  // 改写测试
  test("should change text content", () => {
    const ast = baseParse("<div>hi</div>");
    // 外部提供处理
    const transformText = (node) => {
      if (node.type === NodeType.TEXT) {
        node.content += " mini-vue";
      }
    };
    // 通过 options 传入内部，内部再调用
    transform(ast, {
      nodeTransforms: [transformText],
    });
    expect(ast.children[0].children[0].content).toEqual("hi mini-vue");
  });

  // test("context state", () => {
  //   const ast = baseParse(`<div>hello {{ world }}</div>`);
  //   console.log(ast);

  //   // manually store call arguments because context is mutable and shared
  //   // across calls
  //   const calls: any[] = [];
  //   const plugin = (node, context) => {
  //     calls.push([node, { ...context }]);
  //   };

  //   transform(ast, {
  //     nodeTransforms: [plugin],
  //   });

  //   // const div = ast.children[0];
  //   // expect(calls.length).toBe(4);
  //   // expect(calls[0]).toMatchObject([
  //   //   ast,
  //   //   {},
  //   //   // TODO
  //   //   //       {
  //   //   //         parent: null,
  //   //   //         currentNode: ast,
  //   //   //       },
  //   // ]);
  //   // expect(calls[1]).toMatchObject([
  //   //   div,
  //   //   {},
  //   //   // TODO
  //   //   //   {
  //   //   //     parent: ast,
  //   //   //     currentNode: div,
  //   //   //   },
  //   // ]);
  //   // expect(calls[2]).toMatchObject([
  //   //   div.children[0],
  //   //   {},
  //   //   //       {
  //   //   //         parent: div,
  //   //   //         currentNode: div.children[0],
  //   //   //       },
  //   // ]);
  //   // expect(calls[3]).toMatchObject([
  //   //   div.children[1],
  //   //   {},
  //   //   //   {
  //   //   //     parent: div,
  //   //   //     currentNode: div.children[1],
  //   //   //   },
  //   // ]);
  // });

  // test("should inject toString helper for interpolations", () => {
  //   const ast = baseParse(`{{ foo }}`);
  //   transform(ast, {});
  //   expect(ast.helpers).toContain(TO_DISPLAY_STRING);
  // });
});
