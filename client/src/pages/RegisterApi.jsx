import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <main className="container narrow">
      <div className="page-head">
        <h1>Register API</h1>
      </div>

      <form className="card form" onSubmit={submit}>
        <label>API Name</label>
        <input value={form.name} onChange={set('name')} placeholder="Payment Service" required />

        <label>API Description</label>
        <textarea value={form.description} onChange={set('description')} rows={3} />

        <label>API Group</label>
        <select value={form.group_id} onChange={set('group_id')} required>
          <option value="">— Pilih group —</option>
          {(groups || []).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <label>Git Provider</label>
        <select value={form.provider} onChange={set('provider')}>
          <option value="github">GitHub</option>
        </select>

        <label>Repository</label>
        <input
          value={form.repository}
          onChange={set('repository')}
          placeholder="company/payment-service"
          required
        />

        <label>Branch</label>
        <input value={form.branch} onChange={set('branch')} placeholder="main" />

        <label>OpenAPI File Path</label>
        <input
          value={form.file_path}
          onChange={set('file_path')}
          placeholder="docs/openapi.yml"
          required
        />

        {error && <div className="error">{error}</div>}
        {syncInfo?.error && (
          <div className="error">
            API terdaftar, tapi sync awal gagal: {syncInfo.error}
          </div>
        )}

        <button className="btn primary" disabled={register.isPending}>
          {register.isPending ? 'Mendaftarkan...' : 'Register & Sync'}
        </button>
      </form>
    </main>
  )
}
