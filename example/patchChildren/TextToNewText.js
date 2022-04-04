/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-04 11:44:41
 * @LastEditTime: 2022-04-04 11:47:02
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\example\patchChildren\TextToNewText.js
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
    return h('div', {}, this.isChange ? 'newChildren' : 'oldChildren')
  },
}
