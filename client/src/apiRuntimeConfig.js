const defaults = {
  baseUrl: '',
  headers: '{}',
  authType: 'none',
  bearerToken: '',
  basicUser: '',
  basicPass: '',
  apiKeyName: 'X-API-Key',
  apiKeyValue: '',
  apiKeyIn: 'header'
}

export function runtimeConfigKey(apiId) {
  return `api-docs:runtime:${apiId}`
}

export function readRuntimeConfig(apiId, apiBaseUrl = '') {
  try {
    const saved = JSON.parse(localStorage.getItem(runtimeConfigKey(apiId)) || '{}')
    return { ...defaults, ...saved, baseUrl: saved.baseUrl || apiBaseUrl || '' }
  } catch {
    return { ...defaults, baseUrl: apiBaseUrl || '' }
  }
}

export function saveRuntimeConfig(apiId, config) {
  localStorage.setItem(runtimeConfigKey(apiId), JSON.stringify(config))
}

export function authHeaders(config) {
  if (config.authType === 'bearer' && config.bearerToken) return { Authorization: `Bearer ${config.bearerToken}` }
  if (config.authType === 'basic' && (config.basicUser || config.basicPass)) return { Authorization: `Basic ${btoa(`${config.basicUser}:${config.basicPass}`)}` }
  if (config.authType === 'apiKey' && config.apiKeyIn === 'header' && config.apiKeyName && config.apiKeyValue) {
    return { [config.apiKeyName]: config.apiKeyValue }
  }
  return {}
}
