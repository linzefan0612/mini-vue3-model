/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 14:00:10
 * @LastEditTime: 2022-04-01 15:32:51
 * @LastEditors: Lin zefan
 * @Description: shapeFlags
 * @FilePath: \mini-vue3\src\shared\ShapeFlags.ts
 *
 */

/**
 * element：vnode.type === string
 * stateful_component：isObject(vnode.type)
 * text_children：vnode.type === string
 * array_children：Array.isArray(children)
 */

// export const enum ShapeFlags {
//   ELEMENT = 1,
//   STATEFUL_COMPONENT = 1 << 1,
//   TEXT_CHILDREN = 1 << 2,
//   ARRAY_CHILDREN = 1 << 3,
// }
 export const enum ShapeFlags {
  ELEMENT = "element",
  COMPONENT = "component",
  TEXT_CHILDREN = "text_children",
  ARRAY_CHILDREN = "array_children",
}
