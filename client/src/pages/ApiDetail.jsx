import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api as apiClient } from '../api'
import { readRuntimeConfig, saveRuntimeConfig } from '../apiRuntimeConfig'

const METHOD_COLORS = {
  GET: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  PATCH: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  DELETE: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  HEAD: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  OPTIONS: 'bg-slate-500/10 text-slate-400 ring-slate-500/20'
}

function ApiRuntimeSettings({ currentApi }) {
  const [config, setConfig] = useState(() => readRuntimeConfig(currentApi.id, currentApi.base_url))
  const [savedAt, setSavedAt] = useState(null)
  const setField = (key, value) => setConfig((current) => ({ ...current, [key]: value }))

  function save() {
    saveRuntimeConfig(currentApi.id, config)
    setSavedAt(new Date())
  }

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-white/10 bg-[#080d14]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Runtime</p>
          <h2 className="mt-1 text-lg font-bold text-white">Base URL & Authentication</h2>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs font-semibold text-emerald-400">Saved {savedAt.toLocaleTimeString()}</span>}
          <button onClick={save} className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-500">Save for all endpoints</button>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_220px]">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Base URL</span>
          <input list={`api-base-${currentApi.id}`} value={config.baseUrl} onChange={(e) => setField('baseUrl', e.target.value)} placeholder={currentApi.base_url || 'https://api.example.com'} className="h-11 w-full rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500" />
          <datalist id={`api-base-${currentApi.id}`}>
            {currentApi.base_url && <option value={currentApi.base_url}>OpenAPI</option>}
          </datalist>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Auth Type</span>
          <select value={config.authType} onChange={(e) => setField('authType', e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500">
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="apiKey">API Key</option>
          </select>
        </label>

        {config.authType === 'bearer' && (
          <input value={config.bearerToken} onChange={(e) => setField('bearerToken', e.target.value)} placeholder="Bearer token" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500 xl:col-span-2" />
        )}
        {config.authType === 'basic' && (
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-2">
            <input value={config.basicUser} onChange={(e) => setField('basicUser', e.target.value)} placeholder="username" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500" />
            <input value={config.basicPass} onChange={(e) => setField('basicPass', e.target.value)} placeholder="password" type="password" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500" />
          </div>
        )}
        {config.authType === 'apiKey' && (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px] xl:col-span-2">
            <input value={config.apiKeyName} onChange={(e) => setField('apiKeyName', e.target.value)} placeholder="Header/query name" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500" />
            <input value={config.apiKeyValue} onChange={(e) => setField('apiKeyValue', e.target.value)} placeholder="value" className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500" />
            <select value={config.apiKeyIn} onChange={(e) => setField('apiKeyIn', e.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#05070a] px-3 text-sm text-white outline-none focus:border-sky-500">
              <option value="header">Header</option>
              <option value="query">Query</option>
            </select>
          </div>
        )}

        <label className="space-y-2 xl:col-span-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Default Headers JSON</span>
          <textarea value={config.headers} onChange={(e) => setField('headers', e.target.value)} className="min-h-24 w-full resize-y rounded-lg border border-white/10 bg-[#05070a] p-3 font-mono text-xs text-sky-200 outline-none focus:border-sky-500" spellCheck="false" />
        </label>
      </div>
    </section>
  )
}

function SourceSettings({ currentApi, knownBranches = [], onChangeBranch, saving, endpointCount }) {
  const [branch, setBranch] = useState(currentApi.branch || 'main')
  const { data: branches = [] } = useQuery({
    queryKey: ['branches', currentApi.id],
    queryFn: () => apiClient.get(`/api/apis/${currentApi.id}/branches`).then((r) => r.branches)
  })
  const branchOptions = Array.from(new Set([...branches, ...knownBranches, currentApi.branch].filter(Boolean)))

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-sky-500/20 bg-[#080d14]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Source</p>
          <h2 className="mt-1 text-lg font-bold text-white">Git Branch & Active Docs</h2>
        </div>
        {saving && <span className="text-xs font-semibold text-sky-400">Syncing branch...</span>}
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-[260px_1fr_160px]">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Branch ref</span>
          {branchOptions.length > 1 ? (
            <select value={branch} disabled={saving} onChange={(e) => {
              setBranch(e.target.value)
              onChangeBranch(e.target.value)
            }} className="h-11 w-full rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500 disabled:opacity-50">
              {branchOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          ) : (
            <input value={branch} onBlur={() => onChangeBranch(branch)} onChange={(e) => setBranch(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#05070a] px-3 font-mono text-sm text-white outline-none focus:border-sky-500" />
          )}
        </label>
        <div className="rounded-lg border border-white/10 bg-[#05070a] p-3 text-xs text-slate-500">
          <p className="font-mono text-slate-300">{currentApi.repository || '-'}</p>
          <p className="mt-2 font-mono">{currentApi.file_path || '-'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#05070a] p-3">
          <p className="text-2xl font-extrabold text-white">{endpointCount}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">endpoints</p>
        </div>
      </div>
    </section>
  )
}

export default function ApiDetail() {
  const { apiId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: apiData, isLoading: apiLoading } = useQuery({
    queryKey: ['api', apiId],
    queryFn: () => apiClient.get(`/api/apis/${apiId}`)
  })

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', apiId],
    queryFn: () => apiClient.get(`/api/apis/${apiId}/versions`).then((r) => r.versions)
  })

  const { data: allApis = [] } = useQuery({
    queryKey: ['apis'],
    queryFn: () => apiClient.get('/api/apis').then((r) => r.apis)
  })

  const [activeVersionId, setActiveVersionId] = useState(null)

  const { data: endpoints, isLoading: endpointsLoading } = useQuery({
    queryKey: ['endpoints', activeVersionId],
    enabled: !!activeVersionId,
    queryFn: () => apiClient.get(`/api/versions/${activeVersionId}/endpoints`).then((r) => r.endpoints)
  })

  const currentApi = apiData?.api

  // Set active version once loaded
  const hasSelectedVersion = (versions || []).some((v) => v.id === activeVersionId)
  const versionId = hasSelectedVersion ? activeVersionId : (versions || []).find((v) => v.is_active)?.id
  if (versionId && versionId !== activeVersionId) setActiveVersionId(versionId)

  const sync = useMutation({
    mutationFn: () => apiClient.post(`/api/apis/${apiId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', apiId] })
      queryClient.invalidateQueries({ queryKey: ['versions', apiId] })
    }
  })

  const updateSource = useMutation({
    mutationFn: async (branch) => {
      await apiClient.patch(`/api/apis/${apiId}/source`, { branch })
      return apiClient.post(`/api/apis/${apiId}/sync`)
    },
    onSuccess: async () => {
      setActiveVersionId(null)
      queryClient.invalidateQueries({ queryKey: ['api', apiId] })
      queryClient.invalidateQueries({ queryKey: ['versions', apiId] })
      queryClient.invalidateQueries({ queryKey: ['apis'] })
    }
  })

  const sameSourceApis = allApis.filter((item) =>
    item.repository === currentApi?.repository && item.file_path === currentApi?.file_path
  )

  function changeBranch(branch) {
    if (!branch || branch === currentApi?.branch) return
    const existing = sameSourceApis.find((item) => item.branch === branch)
    if (existing) {
      navigate(`/apis/${existing.id}`)
      return
    }
    updateSource.mutate(branch)
  }

  if (apiLoading || versionsLoading) return <div className="mx-auto max-w-7xl px-6 py-12 text-slate-500">Loading API data...</div>

  const grouped = (endpoints || []).reduce((acc, ep) => {
    const tag = (ep.tags && ep.tags[0]) || 'General'
    if (!acc[tag]) acc[tag] = []
    acc[tag].push(ep)
    return acc
  }, {})

  return (
    <main className="mx-auto w-full px-6 py-10 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-6">
        <div>
          <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-sky-400 mb-4 transition-colors">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{currentApi?.name}</h1>
          {currentApi?.description && <p className="mt-3 max-w-3xl text-slate-400 leading-relaxed">{currentApi.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-300 shadow-sm hover:border-sky-500/30 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
          >
            {sync.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-slate-900/30 p-5 shadow-inner backdrop-blur-sm mb-8">
        <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400 ring-1 ring-inset ring-sky-500/20">
          v{currentApi?.active_version || '-'}
        </span>
        <span className="text-sm text-slate-400 font-medium border-l border-white/10 pl-4">{currentApi?.repository}</span>
        <span className="text-sm text-slate-400 font-medium border-l border-white/10 pl-4">
          <span className="text-slate-500 mr-2">Ref:</span>{currentApi?.branch}
        </span>
        <span className="text-sm text-slate-400 font-medium border-l border-white/10 pl-4">
          <span className="font-mono text-slate-300">{currentApi?.file_path}</span>
        </span>
      </div>

      {currentApi && <SourceSettings key={`${currentApi.id}-${currentApi.branch}`} currentApi={currentApi} knownBranches={sameSourceApis.map((item) => item.branch)} endpointCount={(endpoints || []).length} saving={updateSource.isPending} onChangeBranch={changeBranch} />}
      {currentApi && <ApiRuntimeSettings key={currentApi.id} currentApi={currentApi} />}

      {endpointsLoading ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center text-sm font-medium text-slate-500">Loading endpoints...</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([tag, eps]) => (
            <section key={tag} className="scroll-mt-24">
              <h2 className="mb-5 text-xl font-extrabold text-white">{tag}</h2>
              <div className="flex flex-col gap-3">
                {eps.map((ep) => (
                  <Link
                    key={ep.id}
                    to={`/endpoints/${ep.id}`}
                    className="group/ep flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 rounded-xl border border-white/5 bg-slate-900/40 p-4 shadow-sm transition-all hover:border-white/10 hover:bg-slate-900/60"
                  >
                    <span
                      className={`inline-flex w-24 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-bold tracking-wide ring-1 ring-inset ${METHOD_COLORS[ep.method] || METHOD_COLORS.GET}`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-300 group-hover/ep:text-white transition-colors">{ep.path}</span>
                    <span className="text-sm text-slate-500 sm:ml-auto">{ep.summary}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
