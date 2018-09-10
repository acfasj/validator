(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Validator = factory());
}(this, (function () { 'use strict';

  /**
   * 类似于 Object.assign
   * 但对于 target 中原有的 object 类型的属性值不会覆盖, 而是合并
   *
   * @param {Object} target
   * @param {Object} source
   */

  function merge(target, source) {
    for (let key in source) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = source[key];
      } else {
        merge(target[key], source[key]);
      }
    }
  }

  /**
   * 返回一个函数
   * 调用这个函数就是用 merge 来修改 baseObj 的值
   *
   * @param {Object} baseObj
   * @return {Function}
   */

  function createAddAPI(baseObj) {
    return function add(...args) {
      if (typeof args[0] === 'string') {
        args[0] = {
          [args[0]]: args[1]
        };
      }
      merge(baseObj, args[0]);
    }
  }

  /**
   * 实际上, 最终要校验的值几乎都是 primitive 的, 绝大部分都是字符串
   * 如果要校验 object 套 object 的, 有意义吗 ? 不懂写, 不写
   */

  const types = {
    string(value) {
      return typeof value === 'string'
    },

    /**
     * 只要能转换成 number
     *
     * @param {String|Number} value
     */

    number(value) {
      // Boolean([]) === 0
      if (Array.isArray(value)) {
        return false
      }
      return !isNaN(Number(value))
    },

    /**
     * 比如想发一个 id 数组到后端
     *
     * @param {Array} value
     */

    array(value) {
      return Array.isArray(value)
    }
  };

  const rules = {
    required(value, config, type) {
      // 用户指明 reuired = false
      if (config === false) {
        return true
      }
      if (type === 'array' && Array.isArray(value)) {
        return value.length > 0
      }
      return Boolean(value) && value !== 0
    },

    type(value, config, type) {
      return types[type] && types[type](value)
    },

    min(value, config, type) {
      if (type === 'number') {
        return Number(value) >= config
      } else {
        return value.length >= config
      }
    },

    max(value, config, type) {
      if (type === 'number') {
        return Number(value) <= config
      } else {
        return value.length <= config
      }
    },

    len(value, config, type) {
      if (type === 'number') {
        return String(value) === String(config)
      }
      return value.length === config
    },

    pattern(value, config, type) {
      const reg = new RegExp(config);
      return reg.test(value)
    }

    // custom(value, config, type) {
    //   return config(value)
    // }
  };

  const addType = createAddAPI(types);
  const addRule = createAddAPI(rules);

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
    pattern: '正则匹配不通过'
    // custom: '未通过校验'
  };

  function getMessage(rulename, type, ...config) {
    const target = messages[rulename];
    if (typeof target === 'string') {
      return target
    }

    if (typeof target === 'object') {
      const typeTarget = target[type];
      if (typeof typeTarget === 'function') {
        return typeTarget(...config)
      }
      return typeTarget
    }

    return 'unknown message'
  }

  const addMessage = createAddAPI(messages);

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

  class Validator {
    constructor(opts = {}) {
      this.formatError = opts.formatError || noop;
      this.formatResult = opts.formatResult || noop;
    }

    /**
     * 默认返回一个 Promise
     * https://eggjs.org/zh-cn/intro/egg-and-koa.html
     *
     * @param {Object} data
     * @param {Object} schema
     */

    async validate(data, schema) {
      const output = {};
      const entries = Object.entries(schema);

      const promises = entries.map(([key, rulesOfKey]) => {
        rulesOfKey = formatRules(rulesOfKey);
        return this._validateKey(key, data[key], rulesOfKey, output) // map 记住要返回一个 promise 啊
      });

      await Promise.all(promises);

      if (Object.keys(output).length) {
        return this.formatResult(output)
      }
    }

    /**
     * 对一个字段的所有规则进行验证
     * 碰到第一条错误马上返回
     *
     * @param {String} key
     * @param {String} value
     * @param {Array<Object>} rulesOfKey
     * @param {Object} output
     */

    async _validateKey(key, value, rulesOfKey, output) {
      for (let rule of rulesOfKey) {
        // 先把所有异步校验函数保存起来
        const AsyncFns = [];

        for (let rulename in rule) {
          // 不要删除 message 字段, 多次校验
          if (rulename === 'message') {
            continue
          }

          const isFunction = typeof rule[rulename] === 'function';
          if (isFunction) {
            AsyncFns.push({
              rulename,
              fn: rule[rulename]
            });
          } else {
            const error = this._checkBuiltin({
              rulename,
              defMessage: rule.message,
              value,
              config: rule[rulename],
              type: rule.type
            });
            if (error) {
              output[key] = this.formatError(error);
              return
            }
          }
        }

        const promises = AsyncFns.map(({ rulename, fn }) => {
          const customPromise = fn(value, rulename);
          if (typeof customPromise.then !== 'function') {
            throw TypeError('自定义校验函数必须返回一个Promise')
          }
          return (
            customPromise
              // eslint-disable-next-line
              .then(null, message => Promise.reject({ message, rulename }))
          )
        });

        // 异步校验
        await Promise.all(promises).catch(({ message, rulename }) => {
          const validatedReslut = this.formatError({
            value,
            message,
            rule: rulename
          });
          output[key] = validatedReslut;
        });
      }
    }

    _checkBuiltin({ rulename, defMessage, value, config, type }) {
      let checker = rules[rulename];
      let pass = false;

      if (!checker) {
        throw new TypeError(
          '基本规则名不正确, 不存在于内置的RULE_MAP中, 请检查是否拼写错误'
        )
      }
      checker = checker.bind(this);
      pass = checker(value, config, type);

      if (!pass) {
        const message = defMessage || getMessage(rulename, type, config);
        const validatedReslut = {
          value,
          message,
          rule: rulename
        };
        return validatedReslut
      }
    }
  }

  /**
   * 修改 rules(RULE_MAP) 对象
   * 和 custom 这条规则又有什么区别呢?
   * 如果有要多次重复使用的自定义规则, 用 addRule 和下面的api定义
   * 否则直接使用 custom 就好了
   */

  Validator.addRule = addRule;

  /**
   * 修改 messages 对象
   */

  Validator.addMessage = addMessage;

  /**
   * 修改 types 对象
   */

  Validator.addType = addType;

  return Validator;

})));
