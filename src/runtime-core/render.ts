/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-05 14:41:17
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */

import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createdApp";
import {
  Fragment,
  getChildrenShapeFlags,
  getShapeFlags,
  TextNode,
} from "./vnode";

export function createRenderer(options) {
  // 改名字是为了 debug 方便
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    patchProp: hostPatchProp,
    selector: hostSelector,
    setElementText: hostSetElementText,
    remove: hostRemove,
  } = options;

  function render(vnode, container) {
    // 根组件没有父级，所以是null
    patch(null, vnode, container, null, null);
  }

  /**
   * @param n1 旧vnode
   * @param n2 新vnode
   * @param container 容器
   * @param parentComponent 父组件实例
   * @param anchor 插入到对应元素的锚点
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    if (!n2) return;
    const { type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case TextNode:
        processTextNode(n2, container);
        break;

      default:
        const shapeFlags = getShapeFlags(type);

        if (shapeFlags === ShapeFlags.COMPONENT) {
          // 是一个Component
          processComponent(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlags === ShapeFlags.ELEMENT) {
          // 是一个element
          processElement(n1, n2, container, parentComponent, anchor);
        }

        break;
    }
  }

  // 创建一个Fragment节点
  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  // 创建一个TextNode节点
  function processTextNode(vnode: any, container: any) {
    const textNode = document.createTextNode(vnode.children);
    container.append(textNode);
  }

  // ---------------------Element----------------------
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      updateElement(n1, n2, container, parentComponent, anchor);
    }
  }
  // ---------------------Element创建流程----------------------
  function mountElement(vnode, container, parentComponent, anchor) {
    const { type, props, children } = vnode;

    // 创建根元素、将元素挂载到实例
    const el = (vnode.el = hostCreateElement(type));

    // 设置行内属性
    for (const key in props) {
      hostPatchProp(el, key, props);
    }

    // 设置children
    const shapeFlags = getChildrenShapeFlags(children);
    if (shapeFlags === ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags === ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent, anchor);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((h) => {
      patch(null, h, container, parentComponent, anchor);
    });
  }

  // ---------------------Element更新流程----------------------

  function updateElement(n1, n2, container, parentComponent, anchor) {
    // dom元素取的是旧vnode，覆盖新vnode的el
    const el = (n2.el = n1.el);
    // 更新props
    patchProps(el, n1, n2);
    // 更新children
    patchChildren(n1, n2, el, parentComponent, anchor);
  }

  function patchProps(el, n1: any, n2: any) {
    const prevProps = n1.props || EMPTY_OBJECT;
    const nowProps = n2.props || EMPTY_OBJECT;
    // 相等不操作
    if (prevProps === nowProps) return;

    // 值新增、变更的情况
    for (const key in nowProps) {
      if (prevProps[key] !== nowProps[key]) {
        hostPatchProp(el, key, nowProps);
      }
    }

    // 旧的props为空，不遍历
    if (EMPTY_OBJECT === prevProps) return;

    // 键不存在删除
    for (const key in prevProps) {
      if (!(key in nowProps)) {
        hostPatchProp(el, key, null);
      }
    }
  }

  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor
  ) {
    const { el, children: n1Child } = n1;
    const { children: n2Child } = n2;
    const n1ShapeFlags = getChildrenShapeFlags(n1Child);
    const n2ShapeFlags = getChildrenShapeFlags(n2Child);

    if (n1ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
      if (n2ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
        // text -> text
        // 直接覆盖值
        hostSetElementText(el, n2Child);
      } else {
        /** text -> array
         * 1. 先清空原先的text
         * 2. 再push进新的children
         */
        hostSetElementText(el, "");
        mountChildren(n2Child, el, parentComponent, anchor);
      }
    } else {
      if (n2ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
        /** array -> text
         * 1. 删除子元素
         * 2. 重新赋值
         */
        unmountChildren(n1Child);
        hostSetElementText(el, n2Child);
      } else {
        patchKeyedChildren(
          n1Child,
          n2Child,
          container,
          parentComponent,
          anchor
        );
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    /** array -> array
     * 1. 左侧对比，取出差异目标下标
     * 2. 右侧对比，锁定当前差异右侧位置
     * 3. 新老对比，新增少删
     */
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    const l2 = c2.length - 1;
    let i = 0;

    // 对比是否相同数据
    function isSameVNode(c1, c2) {
      return c1.key === c2.key && c1.type === c2.type;
    }
    /** 1. 左侧对比，取出左侧差异目标下标
     * 循环的边界在两个数组长度内
     * 从左到右对比，判断相同，继续向右查询，直至差异结束
     */
    while (i <= e1 && i <= e2) {
      if (isSameVNode(c1[i], c2[i])) {
        // 相同，再深度patch
        patch(c1[i], c2[i], container, parentComponent, parentAnchor);
      } else {
        // 有差异，退出循环
        break;
      }
      i++;
    }
    console.log("左侧差异的位置", i);

    /** 2. 右侧对比，锁定右侧差异目标
     * 循环的边界在**左侧差异位置i**到**两个数组长度**之间
     * 在尾部开始判断，所以取的是对应children长度
     * 从右到左对比，判断相同，继续向左查询，直至差异
     */
    while (i <= e1 && i <= e2) {
      if (isSameVNode(c1[e1], c2[e2])) {
        // 相同，再深度patch
        patch(c1[e1], c2[e2], container, parentComponent, parentAnchor);
      } else {
        // 有差异，退出循环
        break;
      }
      e1--;
      e2--;
    }

    console.log("右侧差异位置-旧的", e1);
    console.log("右侧差异位置-新的", e2);

    /** 3. 新的比旧的长，添加元素
     * 1. 改写insert，支持插入到对应位置
     * 2. i 为新老数据左侧的差异位置，e1、e2为数据右侧的差异位置
     * 3. i > e1，说明新的比旧的长，需要插入数据
     * 4. i > e2，说明新的比旧的短，需要删除数据
     */

    if (i > e1 && i <= e2) {
      /** 新的比老的多，插入数据
       * 1. 左侧 i 大于 e1，说明新数据比旧数据多，要把新数据插入
       * 2. 添加范围在新数据长度内
       */

      /** nextPos用来判断插入数据的位置
       * 1. nextPos为新数据差异位的后一个元素的锚点位置
       * 2. 如果锚点超出新数据children长度，则没有找到对应的锚点元素，则插到尾部
       * 3. 如果锚点在新数据children长度范围内，则取到对应的下标元素作为锚点元素，插到对应的位置
       */
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
      while (i <= e2) {
        // 新增数据，走mountElement逻辑
        patch(null, c2[i], container, parentComponent, anchor);
        i += 1;
      }
    } else if (i > e2 && i <= e1) {
      /** 新的比老的少，删除数据
       * 1. 左侧 i 大于 e2，则新数据比旧数据少，删除对应数据
       * 2. 删除范围在旧数据的长度内
       */
      while (i <= e1) {
        hostRemove(c1[i].el);
        i += 1;
      }
    } else {
      /** 数据等长，中间对比
       * 1. 提取新数据的key，旧数据遍历时，用来提取对应key的数据
       * 2. 遍历旧数据，找到与旧数据key对应的新数据，赋值给newIndex
       * 3. 遍历旧数据，若newIndex有值，则patch对应newIndex的数据，若没值，直接删除当前下标的旧数据
       */
      let s1,
        s2 = i;

      // 新节点的个数，用来判断遍历次数
      const toBePatched = e2 - s2 + 1;
      // patch 过的次数
      let patched = 0;

      // 提取新数据的key
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 遍历老数据，判断当前元素是否在新数据中
      for (let i = s1; i < e1; i++) {
        // 旧节点当前数据
        const prevChild = e1[i];
        
        // 新旧节点对比相同时，存储的新节点对应下标，用于patch对应数据
        let newIndex;

        // 如果当前 patched 的次数 >= 应该 patch 的总数，则说明是多余的旧数据，直接做删除
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        // key不为空，匹配对应key的新数据
        if (prevChild.key) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 没有key，遍历新数据逐个对比
          for (let j = s2; j <= e2; j++) {
            if (isSameVNode(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // newIndex不为空，新老对比，深度patch
        if (newIndex) {
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          // 每次patch都加一次patched次数
          patched++;
        } else {
          // 没有找到相同数据，则删除当前数据
          hostRemove(prevChild.el);
        }
      }
    }
  }
  function unmountChildren(child) {
    for (let index = 0; index < child.length; index++) {
      // 是一个h对象，当前dom元素存在el
      const element = child[index] && child[index].el;
      hostRemove(element);
    }
  }
  // ---------------------Component---------------------------
  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // 创建组件
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      // 更新组件
      updateComponent(n1, n2, container, parentComponent);
    }
  }

  // -----------------Component创建流程-------------------
  function mountComponent(vnode, container, parentComponent, anchor) {
    // 初始化Component实例
    const instance = createComponentInstance(vnode, parentComponent);
    // 初始化setup函数return的数据
    setupComponent(instance, container);

    // setupRenderEffect
    setupRenderEffect(instance, container, anchor);
  }

  function setupRenderEffect(instance, container, anchor) {
    effect(() => {
      // 初始化vnode
      if (!instance.isMounted) {
        let { proxy, vnode } = instance;
        // 通过render函数，获取render返回虚拟节点，并绑定render的this
        const subTree = instance.render.call(proxy);
        /**
         * 1. 调用组件render后把结果再次给到patch
         * 2. 再把对应的dom节点append到container
         * 3. 把当前实例传过去，让子组件可以通过parent获取父组件实例
         */
        patch(null, subTree, container, instance, anchor);
        /** 挂载当前的dom元素到$el
         * 1. 当遍历完所有Component组件后，会调用processElement
         * 2. 在processElement中，会创建dom元素，把创建的dom元素挂载到传入的vnode里面
         * 3. 当前的dom元素也就是processElement中创建的dom元素
         */
        vnode.el = subTree.el;
        // 更新初始化状态
        instance.isMounted = true;
        // 保存当前vnode
        instance.preTree = subTree;
      } else {
        let { proxy } = instance;
        // 通过render函数，获取render返回虚拟节点，并绑定render的this
        const nowTree = instance.render.call(proxy);
        // 旧vnode
        const preTree = instance.preTree;
        // 更新旧的vnode
        instance.preTree = nowTree;
        // 对比新老vnode
        patch(preTree, nowTree, container, instance, anchor);
      }
    });
  }

  // -----------------Component更新流程-------------------
  function updateComponent(n1, n2, container, parentComponent) {
    console.log("updateComponent更新");
    console.log("旧vnode", n1);
    console.log("新vnode", n2);
  }

  // 暴露
  return {
    /** 将createApp方法暴露出去
     * 参数一为 render渲染函数，调用patch
     * 参数二为 是一个函数，返回一个节点，是可选的
     */
    createApp: createAppAPI(render, hostSelector),
  };
}
