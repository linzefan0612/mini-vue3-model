/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 15:40:00
 * @LastEditTime: 2022-04-20 22:16:47
 * @LastEditors: Lin ZeFan
 * @Description: 打包入口文件
 * @FilePath: \mini-vue3\src\index.ts
 *
 */

export * from "./runtime-dom";
export * from "./reactivity";
import { baseCompile } from "./compiler-core/src";
import * as runtimeDom from "./runtime-dom";
import { registerCompiler } from "./runtime-dom";

// 创建一个 render 函数
function compileToFunction(template: string) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

// 在这里将 compiler 传入到 component 内部中
registerCompiler(compileToFunction);
