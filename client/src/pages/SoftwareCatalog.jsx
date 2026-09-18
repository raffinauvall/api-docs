import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

export default function SoftwareCatalog() {
  const { data: apis = [], isLoading } = useQuery({ queryKey: ['apis'], queryFn: () => api.get('/api/apis').then((response) => response.apis) })
  const catalog = groupApis(apis)

  return <main className="hub-page"><header className="hub-page-header"><div><p className="hub-kicker">Software catalog</p><h1 className="hub-title">Apps, APIs, Services</h1><p className="hub-subtitle">Satu inventory untuk memahami service yang dimiliki organisasi dan source repository-nya.</p></div></header>{isLoading ? <div className="hub-panel hub-empty">Loading catalog...</div> : catalog.length ? <div className="hub-api-grid">{catalog.map((item) => <Link key={item.id} to={`/apis/${item.id}`} className="hub-panel hub-api-card"><div className="hub-api-card-head"><div style={{ minWidth: 0 }}><p className="hub-panel-label">API service</p><h3 style={{ marginTop: 10 }}>{item.name}</h3><p className="hub-api-card-desc">{item.description || 'No description provided.'}</p></div><span className="hub-badge hub-badge-muted">{item.endpoint_count || 0} endpoints</span></div><div style={{ borderTop: '1px solid var(--line-soft)', color: 'var(--text-3)', fontFamily: 'ui-monospace, monospace', fontSize: 11, marginTop: 18, paddingTop: 14 }}>{item.repository || 'Repository belum terset'}</div></Link>)}</div> : <div className="hub-panel hub-empty"><p className="hub-kicker">Empty inventory</p><h2>Belum ada software</h2><p>Register API atau push OpenAPI via webhook untuk mulai mengisi catalog.</p><Link to="/register" className="hub-button hub-button-primary">Register API</Link></div>}</main>
}
