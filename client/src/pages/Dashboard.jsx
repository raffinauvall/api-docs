import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'

function SyncBadge({ status }) {
  const map = {
    SYNCED: { label: 'Synced', cls: 'ok' },
    SYNCING: { label: 'Syncing', cls: 'warn' },
    FAILED: { label: 'Sync Failed', cls: 'err' },
    DISABLED: { label: 'Disabled', cls: 'muted' },
    PENDING: { label: 'Pending', cls: 'muted' }
  }
  const s = map[status] || map.PENDING
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [newGroup, setNewGroup] = useState('')

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/api/groups').then((r) => r.groups)
  })

  const { data: apis, isLoading: apisLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/api/apis').then((r) => r.apis)
  })

  const createGroup = useMutation({
    mutationFn: (name) => api.post('/api/groups', { name }),
    onSuccess: () => queryClient.invalidateQueries(['groups'])
  })

  const syncApi = useMutation({
    mutationFn: (apiId) => api.post(`/api/apis/${apiId}/sync`),
    onSuccess: () => queryClient.invalidateQueries(['apis'])
  })

  const apisByGroup = (groupId) => (apis || []).filter((a) => a.group_id === groupId)

  return (
    <main className="container">
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="actions">
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (newGroup.trim()) {
                createGroup.mutate(newGroup.trim())
                setNewGroup('')
              }
            }}
          >
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Nama group baru"
            />
            <button className="btn ghost" type="submit" disabled={createGroup.isPending}>
              + Create Group
            </button>
          </form>
          <Link className="btn primary" to="/register">+ Register API</Link>
        </div>
      </div>

      {groupsLoading || apisLoading ? (
        <div>Memuat...</div>
      ) : (
        (groups || []).map((g) => (
          <section key={g.id} className="group">
            <h2>{g.name}</h2>
            <div className="grid">
              {apisByGroup(g.id).map((a) => (
                <div key={a.id} className="card api-card">
                  <div className="card-head">
                    <Link to={`/apis/${a.id}`} className="api-name">{a.name}</Link>
                    {a.active_version && <span className="badge">v{a.active_version}</span>}
                  </div>
                  {a.description && <p className="desc">{a.description}</p>}
                  <div className="meta">
                    <span>{a.endpoint_count} endpoint</span>
                    <span>·</span>
                    <SyncBadge status={a.last_sync_status} />
                  </div>
                  <div className="card-foot">
                    <span className="muted small">
                      {a.last_commit_sha ? `Commit ${a.last_commit_sha.slice(0, 7)}` : 'Belum sync'}
                    </span>
                    <button
                      className="btn ghost small"
                      onClick={() => syncApi.mutate(a.id)}
                      disabled={syncApi.isPending}
                    >
                      Sync Now
                    </button>
                  </div>
                </div>
              ))}
              {apisByGroup(g.id).length === 0 && (
                <div className="muted">Belum ada API di group ini.</div>
              )}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
