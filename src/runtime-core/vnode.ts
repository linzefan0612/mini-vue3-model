/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-03-27 15:29:08
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */

// import { ShapeFlags } from "../shared/ShapeFlags";
// import { isObject } from "../shared/index";

/**
 * @description: 转换根组件为vnode
 * @param {*} type 根组件(App)
 * @param {*} props 组件的props
 * @param {*} children 组件嵌套的子组件
 * @return {vnode}
 */
export function createdVNode(type, props?, children?) {
  // ShapeFlags.root =
  //   type && typeof type === "string"
  //     ? "element"
  //     : isObject(type)
  //     ? "component"
  //     : "";
  // 将根组件转换为vnode，再将其暴露
  return {
    type,
    props,
    children,
  };
}
