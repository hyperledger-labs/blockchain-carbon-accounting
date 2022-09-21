import originalTv4 from 'tv4'
import originalRp from 'request-promise-native'
import debug from 'debug'
const originalDebug = debug('ws-identity')

const requestSchema = {
  type: 'object',
  properties: {
    path: {
      type: 'string'
    },
    method: {
      type: 'string'
    }
  },
  required: ['path', 'method']
}

export interface WsIdentityClientOpts {
  debug?(...args: any[]): any;
  tv4?(...args: any[]): any;
  'request-promise'?: any;
  Promise?: PromiseConstructor;

  apiVersion?: string;
  endpoint?: string;
  signature?: string;
  sessionId?: string;
  namespace?: string;
  noCustomHTTPVerbs?: boolean;
  pathPrefix?: string;
  rpDefaults?: object;
  requestOptions?: object;
}

export class WsIdentityClient {
  private readonly debug
  private readonly tv4
  private readonly rpDefaults
  private readonly rp
  private readonly apiVersion
  private readonly endpoint
  private readonly pathPrefix
  private readonly noCustomHTTPVerbs
  private readonly namespace
  private functions

  constructor (private readonly config:WsIdentityClientOpts) {
    this.debug = config.debug || originalDebug
    this.tv4 = config.tv4 || originalTv4
    const rpDefaults = {
      json: true,
      resolveWithFullResponse: true,
      simple: false,
      strictSSL: !process.env.WS_SKIP_VERIFY
    }

    if (config.rpDefaults) {
      Object.keys(config.rpDefaults).forEach(key => {
        rpDefaults[key] = config.rpDefaults[key]
      })
    }
    this.rp = (config['request-promise'] || originalRp).defaults(rpDefaults)
    // defaults
    this.apiVersion = config.apiVersion || 'v1'
    this.endpoint = config.endpoint || process.env.WS_X509_SERVER_ADDR || 'http://127.0.0.1:8700'
    this.pathPrefix = config.pathPrefix || process.env.SERVER_PREFIX || ''
    this.noCustomHTTPVerbs = config.noCustomHTTPVerbs || false
    this.namespace = config.namespace || process.env.WEB_SOCKET_NAMESPACE
    this.functions = {}
  }

  private handleServerResponse (response) {
    if (!response) return Promise.reject(new Error('No response passed'))
    originalDebug(response.statusCode)
    if (![200, 201, 204].includes(response.statusCode)) {
      // handle health response not as error
      if (response.request.path.match(/sys\/health/) !== null) {
        return Promise.resolve(response.body)
      }
      let message
      if (response.body && response.body.errors && response.body.errors.length > 0) {
        message = response.body.errors[0]
      } else {
        message = `Status ${response.statusCode}`
      }
      const error = new Error(message)
      return Promise.reject(error)
    }
    return Promise.resolve(response.body)
  }

  // Handle any HTTP requests
  private request (options) {
    const valid = this.tv4.validate(options, requestSchema)
    if (!valid) return Promise.reject(this.tv4.error)
    let uri = `${this.endpoint}/${this.apiVersion}${this.pathPrefix}${options?.path}`
    // Replace unicode encodings.
    uri = uri.replace(/&#x2F;/g, '/')
    options.headers = options.headers || {}
    if (typeof this.config.signature === 'string' && this.config.signature.length) {
      options.headers['x-signature'] = options.headers['x-signature'] || this.config.signature
    }
    if (typeof this.config.sessionId === 'string' && this.config.sessionId.length) {
      options.headers['x-session-id'] = options.headers['x-session-id'] || this.config.sessionId
    }
    if (typeof this.namespace === 'string' && this.namespace.length) {
      options.headers['x-web-socket-namespace'] = this.namespace
    }
    options.uri = uri
    this.debug(options.method, uri)
    if (options.json) this.debug(options.json)
    return this.rp(options).then(this.handleServerResponse)
  }

  public write (path, data, requestOptions) {
    this.debug('write %o to %s', data, path)
    const options = Object.assign({}, this.config.requestOptions, requestOptions)
    options.path = `/${path}`
    options.json = data
    options.method = 'POST'
    return this.request(options)
  }

  public read (path, requestOptions) {
    this.debug(`read ${path}`)
    const options = Object.assign({}, this.config.requestOptions, requestOptions)
    options.path = `/${path}`
    options.method = 'GET'
    return this.request(options)
  }

  private validate (json, schema) {
    // ignore validation if no schema
    if (schema === undefined) return Promise.resolve()
    const valid = this.tv4.validate(json, schema)
    if (!valid) {
      this.debug(this.tv4.error.dataPath)
      this.debug(this.tv4.error.message)
      return Promise.reject(this.tv4.error)
    }
    return Promise.resolve()
  }

  private extendOptions (conf, options, args = {}) {
    const hasArgs = Object.keys(args).length > 0
    if (!hasArgs) return Promise.resolve(options)

    const querySchema = conf.schema.query
    if (querySchema) {
      const params = []
      for (const key of Object.keys(querySchema.properties)) {
        if (key in args) {
          params.push(`${key}=${encodeURIComponent(args[key])}`)
        }
      }
      if (params.length > 0) {
        options.path += `?${params.join('&')}`
      }
    }

    const reqSchema = conf.schema.req
    if (reqSchema) {
      const json = {}
      for (const key of Object.keys(reqSchema.properties)) {
        if (key in args) {
          json[key] = args[key]
        }
      }
      if (Object.keys(json).length > 0) {
        options.json = json
      }
    }

    return Promise.resolve(options)
  }

  public generateFunction (name, conf) {
    this.functions[name] = (args) => {
      const options = Object.assign({}, this.config.requestOptions, args.requestOptions)
      options.method = conf.method
      // no schema object -> no validation
      if (!conf.schema) {
        if (options.method === 'POST' || options.method === 'PUT') {
          options.json = args
        }
        return this.request(options)
      }
      // else do validation of request URL and body
      const promise = this.validate(args, conf.schema.req)
        .then(() => this.validate(args, conf.schema.query))
        .then(() => this.extendOptions(conf, options, args))
        .then((extendedOptions) => this.request(extendedOptions))

      return promise
    }
  }
}
