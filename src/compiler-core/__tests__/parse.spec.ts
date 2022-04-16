/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-16 16:49:27
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\__tests__\parse.spec.ts
 *
 */
// import { ElementTypes, NodeTypes } from "../src/ast";
import { NodeType } from "../src/ast";
import { baseParse } from "../src/parse";

describe("parser", () => {
  test("simple text", () => {
    const textStr = "simple text";
    const ast = baseParse(textStr);
    expect(ast.children[0]).toStrictEqual({
      type: NodeType.TEXT,
      content: "simple text",
    });
  });
  test("simple interpolation", () => {
    // 1. 看看是不是一个 {{ 开头的
    // 2. 是的话，那么就作为 插值来处理
    // 3. 获取内部 message 的内容即可
    const ast = baseParse("{{message  }}");
    const interpolation = ast.children[0];

    expect(interpolation).toStrictEqual({
      type: NodeType.INTERPOLATION,
      content: {
        type: NodeType.SIMPLE_EXPRESSION,
        content: `message`,
      },
    });
  });
  test("simple element", () => {
    const elementStr = "<div></div>";
    const ast = baseParse(elementStr);
    expect(ast.children[0]).toStrictEqual({
      type: NodeType.ELEMENT,
      tag: "div",
      children: [],
    });
  });
  // 三种类型联合
  test("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeType.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeType.TEXT,
          content: "hi,",
        },
        {
          type: NodeType.INTERPOLATION,
          content: {
            type: NodeType.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  test("nested element", () => {
    const ast = baseParse("<div><p>hi,{{ val }}</p>{{message}}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeType.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeType.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeType.TEXT,
              content: "hi,",
            },
            {
              type: NodeType.INTERPOLATION,
              content: {
                type: NodeType.SIMPLE_EXPRESSION,
                content: "val",
              },
            },
          ],
        },
        {
          type: NodeType.INTERPOLATION,
          content: {
            type: NodeType.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  test("should throw error when lack end tag", () => {
    expect(() => {
      baseParse("<div><span></div>");
    }).toThrow();
  });
});
