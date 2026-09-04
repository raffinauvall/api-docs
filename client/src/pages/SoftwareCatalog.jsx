import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

export default function SoftwareCatalog() {
  const { data: apis = [], isLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/api/apis').then((r) => r.apis)
  })
  const catalog = groupApis(apis)

  return (
    <main className="w-full p-6 pb-20 lg:p-8">
      <div className="mb-8 border-b border-white/5 pb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Software Catalog</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">Apps, APIs, Services</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Inventory service yang nanti nyambung ke Organization dan API Catalog.</p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-white/10 bg-slate-900/30 p-8 text-sm text-slate-500">Loading catalog...</div>
      ) : catalog.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {catalog.map((item) => (
            <Link key={item.id} to={`/apis/${item.id}`} className="rounded-lg border border-white/10 bg-slate-900/30 p-5 transition hover:border-sky-500/30 hover:bg-slate-900/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">API</p>
                  <h2 className="mt-2 text-lg font-bold text-white">{item.name}</h2>
                </div>
                <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400">{item.endpoint_count || 0} endpoints</span>
              </div>
              <p className="mt-4 text-sm text-slate-400">{item.description || 'No description provided.'}</p>
              <p className="mt-4 truncate font-mono text-xs text-slate-500">{item.repository || 'repository belum terset'}</p>
              {item.branches?.length > 1 && <p className="mt-2 text-xs text-slate-500">Branches: {item.branches.map((branch) => branch.branch).join(', ')}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 bg-slate-900/20 p-12 text-center">
          <h2 className="text-lg font-bold text-white">Catalog masih kosong</h2>
          <p className="mt-2 text-sm text-slate-500">Register API atau push OpenAPI via webhook untuk mulai isi catalog.</p>
        </div>
      )}
    </main>
  )
}
