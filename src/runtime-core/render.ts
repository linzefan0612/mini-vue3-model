/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-04 12:34:47
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
    patch(null, vnode, container, null);
  }

  /**
   * @param n1 旧vnode
   * @param n2 新vnode
   * @param container 容器
   * @param parentComponent 父组件实例
   */
  function patch(n1, n2, container, parentComponent) {
    if (!n2) return;
    const { type } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case TextNode:
        processTextNode(n2, container);
        break;

      default:
        const shapeFlags = getShapeFlags(type);

        if (shapeFlags === ShapeFlags.COMPONENT) {
          // 是一个Component
          processComponent(n1, n2, container, parentComponent);
        } else if (shapeFlags === ShapeFlags.ELEMENT) {
          // 是一个element
          processElement(n1, n2, container, parentComponent);
        }

        break;
    }
  }

  // 创建一个Fragment节点
  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  // 创建一个TextNode节点
  function processTextNode(vnode: any, container: any) {
    const textNode = document.createTextNode(vnode.children);
    container.append(textNode);
  }

  // ---------------------Element----------------------
  function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      updateElement(n1, n2, container, parentComponent);
    }
  }
  // ---------------------Element创建流程----------------------
  function mountElement(vnode, container, parentComponent) {
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
      mountChildren(children, el, parentComponent);
    }

    hostInsert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((h) => {
      patch(null, h, container, parentComponent);
    });
  }

  // ---------------------Element更新流程----------------------

  function updateElement(n1, n2, container, parentComponent) {
    // 更新props
    patchProps(n1, n2);
    // 更新children
    patchChildren(n1, n2, container, parentComponent);
  }

  function patchProps(n1: any, n2: any) {
    const prevProps = n1.props || EMPTY_OBJECT;
    const nowProps = n2.props || EMPTY_OBJECT;
    // 相等不操作
    if (prevProps === nowProps) return;

    // dom元素取的是旧vnode，覆盖新vnode的el
    const el = (n2.el = n1.el);

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
    parentComponent: any
  ) {
    const { el, children: n1Children } = n1;
    const { children: n2Children } = n2;
    const n1ShapeFlags = getChildrenShapeFlags(n1Children);
    const n2ShapeFlags = getChildrenShapeFlags(n2Children);

    if (n1ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
      if (n2ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
        // text -> text
        // 直接覆盖值
        hostSetElementText(el, n2Children);
      } else {
        /** text -> array
         * 1. 先清空原先的text
         * 2. 再push进新的children
         */
        hostSetElementText(el, "");
        mountChildren(n2Children, el, parentComponent);
      }
    } else {
      if (n2ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
        /** array -> text
         * 1. 删除子元素
         * 2. 重新赋值
         */
        unmountChildren(n1Children);
        hostSetElementText(el, n2Children);
      } else {
        // TODO
        /** array -> array
         *
         */

        console.log("数组转数组");
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
  function processComponent(n1, n2, container, parentComponent) {
    if (!n1) {
      // 创建组件
      mountComponent(n2, container, parentComponent);
    } else {
      // 更新组件
      updateComponent(n1, n2, container, parentComponent);
    }
  }

  // -----------------Component创建流程-------------------
  function mountComponent(vnode, container, parentComponent) {
    // 初始化Component实例
    const instance = createComponentInstance(vnode, parentComponent);
    // 初始化setup函数return的数据
    setupComponent(instance, container);

    // setupRenderEffect
    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance, container) {
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
        patch(null, subTree, container, instance);
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
        // 对比新老vnode
        patch(preTree, nowTree, container, instance);
        // 更新旧的vnode
        instance.preTree = nowTree;
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
