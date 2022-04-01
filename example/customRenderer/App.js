/*
 * @Author: Lin zefan
 * @Date: 2022-04-01 21:33:08
 * @LastEditTime: 2022-04-01 21:33:09
 * @LastEditors: Lin zefan
 * @Description: 
 * @FilePath: \mini-vue3\example\customRenderer\App.js
 * 
 */

import { h } from '../../lib/mini-vue.esm.js'

export default {
  setup() {
    return {
      x: 100,
      y: 100,
    }
  },
  render() {
    return h('rect', { x: this.x, y: this.y })
  },
}
