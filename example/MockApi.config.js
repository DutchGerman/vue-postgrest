module.exports = function (mockData) {
  return [
    {
      pattern: 'api(.*)',
      fixtures: function (match, params, headers, context) {
        for (const endpoint in mockData.data) {
          if (match[1].split('?')[0] === endpoint) {
            const resp = {
              body: [],
              headers: {}
            }
            if (context.method === 'get') {
              resp.body = mockData.data[endpoint].get
            } else {
              throw new Error('Method not supported on mock api.')
            }
            if (headers['Accept'] === 'application/vnd.pgrst.object+json') {
              resp.body = resp.body[0]
            }
            if (headers.Range && Array.isArray(resp.body)) {
              resp.headers['Range-Unit'] = 'items'
              // setting content range properly to actual returned range not neccessary for the simple test cases
              const range = headers.Range.split('-')
              const retRange = range[1] ? range.join('-') : [range[0], resp.body.length].join('-')
              resp.headers['Content-Range'] = headers.Prefer.split(',').includes('count=exact') ? retRange + '/' + resp.body.length : retRange + '/*'
              resp.body = resp.body.slice(...range)
            }
            return resp
          }
        }

        if (match[1] === '/') {
          return {
            body: mockData.docs || { definitions: {} },
            headers: {
              'content-type': 'application/openapi+json'
            }
          }
        }
      },

      get: function (match, data) {
        return data
      },

      delete: function (match, data) {

      },

      patch: function (match, data) {
      },

      post: function (match, data) {
      }
    }
  ]
}