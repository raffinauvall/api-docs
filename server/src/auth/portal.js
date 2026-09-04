import { config } from '../config.js'

function requiredPortalConfig() {
  const missing = []
  if (!config.portal.authUrl) missing.push('PORTAL_AUTH_URL')
  if (!config.portal.basicUsername) missing.push('PORTAL_BASIC_USERNAME')
  if (!config.portal.basicPassword) missing.push('PORTAL_BASIC_PASSWORD')
  if (!config.portal.corpId) missing.push('CORP_ID')
  if (!config.portal.appKey) missing.push('APP_KEY')
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

function buildPortalRequestBody(nik, password, businessUnit) {
  const body = {
    nik,
    password,
    corp_id: config.portal.corpId,
    app_key: config.portal.appKey
  }
  const selectedBusinessUnit = businessUnit || config.portal.defaultBusinessUnit
  if (selectedBusinessUnit) body[config.portal.businessUnitField] = selectedBusinessUnit
  return body
}

async function postPortal(body, fetchImpl) {
  const basicAuth = Buffer.from(
    `${config.portal.basicUsername}:${config.portal.basicPassword}`
  ).toString('base64')

  let response
  try {
    response = await fetchImpl(config.portal.authUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
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

function resolveMultipleNik(data, body) {
  if (data.status === 'success' || data.reff !== 'multiple-nik' || !data.userToken) return ''

  const units = JSON.parse(data.userToken)
  const first = Array.isArray(units) ? units[0] : null
  const buId = first?.userBu?.buId
  if (!buId) return ''

  body[config.portal.businessUnitField] = buId
  return first?.userBu?.title || ''
}

export function normalizePortalUser(data, fallbackNik, fallbackBu = '') {
  const user = data.data?.user || data.user || data.data || {}
  const token = data.data?.token || data.token || null
  return {
    nik: getString(user, ['nik', 'employee_id', 'employeeId']) || fallbackNik,
    email: getString(user, ['email']),
    name: getString(user, ['employee_name', 'name', 'fullName', 'full_name']) || fallbackNik,
    avatar: getString(user, ['avatar', 'picture']),
    role: getString(user, ['role']) || 'user',
    bu: user.userBu?.title || fallbackBu || user.userBu?.buId || '',
    token
  }
}

export async function loginPortal(nik, password, businessUnit, fetchImpl = fetch) {
  const missing = requiredPortalConfig()
  if (missing.length) {
    const err = new Error(`Missing Portal config: ${missing.join(', ')}`)
    err.code = 'PORTAL_CONFIG'
    throw err
  }

  const body = buildPortalRequestBody(nik, password, businessUnit)
  let data = await postPortal(body, fetchImpl)
  let autoResolvedBuTitle = ''

  try {
    autoResolvedBuTitle = resolveMultipleNik(data, body)
    if (autoResolvedBuTitle) data = await postPortal(body, fetchImpl)
  } catch (err) {
    console.error('[portal] Multiple NIK auto-resolve error:', err.message)
  }

  if (data.status !== 'success') throw portalError(mapPortalMessage(data.message), 401)
  return normalizePortalUser(data, nik, autoResolvedBuTitle || body[config.portal.businessUnitField])
}
