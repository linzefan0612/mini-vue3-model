import { createApp } from "../../lib/mini-vue.esm.js";
import App from "./App.js";

// 这里跟vue一样，通过createApp创建Vue实例，再通过mount挂载到对应节点
const rootContainer = document.querySelector("#root");
createApp(App).mount(rootContainer);
