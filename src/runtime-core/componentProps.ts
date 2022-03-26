/*
 * @Author: Lin zefan
 * @Date: 2022-03-26 10:02:13
 * @LastEditTime: 2022-03-26 10:52:04
 * @LastEditors: Lin zefan
 * @Description: 初始化props
 * @FilePath: \mini-vue3\src\runtime-core\componentProps.ts
 *
 */
export function initProps(instance) {
  /** 初始化props
   * 1. 前面通过h函数去创建我们的节点，它的第二个参数可以接收props
   * 2. h的返回格式 { type: component|string , props:{} , children:[]}
   * 3. 前面又通过createComponentInstance函数去重构实例，所以是通过instance.vnode.props取得当前props
   */
  instance.props = instance.vnode.props || {};
}
