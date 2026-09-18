import { Router } from 'express'
import { config } from '../config.js'
import { requireAuth } from '../auth/middleware.js'
import { loginPortal } from '../auth/portal.js'
import { upsertUser } from '../repos/users.js'

export const authRouter = Router()

// GET /api/auth/me — profil user yang sedang login
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user })
})

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

// POST /api/auth/login — SSO ke Portal SMG production API
authRouter.post('/login', async (req, res) => {
  try {
    const { email, nik: bodyNik, password } = req.body || {}
    if (!(email || bodyNik) || !password) {
      return res.status(400).json({ error: 'NIK dan password wajib diisi' })
    }

    const nik = String(bodyNik || email).trim()
    const portalUser = await loginPortal(nik, password)
    if (portalUser.token) req.session.portalToken = portalUser.token
    const userNik = portalUser.nik || nik

    // Provision / update user lokal
    const user = await upsertUser({
      email: portalUser.email || null,
      name: portalUser.name,
      avatar: portalUser.avatar || null,
      nik: userNik,
      role: portalUser.role || null,
      bu: portalUser.bu || null
    })

    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      nik: user.nik,
      role: user.role,
      bu: user.bu
    }

    res.json({ user: req.session.user })
  } catch (err) {
    if (err.code === 'PORTAL_CONFIG') {
      console.error('[portal] Config error:', err.message)
      return res.status(503).json({ error: 'Layanan autentikasi tidak tersedia.' })
    }
    console.error('Login error:', err.message)
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error. Coba lagi.' })
  }
})

// POST /api/auth/dev-login — hanya untuk development
authRouter.post('/dev-login', async (req, res) => {
  if (!config.devAuth) {
    return res.status(403).json({ error: 'Dev login nonaktif' })
  }

  const nik = req.body?.nik || '999999'
  const user = await upsertUser({
    email: req.body?.email || `${nik}@dev.internal`,
    name: req.body?.name || 'Dev User',
    avatar: req.body?.avatar || null,
    nik,
    role: req.body?.role || 'admin',
    bu: req.body?.bu || null
  })

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    nik: user.nik,
    role: user.role,
    bu: user.bu
  }

  res.json({ user: req.session.user })
})
