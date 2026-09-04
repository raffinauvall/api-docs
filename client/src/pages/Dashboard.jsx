import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

const statusClass = {
  SYNCED: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  SYNCING: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  FAILED: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  DISABLED: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  PENDING: 'bg-slate-500/10 text-slate-400 ring-slate-500/20'
}

function SyncBadge({ status }) {
  const label = {
    SYNCED: 'Synced',
    SYNCING: 'Syncing',
    FAILED: 'Failed',
    DISABLED: 'Disabled',
    PENDING: 'Pending'
  }[status] || 'Pending'

  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset ${statusClass[status] || statusClass.PENDING}`}>
      {label}
    </span>
  )
}

function shortDate(value) {
  if (!value) return 'Never synced'
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { data: apis = [], isLoading: apisLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/api/apis').then((r) => r.apis)
  })

  const syncApi = useMutation({
    mutationFn: (apiId) => api.post(`/api/apis/${apiId}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apis'] })
  })

  const loading = apisLoading
  const catalog = useMemo(() => groupApis(apis), [apis])
  const stats = useMemo(() => {
    const endpoints = catalog.reduce((sum, item) => sum + Number(item.endpoint_count || 0), 0)
    const synced = catalog.filter((item) => item.last_sync_status === 'SYNCED').length
    const failed = catalog.filter((item) => item.last_sync_status === 'FAILED')
    return { endpoints, synced, failed }
  }, [catalog])

  const portalAreas = [
    { title: 'Organization', body: 'Business units, teams, developers', count: '3 units', to: '/organization' },
    { title: 'Software Catalog', body: 'Apps, APIs, services', count: `${catalog.length} items`, to: '/software' },
    { title: 'API Catalog', body: 'OpenAPI from GitHub webhook sync', count: `${catalog.length} APIs`, to: '/register' }
  ]

  return (
    <div className="w-full p-6 lg:p-8 pb-20">
      {
        <>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400 mb-1">Control Center</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
              Developer Portal
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Backstage-style hub for organization, software catalog, and OpenAPI catalog. API Catalog is connected to GitHub sync.
            </p>
          </div>

          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {portalAreas.map((area) => (
              <div key={area.title} className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-5 text-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Portal Area</p>
                    <h2 className="mt-2 text-lg font-extrabold text-white">{area.title}</h2>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold">{area.count}</span>
                </div>
                <p className="mt-4 text-sm">{area.body}</p>
                <Link to={area.to} className="mt-5 inline-flex h-9 items-center rounded-lg bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-500">Open</Link>
              </div>
            ))}
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {/* KPI Card 1 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-900/60">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registered APIs</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-4xl font-extrabold text-white">{catalog.length}</p>
            </div>

            {/* KPI Card 2 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-900/60">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Endpoints</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-4xl font-extrabold text-white">{stats.endpoints}</p>
            </div>

            {/* KPI Card 3 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-900/60">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Successfully Synced</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-4xl font-extrabold text-white">{stats.synced}</p>
            </div>
          </div>
        </>
      }

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-200">
          All APIs
        </h2>
        <Link className="inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-500" to="/register">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register API
        </Link>
      </div>

      {stats.failed.length > 0 && (
        <section className="mb-8 rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-400">{stats.failed.length} Sync Failures Detected</h3>
              <p className="mt-1 text-sm text-rose-300/70">Previous active documentation is retained. Please inspect the sync logs before retrying.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.failed.slice(0, 3).map((item) => (
                <Link key={item.id} to={`/apis/${item.id}`} className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/20 transition-colors">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center text-sm font-medium text-slate-500">Loading data...</div>
      ) : catalog.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/20 p-12 text-center">
          <h3 className="text-lg font-bold text-white">No APIs Found</h3>
          <p className="mt-2 text-sm text-slate-400">There are no APIs in this view. Try registering one.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {catalog.map((item) => (
            <article key={item.id} className="group/card relative rounded-xl border border-white/10 bg-slate-900/40 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-sky-500/30 hover:bg-slate-900/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                  </div>
                  <Link to={`/apis/${item.id}`} className="block truncate text-lg font-bold text-slate-100 group-hover/card:text-sky-400 transition-colors">
                    {item.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {item.description || 'No description provided.'}
                  </p>
                </div>
                <SyncBadge status={item.last_sync_status} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-[#0B0F19]/80 p-3 border border-white/5">
                  <p className="font-bold text-slate-200">{item.endpoint_count || 0}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Endpoints</p>
                </div>
                <div className="rounded-lg bg-[#0B0F19]/80 p-3 border border-white/5">
                  <p className="truncate font-bold text-slate-200">v{item.active_version || '-'}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active Ver</p>
                </div>
                <div className="rounded-lg bg-[#0B0F19]/80 p-3 border border-white/5">
                  <p className="truncate font-mono font-bold text-slate-200">{item.last_commit_sha ? item.last_commit_sha.slice(0, 7) : '-'}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Commit</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-xs text-slate-500 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <span className="truncate">{item.repository || '-'}</span>
                  </div>
                  <p>Ref: <span className="text-slate-400">{item.branch || '-'}</span> / <span className="font-mono text-slate-400">{item.file_path || '-'}</span></p>
                  {item.branches?.length > 1 && <p>Branches: <span className="text-slate-400">{item.branches.map((branch) => branch.branch).join(', ')}</span></p>}
                  <p>Last sync: {shortDate(item.last_synced_at)}</p>
                </div>
                <button
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                  onClick={() => syncApi.mutate(item.id)}
                  disabled={syncApi.isPending}
                >
                  {syncApi.isPending ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
