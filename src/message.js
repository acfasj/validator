import { createAddAPI } from './helper'

/**
 * rule 和 message 能否不因为 type 的缘故而再嵌套多一层 ?
 * 都是扁平化的结构, 一条 rule 就对应一条message不行吗 ?
 * 当然可以, 只是这样必定要多出很多条 rulename , 代码写起来是方便了(测试也会更好写), 但使用不方便
 *
 * 比如, min 只用来比较 number 数值的大小
 * 如果要不再嵌套, 那么 min 就不能再用于限制 string 的最小长度, 要另起一个名字比如 minlength
 */

const messages = {
  required: '必填',
  type: {
    string: '必须是字符串',
    number: '必须是数字',
    array: '必须是数组'
  },
  min: {
    string: config => `至少要${config}个字符`,
    number: config => `至少要大于${config}`
  },
  max: {
    string: config => `不能超过${config}个字符`,
    number: config => `不能大于${config}`
  },
  pattern: '正则匹配不通过',
  custom: '未通过校验'
}

function getMessage(rulename, type, ...config) {
  const target = messages[rulename]
  if (typeof target === 'string') {
    return target
  }

  if (typeof target === 'object') {
    const typeTarget = target[type]
    if (typeof typeTarget === 'function') {
      return typeTarget(...config)
    }
    return typeTarget
  }

  return 'unknown message'
}

const addMessage = createAddAPI(messages)

export {
  getMessage,
  addMessage
}
