/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-03-26 12:52:58
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
// 将 -字母 转换为 大驼
var camelize = function (event) {
    /** replace的第二个参数为函数
     * 参数一：正则匹配的结，即-x
     * 参数二：为\w
     */
    // replace的函数回调有个特点，正则里面只要有()包裹的，判断为分组($1)，都会单独返会一个结果，所以这里参数2是-后的字母，如果(\w)换成\w，那参数2会是匹配结果的下标
    return event.replace(/-(\w)/g, function (_, str) {
        return str.toUpperCase();
    });
};
var capitalize = function (event) {
    // 取出首字母，转换为大写 + 切割掉首字母
    return event ? event.charAt(0).toLocaleUpperCase() + event.slice(1) : "";
};
var handlerEventName = function (event) {
    return "on" + capitalize(camelize(event));
};

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
 * @Date: 2022-03-26 11:27:22
 * @LastEditTime: 2022-03-26 13:04:08
 * @LastEditors: Lin zefan
 * @Description: emit
 * @FilePath: \mini-vue3\src\runtime-core\componentEmit.ts
 *
 */
function emit(_a, event) {
    var props = _a.props;
    var arg = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        arg[_i - 2] = arguments[_i];
    }
    /**
     * 1. event 为当前emit触发的事件名
     * 2. 根据事件名去找到props注册的对应事件，进行调用
     * 3. arg是emit接收的数据
     */
    var handler = props[handlerEventName(event)];
    handler && handler.apply(void 0, arg);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-26 10:02:13
 * @LastEditTime: 2022-03-27 11:36:05
 * @LastEditors: Lin zefan
 * @Description: 初始化props
 * @FilePath: \mini-vue3\src\runtime-core\componentProps.ts
 *
 */
