import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { user, login, devLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDevLogin() {
    setError('')
    setBusy(true)
    try {
      await devLogin()
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>API Docs</h1>
        <p className="muted">Login pakai SSO Portal SMG</p>

        <label>NIK / Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="NIK anda"
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
        />

        {error && <div className="error">{error}</div>}

        <button className="btn primary" disabled={busy}>
          {busy ? 'Memproses...' : 'Login'}
        </button>

        <button type="button" className="btn ghost" onClick={handleDevLogin} disabled={busy}>
          Dev Login (skip SSO)
        </button>
      </form>
    </div>
  )
}
