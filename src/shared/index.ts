/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-03-26 12:52:58
 * @LastEditors: Lin zefan
 * @Description: 公用hook
 * @FilePath: \mini-vue3\src\shared\index.ts
 *
 */

export const extend = Object.assign;

export function isObject(obj) {
  return obj !== null && typeof obj === "object";
}

export function hasChanged(val, newVal) {
  return Object.is(val, newVal);
}

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}

// 将 -字母 转换为 大驼
export const camelize = (event: string) => {
  /** replace的第二个参数为函数
   * 参数一：正则匹配的结，即-x
   * 参数二：为\w
   */
  // replace的函数回调有个特点，正则里面只要有()包裹的，判断为分组($1)，都会单独返会一个结果，所以这里参数2是-后的字母，如果(\w)换成\w，那参数2会是匹配结果的下标
  return event.replace(/-(\w)/g, (_, str: string) => {
    return str.toUpperCase();
  });
};
export const capitalize = (event: string) => {
  // 取出首字母，转换为大写 + 切割掉首字母
  return event ? event.charAt(0).toLocaleUpperCase() + event.slice(1) : "";
};

export const handlerEventName = (event) => {
  return "on" + capitalize(camelize(event));
};
