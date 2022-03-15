<!--
 * @Author: Lin zefan
 * @Date: 2022-03-14 15:29:23
 * @LastEditTime: 2022-03-15 14:46:27
 * @LastEditors: Lin zefan
 * @Description: 初始化项目、配置test
 * @FilePath: \mini-vue3\md\init.md
 *
-->

# 安装 ts

yarn add typescript --dev

# 生成 ts 配置项

npx tsc --init

# 修改 ts 配置项，让其支持 jest

```json
 "types": [
      "jest"
 ]
```

# package.json 新增单元测试命令

```json
 "scripts": {
    "test": "jest"
  },
```

# 下载 jest 依赖包，支持 ts

yarn add jest @types/jest --dev

# 配置 babel，使 jest 支持 esm 语法

1. 支持 Typescript
   yarn add --dev @babel/preset-typescript

2. 配置 babel
   yarn add --dev babel-jest @babel/core @babel/preset-env

```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
```
