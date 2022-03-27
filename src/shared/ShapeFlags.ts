/*
 * @Author: Lin zefan
 * @Date: 2022-03-27 15:16:51
 * @LastEditTime: 2022-03-27 15:22:51
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\shared\ShapeFlags.ts
 *
 */

type RootType = "element" | "component" | "";
type ChildrenType = "text_children" | "array_children" | "";

interface ShapeFlagsType {
  root: RootType;
  children: ChildrenType;
  isSlots: boolean;
}
export const ShapeFlags: ShapeFlagsType = {
  root: "",
  children: "",
  isSlots: false,
};
