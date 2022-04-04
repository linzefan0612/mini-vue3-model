/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-04 11:44:36
 * @LastEditTime: 2022-04-04 11:46:23
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\example\patchChildren\ArrayToText.js
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
        ? 'newChildren'
        : [h('div', {}, 'oldChildren1'), h('div', {}, 'oldChildren1')]
    )
  },
}
