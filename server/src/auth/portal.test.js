import assert from 'node:assert/strict'
import test from 'node:test'

process.env.PORTAL_AUTH_URL = 'https://portal.test/auth/login'
process.env.PORTAL_BASIC_USERNAME = 'user'
process.env.PORTAL_BASIC_PASSWORD = 'pass'
process.env.CORP_ID = 'corp'
process.env.APP_KEY = 'app'

const { loginPortal } = await import('./portal.js')

function response(body, ok = true) {
  return {
    ok,
    json: async () => body
  }
}

test('loginPortal auto-resolves multiple-nik with first BU', async () => {
  const calls = []
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body)
    calls.push(body)

    if (calls.length === 1) {
      return response({
        status: 'failed',
        reff: 'multiple-nik',
        userToken: JSON.stringify([{ userBu: { buId: 'BU01', title: 'Business Unit 1' } }])
      })
    }

    return response({
      status: 'success',
      data: {
        user: { nik: body.nik, name: 'Tester', userBu: { title: 'Business Unit 1' } },
        token: { access: 'access-token' }
      }
    })
  }

  const user = await loginPortal('12345', 'secret', '', fetchImpl)

  assert.equal(calls.length, 2)
  assert.equal(calls[1].business_unit, 'BU01')
  assert.deepEqual(user, {
    nik: '12345',
    email: '',
    name: 'Tester',
    avatar: '',
    role: 'user',
    bu: 'Business Unit 1',
    token: { access: 'access-token' }
  })
})
