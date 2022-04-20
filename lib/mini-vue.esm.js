/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-04-20 21:59:05
 * @LastEditors: Lin ZeFan
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
const EMPTY_OBJECT = {};
function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 13:11:07
 * @LastEditTime: 2022-04-02 14:10:29
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: windowmini-vue3windowsrcwindowreactivitywindoweffect.ts
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
    if (depMap) {
        let dep = depMap.get(key);
        triggerEffect(dep);
    }
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
 * @LastEditTime: 2022-04-20 21:02:44
 * @LastEditors: Lin ZeFan
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
 * @LastEditTime: 2022-04-02 13:05:11
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
function isReadonly(raw) {
    // 双取反是为了兼容返回undefined
    return !!raw["__v_isReadonly" /* IS_READONLY */];
}
function isReactive(raw) {
    // 双取反是为了兼容返回undefined
    return !!raw["__v_isReactive" /* IS_REACTIVE */];
}
function isProxy(raw) {
    // 双取反是为了兼容返回undefined
    return isReadonly(raw) || isReactive(raw);
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
 * @LastEditTime: 2022-04-09 10:43:19
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentPublicInstanceProxyHandlers.ts
 *
 */
// 扩展的实例Map
const PublicInstanceMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
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
 * @LastEditTime: 2022-04-20 21:02:47
 * @LastEditors: Lin ZeFan
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
 * @LastEditTime: 2022-04-20 21:46:17
 * @LastEditors: Lin ZeFan
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
        component: null,
        // effect
        runner: null,
        next: null,
        // 挂载this
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
    else if (component.template && compiler) {
        // 没有写 render，但是写了template
        instance.render = compiler(component.template);
    }
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerCompiler(_compiler) {
    compiler = _compiler;
}

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-09 12:04:52
 * @LastEditTime: 2022-04-09 12:04:53
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\componentUpdateUtils.ts
 *
 */
function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 21:58:19
 * @LastEditTime: 2022-04-09 10:57:05
 * @LastEditors: Lin ZeFan
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
        key: props === null || props === void 0 ? void 0 : props.key,
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
    return typeof children === "string" || isNumber(children)
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
 * @Author: Lin ZeFan
 * @Date: 2022-04-09 13:35:06
 * @LastEditTime: 2022-04-09 15:08:18
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\scheduler.ts
 *
 */
// 队列
const queue = [];
// 当前队列调用状态
let isFlushPending = false;
const P = Promise.resolve();
function queueJobs(job) {
    // 不存在时再添加进去
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function nextTick(fn) {
    return fn ? P.then(fn) : P;
}
function queueFlush() {
    if (isFlushPending)
        return;
    // 通过pending flag来阻止多次调用
    isFlushPending = true;
    // 把当前任务放进了微任务队列
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-20 22:32:12
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */
function createRenderer(options) {
    // 改名字是为了 debug 方便
    const { createElement: hostCreateElement, insert: hostInsert, patchProp: hostPatchProp, selector: hostSelector, setElementText: hostSetElementText, remove: hostRemove, } = options;
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
        if (!n2)
            return;
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
                if (shapeFlags === "component" /* COMPONENT */) {
                    // 是一个Component
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlags === "element" /* ELEMENT */) {
                    // 是一个element
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    // 创建一个Fragment节点
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    // 创建一个TextNode节点
    function processTextNode(vnode, container) {
        const textNode = document.createTextNode(vnode.children);
        container.append(textNode);
    }
    // ---------------------Element----------------------
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
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
        if (shapeFlags === "text_children" /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags === "array_children" /* ARRAY_CHILDREN */) {
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
    function patchProps(el, n1, n2) {
        const prevProps = n1.props || EMPTY_OBJECT;
        const nowProps = n2.props || EMPTY_OBJECT;
        // 相等不操作
        if (prevProps === nowProps)
            return;
        // 值新增、变更的情况
        for (const key in nowProps) {
            if (prevProps[key] !== nowProps[key]) {
                hostPatchProp(el, key, nowProps);
            }
        }
        // 旧的props为空，不遍历
        if (EMPTY_OBJECT === prevProps)
            return;
        // 键不存在删除
        for (const key in prevProps) {
            if (!(key in nowProps)) {
                hostPatchProp(el, key, null);
            }
        }
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { el, children: n1Child } = n1;
        const { children: n2Child } = n2;
        const n1ShapeFlags = getChildrenShapeFlags(n1Child);
        const n2ShapeFlags = getChildrenShapeFlags(n2Child);
        if (n1ShapeFlags === "text_children" /* TEXT_CHILDREN */) {
            if (n2ShapeFlags === "text_children" /* TEXT_CHILDREN */) {
                // text -> text
                // 直接覆盖值
                hostSetElementText(el, n2Child);
            }
            else {
                /** text -> array
                 * 1. 先清空原先的text
                 * 2. 再push进新的children
                 */
                hostSetElementText(el, "");
                mountChildren(n2Child, el, parentComponent, anchor);
            }
        }
        else {
            if (n2ShapeFlags === "text_children" /* TEXT_CHILDREN */) {
                /** array -> text
                 * 1. 删除子元素
                 * 2. 重新赋值
                 */
                unmountChildren(n1Child);
                hostSetElementText(el, n2Child);
            }
            else {
                patchKeyedChildren(n1Child, n2Child, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
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
            }
            else {
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
            }
            else {
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
         * 5. 中间混乱数据对比
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
        }
        else if (i > e2 && i <= e1) {
            /** 新的比老的少，删除数据
             * 1. 左侧 i 大于 e2，则新数据比旧数据少，删除对应数据
             * 2. 删除范围在旧数据的长度内
             */
            while (i <= e1) {
                hostRemove(c1[i].el);
                i += 1;
            }
        }
        else {
            /** 数据等长，中间对比
             * 1. 提取新数据的key，旧数据遍历时，用来提取对应key的数据
             * 2. 遍历旧数据，找到与旧数据key对应的新数据，赋值给newIndex
             * 3. 遍历旧数据，若newIndex有值，则patch对应newIndex的数据，若没值，直接删除当前下标的旧数据
             */
            let s1 = i;
            let s2 = i;
            // 新节点的个数，用来判断遍历次数
            const toBePatched = e2 - s2 + 1;
            // patch 过的次数
            let patched = 0;
            // 当前元素是否需要移动判断标识
            let shouldMove = false;
            // 目前最大的索引
            let maxNewIndexSoFar = 0;
            // 提取新数据的key
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            /** 创建一个定长数组，用来储存旧节点的混乱元素节点
             * 1. 初始化索引，0 表示未建立映射关系
             */
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            // 遍历老数据，判断当前元素是否在新数据中
            for (let i = s1; i <= e1; i++) {
                // 旧节点当前数据
                const prevChild = c1[i];
                // 新旧节点对比相同时，新节点的对应下标
                let newIndex;
                // 新老数据对比相同的次数，如果超过新数据长度，则说明是多余的数据，后面的直接删除即可
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 匹配旧数据的key，匹配上返回对应的新数据下标
                if (prevChild && prevChild.key) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 旧数据没有key，采用遍历新数据，再逐个对比
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNode(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                /** 匹配上数据，深度patch
                 * 1. patch新老数据，更新内部改动
                 * 2. patched++，记录patch调用次数，用于超出长度判断
                 * 3. 储存映射索引，用于设置中间混乱数据
                 */
                if (newIndex) {
                    // 在储存索引的时候
                    // 判断是否需要移动
                    // 如果说当前的索引 >= 记录的最大索引
                    if (newIndex >= maxNewIndexSoFar) {
                        // 就把当前的索引给到最大的索引
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        // 否则就不是一直递增，那么就是需要移动的
                        shouldMove = true;
                    }
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    // 记录patch次数
                    patched++;
                    /** 设置对应旧节点在新节点上的位置
                     * 1. 把新节点的索引和老的节点的索引建立映射关系
                     * 2. newIndex - s2 是让下标从最左边开始排
                     * 3. i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在老的节点中不存在，0也是我们初始化状态)
                     */
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                }
                else {
                    // 没有找到相同数据，则删除当前数据
                    hostRemove(prevChild.el);
                }
            }
            /** 最长递增子序列
             * 1. 元素是升序的话，那么这些元素就是不需要移动的
             * 2. 移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
             * 3. 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
             * 4. getSequence 返回的是 newIndexToOldIndexMap 的索引值
             * 5. 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
             */
            const increasingNewIndexSequence = shouldMove
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 需要两个指针 i,j
            // j 指向获取出来的最长递增子序列的索引
            // i 指向我们新节点
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 获取元素的索引，当前i加上左侧差异位
                const nextIndex = i + s2;
                // 获取到需要插入的元素
                const nextChild = c2[nextIndex];
                // 获取锚点
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 说明新节点在老的里面不存在，需要创建
                    // 因为前面初始化索引为0，如果存在0则说明，有未创建的数据
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (shouldMove) {
                    // 需要移动
                    // 1. j 已经没有了 说明剩下的都需要移动了
                    // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
                    if (j < 0 || increasingNewIndexSequence[j] !== i) {
                        // 移动的话使用 insert 即可
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 这里就是命中了  index 和 最长递增子序列的值
                        // 所以可以移动指针了
                        j--;
                    }
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
        }
        else {
            // 更新组件
            updateComponent(n1, n2);
        }
    }
    // -----------------Component创建流程-------------------
    function mountComponent(n2, container, parentComponent, anchor) {
        // 初始化Component实例
        const instance = (n2.component = createComponentInstance(n2, parentComponent));
        // 初始化setup函数return的数据
        setupComponent(instance);
        // setupRenderEffect
        setupRenderEffect(instance, container, anchor);
    }
    function renderComponentInstance(instance) {
        const { proxy } = instance;
        return instance.render.call(proxy, proxy);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.runner = effect(() => {
            // 初始化vnode
            if (!instance.isMounted) {
                let { vnode } = instance;
                // 通过render函数，获取render返回虚拟节点，并绑定render的this，并把this传出去
                const subTree = renderComponentInstance(instance);
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
            }
            else {
                const { next, vnode } = instance;
                if (next) {
                    // 保存当前的dom节点，因为新vnode没有走创建流程，所以没有el
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                // 通过render函数，获取render返回虚拟节点，并绑定render的this
                const nowTree = renderComponentInstance(instance);
                // 旧vnode
                const preTree = instance.preTree;
                // 更新旧的vnode
                instance.preTree = nowTree;
                // 对比新老vnode
                patch(preTree, nowTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                // 将本次 update 加入到任务队列中
                queueJobs(instance.runner);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        // 更新当前虚拟节点
        instance.vnode = nextVNode;
        // 更新当前的props
        instance.props = nextVNode.props;
        // 把next清空
        nextVNode = null;
    }
    // -----------------Component更新流程-------------------
    function updateComponent(n1, n2) {
        /** 更新组件
         * 1. 获取当前组件实例
         * 2. 对比props数据，若有变更，则走更新逻辑；否则直接将vnode替换即可
         * 2. 保存当前新的vnode，在触发更新时做数据更新
         * 3. 利用runner来触发更新逻辑
         */
        const instance = (n2.component = n1.component);
        /** 需要更新props
         * 1. 保存新的vnode数据
         * 2. 触发runner再次调用更新逻辑
         */
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.runner();
        }
        else {
            // 不需要更新props，更新当前vnode即可
            n2.el = n1.el;
            instance.vnode = n2;
        }
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
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 15:29:16
 * @LastEditTime: 2022-04-08 19:55:19
 * @LastEditors: Lin ZeFan
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
    return createdVNode(type, props, children);
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
 * @Author: Lin ZeFan
 * @Date: 2022-04-20 21:49:05
 * @LastEditTime: 2022-04-20 21:57:56
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\shared\toDisplayString.ts
 *
 */
function toDisplayString(str) {
    return String(str);
}

/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 16:53:01
 * @LastEditTime: 2022-04-05 13:22:20
 * @LastEditors: Lin ZeFan
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
    const val = (props && props[key]) || null;
    /** 注册事件
     * 1. 判断是否on开头并包含一个大写字母开头
     * 2. 是的话，截取on后面的内容
     * 3. 注册元素事件
     */
    if (isEvents(key)) {
        el.addEventListener(isEvents(key), val);
    }
    else {
        // 如果当前的值是空的，那要把对应的行内属性删除
        if (val === undefined || val === null) {
            el.removeAttribute(key);
            return;
        }
        el.setAttribute(key, val);
    }
}
function insert(el, parent, anchor) {
    /** 根据锚点插入到对应位置
     * 1. anchor为null默认插到尾部
     * 2. anchor不为空，则插到anchor对应的元素之前
     */
    parent.insertBefore(el, anchor || null);
}
function selector(container) {
    return isDom(container);
}
function setElementText(el, text) {
    el.textContent = text;
}
function remove(child) {
    const parentNode = child.parentNode;
    parentNode && parentNode.removeChild(child);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    selector,
    setElementText,
    remove,
});
/**
 * 暴露 createApp，这个方法就是创建vue实例的方法
 * @param args 当前的根节点，一般是App.js
 */
const createApp = (...args) => {
    return renderer.createApp(...args);
};

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement,
    patchProp: patchProp,
    insert: insert,
    selector: selector,
    setElementText: setElementText,
    remove: remove,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createdVNode,
    getCurrentInstance: getCurrentInstance,
    registerCompiler: registerCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    createAppAPI: createAppAPI
});

/*
 * @Author: Lin zefan
 * @Date: 2022-03-18 17:23:33
 * @LastEditTime: 2022-03-18 18:28:34
 * @LastEditors: Lin zefan
 * @Description: 实现 computed
 * @FilePath: \mini-vue3\src\reactivity\computed.ts
 *
 */
class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true;
        /** 思考
         * 1. 需要借助effect的进行依赖收集，这里我们直接用effect的类
         * 2. 借助scheduler来重置_dirty，加上!this._dirty判断避免多次执行。
         */
        this._effect = new Effect(getter, () => {
            !this._dirty && (this._dirty = true);
        });
    }
    get value() {
        /** 思考
         * 1. 这里用了_dirty做缓存判断，什么时候需要更新呢？
         * 2. 依赖的缓存数据更新时，就需要把_dirty重置，更新value的值
         * 3. 借助scheduler来重置_dirty
         */
        // 缓存
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 12:10:36
 * @LastEditTime: 2022-04-17 13:11:36
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\runtimeHelpers.ts
 *
 */
const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const HelperNameMapping = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 16:03:37
 * @LastEditTime: 2022-04-17 16:34:18
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\utils.ts
 *
 */
const isString = (val) => val && typeof val === "string";
const isArray = (val) => val && Array.isArray(val);
function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-17 10:40:19
 * @LastEditTime: 2022-04-20 22:20:45
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\codegen.ts
 *
 */
function generate(ast) {
    const context = createCodeGenContext();
    const { push } = context;
    // 处理头部函数引入
    if (ast.helpers.length) {
        genFunctionPreamble(ast, context);
    }
    const funcName = "render";
    push(`return `);
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(`function ${funcName}(${signature}) { `);
    push(`return `);
    genNode(ast.codegenNode, context);
    push(` }`);
    return context.code;
}
function genNode(node, context) {
    // 根据 node 的类型进行不同的处理
    switch (node.type) {
        case 3 /* TEXT */:
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
    }
}
function genExpression(node, context) {
    // 处理 SIMPLE_EXPRESSION
    const { push } = context;
    push(`${node.content}`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    // 前面处理插值类型的时候，真正的值是包在content.content里的
    // { type: NodeType.INTERPOLATION, content: { type: NodeType.SIMPLE_EXPRESSION, content: 'message'} }
    genNode(node.content, context);
    push(`)`);
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // 批量处理 tag，props 和 children，优化空值情况
    genNodeList(genNullable([tag, props, children]), context);
    push(`)`);
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        /** 处理node list
         * 1. 如果是text，直接拼接
         * 2. 如果是数组，遍历数组，把每一项再通过 genNode 检测类型
         * 3. 如果是对象，给 genNode 检测类型
         */
        if (isString(node)) {
            push(`${node}`);
        }
        else if (isArray(node)) {
            for (let j = 0; j < node.length; j++) {
                const n = node[j];
                genNode(n, context);
            }
        }
        else {
            genNode(node, context);
        }
        // 遍历完，加上分隔符
        i < nodes.length - 1 && push(", ");
    }
}
function genNullable(args) {
    // 把undefined、null，转为 “null”
    return args.map((arg) => arg || "null");
}
function genCompoundExpression(node, context) {
    const { children } = node;
    const { push } = context;
    // 对 children 进行遍历
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 如果是 string，也就是我们手动添加的 +
        if (isString(child)) {
            // 直接 push
            push(child);
        }
        else {
            // 否则还是走 genNode
            genNode(child, context);
        }
    }
}
function createCodeGenContext() {
    const context = {
        code: "",
        helper(key) {
            return `_${HelperNameMapping[key]}`;
        },
        push(source) {
            context.code += source;
        },
        addLine() {
            context.code += "\n";
        },
    };
    return context;
}
function genFunctionPreamble(ast, context) {
    // 引入都来自 Vue
    const VueBinding = "Vue";
    const { push, addLine } = context;
    // 因为是Symbol，需要用映射表匹配
    const aliasHelper = (s) => `${HelperNameMapping[s]} : _${HelperNameMapping[s]}`;
    // 处理头部引入
    push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinding}`);
    addLine();
}

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-10 10:45:42
 * @LastEditTime: 2022-04-17 11:45:51
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\parse.ts
 *
 */
// const DOM_TAG_REG = /^<\/?([a-z]*>$)/;
// const ELEMENT_REG =  /^<[a-z]*>$/
function baseParse(content) {
    const context = createContext(content);
    return createRoot(parseChildren(context, []));
}
// 创建上下文
function createContext(content) {
    return {
        source: content,
    };
}
// 创建 ast 根节点
function createRoot(children) {
    return {
        children,
        type: 4 /* ROOT */,
    };
}
// 创建 children
function parseChildren(context, ancestors) {
    const nodes = [];
    while (isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        /** 判断字符串类型
         * 1. 为插值
         * 2. 为element
         */
        if (s.startsWith("{{")) {
            // {{ 开头，即认为是插值
            node = parseInterpolation(context);
        }
        else if (s.startsWith("<") && /[a-z]/i.test(s[1])) {
            // <开头，并且第二位是a-z，即认为是element类型
            node = parseElement(context, ancestors);
        }
        else {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function parseTextData(context, length) {
    return context.source.slice(0, length);
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
// 解析插值表达式
function parseInterpolation(context) {
    // 插值开始字符
    const openDelimiter = "{{";
    // 插值结束字符
    const closeDelimiter = "}}";
    // 找到插值结束字符的位置
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // 切割掉 {{
    advanceBy(context, openDelimiter.length);
    // 找到 }} 前的内容
    const rawContentLength = closeIndex - closeDelimiter.length;
    // 截取插值表达式里的内容
    const content = parseTextData(context, rawContentLength).trim();
    // 完成{{}}的内容匹配，切割掉匹配完成的内容，继续往前推进，解析后面的内容
    advanceBy(context, rawContentLength + closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content,
        },
    };
}
// 解析element
function parseElement(context, ancestors) {
    // 这里调用两次 parseTag 处理前后标签
    const element = parseTag(context, 0 /* START */);
    // 收集标签
    ancestors.push(element);
    // 增加 parseChildren，储存包裹的内容
    element.children = parseChildren(context, ancestors);
    // 循环结束，把当前tag删除
    ancestors.pop();
    /** 切除闭合标签
     * 1. 当前tag等于首部tag，说明是闭合标签，则进行切除
     * 2. 不相等，则说明没有写闭合标签，报警告
     */
    if (startsWithEndTagOpen(context.source, element.tag)) {
        // 处理闭合标签
        parseTag(context, 1 /* END */);
    }
    else {
        throw new Error(`不存在结束标签：${element.tag}`);
    }
    return element;
}
function parseTag(context, type) {
    // i 忽略大小写, ([a-z]*) 作为一个分组，匹配<开头或者</开头的内容
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    // 其中 tag[1] 就是匹配出来的 div，取反是为了避免为null报错
    const tag = match[1];
    /** 往后推进
     * 1. match[0]匹配出 <div
     * 2. match[0].length + 1，即下标<div>后开始
     */
    advanceBy(context, match[0].length + 1);
    // 处理闭合标签，就不需要return了
    if (type === 1 /* END */)
        return;
    return {
        tag,
        type: 2 /* ELEMENT */,
    };
}
// 解析text
function parseText(context) {
    const s = context.source;
    let len = s.length;
    /** 处理element包裹情况
     * 1. 新建一个TAG_ARRAY，用来判断text后可能存在的符号
     * 2. 取最贴近text的符号，因为 < 跟 {{ 可能同时都存在，取最小的，即离text内容最近的
     */
    const TAG_ARRAY = ["<", "{{"];
    for (let i = 0; i < TAG_ARRAY.length; i++) {
        const tag = TAG_ARRAY[i];
        const index = s.indexOf(tag);
        /** 获取text的位置
         * 1. 如果符号存在，并且小于len，取离text最近的内容
         * 例如 hi,</p>{{message}}，会先找到 < 的位置，覆盖len，又找到 {{，但是 {{ 比 len大，说明 {{ 符号在后面，所以不赋值
         * 2. 如果不存在，直接切到最后面即可
         */
        if (index !== -1 && index < len) {
            len = index;
        }
    }
    // 获取当前字符串内容
    const content = parseTextData(context, len);
    // 推进
    advanceBy(context, len);
    return {
        type: 3 /* TEXT */,
        content,
    };
}
// 匹配是否结束标签
function isEnd(context, ancestors) {
    const s = context.source;
    /** 是否结束标签
     * 1. 判断是否</开头，是则进入循环
     * 2. 从栈顶开始循环，栈是先入后出的，所以要从最底部开始循环
     * 3. 判断当前的标签的tag是否跟栈的tag相等，相等则说明当前tag内容已经推导结束，需要结束当前children循环，进入下一个循环
     */
    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            // 如果说栈里存在这个标签，那么就跳出循环
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return false;
            }
        }
    }
    // 返回内容本身
    return s;
}
function startsWithEndTagOpen(source, tag) {
    const endTokenLength = "</".length;
    return source.slice(endTokenLength, tag.length + endTokenLength) === tag;
}

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-16 22:33:45
 * @LastEditTime: 2022-04-17 16:18:02
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\transform.ts
 *
 */
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createdRootCodegen(root);
    // 储存所有头部引入
    root.helpers = [...context.helpers.keys()];
}
function createTransformContext(root, options) {
    const { nodeTransforms = [] } = options;
    const context = {
        root,
        nodeTransforms: nodeTransforms || [],
        helpers: new Map(),
        helper(name) {
            this.helpers.set(name, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    const { nodeTransforms } = context;
    const exitFns = [];
    for (let index = 0; index < nodeTransforms.length; index++) {
        const transform = nodeTransforms[index];
        const exitFn = transform(node, context);
        // 收集退出函数
        if (exitFn)
            exitFns.push(exitFn);
    }
    // 在这里遍历整棵树的时候，将根据不同的 node 的类型存入不同的 helper
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            // 只有在 ROOT 和 ELEMENT 才会存在 children
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    // 执行所有的退出函数
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        traverseNode(children[i], context);
    }
}
function createdRootCodegen(root) {
    const child = root.children[0];
    // 在这里进行判断，如果说 children[0] 的类型是 ELEMENT，那么直接修改为 child.codegenNode
    if (child.type === 2 /* ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        // 添加相关的helper
        context.helper(CREATE_ELEMENT_VNODE);
        // 中间处理层，处理 props 和 tag
        const vnodeTag = `'${node.tag}'`;
        const vnodeProps = node.props;
        const { children } = node;
        let vnodeChildren = children;
        const vnodeElement = {
            type: 2 /* ELEMENT */,
            tag: vnodeTag,
            props: vnodeProps,
            children: vnodeChildren,
        };
        node.codegenNode = vnodeElement;
    }
}

// 处理多层包装
function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function transformText(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        // 在 exit 的时期执行
        // 下面的逻辑会改变 ast 树
        // 有些逻辑是需要在改变之前做处理的
        return () => {
            // hi,{{msg}}
            // 上面的模块会生成2个节点，一个是 text 一个是 interpolation 的话
            // 生成的 render 函数应该为 "hi," + _toDisplayString(_ctx.msg)
            // 这里面就会涉及到添加一个 “+” 操作符
            // 那这里的逻辑就是处理它
            // 检测下一个节点是不是 text 类型，如果是的话， 那么会创建一个 COMPOUND 类型
            // COMPOUND 类型把 2个 text || interpolation 包裹（相当于是父级容器）
            const children = node.children;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    // 看看下一个节点是不是 text 类
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        // currentContainer 的目的是把相邻的节点都放到一个 容器内
                        if (!currentContainer) {
                            currentContainer = children[i] = {
                                type: 5 /* COMPOUND_EXPRESSION */,
                                loc: child.loc,
                                children: [child],
                            };
                        }
                        currentContainer.children.push(` + `, next);
                        // 把当前的节点放到容器内, 然后删除掉j
                        children.splice(j, 1);
                        // 因为把 j 删除了，所以这里就少了一个元素，那么 j 需要 --
                        j--;
                    }
                }
                else {
                    currentContainer = undefined;
                }
            }
        };
    }
}

/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-20 20:47:43
 * @LastEditTime: 2022-04-20 20:49:25
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\compiler-core\src\compiler.ts
 *
 */
// 暴露编译方法
function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    const code = generate(ast);
    return {
        code,
    };
}

/*
 * @Author: Lin zefan
 * @Date: 2022-03-22 15:40:00
 * @LastEditTime: 2022-04-20 22:16:47
 * @LastEditors: Lin ZeFan
 * @Description: 打包入口文件
 * @FilePath: \mini-vue3\src\index.ts
 *
 */
// 创建一个 render 函数
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
// 在这里将 compiler 传入到 component 内部中
registerCompiler(compileToFunction);

export { computed, createApp, createAppAPI, createElement, createdVNode as createElementVNode, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, insert, isProxy, isReactive, isReadonly, isRef, nextTick, patchProp, provide, proxyRefs, reactive, readonly, ref, registerCompiler, remove, renderSlots, selector, setElementText, shallowReadonly, stop, toDisplayString, unRef };
