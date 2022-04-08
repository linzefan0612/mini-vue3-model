/*
 * @Author: Lin zefan
 * @Date: 2022-03-15 19:28:09
 * @LastEditTime: 2022-04-02 15:18:03
 * @LastEditors: Lin zefan
 * @Description: 公用hook
 * @FilePath: windowmini-vue3windowsrcwindowsharedwindowindex.ts
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
 * @LastEditTime: 2022-04-02 15:00:18
 * @LastEditors: Lin zefan
 * @Description:
 * @FilePath: windowmini-vue3windowsrcwindowreactivitywindowbaseHandlers.ts
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
 * @LastEditTime: 2022-04-02 15:19:43
 * @LastEditors: Lin zefan
 * @Description: ref
 * @FilePath: windowmini-vue3windowsrcwindowreactivitywindowref.ts
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
 * @LastEditTime: 2022-04-04 23:17:46
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
 * @LastEditTime: 2022-04-08 19:55:43
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
 * @LastEditTime: 2022-04-08 21:07:41
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
                    patch(null, nextChild, container, anchor, parentComponent);
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
    // function patchKeyedChildren(
    //   c1: any[],
    //   c2: any[],
    //   container,
    //   parentAnchor,
    //   parentComponent
    // ) {
    //   let i = 0;
    //   const l2 = c2.length;
    //   let e1 = c1.length - 1;
    //   let e2 = l2 - 1;
    //   const isSameVNodeType = (n1, n2) => {
    //     console.log(n1, n2);
    //     return n1.type === n2.type && n1.key === n2.key;
    //   };
    //   while (i <= e1 && i <= e2) {
    //     const prevChild = c1[i];
    //     const nextChild = c2[i];
    //     if (!isSameVNodeType(prevChild, nextChild)) {
    //       console.log("两个 child 不相等(从左往右比对)");
    //       console.log(`prevChild:${prevChild}`);
    //       console.log(`nextChild:${nextChild}`);
    //       break;
    //     }
    //     console.log("两个 child 相等，接下来对比这两个 child 节点(从左往右比对)");
    //     patch(prevChild, nextChild, container, parentAnchor, parentComponent);
    //     i++;
    //   }
    //   console.log("左侧i", i);
    //   while (i <= e1 && i <= e2) {
    //     // 从右向左取值
    //     const prevChild = c1[e1];
    //     const nextChild = c2[e2];
    //     if (!isSameVNodeType(prevChild, nextChild)) {
    //       console.log("两个 child 不相等(从右往左比对)");
    //       console.log(`prevChild:${prevChild}`);
    //       console.log(`nextChild:${nextChild}`);
    //       break;
    //     }
    //     console.log("两个 child 相等，接下来对比这两个 child 节点(从右往左比对)");
    //     patch(prevChild, nextChild, container, parentAnchor, parentComponent);
    //     e1--;
    //     e2--;
    //   }
    //   console.log("e1", e1);
    //   console.log("e2", e2);
    //   if (i > e1 && i <= e2) {
    //     // 如果是这种情况的话就说明 e2 也就是新节点的数量大于旧节点的数量
    //     // 也就是说新增了 vnode
    //     // 应该循环 c2
    //     // 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题
    //     // 要添加的位置是当前的位置(e2 开始)+1
    //     // 因为对于往左侧添加的话，应该获取到 c2 的第一个元素
    //     // 所以我们需要从 e2 + 1 取到锚点的位置
    //     const nextPos = e2 + 1;
    //     const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
    //     while (i <= e2) {
    //       console.log(`需要新创建一个 vnode: ${c2[i].key}`);
    //       patch(null, c2[i], container, anchor, parentComponent);
    //       i++;
    //     }
    //   } else if (i > e2 && i <= e1) {
    //     // 这种情况的话说明新节点的数量是小于旧节点的数量的
    //     // 那么我们就需要把多余的
    //     while (i <= e1) {
    //       console.log(`需要删除当前的 vnode: ${c1[i].key}`);
    //       hostRemove(c1[i].el);
    //       i++;
    //     }
    //   } else {
    //     // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
    //     // 例如下面的情况
    //     // a,b,[c,d,e],f,g
    //     // a,b,[e,c,d],f,g
    //     let s1 = i;
    //     let s2 = i;
    //     const keyToNewIndexMap = new Map();
    //     let moved = false;
    //     let maxNewIndexSoFar = 0;
    //     // 先把 key 和 newIndex 绑定好，方便后续基于 key 找到 newIndex
    //     // 时间复杂度是 O(1)
    //     for (let i = s2; i <= e2; i++) {
    //       const nextChild = c2[i];
    //       keyToNewIndexMap.set(nextChild.key, i);
    //     }
    //     // 需要处理新节点的数量
    //     const toBePatched = e2 - s2 + 1;
    //     let patched = 0;
    //     // 初始化 从新的index映射为老的index
    //     // 创建数组的时候给定数组的长度，这个是性能最快的写法
    //     const newIndexToOldIndexMap = new Array(toBePatched);
    //     // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
    //     for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
    //     // 遍历老节点
    //     // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
    //     // 2. 新老节点都有的，—> 需要 patch
    //     for (i = s1; i <= e1; i++) {
    //       const prevChild = c1[i];
    //       // 优化点
    //       // 如果老的节点大于新节点的数量的话，那么这里在处理老节点的时候就直接删除即可
    //       if (patched >= toBePatched) {
    //         hostRemove(prevChild.el);
    //         continue;
    //       }
    //       let newIndex;
    //       if (prevChild.key != null) {
    //         // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
    //         // 时间复杂度O(1)
    //         newIndex = keyToNewIndexMap.get(prevChild.key);
    //       } else {
    //         // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
    //         // 时间复杂度O(n)
    //         for (let j = s2; j <= e2; j++) {
    //           if (isSameVNodeType(prevChild, c2[j])) {
    //             newIndex = j;
    //             break;
    //           }
    //         }
    //       }
    //       // 因为有可能 nextIndex 的值为0（0也是正常值）
    //       // 所以需要通过值是不是 undefined 或者 null 来判断
    //       if (newIndex === undefined) {
    //         // 当前节点的key 不存在于 newChildren 中，需要把当前节点给删除掉
    //         hostRemove(prevChild.el);
    //       } else {
    //         // 新老节点都存在
    //         console.log("新老节点都存在");
    //         // 把新节点的索引和老的节点的索引建立映射关系
    //         // i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在老的节点中不存在)
    //         newIndexToOldIndexMap[newIndex - s2] = i + 1;
    //         // 来确定中间的节点是不是需要移动
    //         // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
    //         // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
    //         // 不是升序的话，我们就可以确定节点移动过了
    //         if (newIndex >= maxNewIndexSoFar) {
    //           maxNewIndexSoFar = newIndex;
    //         } else {
    //           moved = true;
    //         }
    //         patch(prevChild, c2[newIndex], container, null, parentComponent);
    //         patched++;
    //       }
    //     }
    //     // 利用最长递增子序列来优化移动逻辑
    //     // 因为元素是升序的话，那么这些元素就是不需要移动的
    //     // 而我们就可以通过最长递增子序列来获取到升序的列表
    //     // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
    //     // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
    //     // getSequence 返回的是 newIndexToOldIndexMap 的索引值
    //     // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
    //     const increasingNewIndexSequence = moved
    //       ? getSequence(newIndexToOldIndexMap)
    //       : [];
    //     let j = increasingNewIndexSequence.length - 1;
    //     // 遍历新节点
    //     // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
    //     // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]
    //     // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
    //     // 因为 insert 逻辑是使用的 insertBefore()
    //     for (let i = toBePatched - 1; i >= 0; i--) {
    //       // 确定当前要处理的节点索引
    //       const nextIndex = s2 + i;
    //       const nextChild = c2[nextIndex];
    //       // 锚点等于当前节点索引+1
    //       // 也就是当前节点的后面一个节点(又因为是倒遍历，所以锚点是位置确定的节点)
    //       const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
    //       if (newIndexToOldIndexMap[i] === 0) {
    //         // 说明新节点在老的里面不存在
    //         // 需要创建
    //         patch(null, nextChild, container, anchor, parentComponent);
    //       } else if (moved) {
    //         // 需要移动
    //         // 1. j 已经没有了 说明剩下的都需要移动了
    //         // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
    //         if (j < 0 || increasingNewIndexSequence[j] !== i) {
    //           // 移动的话使用 insert 即可
    //           hostInsert(nextChild.el, container, anchor);
    //         } else {
    //           // 这里就是命中了  index 和 最长递增子序列的值
    //           // 所以可以移动指针了
    //           j--;
    //         }
    //       }
    //     }
    //   }
    // }
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
    function mountComponent(vnode, container, parentComponent, anchor) {
        // 初始化Component实例
        const instance = createComponentInstance(vnode, parentComponent);
        // 初始化setup函数return的数据
        setupComponent(instance);
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
            }
            else {
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

export { Effect, createApp, createAppAPI, createElement, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, insert, isRef, isTracking, patchProp, provide, proxyRefs, ref, remove, renderSlots, selector, setElementText, stop, track, trackEffect, trigger, triggerEffect, unRef };
