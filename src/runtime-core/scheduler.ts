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
const queue: any[] = [];
// 当前队列调用状态
let isFlushPending = false;
const P = Promise.resolve();

export function queueJobs(job) {
  // 不存在时再添加进去
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

export function nextTick(fn) {
  return fn ? P.then(fn) : P;
}

function queueFlush() {
  if (isFlushPending) return;
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
