/**
 * @description: diff
 * @param {*} n1 旧的vnode
 * @param {*} n2 新的vnode
 */
export function diff(n1, n2) {
  const el = n1.el;
  // 对比tag
  if (n1.tag !== n2.tag) {
    // 替换真实dom的tag
    el.replaceWith(document.createElement(n2.tag || "div"));
    return;
  }
  // 对比props
  /** 3种对比情况
   * 1、键一样，值变动 {a:1} -> {a:2}
   * 2、键新增，{a:1} -> {a:1,b:1}
   * 3、键减少，{a:1,b:1} -> {a:1}
   */
  const { props: oProps = {} } = n1;
  const { props: nProps = {} } = n2;
  // 值变动、新增
  if (nProps && oProps) {
    Object.keys(nProps).forEach((key) => {
      if (nProps[key] !== oProps[key]) {
        el.setAttribute(key, nProps[key]);
      }
    });
  }
  // 值减少
  if (oProps) {
    Object.keys(oProps).forEach((key) => {
      !nProps[key] && el.removeAttribute(key);
    });
  }

  // 对比children
  /**
   * 1、同样是string
   * 2、数组与string
   * 3、数组与数组
   */
  const { children: oChild } = n1;
  const { children: nChild } = n2;
  if (typeof nChild === "string") {
    // 直接替换真实dom的数据
    // 1、都是string，新老不相等
    // 2、老的是数组，新的直接覆盖
    if (
      (typeof oChild === "string" && nChild !== oChild) ||
      Array.isArray(oChild)
    ) {
      el.textContent = nChild;
    }
  } else if (Array.isArray(nChild)) {
    // 新的是数组，老的是string，重新生成dom元素
    if (typeof oChild === "string") {
      el.innerHtml = "";
      mountElement(n2, el);
      // 都是数组， -> 暴力解法
    } else if (Array.isArray(oChild)) {
      // 公共部分
      const minLen = Math.min(oChild.length, nChild.length);
      for (let index = 0; minLen; index++) {
        diff(oChild[index], nChild[index]);
      }
      // 新增
      if (nChild.length > minLen) {
        for (let index = minLen; nChild.length; index++) {
          mountElement(nChild[index], el);
        }
      }
      // 删除
      if (oChild.length > minLen) {
        for (let index = minLen; oChild.length; index++) {
          const oldEl = oChild[index] && oChild[index].el;
          // 找到父元素，删除当前元素
          oldEl && oldEl.parent.removeChild(oldEl);
        }
      }
    }
  }
}

/**
 * @description:
 * @param {*} vnode 虚拟dom
 * @param {*} container 根容器
 */
export function mountElement(vnode, container) {
  const { tag, props, children } = vnode;
  // 创建根节点
  const el = document.createElement(tag || "div");
  // 对比虚拟dom时用
  vnode.el = el;

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
