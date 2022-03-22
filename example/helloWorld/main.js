/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:46:14
 * @LastEditTime: 2022-03-22 17:14:50
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\example\helloWorld\main.js
 *
 */

import { createApp } from "../../lib/mini-vue.esm.js";
import App from "./App.js";

// 这里跟vue一样，通过createApp创建Vue实例，再通过mount挂载到对应节点
const rootContainer = document.querySelector("#root");
createApp(App).mount(rootContainer);
