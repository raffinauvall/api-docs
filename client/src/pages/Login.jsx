import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { user, login, devLogin } = useAuth()
  const navigate = useNavigate()
  const [nik, setNik] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await login(nik, password); navigate('/') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function handleDevLogin() {
    setError(''); setBusy(true)
    try { await devLogin(); navigate('/') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <main className="hub-auth">
      <div className="hub-auth-card">
        <img className="hub-auth-brand" src="/logo-serba-mulia.png" alt="Serba Mulia" />
        <p className="hub-kicker" style={{ marginTop: 28 }}>Developer platform</p>
        <h1>Hub API</h1>
        <p>Satu pintu untuk menemukan, memahami, dan menguji API internal SMG.</p>
        <form className="hub-auth-form" onSubmit={submit}>
          <label className="hub-label">NIK Portal<input className="hub-input" value={nik} onChange={(event) => setNik(event.target.value)} placeholder="Masukkan NIK" autoComplete="username" required /></label>
          <label className="hub-label">Password Portal<input className="hub-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password Portal" autoComplete="current-password" required /></label>
          {error && <div className="hub-auth-error" role="alert">{error}</div>}
          <button className="hub-button hub-button-primary" disabled={busy}>{busy ? 'Memverifikasi...' : 'Masuk ke Hub SMG'}</button>
          {import.meta.env.DEV && <><div style={{ alignItems: 'center', color: 'var(--text-3)', display: 'flex', fontSize: 10, gap: 10, letterSpacing: '.16em', textTransform: 'uppercase' }}><span style={{ background: 'var(--line-soft)', flex: 1, height: 1 }} />Development<span style={{ background: 'var(--line-soft)', flex: 1, height: 1 }} /></div><button type="button" className="hub-button hub-button-secondary" onClick={handleDevLogin} disabled={busy}>Dev Login</button></>}
        </form>
        <p style={{ fontSize: 11, marginTop: 26, textAlign: 'center' }}>Gunakan kredensial SSO Portal SMG untuk melanjutkan.</p>
      </div>
    </main>
  )
}
