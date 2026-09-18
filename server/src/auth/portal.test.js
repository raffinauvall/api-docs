import assert from 'node:assert/strict'
import test from 'node:test'

process.env.PORTAL_HOST = 'https://portal.test/v1/'
process.env.PORTAL_CORP = 'corp'

const { loginPortal } = await import('./portal.js')

function response(body, ok = true) {
  return {
    ok,
    json: async () => body
  }
}

test('loginPortal uses the production Portal contract', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    const body = JSON.parse(options.body)
    return response({
      status: 'success',
      data: {
        user: { nik: body.username, name: 'Tester', userBu: { title: 'Business Unit 1' } },
        token: { access: 'access-token' }
      }
    })
  }

  const user = await loginPortal('12345', 'secret', fetchImpl)

  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://portal.test/v1/auth/login')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    username: '12345',
    password: 'secret',
    device: 'Web'
  })
  assert.equal(calls[0].options.headers['X-API-Corp'], 'corp')
  assert.equal(calls[0].options.headers['Accept-Language'], 'id')
  assert.deepEqual(user, {
    nik: '12345',
    email: '',
    name: 'Tester',
    avatar: '',
    role: '',
    bu: 'Business Unit 1',
    token: { access: 'access-token' }
  })
})
