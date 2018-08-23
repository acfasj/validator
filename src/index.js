import RULE_MAP, { addType, addRule } from './rule'
import { getMessage, addMessage } from './message'

/*
const loginRule = {
  rules: {
    username: {
      type: 'email'
    },
    password: {
      required: true
    }
  },
  messages: {
    username: {
      required: '用户名必填.',
      email: '邮箱格式不正确'
    },
    password: {
      required: '请输入密码'
    }
  }
}

// 采用下面这种
const loginRule = {
  username: [
    { required: true, message: '邮箱必填' }
    { type: 'email', message: '邮箱格式不正确' }
  ],
  password: [
    { required: true, message: '请输入密码' }
  ]
}
*/

function formatRules(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    return [{ type: value }]
  }
  if (typeof value === 'object') {
    return [value]
  }
  return []
}

function noop(value) {
  return value
}

export default class Validator {
  constructor(opts = {}) {
    this.formatError = opts.formatError || noop
    this.formatResult = opts.formatResult || noop
  }

  validate(data, schema) {
    let output = {}
    const self = this

    for (let key in schema) {
      const rules = formatRules(schema[key])
      const value = data[key]

      // 一个字段对应的所有规则数组
      ;(function validateKey() {
        for (let rule of rules) {
          const defMessage = rule.message

          for (let rulename in rule) {
            // 不能 delete rule.message, 多次验证
            if (rulename === 'message') {
              continue
            }

            let checker = RULE_MAP[rulename]
            if (!checker) {
              throw new Error('对应的规则不存在于RULE_MAP中')
            }
            checker = checker.bind(RULE_MAP)

            const pass = checker(value, rule[rulename], rule.type)
            if (!pass) {
              // 遇到第一个错误就直接返回
              const message =
                defMessage || getMessage(rulename, rule.type, rule[rulename])
              output[key] = self.formatError({
                value,
                message,
                rule: rulename
              })
              return
            }
          }
        }
      })()
    }

    if (Object.keys(output).length) {
      return self.formatResult(output)
    }
  }
}

/**
 * 修改 rules(RULE_MAP) 对象
 * 和 custom 这条规则又有什么区别呢?
 * 如果有要多次重复使用的自定义规则, 用 addRule 和下面的api定义
 * 否则直接使用 custom 就好了
 */

Validator.addRule = addRule

/**
 * 修改 messages 对象
 */

Validator.addMessage = addMessage

/**
 * 修改 types 对象
 */

Validator.addType = addType
