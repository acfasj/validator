import { createAddAPI } from './helper'

/**
 * 主要在于, messsage对应不同情况下的rule, 会有多条
 */
const messages = {
  required: '必填',
  type: {
    string: '必须是字符串',
    number: '必须是数字'
  },
  min: {
    string: config => `至少要${config}个字符`,
    number: config => `至少要大于${config}`
  },
  max: {
    string: config => `不能超过${config}个字符`,
    number: config => `不能大于${config}`
  },
  match: '正则匹配不通过',
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
