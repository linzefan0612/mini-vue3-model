'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:08:11
 * @LastEditTime: 2022-03-21 23:02:02
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\component.ts
 *
 */
function processComponent(vnode, container) {
    // TODO，这里会比较vnode，然后做创建、更新操作，这里先处理创建
    // 创建组件
    mountComponent(vnode);
    // TODO，更新组件
    //   updateComponent(vnode, container);
}
// -----------------创建流程-------------------
function mountComponent(vnode, container) {
    // 创建component实例
    var instance = createComponentInstance(vnode);
    // setup component
    setupComponent(instance);
    // setupRenderEffect
    setupRenderEffect(instance);
}
// 初始化Component结构
function createComponentInstance(vnode) {
    var component = {
        vnode: vnode,
        type: vnode.type,
    };
    return component;
}
// 初始化setup数据
function setupComponent(instance, container) {
    // TODO initProps() - 初始化props
    // TODO initSlots() - 初始化slots
    // 初始化setup函数返回值
    setupStatefulComponent(instance);
}
// 初始化setup返回值
function setupStatefulComponent(instance, container) {
    /** 获取用户声明的setup函数过程
     * 1. 前面通过createApp将根组件转换为vnode
     * 2. 之后通过createComponentInstance将vnode进行二次包装
     * 3. 最后可以通过instance.type 获取根组件(rootComponent)
     */
    var component = instance.type;
    var setup = component.setup;
    if (setup) {
        var setupResult = setup();
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
    }
    // 初始化render函数
    finishComponentSetup(instance);
}
// 初始化render函数
function finishComponentSetup(instance) {
    var component = instance.type;
    // 挂载实例的render函数，取当前组件实例声明得render
    if (!instance.render && component.render) {
        instance.render = component.render;
    }
    // 而没有 component.render 咋办捏，其实可以通过编译器来自动生成一个 render 函数
    // 这里先不写
}
function setupRenderEffect(instance, container) {
    // 通过render函数，获取render返回虚拟节点
    var subTree = instance.render();
    // 最后通过patch的processElement，将subTree渲染到container(节点)上
    patch(subTree);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-03-21 22:10:06
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */
function render(vnode, container) {
    // 调用patch方法，里面会判断vnode类型
    patch(vnode);
}
function patch(vnode, container) {
    // TODO，先处理Component类型，Element类型稍后做
    processComponent(vnode);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-03-21 23:11:23
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */
/**
 * @description: 转换根组件为vnode
 * @param {*} type 根组件(App)
 * @param {*} props 组件的props
 * @param {*} children 组件嵌套的子组件
 * @return {vnode}
 */
function createdVNode(type, props, children) {
    // 将根组件转换为vnode，再将其暴露
    return {
        type: type,
        props: props,
        children: children,
    };
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:49:41
 * @LastEditTime: 2022-03-21 22:21:44
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\createdApp.ts
 *
 */
// 创建一个Vue实例
function createdApp(rootComponent) {
    return {
        // 暴露一个mount方法
        mount: function (rootContainer) {
            /**
             * 1. 将根组件(rootComponent)转换为vnode
             * 2. 再通过render函数将vnode渲染到mount接收的容器(rootContainer)中
             */
            var vnode = createdVNode(rootComponent);
            render(vnode);
        },
    };
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 15:29:16
 * @LastEditTime: 2022-03-22 15:30:41
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\h.ts
 *
 */
/**
 * @description: 转换根组件为vnode
 * @param {*} type 对应的标签
 * @param {*} props 标签的props
 * @param {*} children 组件嵌套的子组件
 * @return {Element}
 */
function h(type, props, children) { }

exports.createdApp = createdApp;
exports.h = h;
