import Query from '@/Query'
import { splitToObject } from '@/utils'
import { throwWhenStatusNotOk, AuthError } from '@/errors'

const acceptHeaderMap = {
  '': 'application/json',
  single: 'application/vnd.pgrst.object+json',
  binary: 'application/octet-stream',
  text: 'text/plain'
}

async function request (apiRoot, token, route, method, query = {}, options = {}, body) {
  const headers = new Headers()

  headers.set('Accept', acceptHeaderMap[options.accept ?? ''] || options.accept)

  if (options.limit === 0) {
    // this will be an unsatisfiable range, but the user wanted it!
    headers.set('Range-Unit', 'items')
    headers.set('Range', '-0')
  } else if (options.limit || options.offset !== undefined) {
    const lower = options.offset ?? 0
    const upper = options.limit ? lower + options.limit - 1 : ''
    headers.set('Range-Unit', 'items')
    headers.set('Range', [lower, upper].join('-'))
  }

  const prefer = ['return', 'count', 'params']
    .filter(key => options[key])
    .map(key => `${key}=${options[key]}`)
    .join(',')
  if (prefer) {
    headers.set('Prefer', prefer)
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // overwrite headers with custom headers if set
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers.set(k, v)
    }
  }

  const url = new Query(apiRoot, route, query)

  try {
    return await fetch(url.toString(), {
      method,
      headers,
      body
    }).then(throwWhenStatusNotOk)
  } catch (err) {
    if (err.resp?.headers.get('WWW-Authenticate')) {
      const authError = splitToObject(err.resp.headers.get('WWW-Authenticate').replace(/^Bearer /, ''))
      throw new AuthError(authError)
    } else {
      throw err
    }
  }
}

export default request