function initProps(instance, props) {
    /** 初始化props
     * 1. 前面通过h函数去创建我们的节点，它的第二个参数可以接收props
     * 2. h的返回格式 { type: component|string , props:{} , children:[]}
     * 3. 前面又通过createComponentInstance函数去重构实例，所以是通过instance.vnode.props取得当前props
     */
    instance.props = props || {};
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-23 17:52:57
 * @LastEditTime: 2022-03-27 11:35:10
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentPublicInstanceProxyHandlers.ts
 *
 */
// 扩展的实例Map
var PublicInstanceMap = {
    $el: function (i) { return i.vnode.el; },
    $slots: function (i) { return i.slots; },
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
 * @Date: 2022-03-27 11:18:29
 * @LastEditTime: 2022-03-27 14:18:07
 * @LastEditors: Lin zefan
 * @Description: 初始化slot
 * @FilePath: \mini-vue3\src\runtime-core\componentSlot.ts
 *
 */
function initSlots(instance, children) {
    normalizeSlotObject(children, instance.slots);
}
function normalizeSlotObject(children, slots) {
    var _loop_1 = function (key) {
        if (Object.prototype.hasOwnProperty.call(children, key)) {
            var value_1 = children[key];
            if (typeof value_1 === "function") {
                /**
                 * 1. 如果是一个函数，那初始化的时候就返回一个函数
                 * 2. props为作用域插槽的值，在renderSlots函数中会传递过来
                 */
                var handler = function (props) { return normalizeSlotValue(value_1(props)); };
                slots[key] = handler;
            }
            else {
                // 不是函数，是一个是h对象，或者h对象数组集合
                slots[key] = normalizeSlotValue(value_1);
            }
        }
    };
    for (var key in children) {
        _loop_1(key);
    }
}
function normalizeSlotValue(slots) {
    // 统一转换为数组，因为children接收的是一个数组
    return Array.isArray(slots) ? slots : [slots];
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:08:11
 * @LastEditTime: 2022-04-01 12:38:15
 * @LastEditors: Lin zefan
 * @Description: 处理组件类型
 * @FilePath: \mini-vue3\src\runtime-core\component.ts
 *
 */
// 全局变量，接收的是当前实例
var currentInstance = null;
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
    var instance = createComponentInstance(vnode, parentComponent);
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
function createComponentInstance(initVNode, parent) {
    var component = {
        vnode: initVNode,
        type: initVNode.type,
        proxy: null,
        setupState: {},
        props: {},
        slots: {},
        /** 当前的 providers 指向父级的 providers，解决跨层取值，但是有缺陷
         * 1. 引用的关系会影响父组件，当子组件注入同名的foo，就会影响到父组件的foo
         * const father = { foo:1};
           const children = father;
           children.foo =2;
           console.log(father, children)
         */
        providers: parent ? parent.providers : {},
        emit: function () { },
        // 挂载父组件实例
        parent: parent,
    };
    /** 注册emit
     * 1. 通过bind把当前实例给到emit函数
     */
    component.emit = emit.bind(null, component);
    return component;
}
// 初始化组件代理
function createProxyInstance(instance) {
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}
// 初始化setup数据
function setupComponent(instance, container) {
    // 初始化props
    initProps(instance, instance.vnode.props);
    // 初始化slots
    initSlots(instance, instance.vnode.children);
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
         * 1. setup接收props、context
         * 2. 设置 currentInstance
         * 2. 执行setup
         */
        setCurrentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        /** 清除currentInstance
         * 1. 每个组件的getCurrentInstance都是独立的
         * 2. 每次初始化完setup，必须把currentInstance清空，避免影响其他
         * 3. getCurrentInstance 只是 Composition API 的语法糖
         */
        setCurrentInstance(null);
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
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-04-01 15:33:08
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */
var TextNode = Symbol("TextNode");
var Fragment = Symbol("Fragment");
/**
 * @description: 转换根组件为vnode
 * @param {*} type 根组件(App)
 * @param {*} props 组件的props
 * @param {*} children 组件嵌套的子组件
 * @return {vnode}
 */
function createdVNode(type, props, children) {
    // 将根组件转换为vnode，再将其暴露
    var vnode = {
        type: type,
        props: props,
        children: children,
        // shapeFlags: getShapeFlags(type),
    };
    // 还要对于 children 进行处理
    // if (typeof children === "string") {
    //   // 或运算符，vnode.shapeFlags | ShapeFlags.TEXT_CHILDREN
    //   // 这里其实非常巧妙，例如我们现在是 0001，0001 | 0100 = 0101
    //   vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
    // } else if (Array.isArray(children)) {
    //   // 这里也是同理
    //   vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
    // }
    return vnode;
}
// 创建一个textNode节点
function createTextVNode(text) {
    return createdVNode(TextNode, {}, text);
}
// export function getShapeFlags(type) {
//   return typeof type === "string"
//     ? ShapeFlags.ELEMENT
//     : ShapeFlags.STATEFUL_COMPONENT;
// }
function getShapeFlags(type) {
    return typeof type === "string" ? "element" /* ELEMENT */ : "component" /* COMPONENT */;
}
function getChildrenShapeFlags(children) {
    return typeof children === "string"
        ? "text_children" /* TEXT_CHILDREN */
        : "array_children" /* ARRAY_CHILDREN */;
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 17:32:00
 * @LastEditTime: 2022-04-01 15:46:12
 * @LastEditors: Lin zefan
 * @Description: 处理dom
 * @FilePath: \mini-vue3\src\runtime-core\element.ts
 *
 */
// ---------------------Element创建流程----------------------
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
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
function mountElement(vnode, container, parentComponent) {
    var type = vnode.type, props = vnode.props, children = vnode.children;
    // 创建根元素、将dom元素挂载到实例
    var el = (vnode.$el = document.createElement(type));
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
    var shapeFlags = getChildrenShapeFlags(children);
    // 设置children
    if (shapeFlags === "text_children" /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlags === "array_children" /* ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
    }
    container.append(el);
}
function mountChildren(children, container, parentComponent) {
    children.forEach(function (h) {
        patch(h, container, parentComponent);
    });
}
// 创建一个Fragment节点
function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode.children, container, parentComponent);
}
// 创建一个TextNode节点
function processTextNode(vnode, container) {
    var textNode = document.createTextNode(vnode.children);
    container.append(textNode);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-01 15:46:23
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */
function render(vnode, container) {
    // 根组件没有父级，所以是null
    patch(vnode, container, null);
}
function patch(vnode, container, parentComponent) {
    if (!vnode)
        return;
    var type = vnode.type;
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case TextNode:
            processTextNode(vnode, container);
            break;
        default:
            var shapeFlags = getShapeFlags(type);
            if (shapeFlags === "component" /* COMPONENT */) {
                // 是一个Component
                processComponent(vnode, container, parentComponent);
            }
            else if (shapeFlags === "element" /* ELEMENT */) {
                // 是一个element
                processElement(vnode, container, parentComponent);
            }
            break;
    }
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

/*
 * @Author: Lin zefan
 * @Date: 2022-03-27 12:03:47
 * @LastEditTime: 2022-03-30 21:45:42
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\helpers\renderSlots.ts
 *
 */
function renderSlots(slots, name, props) {
    if (name === void 0) { name = "default"; }
    if (props === void 0) { props = {}; }
    /** 返回一个vnode
     * 1. 其本质和 h 是一样的
     * 2. 通过name取到对应的slots
     */
    var slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 是一个函数，需要调用函数，并把当前作用域插槽的数据传过去，把调用结果渲染处理
            return createdVNode(Fragment, {}, slot(props));
        }
        // 不是函数，是h对象，或者h对象数组集合
        return createdVNode(Fragment, {}, slot);
    }
    else {
        return console.warn("没有找到对应的插槽");
    }
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-31 18:34:20
 * @LastEditTime: 2022-04-01 13:56:43
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\apiInject.ts
 *
 */
function provide(key, value) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var providers = currentInstance.providers;
        var parentProviders = currentInstance.parent && currentInstance.parent.providers;
        /** 初始化判断
         * 1. 根组件没有parent，这个判断不会走
         * 2. 判断当前providers与父级providers是否相等，相等即初始化
         */
        if (providers === parentProviders) {
            /** 初始化组件providers
             * 1. 通过Object.create创建一个新对象，避免引用导致的问题
             * 2. 通过Object.create传入父组件数据，Object.create内部会挂载prototype
             * 3. 当前组件获取不到数据，可以通过prototype向上级寻找（原型链）
             */
            providers = currentInstance.providers = Object.create(parentProviders);
        }
        providers[key] = value;
    }
}
function inject(key, defaultVal) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        /**
         * 1. 获取的是父元素的providers，而不是自身
         * 2. 所以我们需要把父组件实例注入到实例对象
         */
        var providers = currentInstance.parent.providers;
        // 支持默认值，string | array
        if (!providers[key] && defaultVal) {
            if (typeof defaultVal === "function") {
                return defaultVal();
            }
            return defaultVal;
        }
        return providers[key];
    }
}

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, renderSlots };
