/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-16 16:56:00
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\parse.ts
 *
 */

import { NodeType } from "./ast";

// const DOM_TAG_REG = /^<\/?([a-z]*>$)/;
// const ELEMENT_REG =  /^<[a-z]*>$/

export function baseParse(content: string) {
  const context = createContext(content);
  return createRoot(parseChildren(context, []));
}

// 创建上下文
function createContext(content: string) {
  return {
    source: content,
  };
}

// 创建 ast 根节点
function createRoot(children) {
  return {
    children,
  };
}

// 创建 children
function parseChildren(context: { source: string }, ancestors): any {
  const nodes: any = [];
  while (isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    /** 判断字符串类型
     * 1. 为插值
     * 2. 为element
     */
    if (s.startsWith("{{")) {
      // {{ 开头，即认为是插值
      node = parseInterpolation(context);
    } else if (s.startsWith("<") && /[a-z]/i.test(s[1])) {
      // <开头，并且第二位是a-z，即认为是element类型
      node = parseElement(context, ancestors);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function parseTextData(context: { source: string }, length) {
  return context.source.slice(0, length);
}
function advanceBy(context, length: number) {
  context.source = context.source.slice(length);
}

// 解析插值表达式
function parseInterpolation(context: { source: string }) {
  // 插值开始字符
  const openDelimiter = "{{";
  // 插值结束字符
  const closeDelimiter = "}}";
  // 找到插值结束字符的位置
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  // 切割掉 {{
  advanceBy(context, openDelimiter.length);
  // 找到 }} 前的内容
  const rawContentLength = closeIndex - closeDelimiter.length;
  // 截取插值表达式里的内容
  const content = parseTextData(context, rawContentLength).trim();
  // 完成{{}}的内容匹配，切割掉匹配完成的内容，继续往前推进，解析后面的内容
  advanceBy(context, rawContentLength + closeDelimiter.length);
  return {
    type: NodeType.INTERPOLATION,
    content: {
      type: NodeType.SIMPLE_EXPRESSION,
      content,
    },
  };
}

const enum TagType {
  START,
  END,
}

// 解析element
function parseElement(context: { source: string }, ancestors): any {
  // 这里调用两次 parseTag 处理前后标签
  const element: any = parseTag(context, TagType.START);
  // 收集标签
  ancestors.push(element);
  // 增加 parseChildren，储存包裹的内容
  element.children = parseChildren(context, ancestors);
  // 循环结束，把当前tag弹出标签，进入下一个循环
  ancestors.pop();
  /** 切除闭合标签
   * 1. 当前source标签内容等于首部tag，说明是闭合标签，则进行切除
   * 2. 不相等，则说明没有写闭合标签，报警告
   */
  if (startsWithEndTagOpen(context.source, element.tag)) {
    // 处理闭合标签
    parseTag(context, TagType.END);
  } else {
    throw new Error(`不存在结束标签：${element.tag}`);
  }
  return element;
}

function parseTag(context: { source: string }, type: TagType) {
  // i 忽略大小写, ([a-z]*) 作为一个分组，匹配<开头或者</开头的内容
  const match = /^<\/?([a-z]*)/i.exec(context.source);
  // 其中 tag[1] 就是匹配出来的 div，取反是为了避免为null报错
  const tag = match![1];
  /** 往后推进
   * 1. match[0]匹配出 <div
   * 2. match[0].length + 1，即下标<div>后开始
   */
  advanceBy(context, match![0].length + 1);
  // 处理闭合标签，就不需要return了
  if (type === TagType.END) return;
  return {
    tag,
    type: NodeType.ELEMENT,
  };
}

// 解析text
function parseText(context: { source: string }): any {
  const s = context.source;
  let len = s.length;
  /** 处理element包裹情况
   * 1. 新建一个TAG_ARRAY，用来判断text后可能存在的符号
   * 2. 取最贴近text的符号，因为 < 跟 {{ 可能同时都存在，取最小的，即离text内容最近的
   */
  const TAG_ARRAY = ["<", "{{"];
  for (let i = 0; i < TAG_ARRAY.length; i++) {
    const tag = TAG_ARRAY[i];
    const index = s.indexOf(tag);
    /** 获取text的位置
     * 1. 如果符号存在，并且小于len，取离text最近的内容
     * 例如 hi,</p>{{message}}，会先找到 < 的位置，覆盖len，又找到 {{，但是 {{ 比 len大，说明 {{ 符号在后面，所以不赋值
     * 2. 如果不存在，直接切到最后面即可
     */
    if (index !== -1 && index < len) {
      len = index;
    }
  }
  // 获取当前字符串内容
  const content = parseTextData(context, len);
  // 推进
  advanceBy(context, len);
  return {
    type: NodeType.TEXT,
    content,
  };
}

// 匹配是否结束标签
function isEnd(context: { source: string }, ancestors: any) {
  const s = context.source;
  /** 判断tag是结束标签
   * 1. 判断是否标签，是标签进入循环
   * 2. 从栈顶开始循环，栈是先入后出的，所以根标签会在最底部
   * 3. 判断当前的标签的tag是否跟栈的tag相等，相等则说明当前tag内容已经推导结束，结束当前children循环，进入下一个循环
   */
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      // 如果说栈里存在这个标签，那么就跳出循环
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return false;
      }
    }
  }
  // 返回内容本身
  return s;
}

function startsWithEndTagOpen(source, tag) {
  const endTokenLength = "</".length;
  return source.slice(endTokenLength, tag.length + endTokenLength) === tag;
}
