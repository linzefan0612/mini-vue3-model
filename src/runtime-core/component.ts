/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:08:11
 * @LastEditTime: 2022-03-22 17:34:01
 * @LastEditors: Lin zefan
 * @Description: 处理组件类型
 * @FilePath: \mini-vue3\src\runtime-core\component.ts
 *
 */

import { patch } from "./render";

export function processComponent(vnode, container) {
  // TODO，这里会比较vnode，然后做创建、更新操作，这里先处理创建

  // 创建组件
  mountComponent(vnode, container);

  // TODO，更新组件
  //   updateComponent(vnode, container);
}

// -----------------Component创建流程-------------------
function mountComponent(vnode, container) {
  // 创建component实例
  const instance = createComponentInstance(vnode);
  // setup component
  setupComponent(instance, container);
  // setupRenderEffect
  setupRenderEffect(instance, container);
}

// 初始化Component结构
function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  };
  return component;
}

// 初始化setup数据
function setupComponent(instance, container) {
  // TODO initProps() - 初始化props
  // TODO initSlots() - 初始化slots
  // 初始化setup函数返回值
  setupStatefulComponent(instance, container);
}

// 初始化setup返回值
function setupStatefulComponent(instance, container) {
  /** 获取用户声明的setup函数过程
   * 1. 前面通过createApp将根组件转换为vnode
   * 2. 之后通过createComponentInstance将vnode进行二次包装
   * 3. 最后可以通过instance.type 获取根组件(rootComponent)
   */
  const component = instance.type;
  const { setup } = component;
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}

// 获取 setup() 的返回值并挂载实例
function handleSetupResult(instance, setupResult) {
  /** 这里有setup返回值有两种情况
   * 1. 是一个函数
   * 2. 是一个对象
   */
  // 如果是对象，将对象注入上下文
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  } else {
    // 如果是函数，那么当作render处理TODO
  }

  // 初始化render函数
  finishComponentSetup(instance);
}

// 初始化render函数
function finishComponentSetup(instance) {
  const component = instance.type;
  // 挂载实例的render函数，取当前组件实例声明得render
  if (component.render) {
    instance.render = component.render;
  }
  // 而没有 component.render 咋办捏，其实可以通过编译器来自动生成一个 render 函数
  // 这里先不写
}

function setupRenderEffect(instance, container) {
  // 通过render函数，获取render返回虚拟节点
  const subTree = instance.render();
  // 最后通过patch的processElement，将subTree渲染到container(节点)上
  patch(subTree, container);
}

// ---------------------Component更新流程----------------------
function updateComponent(vnode, container) {}
