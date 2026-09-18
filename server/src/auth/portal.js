import { config } from '../config.js'

function requiredPortalConfig() {
  const missing = []
  if (!config.portal.host) missing.push('PORTAL_HOST')
  if (!config.portal.corp) missing.push('PORTAL_CORP')
  return missing
}

function getString(source, keys) {
  if (!source || typeof source !== 'object') return ''
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return ''
}

function mapPortalMessage(message = '') {
  const text = String(message || '').trim() || 'NIK atau Password salah'
  const lower = text.toLowerCase()
  if (lower.includes('password')) return 'PASSWORD SALAH'
  if (lower.includes('not found')) return 'NIK TIDAK TERDAFTAR'
  return text.toUpperCase()
}

function portalError(message, status) {
  const err = new Error(message)
  err.status = status
  return err
}

async function postPortal(body, fetchImpl) {
  let response
  try {
    response = await fetchImpl(`${config.portal.host}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Corp': config.portal.corp,
        'Accept-Language': 'id'
      },
      body: JSON.stringify(body)
    })
  } catch (err) {
    throw portalError(err.message || 'Portal authentication failed', 503)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw portalError(data.message || 'Portal authentication failed', 401)
  return data
}

export function normalizePortalUser(data, fallbackNik, fallbackBu = '') {
  const user = data.data?.user || data.user || data.data || {}
  const token = data.data?.token || data.token || null
  return {
    nik: getString(user, ['nik', 'employee_id', 'employeeId']) || fallbackNik,
    email: getString(user, ['email']),
    name: getString(user, ['employee_name', 'name', 'fullName', 'full_name']) || fallbackNik,
    avatar: getString(user, ['avatar', 'picture']),
    role: getString(user, ['role']),
    bu: user.userBu?.title || fallbackBu || user.userBu?.buId || '',
    token
  }
}

export async function loginPortal(nik, password, fetchImpl = fetch) {
  const missing = requiredPortalConfig()
  if (missing.length) {
    const err = new Error(`Missing Portal config: ${missing.join(', ')}`)
    err.code = 'PORTAL_CONFIG'
    throw err
  }

  const data = await postPortal(
    { username: nik, password, device: 'Web' },
    fetchImpl
  )
  return normalizePortalUser(data, nik)
}
