/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-01 21:37:56
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */

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
  } = options;
  // other code ...

  function render(vnode, container) {
    // 根组件没有父级，所以是null
    patch(vnode, container, null);
  }

  function patch(vnode, container, parentComponent) {
    if (!vnode) return;
    const { type } = vnode;

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case TextNode:
        processTextNode(vnode, container);
        break;

      default:
        const shapeFlags = getShapeFlags(type);

        if (shapeFlags === ShapeFlags.COMPONENT) {
          // 是一个Component
          processComponent(vnode, container, parentComponent);
        } else if (shapeFlags === ShapeFlags.ELEMENT) {
          // 是一个element
          processElement(vnode, container, parentComponent);
        }

        break;
    }
  }

  // 创建一个Fragment节点
  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode.children, container, parentComponent);
  }

  // 创建一个TextNode节点
  function processTextNode(vnode: any, container: any) {
    const textNode = document.createTextNode(vnode.children);
    container.append(textNode);
  }

  // ---------------------Element----------------------
  function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }
  // ---------------------Element创建流程----------------------
  function mountElement(vnode, container, parentComponent) {
    const { type, props, children } = vnode;

    // 创建根元素、将元素挂载到实例
    const el = (vnode.$el = hostCreateElement(type));

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
      patch(h, container, parentComponent);
    });
  }

  // ---------------------Component---------------------------
  function processComponent(vnode, container, parentComponent) {
    // TODO，这里会比较vnode，然后做创建、更新操作，这里先处理创建

    // 创建组件
    mountComponent(vnode, container, parentComponent);

    // TODO，更新组件
    //   updateComponent(vnode, container);
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
    const { proxy, vnode } = instance;
    // 通过render函数，获取render返回虚拟节点，并绑定render的this
    const subTree = instance.render.call(proxy);
    /**
     * 1. 调用组件render后把结果再次给到patch
     * 2. 再把对应的dom节点append到container
     * 3. 把当前实例传过去，让子组件可以通过parent获取父组件实例
     */
    patch(subTree, container, instance);
    /** 挂载当前的dom元素到$el
     * 1. 当遍历完所有Component组件后，会调用processElement
     * 2. 在processElement中，会创建dom元素，把创建的dom元素挂载到传入的vnode里面
     * 3. 当前的dom元素也就是processElement中创建的dom元素
     */
    vnode.el = subTree.$el;
  }

  // 暴露
  return {
    // 将createApp方法暴露出去
    createApp: createAppAPI(render, hostSelector),
  };
}
