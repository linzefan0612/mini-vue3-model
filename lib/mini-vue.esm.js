/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-03-26 10:17:50
 * @LastEditors: Lin zefan
 * @Description: 公用hook
 * @FilePath: \mini-vue3\src\shared\index.ts
 *
 */
var extend = Object.assign;
function isObject(obj) {
    return obj !== null && typeof obj === "object";
}
function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:11:07
 * @LastEditTime: 2022-03-20 14:48:32
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\effect.ts
 *
 */
// 收集依赖
var targetMap = new Map(); // 所有的依赖，触发依赖的时候会从这里面取
// 触发依赖
function trigger(target, key) {
    var depMap = targetMap.get(target);
    var dep = depMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    for (var _i = 0, dep_1 = dep; _i < dep_1.length; _i++) {
        var effect_1 = dep_1[_i];
        if (effect_1.scheduler) {
            effect_1.scheduler();
            return;
        }
        effect_1.run();
    }
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-16 18:30:25
 * @LastEditTime: 2022-03-20 12:09:02
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\baseHandlers.ts
 *
 */
function createdGetter(isReadonly, shallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (shallow === void 0) { shallow = false; }
    return function (target, key, receiver) {
        var res = Reflect.get(target, key, receiver);
        // 判断是否为reactive
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        // 判断是否为readonly
        if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        /** 嵌套转换判断, 思考
         * 1. 如果shallow为true，那就不进行深度转换
         * 2. 没有被深度转换的,是一个普通对象,不会二次转换
         * 3. 即没有readonly深度拦截, 没有reactive的深度对象响应(没有被收集)
         */
        if (isObject(res) && !shallow) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createdSetter() {
    return function (target, key, value, receiver) {
        var res = Reflect.set(target, key, value, receiver);
        trigger(target, key);
        return res;
    };
}
// 避免多次创建，这里直接用变量接收~
var get = createdGetter();
var set = createdSetter();
var readonlyGet = createdGetter(true);
var shallowReactiveGet = createdGetter(false, true);
var shallowReadonlyGet = createdGetter(true, true);
var mutableHandles = {
    get: get,
    set: set,
};
var readonlyHandles = {
    get: readonlyGet,
    set: function (target, key, value, receiver) {
        // 给一个警告
        console.warn("".concat(key, "\u662F\u53EA\u8BFB\u7684\uFF0C\u56E0\u4E3A\u88ABreadonly\u5305\u88F9\u4E86"), target);
        return true;
    },
};
var shallowReadonlyHandles = extend({}, readonlyHandles, {
    get: shallowReadonlyGet,
});
extend({}, mutableHandles, {
    get: shallowReactiveGet,
});

/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:08:22
 * @LastEditTime: 2022-03-26 10:20:19
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\reactivity\index.ts
 *
 */
function createdBaseHandler(raw, baseHandler) {
    if (!isObject(raw)) {
        console.warn("Proxy\u7684\u4EE3\u7406\u5FC5\u987B\u662F\u4E00\u4E2A\u5BF9\u8C61\uFF0C".concat(raw, "\u4E0D\u662F\u4E00\u4E2A\u5BF9\u8C61"));
    }
    return new Proxy(raw, baseHandler);
}
function reactive(raw) {
    return createdBaseHandler(raw, mutableHandles);
}
function readonly(raw) {
    return createdBaseHandler(raw, readonlyHandles);
}
function shallowReadonly(raw) {
    return createdBaseHandler(raw, shallowReadonlyHandles);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-26 10:02:13
 * @LastEditTime: 2022-03-26 10:52:04
 * @LastEditors: Lin zefan
 * @Description: 初始化props
 * @FilePath: \mini-vue3\src\runtime-core\componentProps.ts
 *
 */
function initProps(instance) {
    /** 初始化props
     * 1. 前面通过h函数去创建我们的节点，它的第二个参数可以接收props
     * 2. h的返回格式 { type: component|string , props:{} , children:[]}
     * 3. 前面又通过createComponentInstance函数去重构实例，所以是通过instance.vnode.props取得当前props
     */
    instance.props = instance.vnode.props || {};
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-23 17:52:57
 * @LastEditTime: 2022-03-26 10:56:29
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
        var setupState = instance.setupState, props = instance.props;
        // 获取 setup 返回的数据
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        // 获取props数据
        if (hasOwn(props, key)) {
            return props[key];
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
 * @LastEditTime: 2022-03-26 10:54:57
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
        props: {},
    };
}
// 初始化组件代理
function createProxyInstance(instance) {
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}
// 初始化setup数据
function setupComponent(instance, container) {
    // 初始化props
    initProps(instance);
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
        /**
         * 1. setup接收props
         * 2. 执行setup
         */
        var setupResult = setup(shallowReadonly(instance.props));
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
 * @LastEditTime: 2022-03-25 20:30:08
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
        var val = props[key];
        /** 注册事件
         * 1. 判断是否on开头并包含一个大写字母开头
         * 2. 是的话，截取on后面的内容
         * 3. 注册元素事件
         */
        if (isEvents(key)) {
            el.addEventListener(isEvents(key), val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // 设置元素内容
    mountChildren(children, el, container);
}
function isEvents(key) {
    if (key === void 0) { key = ""; }
    var reg = /^on[A-Z]/;
    if (reg.test(key)) {
        // onClick -> click
        return key.slice(2).toLocaleLowerCase();
    }
    return "";
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

export { createApp, h };
