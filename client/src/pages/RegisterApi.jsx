import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api'

export default function RegisterApi() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    group_id: '',
    provider: 'github',
    repository: '',
    branch: 'main',
    file_path: 'openapi.yml'
  })
  const [error, setError] = useState('')
  const [syncInfo, setSyncInfo] = useState(null)

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/api/groups').then((r) => r.groups)
  })

  const register = useMutation({
    mutationFn: (payload) => api.post('/api/apis/register', payload),
    onSuccess: (data) => {
      setSyncInfo(data.sync)
      if (data.sync && !data.sync.error) {
        navigate(`/apis/${data.api.id}`)
      }
    },
    onError: (err) => setError(err.message)
  })

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function submit(e) {
    e.preventDefault()
    setError('')
    setSyncInfo(null)
    register.mutate(form)
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 text-center">
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-sky-400 mb-6 transition-colors">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Register New API</h1>
        <p className="mt-3 text-sm text-slate-400">Connect your OpenAPI specification from Git to sync endpoints.</p>
      </div>

      <form className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur-xl sm:p-10" onSubmit={submit}>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-300">API Name</label>
              <input
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g., Payment Gateway"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Description <span className="text-slate-500 font-normal">(Optional)</span></label>
              <textarea
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600 resize-y"
                value={form.description}
                onChange={set('description')}
                placeholder="Brief description of this API service..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-300">API Group</label>
              <div className="relative">
                <select
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 pr-10 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10"
                  value={form.group_id}
                  onChange={set('group_id')}
                  required
                >
                  <option value="" disabled className="text-slate-500">— Select a group —</option>
                  {(groups || []).map((g) => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">{g.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="col-span-1 border-t border-white/5 pt-6 md:border-t-0 md:pt-0">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Git Provider</label>
              <div className="relative">
                <select
                  className="block w-full appearance-none rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 pr-10 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10"
                  value={form.provider}
                  onChange={set('provider')}
                >
                  <option value="github" className="bg-slate-900">GitHub</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Branch</label>
              <input
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600"
                value={form.branch}
                onChange={set('branch')}
                placeholder="main"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Repository</label>
              <input
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-sky-200 outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600 font-mono"
                value={form.repository}
                onChange={set('repository')}
                placeholder="company/payment-service"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-300">OpenAPI File Path</label>
              <input
                className="block w-full rounded-xl border border-white/10 bg-[#05070a] px-4 py-3 text-sm text-sky-200 outline-none transition-all focus:border-sky-500 focus:bg-[#0B0F19] focus:ring-4 focus:ring-sky-500/10 placeholder-slate-600 font-mono"
                value={form.file_path}
                onChange={set('file_path')}
                placeholder="docs/openapi.yml"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 backdrop-blur-md">
              {error}
            </div>
          )}
          
          {syncInfo?.error && (
            <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 backdrop-blur-md">
              <strong className="block mb-1 text-rose-300">API Registered, but initial sync failed:</strong>
              {syncInfo.error}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-white/5">
            <button
              className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={register.isPending}
            >
              {register.isPending ? 'Authenticating and Syncing...' : 'Register and Sync Repository'}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}
