import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { user, login, devLogin } = useAuth()
  const navigate = useNavigate()
  const [nik, setNik] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(nik, password)
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
    <div className="relative flex min-h-screen items-center justify-center bg-[#05070a] px-6 py-12 selection:bg-sky-500/30 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[420px]">

        <form 
          className="rounded-2xl border border-white/10 bg-[#0B0F19]/80 p-8 shadow-2xl backdrop-blur-xl" 
          onSubmit={submit}
        >
                  <div className="mb-8 text-center">

          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dokumentasi API</h1>
          <p className="mt-3 text-sm text-slate-400">Login to your developer portal</p>
        </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">NIK (SSO Portal)</label>
              <input
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Enter your NIK"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Password</label>
              <input
                type="password"
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-400 backdrop-blur-md">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={busy}
            >
              {busy ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="shrink-0 px-4 text-xs text-slate-500 uppercase font-semibold">Or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDevLogin}
              disabled={busy}
            >
              Dev Login (Skip SSO)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
