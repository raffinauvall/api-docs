import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api'

export default function RegisterApi() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', group_id: '', provider: 'github', repository: '', branch: 'main', file_path: 'openapi.yml' })
  const [error, setError] = useState('')
  const [syncInfo, setSyncInfo] = useState(null)
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: () => api.get('/api/groups').then((response) => response.groups) })
  const register = useMutation({
    mutationFn: (payload) => api.post('/api/apis/register', payload),
    onSuccess: (data) => { setSyncInfo(data.sync); if (data.sync && !data.sync.error) navigate(`/apis/${data.api.id}`) },
    onError: (err) => setError(err.message)
  })
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  function submit(event) { event.preventDefault(); setError(''); setSyncInfo(null); register.mutate(form) }

  return <main className="hub-page"><Link to="/" className="hub-back">← Back to dashboard</Link><header className="hub-page-header"><div><p className="hub-kicker">API registry / New source</p><h1 className="hub-title">Register New API</h1><p className="hub-subtitle">Hub API membaca OpenAPI langsung dari repository. Daftarkan source sekali, lalu sync berikutnya berjalan melalui webhook.</p></div></header><form className="hub-panel" style={{ padding: 24 }} onSubmit={submit}><section><p className="hub-panel-label">01 / Identity</p><div className="hub-form-grid" style={{ marginTop: 16 }}><label className="hub-label hub-form-full">API Name<input className="hub-input" value={form.name} onChange={set('name')} placeholder="Payment Gateway" required /></label><label className="hub-label hub-form-full">Description<textarea className="hub-textarea" value={form.description} onChange={set('description')} placeholder="Brief description of this API service..." rows={3} /></label><label className="hub-label hub-form-full">API Group<select className="hub-select" value={form.group_id} onChange={set('group_id')} required><option value="" disabled>Select a group</option>{(groups || []).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label></div></section><section className="hub-form-section" style={{ marginTop: 28 }}><p className="hub-panel-label">02 / Repository source</p><div className="hub-form-grid" style={{ marginTop: 16 }}><label className="hub-label">Git Provider<select className="hub-select" value={form.provider} onChange={set('provider')}><option value="github">GitHub</option></select></label><label className="hub-label">Branch<input className="hub-input" value={form.branch} onChange={set('branch')} placeholder="main" /></label><label className="hub-label hub-form-full">Repository<input className="hub-input" value={form.repository} onChange={set('repository')} placeholder="company/payment-service" required /></label><label className="hub-label hub-form-full">OpenAPI File Path<input className="hub-input" value={form.file_path} onChange={set('file_path')} placeholder="docs/openapi.yml" required /></label></div></section>{error && <div className="hub-alert" role="alert" style={{ marginTop: 24 }}><strong>Registration failed</strong><p>{error}</p></div>}{syncInfo?.error && <div className="hub-alert" style={{ marginTop: 24 }}><strong>API registered, initial sync failed</strong><p>{syncInfo.error}</p></div>}<div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 28, paddingTop: 22 }}><button className="hub-button hub-button-primary" style={{ width: '100%' }} disabled={register.isPending}>{register.isPending ? 'Authenticating and syncing...' : 'Register and sync repository'}</button></div></form></main>
}
