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
  // 字段之间并行
  username: [
    // item 之间串行, item 内并行
    { required: true, message: '邮箱必填' }
    { type: 'email', message: '邮箱格式不正确' }
  ],
  password: [
    { required: true, message: '请输入密码' }
  ]
}
*/

type IFomatFunc = (value: any) => any
type IFormatErrorFunc = (error: IValidatorResult) => any

interface IValidatorOptions {
  formatError?: IFormatErrorFunc
  formatResult?: IFomatFunc
}

interface ICheckBuiltinOptions {
  rulename: string
  defMessage: string
  value: any
  config: any
  type: string
}

interface IValidatorResult {
  value: string
  rule: string
  message: string
}

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
  /**
   * 修改 rules(RULE_MAP) 对象
   * 和 custom 这条规则又有什么区别呢?
   * 如果有要多次重复使用的自定义规则, 用 addRule 和下面的api定义
   * 否则直接使用 custom 就好了
   */
  public static addRule = addRule
  public static addMessage = addMessage // 修改 messages 对象
  public static addType = addType // 修改 types 对象

  public formatError: IFormatErrorFunc
  public formatResult: IFomatFunc

  constructor(opts: IValidatorOptions = {}) {
    this.formatError = opts.formatError || noop
    this.formatResult = opts.formatResult || noop
  }

  /**
   * 默认返回一个 Promise
   * https://eggjs.org/zh-cn/intro/egg-and-koa.html
   *
   * @param data { key1: value1 .... }
   * @param schema { key1: [ { rulename: config, message: 'define message' } ... ] ... }
   */
  public async validate(data, schema) {
    const output = {}
    const entries = Object.entries(schema)

    const promises = entries.map(([key, rulesOfKey]) => {
      const rules = formatRules(rulesOfKey)
      return this.validateKey(key, data[key], rules, output) // map 记住要返回一个 promise 啊
    })

    await Promise.all(promises)

    if (Object.keys(output).length) {
      return this.formatResult(output)
    }
  }

  /**
   * 对一个字段的所有规则进行验证
   * 碰到第一条错误马上返回
   *
   * @param key
   * @param value
   * @param rulesOfKey
   * @param output
   */
  private async validateKey(
    key: string,
    value: any,
    rulesOfKey: any[],
    output: any
  ) {
    for (const rule of rulesOfKey) {
      // 先把所有异步校验函数保存起来
      const AsyncFns = []

      for (const rulename in rule) {
        // 不要删除 message 字段, 多次校验
        if (rulename === 'message') {
          continue
        }

        const isFunction = typeof rule[rulename] === 'function'
        if (isFunction) {
          AsyncFns.push({
            rulename,
            fn: rule[rulename],
          })
        } else {
          const error = this.checkBuiltin({
            rulename,
            defMessage: rule.message,
            value,
            config: rule[rulename],
            type: rule.type,
          })
          if (error) {
            output[key] = this.formatError(error)
            return
          }
        }
      }

      const promises = AsyncFns.map(({ rulename, fn }) => {
        const customPromise = fn(value, rulename)
        if (typeof customPromise.then !== 'function') {
          throw TypeError('自定义校验函数必须返回一个Promise')
        }
        return customPromise.then(null, message =>
          Promise.reject({ message, rulename })
        )
      })

      // 异步校验
      await Promise.all(promises).catch(({ message, rulename }) => {
        const validatedReslut = this.formatError({
          value,
          message,
          rule: rulename,
        })
        output[key] = validatedReslut
      })
    }
  }

  private checkBuiltin({
    rulename,
    defMessage,
    value,
    config,
    type,
  }: ICheckBuiltinOptions) {
    let checker = RULE_MAP[rulename]
    let pass = false

    if (!checker) {
      throw new TypeError(
        '基本规则名不正确, 不存在于内置的RULE_MAP中, 请检查是否拼写错误'
      )
    }
    checker = checker.bind(this)
    pass = checker(value, config, type)

    if (!pass) {
      const message = defMessage || getMessage(rulename, type, config)
      const validatedReslut: IValidatorResult = {
        value,
        message,
        rule: rulename,
      }
      return validatedReslut
    }
  }
}
