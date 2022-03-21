/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-03-21 22:47:27
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */

/**
 * @description: 转换根组件
 * @param {*} type 根组件(App)
 * @param {*} props 组件的props
 * @param {*} children 组件嵌套的内容
 * @return {vnode}
 */
export function createdVNode(type, props?, children?) {
  // 将根组件转换为vnode，再将其暴露
  return {
    type,
    props,
    children,
  };
}
