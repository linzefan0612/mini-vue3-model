/*
 * @Author: Lin zefan
 * @Date: 2022-03-21 22:04:58
 * @LastEditTime: 2022-04-09 12:51:09
 * @LastEditors: Lin ZeFan
 * @Description:
 * @FilePath: \mini-vue3\src\runtime-core\render.ts
 *
 */

import { effect } from "../reactivity/effect";
import { EMPTY_OBJECT } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtils";
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
    if (!n2) return;
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

        if (shapeFlags === ShapeFlags.COMPONENT) {
          // 是一个Component
          processComponent(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlags === ShapeFlags.ELEMENT) {
          // 是一个element
          processElement(n1, n2, container, parentComponent, anchor);
        }

        break;
    }
  }

  // 创建一个Fragment节点
  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  // 创建一个TextNode节点
  function processTextNode(vnode: any, container: any) {
    const textNode = document.createTextNode(vnode.children);
    container.append(textNode);
  }

  // ---------------------Element----------------------
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
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
    if (shapeFlags === ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags === ShapeFlags.ARRAY_CHILDREN) {
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

  function patchProps(el, n1: any, n2: any) {
    const prevProps = n1.props || EMPTY_OBJECT;
    const nowProps = n2.props || EMPTY_OBJECT;
    // 相等不操作
    if (prevProps === nowProps) return;

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
    parentComponent: any,
    anchor
  ) {
    const { el, children: n1Child } = n1;
    const { children: n2Child } = n2;
    const n1ShapeFlags = getChildrenShapeFlags(n1Child);
    const n2ShapeFlags = getChildrenShapeFlags(n2Child);

    if (n1ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
      if (n2ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
        // text -> text
        // 直接覆盖值
        hostSetElementText(el, n2Child);
      } else {
        /** text -> array
         * 1. 先清空原先的text
         * 2. 再push进新的children
         */
        hostSetElementText(el, "");
        mountChildren(n2Child, el, parentComponent, anchor);
      }
    } else {
      if (n2ShapeFlags === ShapeFlags.TEXT_CHILDREN) {
        /** array -> text
         * 1. 删除子元素
         * 2. 重新赋值
         */
        unmountChildren(n1Child);
        hostSetElementText(el, n2Child);
      } else {
        patchKeyedChildren(
          n1Child,
          n2Child,
          container,
          parentComponent,
          anchor
        );
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
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
      } else {
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
      } else {
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
    } else if (i > e2 && i <= e1) {
      /** 新的比老的少，删除数据
       * 1. 左侧 i 大于 e2，则新数据比旧数据少，删除对应数据
       * 2. 删除范围在旧数据的长度内
       */
      while (i <= e1) {
        hostRemove(c1[i].el);
        i += 1;
      }
    } else {
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
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

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
        } else {
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
          } else {
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
        } else {
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
        } else if (shouldMove) {
          // 需要移动
          // 1. j 已经没有了 说明剩下的都需要移动了
          // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            // 移动的话使用 insert 即可
            hostInsert(nextChild.el, container, anchor);
          } else {
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
    } else {
      // 更新组件
      updateComponent(n1, n2);
    }
  }

  // -----------------Component创建流程-------------------
  function mountComponent(n2, container, parentComponent, anchor) {
    // 初始化Component实例
    const instance = (n2.component = createComponentInstance(
      n2,
      parentComponent
    ));
    // 初始化setup函数return的数据
    setupComponent(instance, container);

    // setupRenderEffect
    setupRenderEffect(instance, container, anchor);
  }

  function setupRenderEffect(instance, container, anchor) {
    instance.runner = effect(() => {
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
      } else {
        const { proxy, next, vnode } = instance;
        if (next) {
          // 保存当前的dom节点，因为新vnode没有走创建流程，所以没有el
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }
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
    } else {
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

function getSequence(arr: number[]): number[] {
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
        } else {
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
