import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

const METHOD_COLORS = {
  GET: 'm-get',
  POST: 'm-post',
  PUT: 'm-put',
  PATCH: 'm-patch',
  DELETE: 'm-del',
  HEAD: 'm-head',
  OPTIONS: 'm-opt'
}

export default function ApiDetail() {
  const { apiId } = useParams()
  const queryClient = useQueryClient()

  const { data: apiData, isLoading: apiLoading } = useQuery({
    queryKey: ['api', apiId],
    queryFn: () => api.get(`/api/apis/${apiId}`)
  })

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', apiId],
    queryFn: () => api.get(`/api/apis/${apiId}/versions`).then((r) => r.versions)
  })

  const [activeVersionId, setActiveVersionId] = useState(null)

  const { data: endpoints, isLoading: endpointsLoading } = useQuery({
    queryKey: ['endpoints', activeVersionId],
    enabled: !!activeVersionId,
    queryFn: () => api.get(`/api/versions/${activeVersionId}/endpoints`).then((r) => r.endpoints)
  })

  const api = apiData?.api

  // Set active version once loaded
  const versionId = activeVersionId || (versions || []).find((v) => v.is_active)?.id
  if (versionId && versionId !== activeVersionId) setActiveVersionId(versionId)

  const activate = useMutation({
    mutationFn: (vid) => api.patch(`/api/versions/${vid}`, { is_active: true }),
    onSuccess: () => queryClient.invalidateQueries(['versions', apiId])
  })

  const sync = useMutation({
    mutationFn: () => api.post(`/api/apis/${apiId}/sync`),
    onSuccess: () => queryClient.invalidateQueries(['api', apiId])
  })

  if (apiLoading || versionsLoading) return <div className="container">Memuat...</div>

  const grouped = (endpoints || []).reduce((acc, ep) => {
    const tag = (ep.tags && ep.tags[0]) || 'General'
    if (!acc[tag]) acc[tag] = []
    acc[tag].push(ep)
    return acc
  }, {})

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <Link to="/" className="back">← Dashboard</Link>
          <h1>{api?.name}</h1>
          {api?.description && <p className="muted">{api.description}</p>}
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => sync.mutate()} disabled={sync.isPending}>
            Sync Now
          </button>
        </div>
      </div>

      <div className="meta-bar">
        <span className="badge">v{api?.active_version || '-'}</span>
        <span className="muted">{api?.repository}</span>
        <span className="muted">{api?.branch} · {api?.file_path}</span>
      </div>

      <div className="version-tabs">
        {(versions || []).map((v) => (
          <button
            key={v.id}
            className={`btn ${v.is_active ? 'primary' : 'ghost'} small`}
            onClick={() => setActiveVersionId(v.id)}
          >
            {v.version}
            {v.is_active && ' (aktif)'}
            {!v.is_active && (
              <span
                className="activate"
                onClick={(e) => {
                  e.stopPropagation()
                  activate.mutate(v.id)
                }}
              >
                · aktifkan
              </span>
            )}
          </button>
        ))}
      </div>

      {endpointsLoading ? (
        <div>Memuat endpoint...</div>
      ) : (
        Object.entries(grouped).map(([tag, eps]) => (
          <section key={tag} className="group">
            <h2>{tag}</h2>
            <div className="endpoint-list">
              {eps.map((ep) => (
                <Link key={ep.id} to={`/endpoints/${ep.id}`} className="endpoint-row">
                  <span className={`method ${METHOD_COLORS[ep.method] || 'm-get'}`}>{ep.method}</span>
                  <span className="path">{ep.path}</span>
                  <span className="summary">{ep.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
