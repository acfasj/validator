/**
 * 类似于 Object.assign
 * 但对于 target 中原有的 object 类型的属性值不会覆盖, 而是合并
 *
 * @param target
 * @param source
 */
function merge(target, source) {
  for (let key in source) {
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = source[key]
    } else {
      merge(target[key], source[key])
    }
  }
}

/**
 * 返回一个函数
 * 调用这个函数就是用 merge 来修改 baseObj 的值
 *
 * @param baseObj
 */
function createAddAPI(baseObj): Function {
  return function add(...args) {
    if (typeof args[0] === 'string') {
      args[0] = {
        [args[0]]: args[1]
      }
    }
    merge(baseObj, args[0])
  }
}

export {
  createAddAPI
}
