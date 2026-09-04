import crypto from 'node:crypto'
import { Router } from 'express'
import { config } from '../config.js'
import { requireAuth } from '../auth/middleware.js'
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

// POST /api/auth/login — SSO ke Portal SMG (pola SMG-EMPmvp)
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' })
    }

    const nik = String(email).trim()
    const portalHost = (config.portal.host || '').replace(/\/$/, '')
    const portalCorp = config.portal.corp

    if (!portalHost || !portalCorp) {
      return res.status(503).json({ error: 'Layanan autentikasi tidak tersedia.' })
    }

    let portalName = nik
    let portalBu = null
    let portalEmail = null
    let portalAvatar = null
    let portalRole = 'user'

    try {
      const url = `${portalHost}/auth/login`
      const pr = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Corp': portalCorp,
          'Accept-Language': 'id'
        },
        body: JSON.stringify({ username: nik, password, device: 'Web' })
      })

      const portalBody = await pr.json().catch(() => ({}))
      if (portalBody.reff === 'multiple-nik') {
        return res.status(400).json({
          error: 'NIK terdaftar di beberapa BU. Hubungi admin untuk penanganan.',
          multipleBu: true
        })
      }
      if (!pr.ok) {
        return res.status(401).json({ error: 'NIK atau password salah' })
      }

      // Simpan portal token ke session (digunakan untuk keperluan integrasi lain)
      const tok = portalBody?.data?.token
      if (tok?.access) {
        req.session.portalToken = {
          access: tok.access,
          refresh: tok.refresh,
          expAccess: tok.expAccess,
          expRefresh: tok.expRefresh
        }
      }

      const prof = portalBody?.data || {}
      portalName = prof.name || prof.fullName || prof.user?.name || nik
      portalEmail = prof.email || prof.user?.email || null
      portalAvatar = prof.avatar || prof.user?.avatar || prof.picture || null
      portalBu = prof.bu?.title || prof.bu?.name || prof.user?.bu?.name || prof.userBu?.name || null
      portalRole = prof.role || prof.user?.role || 'user'
    } catch (e) {
      console.error('[portal] Auth error:', e.message)
      return res.status(503).json({ error: 'Layanan autentikasi tidak tersedia. Coba lagi.' })
    }

    // Provision / update user lokal
    const user = await upsertUser({
      email: portalEmail,
      name: portalName,
      avatar: portalAvatar,
      nik,
      role: portalRole,
      bu: portalBu
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
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Server error. Coba lagi.' })
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
