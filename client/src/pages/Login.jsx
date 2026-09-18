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
    <div className="flex min-h-screen items-center justify-center bg-[#08090D] px-6 py-12 selection:bg-sky-500/30">
      <div className="relative z-10 w-full max-w-[430px]">
        <form
          className="rounded-xl border border-white/10 bg-[#101219] p-7 shadow-2xl shadow-black/30 sm:p-9"
          onSubmit={submit}
        >
          <div className="mb-9">
            <div className="mb-7">
              <img
                src="/logo-serba-mulia.png"
                alt="Serba Mulia"
                className="h-10 w-auto object-contain"
              />
              <p className="mt-3 text-xs font-semibold tracking-wide text-slate-500">Developer Platform · Internal API Documentation</p>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Hub SMG</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Satu pintu untuk menemukan, memahami, dan menguji API internal SMG.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">NIK Portal</label>
              <input
                className="block min-h-11 w-full rounded-lg border border-white/10 bg-[#0C0E14] px-4 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400 focus:bg-[#171923] focus:ring-4 focus:ring-sky-400/10"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Masukkan NIK"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Password Portal</label>
              <input
                type="password"
                className="block min-h-11 w-full rounded-lg border border-white/10 bg-[#0C0E14] px-4 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400 focus:bg-[#171923] focus:ring-4 focus:ring-sky-400/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Portal"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3.5 text-sm font-medium text-rose-300 backdrop-blur-md">
              {error}
            </div>
          )}

          <div className="mt-8">
            <button
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-500/15 transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Memverifikasi...' : 'Masuk ke Hub SMG'}
            </button>

            {import.meta.env.DEV && (
              <>
                <div className="relative flex items-center py-3">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="px-4 text-[11px] font-bold uppercase tracking-widest text-slate-600">Development</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleDevLogin}
                  disabled={busy}
                >
                  Dev Login
                </button>
              </>
            )}
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-slate-600">
            Gunakan kredensial SSO Portal SMG untuk melanjutkan.
          </p>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">© SMG · Hub API Internal</p>
      </div>
    </div>
  )
}
