/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 15:34:06
 * @LastEditTime: 2022-03-22 16:31:59
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\rollup.config.js
 *
 */
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";

export default {
  // 入口文件
  input: "./src/index.ts",
  // 出口文件，可以配多个
  output: [
    // cjs - common.js
    {
      // 输出的模块类型
      format: "cjs",
      // 输出的文件名
      file: pkg.cjs,
    },
    // esm - ES-Module
    {
      format: "esm",
      file: pkg.esm,
    },
  ],
  plugins: [
    // 解析ts
    typescript(),
  ],
};
