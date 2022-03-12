/**
 * @description:
 * @param {*} vnode 虚拟dom
 * @param {*} container 根容器
 */
export function mountElement(vnode, container) {
  const { tag, props, children } = vnode;
  // 创建根节点
  const el = document.createElement(tag || "div");

  // 设置行内属性
  for (const key in props) {
    if (Object.hasOwnProperty.call(props, key)) {
      const element = props[key];
      el.setAttribute(key, element);
    }
  }

  // 设置根节点
  if (typeof children === "string") {
    const childDom = document.createTextNode(children);
    el.append(childDom);
  }
  if (Array.isArray(children)) {
    children.forEach((v) => {
      mountElement(v, el);
    });
  }

  container.append(el);
}
