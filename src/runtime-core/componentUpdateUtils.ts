/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-09 12:04:52
 * @LastEditTime: 2022-04-09 12:04:53
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentUpdateUtils.ts
 *
 */

export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
