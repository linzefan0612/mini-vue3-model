/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 14:00:10
 * @LastEditTime: 2022-04-01 15:53:36
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

export const enum ShapeFlags {
  ELEMENT = "element",
  COMPONENT = "component",
  TEXT_CHILDREN = "text_children",
  ARRAY_CHILDREN = "array_children",
}
