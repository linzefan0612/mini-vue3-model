'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-03-22 23:24:18
 * @LastEditors: Lin zefan
 * @Description: 公用hook
 * @FilePath: \mini-vue3\src\shared\index.ts
 *
 */
function isObject(obj) {
    return obj !== null && typeof obj === "object";
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-23 17:52:57
 * @LastEditTime: 2022-03-23 22:42:31
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentPublicInstanceProxyHandlers.ts
 *
 */
// 扩展的实例Map
var PublicInstanceMap = {
    $el: function (i) { return i.vnode.el; },
};
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        var setupState = instance.setupState;
        // 获取 setup 返回的数据
        if (key in setupState) {
            return setupState[key];
        }
        // 获取instance实例对象
        var publicGetter = PublicInstanceMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:08:11
 * @LastEditTime: 2022-03-23 22:43:09
 * @LastEditors: Lin zefan
 * @Description: 处理组件类型
 * @FilePath: \mini-vue3\src\runtime-core\component.ts
 *
 */
function processComponent(vnode, container) {
    // TODO，这里会比较vnode，然后做创建、更新操作，这里先处理创建
    // 创建组件
    mountComponent(vnode, container);
    // TODO，更新组件
    //   updateComponent(vnode, container);
}
// -----------------Component创建流程-------------------
function mountComponent(vnode, container) {
    // 初始化Component实例
    var instance = createComponentInstance(vnode);
    // 初始化setup函数return的数据
    setupComponent(instance);
    /** 挂载render的this
     * 1. 我们知道render里面可以使用this.xxx，例如setup return的数据、$el、$data等
     * 2. 我们可以借助proxy来挂载我们的实例属性，让proxy代理
     * 3. 最后render的时候，把this指向这个proxy，这样就可以通过 this.xx -> proxy.get(xx) 获取数据
     */
    createProxyInstance(instance);
    // setupRenderEffect
    setupRenderEffect(instance, container);
}
// 初始化Component结构
function createComponentInstance(initVNode) {
    return {
        vnode: initVNode,
        type: initVNode.type,
        proxy: null,
        setupState: {},
    };
}
// 初始化组件代理
function createProxyInstance(instance) {
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
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
    finishComponentSetup(instance);
}
// 挂载render到实例
function finishComponentSetup(instance) {
    var component = instance.type;
    // 挂载实例的render函数，取当前组件实例声明得render
    if (component.render) {
        instance.render = component.render;
    }
    // TODO而没有 component.render 咋办捏，其实可以通过编译器来自动生成一个 render 函数
    // 这里先不写
}
function setupRenderEffect(instance, container) {
    var proxy = instance.proxy, vnode = instance.vnode;
    // 通过render函数，获取render返回虚拟节点，并绑定render的this
    var subTree = instance.render.call(proxy);
    // 最后通过patch的processElement，将subTree渲染到container(节点)上
    patch(subTree, container);
    /** 挂载当前的dom元素到$el
     * 1. 当遍历完所有Component组件后，会调用processElement
     * 2. 在processElement中，会创建dom元素，把创建的dom元素挂载到传入的vnode里面
     * 3. 当前的dom元素也就是processElement中创建的dom元素
     */
    vnode.el = subTree.$el;
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 17:32:00
 * @LastEditTime: 2022-03-23 17:33:15
 * @LastEditors: Lin zefan
 * @Description: 处理dom
 * @FilePath: \mini-vue3\src\runtime-core\element.ts
 *
 */
// ---------------------Element创建流程----------------------
function processElement(vnode, container) {
    var type = vnode.type, props = vnode.props, children = vnode.children;
    // 创建根元素
    var el = document.createElement(type);
    // 将dom元素挂载到实例
    vnode.$el = el;
    // 设置行内属性
    for (var key in props) {
        el.setAttribute(key, props[key]);
    }
    // 设置元素内容
    mountChildren(children, el, container);
}
function mountChildren(children, el, container) {
    // 普通字符串，就直接插入元素
    if (typeof children === "string") {
        el.textContent = children;
        // 数组，可能存在多个子元素
    }
    else if (Array.isArray(children)) {
        children.forEach(function (h) {
            patch(h, el);
        });
    }
    container.append(el);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-03-22 17:33:25
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */
function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (isObject(vnode.type)) {
        // 是一个Component
        processComponent(vnode, container);
    }
    else if (typeof vnode.type === "string") {
        // 是一个element
        processElement(vnode, container);
    }
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
 * @LastEditTime: 2022-03-22 17:15:09
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\createdApp.ts
 *
 */
// 创建一个Vue实例
function createApp(rootComponent) {
    return {
        // 暴露一个mount方法
        mount: function (rootContainer) {
            /**
             * 1. 将根组件(rootComponent)转换为vnode
             * 2. 再通过render函数将vnode渲染到mount接收的容器(rootContainer)中
             */
            var vnode = createdVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 15:29:16
 * @LastEditTime: 2022-03-22 17:25:30
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
function h(type, props, children) {
    return {
        type: type,
        props: props,
        children: children,
    };
}

exports.createApp = createApp;
exports.h = h;
