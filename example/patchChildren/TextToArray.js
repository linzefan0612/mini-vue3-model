/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-04 11:44:45
 * @LastEditTime: 2022-04-04 12:12:55
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\example\patchChildren\TextToArray.js
 * 
 */

import { h, ref } from '../../lib/mini-vue.esm.js'

export default {
  setup() {
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange,
    }
  },
  render() {
    return h(
      'div',
      {},
      this.isChange
        ? [h('div', {}, 'newChildren1'), h('div', {}, 'newChildren2')]
        : 'oldChildrenText'
    )
  },
}
