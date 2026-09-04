import 'dotenv/config'

function required(name, fallback) {
  const v = process.env[name]
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    connectionString:
      process.env.DATABASE_URL || 'postgres://localhost:5432/api_docs'
  },

  session: {
    secret: required('SESSION_SECRET', 'dev-insecure-session-secret'),
    name: process.env.SESSION_NAME || 'api_docs_sid',
    maxAge: 24 * 60 * 60 * 1000, // 24 jam
    secureCookie: process.env.COOKIE_SECURE === 'true'
  },

  portal: {
    authUrl:
      process.env.PORTAL_AUTH_URL ||
      (process.env.PORTAL_HOST ? `${process.env.PORTAL_HOST.replace(/\/$/, '')}/auth/login` : ''),
    basicUsername: process.env.PORTAL_BASIC_USERNAME || '',
    basicPassword: process.env.PORTAL_BASIC_PASSWORD || '',
    corpId: process.env.CORP_ID || process.env.PORTAL_CORP || '',
    appKey: process.env.APP_KEY || '',
    businessUnitField: process.env.PORTAL_BUSINESS_UNIT_FIELD || 'business_unit',
    defaultBusinessUnit: process.env.DEFAULT_BUSINESS_UNIT || ''
  },

  github: {
    token: process.env.GITHUB_TOKEN || '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || ''
  },

  devAuth:
    process.env.DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production'
}
