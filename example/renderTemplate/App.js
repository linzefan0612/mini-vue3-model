/*
 * @Author: Lin ZeFan
 * @Date: 2022-04-20 21:34:55
 * @LastEditTime: 2022-04-20 22:16:33
 * @LastEditors: Lin ZeFan
 * @Description: 
 * @FilePath: \mini-vue3\example\renderTemplate\App.js
 * 
 */
import { ref } from '../../lib/mini-vue.esm.js'

export default {
  setup() {
    const counter = (window.counter = ref(1))
    return {
      message: 'mini-vue',
      counter,
    }
  },
  template: `<div>hi, {{message}}, counter: {{counter}}</div>`,
}
