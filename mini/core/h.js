/*
 * @Author: Lin zefan
 * @Date: 2022-03-12 16:14:22
 * @LastEditTime: 2022-03-12 16:35:29
 * @LastEditors: Lin zefan
 * @Description: 模拟h
 * @FilePath: \mini-vue3\core\h.js
 *
 */

/**
 * @description: 模拟h函数
 * @param {string} tag 标签名
 * @param {Object} props 标签内联数据，id、class等
 * @return {Array|string} 标签内容
 */
export default (tag, props, children) => {
  return {
    tag,
    props,
    children,
  };
};
