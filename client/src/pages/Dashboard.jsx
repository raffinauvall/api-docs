import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

const statusMeta = {
  SYNCED: ['Synced', 'hub-badge-success'],
  SYNCING: ['Syncing', 'hub-badge-warning'],
  FAILED: ['Failed', 'hub-badge-error'],
  DISABLED: ['Disabled', 'hub-badge-muted'],
  PENDING: ['Pending', 'hub-badge-muted']
}

function SyncBadge({ status }) {
  const [label, tone] = statusMeta[status] || statusMeta.PENDING
  return <span className={`hub-badge ${tone}`}>{label}</span>
}

function shortDate(value) {
  if (!value) return 'Never synced'
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function HealthRing({ value }) {
  return (
    <div className="hub-ring" style={{ background: `conic-gradient(#9B7BFF ${value}%, #292d3b 0)` }} aria-label={`${value}% sync coverage`}>
      <div className="hub-ring-content"><strong className="hub-ring-value">{value}%</strong><span className="hub-ring-label">sync coverage</span></div>
    </div>
  )
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { data: apis = [], isLoading } = useQuery({ queryKey: ['apis'], queryFn: () => api.get('/api/apis').then((response) => response.apis) })
  const syncApi = useMutation({ mutationFn: (apiId) => api.post(`/api/apis/${apiId}/sync`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apis'] }) })
  const catalog = useMemo(() => groupApis(apis), [apis])
  const stats = useMemo(() => {
    const byStatus = catalog.reduce((result, item) => {
      const status = item.last_sync_status || 'PENDING'
      result[status] = (result[status] || 0) + 1
      return result
    }, {})
    const synced = byStatus.SYNCED || 0
    return {
      endpoints: catalog.reduce((sum, item) => sum + Number(item.endpoint_count || 0), 0),
      synced,
      failed: byStatus.FAILED || 0,
      attention: catalog.filter((item) => ['FAILED', 'SYNCING', 'PENDING'].includes(item.last_sync_status)).length,
      coverage: catalog.length ? Math.round((synced / catalog.length) * 100) : 0
    }
  }, [catalog])

  return (
    <div className="hub-page">
      <header className="hub-page-header">
        <div><p className="hub-kicker">Control center / Overview</p><h1 className="hub-title">Developer Portal</h1><p className="hub-subtitle">Satu workspace untuk menemukan API, membaca kontrak endpoint, dan memantau sinkronisasi dari Git.</p></div>
        <Link to="/register" className="hub-button hub-button-primary">Register API</Link>
      </header>

      <section className="hub-grid hub-grid-2" style={{ marginBottom: 16 }}>
        <div className="hub-panel hub-panel-raised" style={{ padding: 28 }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 28, justifyContent: 'space-between' }}>
            <div><p className="hub-panel-label" style={{ color: 'var(--purple-2)' }}>Catalog health</p><h2 className="hub-title" style={{ fontSize: 30, marginTop: 12 }}>Sync coverage</h2><p className="hub-subtitle">Status dokumentasi yang tersinkron dari source repository.</p><div style={{ display: 'flex', gap: 8, marginTop: 22 }}><span className="hub-badge hub-badge-success">{stats.synced} synced</span><span className="hub-badge hub-badge-warning">{stats.attention} attention</span></div></div>
            <HealthRing value={stats.coverage} />
          </div>
        </div>
        <div className="hub-panel"><div className="hub-panel-header"><div><p className="hub-panel-label">Workspace index</p><h2 className="hub-panel-title" style={{ marginTop: 6 }}>At a glance</h2></div><span className="hub-panel-label">Live</span></div><div className="hub-stat-list"><div className="hub-stat-row"><span>Registered APIs</span><strong>{catalog.length}</strong></div><div className="hub-stat-row"><span>Total endpoints</span><strong>{stats.endpoints}</strong></div><div className="hub-stat-row"><span>Sync failures</span><strong style={{ color: stats.failed ? 'var(--red)' : undefined }}>{stats.failed}</strong></div></div></div>
      </section>

      <section className="hub-panel hub-link-grid" style={{ marginBottom: 30 }}>
        <Link to="/organization" className="hub-link-card"><p className="hub-panel-label">Workspace</p><h3>Organization</h3><p>Business units, teams, and developers.</p></Link>
        <Link to="/software" className="hub-link-card"><p className="hub-panel-label">Workspace</p><h3>Software Catalog</h3><p>Apps, APIs, and services inventory.</p></Link>
        <Link to="/" className="hub-link-card"><p className="hub-panel-label">Workspace</p><h3>API Catalog</h3><p>OpenAPI synced directly from Git.</p></Link>
      </section>

      <div className="hub-page-header" style={{ alignItems: 'center', marginBottom: 16, paddingBottom: 14 }}><div><p className="hub-kicker">API registry</p><h2 className="hub-panel-title" style={{ fontSize: 22, marginTop: 4 }}>All APIs</h2></div>{stats.failed > 0 && <span className="hub-badge hub-badge-error">{stats.failed} need attention</span>}</div>

      {isLoading ? <div className="hub-panel hub-empty">Loading catalog...</div> : catalog.length === 0 ? (
        <div className="hub-panel hub-empty"><p className="hub-kicker">No source connected</p><h2>Catalog masih kosong</h2><p>Daftarkan repository yang berisi OpenAPI untuk mulai membangun registry ini.</p><Link to="/register" className="hub-button hub-button-primary">Register API</Link></div>
      ) : (
        <div className="hub-api-grid">
          {catalog.map((item) => <article key={item.id} className="hub-panel hub-api-card"><div className="hub-api-card-head"><div style={{ minWidth: 0 }}><Link to={`/apis/${item.id}`}><h3>{item.name}</h3></Link><p className="hub-api-card-desc">{item.description || 'No description provided.'}</p></div><SyncBadge status={item.last_sync_status} /></div><div className="hub-api-metrics"><div className="hub-api-metric"><strong>{item.endpoint_count || 0}</strong><span>Endpoints</span></div><div className="hub-api-metric"><strong>v{item.active_version || '-'}</strong><span>Active version</span></div><div className="hub-api-metric"><strong>{item.last_commit_sha ? item.last_commit_sha.slice(0, 7) : '-'}</strong><span>Commit</span></div></div><div className="hub-api-footer"><div style={{ minWidth: 0 }}><div className="hub-api-source">{item.repository || '-'}</div><div className="hub-api-time">Last sync: {shortDate(item.last_synced_at)}</div></div><button className="hub-button hub-button-secondary" onClick={() => syncApi.mutate(item.id)} disabled={syncApi.isPending}>{syncApi.isPending ? 'Syncing...' : 'Sync now'}</button></div></article>)}
        </div>
      )}
    </div>
  )
}
