/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-04-01 18:27:13
 * @LastEditors: Lin zefan
 * @Description: 公用hook
 * @FilePath: \mini-vue3\src\shared\index.ts
 *
 */
const extend = Object.assign;
function isObject(obj) {
    return obj !== null && typeof obj === "object";
}
function hasChanged(val, newVal) {
    return Object.is(val, newVal);
}
function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}
// 将 -字母 转换为 大驼
const camelize = (event) => {
    /** replace的第二个参数为函数
     * 参数一：正则匹配的结，即-x
     * 参数二：为\w
     */
    // replace的函数回调有个特点，正则里面只要有()包裹的，判断为分组($1)，都会单独返会一个结果，所以这里参数2是-后的字母，如果(\w)换成\w，那参数2会是匹配结果的下标
    return event.replace(/-(\w)/g, (_, str) => {
        return str.toUpperCase();
    });
};
const capitalize = (event) => {
    // 取出首字母，转换为大写 + 切割掉首字母
    return event ? event.charAt(0).toLocaleUpperCase() + event.slice(1) : "";
};
const handlerEventName = (event) => {
    return "on" + capitalize(camelize(event));
};
const isDom = (rootContainer) => {
    if (typeof rootContainer === "string") {
        return document.querySelector(rootContainer);
    }
    return rootContainer;
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
// 当前活跃的effect实例
let activeEffect;
// 判断是否需要收集
let shouldTrack;
class Effect {
    constructor(fn, scheduler) {
        this.stopFlag = false;
        // 收集所有的dep
        this.depMap = [];
        this._fn = fn;
        this.scheduler = scheduler;
    }
    // 执行effect接收的fn
    run() {
        // 如果执行了stop，不会继续进行收集。
        if (this.stopFlag) {
            return this._fn();
        }
        // 保存当前实例，给track收集
        activeEffect = this;
        // 初始化收集状态
        shouldTrack = true;
        const result = this._fn();
        /** 看得见的思考
         * 1. fn调用(track)后，重置收集状态
         * 2. 避免下一轮fn(track的时候)，如果shouldTrack为true，还会被收集进去
         * 3. track内部判断了shouldTrack，所以要在track后重置收集状态
         */
        shouldTrack = false;
        return result;
    }
    /** 清除当前effect
     * 1. 把所有的dep存起来，再从dep中清除当前的effect
     * 2. 把当前effect从对应的dep中删除，触发依赖的时候就遍历不到该数据
     */
    stop() {
        this.onStop && this.onStop();
        // 避免多次调用
        if (!this.stopFlag) {
            cleanEffect(this);
            this.stopFlag = true;
        }
    }
}
function cleanEffect(effect) {
    effect.depMap.forEach((effects) => {
        effects.delete(effect);
    });
    effect.depMap.length = 0;
}
function stop(runner) {
    runner.effect.stop();
}
function isTracking() {
    // shouldTrack为true并且当前实例不为undefined，就会进行依赖收集
    return shouldTrack && activeEffect !== undefined;
}
// 收集依赖
const targetMap = new Map(); // 所有的依赖，触发依赖的时候会从这里面取
function track(target, key) {
    if (!isTracking())
        return;
    let depMap = targetMap.get(target);
    if (!depMap) {
        depMap = new Map();
        targetMap.set(target, depMap);
    }
    let dep = depMap.get(key);
    if (!dep) {
        dep = new Set();
        depMap.set(key, dep);
    }
    // 提取了收集函数
    trackEffect(dep);
}
function trackEffect(dep) {
    // 收集当前不存在的实例
    !dep.has(activeEffect) && dep.add(activeEffect);
    // 收集当前的dep
    activeEffect.depMap.push(dep);
}
// 触发依赖
function trigger(target, key) {
    let depMap = targetMap.get(target);
    let dep = depMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
            return;
        }
        effect.run();
    }
}
function effect(fn, option = {}) {
    const _effect = new Effect(fn);
    // 初始化执行
    _effect.run();
    // 添加所有option属性
    extend(_effect, option);
    // 实现runner
    const runner = _effect.run.bind(_effect);
    // 把当前effect实例加到runner
    runner.effect = _effect;
    return runner;
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
function createdGetter(isReadonly = false, shallow = false) {
    return function (target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
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
        // 如果是readonly，不会进行收集
        !isReadonly && track(target, key);
        return res;
    };
}
function createdSetter() {
    return function (target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver);
        trigger(target, key);
        return res;
    };
}
// 避免多次创建，这里直接用变量接收~
const get = createdGetter();
const set = createdSetter();
const readonlyGet = createdGetter(true);
const shallowReactiveGet = createdGetter(false, true);
const shallowReadonlyGet = createdGetter(true, true);
const mutableHandles = {
    get,
    set,
};
const readonlyHandles = {
    get: readonlyGet,
    set(target, key, value, receiver) {
        // 给一个警告
        console.warn(`${key}是只读的，因为被readonly包裹了`, target);
        return true;
    },
};
const shallowReadonlyHandles = extend({}, readonlyHandles, {
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
        console.warn(`Proxy的代理必须是一个对象，${raw}不是一个对象`);
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
function emit({ props }, event, ...arg) {
    /**
     * 1. event 为当前emit触发的事件名
     * 2. 根据事件名去找到props注册的对应事件，进行调用
     * 3. arg是emit接收的数据
     */
    const handler = props[handlerEventName(event)];
    handler && handler(...arg);
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
    for (const key in children) {
        if (Object.prototype.hasOwnProperty.call(children, key)) {
            const value = children[key];
            if (typeof value === "function") {
                /**
                 * 1. 如果是一个函数，那初始化的时候就返回一个函数
                 * 2. props为作用域插槽的值，在renderSlots函数中会传递过来
                 */
                const handler = (props) => normalizeSlotValue(value(props));
                slots[key] = handler;
            }
            else {
                // 不是函数，是一个是h对象，或者h对象数组集合
                slots[key] = normalizeSlotValue(value);
            }
        }
    }
}
function normalizeSlotValue(slots) {
    // 统一转换为数组，因为children接收的是一个数组
    return Array.isArray(slots) ? slots : [slots];
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
const PublicInstanceMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        let { setupState, props } = instance;
        // 获取 setup 返回的数据
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        // 获取props数据
        if (hasOwn(props, key)) {
            return props[key];
        }
        // 获取instance实例对象
        const publicGetter = PublicInstanceMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

/*
 * @Author: Lin zefan
 * @Date: 2022-03-17 18:23:36
 * @LastEditTime: 2022-03-21 23:28:20
 * @LastEditors: Lin zefan
 * @Description: ref
 * @FilePath: \mini-vue3\src\reactivity\ref.ts
 *
 */
class RefImpl {
    constructor(value) {
        // ref对象标识
        this.__v_isRef = true;
        /**
         * 1. 需要判断value是基本类型还是引用类型
         * 2. 引用类型需要用reactive包裹，做到深度侦听
         */
        this._value = convert(value);
        this._dep = new Set();
    }
    get value() {
        /** 思考
         * 1. get要收集依赖
         */
        isTracking() && trackEffect(this._dep);
        return this._value;
    }
    set value(newVal) {
        /** 思考
         * 1. 先判断新老值，值不相等再做更新
         * 2. 更新ref.value
         * 3. 更新依赖的值
         */
        if (hasChanged(this._value, newVal))
            return;
        this._value = convert(newVal);
        triggerEffect(this._dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(ref) {
    return new RefImpl(ref);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(ref) {
    return new Proxy(ref, {
        get(target, key) {
            // 需要判断target是ref对象还是其他，ref帮忙提取.value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            /** 思考
             * 1. 新老值对比，如果老值是ref，新值不是，那应该是更新老值的.value
             * 2. 如果新值是ref，直接替换即可
             */
            if (isRef(target[key]) && !isRef(value)) {
                target[key].value = value;
                return target;
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:08:11
 * @LastEditTime: 2022-04-02 11:31:17
 * @LastEditors: Lin zefan
 * @Description: 处理组件类型
 * @FilePath: \mini-vue3\src\runtime-core\component.ts
 *
 */
// 全局变量，接收的是当前实例
let currentInstance = null;
// 初始化Component结构
function createComponentInstance(initVNode, parent) {
    const component = {
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
        emit: () => { },
        // 挂载父组件实例
        parent,
        isMounted: false,
        preTree: {},
    };
    /** 注册emit
     * 1. 通过bind把当前实例给到emit函数
     */
    component.emit = emit.bind(null, component);
    return component;
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
function createProxyInstance(instance) {
    /** 挂载render的this
     * 1. 我们知道render里面可以使用this.xxx，例如setup return的数据、$el、$data等
     * 2. 我们可以借助proxy来挂载我们的实例属性，让proxy代理
     * 3. 最后render的时候，把this指向这个proxy，这样就可以通过 this.xx -> proxy.get(xx) 获取数据
     */
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
}
// 初始化setup返回值
function setupStatefulComponent(instance, container) {
    // 初始化组件代理
    createProxyInstance(instance);
    /** 获取用户声明的setup函数过程
     * 1. 前面通过createApp将根组件转换为vnode
     * 2. 之后通过createComponentInstance将vnode进行二次包装
     * 3. 最后可以通过instance.type 获取根组件(rootComponent)
     */
    const component = instance.type;
    const { setup } = component;
    if (setup) {
        /**
         * 1. setup接收props、context，props是只读的
         * 2. 设置 currentInstance
         * 2. 执行setup函数
         */
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        /** 清除currentInstance
         * 1. 每个组件的getCurrentInstance都是独立的
         * 2. 每次初始化完setup，必须把currentInstance清空，避免影响其他
         * 3. getCurrentInstance 只是 Composition API 的语法糖，清空也能避免其他地方调用
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
        // 利用proxyRefs解构ref对象
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
// 挂载render到实例
function finishComponentSetup(instance) {
    const component = instance.type;
    // 挂载实例的render函数，取当前组件实例声明得render
    if (component.render) {
        instance.render = component.render;
    }
    // TODO而没有 component.render 咋办捏，其实可以通过编译器来自动生成一个 render 函数
    // 这里先不写
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
 * @LastEditTime: 2022-04-01 21:37:13
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\vnode.ts
 *
 */
const TextNode = Symbol("TextNode");
const Fragment = Symbol("Fragment");
/**
 * @description: 转换根组件为vnode
 * @param {*} type 根组件(App)
 * @param {*} props 组件的props
 * @param {*} children 组件嵌套的子组件
 * @return {vnode}
 */
function createdVNode(type, props, children) {
    // 将根组件转换为vnode，再将其暴露
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}
// 创建一个textNode节点
function createTextVNode(text) {
    return createdVNode(TextNode, {}, text);
}
function getShapeFlags(type) {
    return typeof type === "string" ? "element" /* ELEMENT */ : "component" /* COMPONENT */;
}
function getChildrenShapeFlags(children) {
    return typeof children === "string"
        ? "text_children" /* TEXT_CHILDREN */
        : typeof children === "object"
            ? "array_children" /* ARRAY_CHILDREN */
            : "";
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:49:41
 * @LastEditTime: 2022-04-01 22:10:27
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\createdApp.ts
 *
 */
/**
 * 创建一个Vue实例
 * @param renderer render函数，内部调用了patch
 * @param selector selector函数，内部返回一个节点
 * @returns
 */
function createAppAPI(renderer, selector) {
    return function createApp(rootComponent) {
        return {
            // 暴露一个mount方法
            mount(rootContainer) {
                /**
                 * 1. 将根组件(rootComponent)转换为vnode
                 * 2. 再通过render函数将vnode渲染到mount接收的容器(rootContainer)中
                 */
                const vnode = createdVNode(rootComponent);
                renderer(vnode, selector ? selector(rootContainer) : isDom(rootContainer));
            },
        };
    };
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-02 11:44:47
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */
function createRenderer(options) {
    // 改名字是为了 debug 方便
    const { createElement: hostCreateElement, insert: hostInsert, patchProp: hostPatchProp, selector: hostSelector, } = options;
    function render(vnode, container) {
        // 根组件没有父级，所以是null
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        if (!n2)
            return;
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
                if (shapeFlags === "component" /* COMPONENT */) {
                    // 是一个Component
                    processComponent(n1, n2, container, parentComponent);
                }
                else if (shapeFlags === "element" /* ELEMENT */) {
                    // 是一个element
                    processElement(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    // 创建一个Fragment节点
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    // 创建一个TextNode节点
    function processTextNode(vnode, container) {
        const textNode = document.createTextNode(vnode.children);
        container.append(textNode);
    }
    // ---------------------Element----------------------
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            updateElement(n1, n2);
        }
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
        if (shapeFlags === "text_children" /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags === "array_children" /* ARRAY_CHILDREN */) {
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
        console.log("updateElement更新");
        console.log("旧vnode", n1);
        console.log("新vnode", n2);
    }
    // ---------------------Component---------------------------
    function processComponent(n1, n2, container, parentComponent) {
        if (!n1) {
            // 创建组件
            mountComponent(n2, container, parentComponent);
        }
        else {
            // 更新组件
            updateComponent(n1, n2);
        }
    }
    // -----------------Component创建流程-------------------
    function mountComponent(vnode, container, parentComponent) {
        // 初始化Component实例
        const instance = createComponentInstance(vnode, parentComponent);
        // 初始化setup函数return的数据
        setupComponent(instance);
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
                vnode.el = subTree.$el;
                // 更新初始化状态
                instance.isMounted = true;
                // 保存当前vnode
                instance.preTree = subTree;
            }
            else {
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
        type,
        props,
        children,
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
function renderSlots(slots, name = "default", props = {}) {
    /** 返回一个vnode
     * 1. 其本质和 h 是一样的
     * 2. 通过name取到对应的slots
     */
    const slot = slots[name];
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
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { providers } = currentInstance;
        const parentProviders = currentInstance.parent && currentInstance.parent.providers;
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
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        /**
         * 1. 获取的是父元素的providers，而不是自身
         * 2. 所以我们需要把父组件实例注入到实例对象
         */
        const { providers } = currentInstance.parent;
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

/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 16:53:01
 * @LastEditTime: 2022-04-01 22:16:15
 * @LastEditors: Lin zefan
 * @Description: dom渲染
 * @FilePath: \mini-vue3\src\runtime-dom\index.ts
 *
 */
function createElement(type) {
    return document.createElement(type);
}
const isEvents = (key = "") => {
    const reg = /^on[A-Z]/;
    if (reg.test(key)) {
        // onClick -> click
        return key.slice(2).toLocaleLowerCase();
    }
    return "";
};
function patchProp(el, key, props) {
    /** 注册事件
     * 1. 判断是否on开头并包含一个大写字母开头
     * 2. 是的话，截取on后面的内容
     * 3. 注册元素事件
     */
    const val = props[key];
    if (isEvents(key)) {
        el.addEventListener(isEvents(key), val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    parent.appendChild(el);
}
function selector(container) {
    return isDom(container);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    selector,
});
/**
 * 暴露 createApp，这个方法就是创建vue实例的方法
 * @param args 当前的根节点，一般是App.js
 */
const createApp = (...args) => {
    return renderer.createApp(...args);
};

export { Effect, createApp, createAppAPI, createElement, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, insert, isRef, isTracking, patchProp, provide, proxyRefs, ref, renderSlots, selector, stop, track, trackEffect, trigger, triggerEffect, unRef };
