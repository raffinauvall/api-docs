import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { data: apis = [] } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/api/apis').then((r) => r.apis)
  })
  const catalog = groupApis(apis)

  return (
    <div className="flex h-screen flex-col bg-[#090b14] text-slate-300 font-sans selection:bg-sky-500/30 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-white/5 bg-[#090b14]/80 backdrop-blur-md z-50">
        <div className="mx-auto flex h-16 w-full max-w-none items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <Link to="/" className="text-lg font-bold tracking-tight text-slate-100 hover:text-white transition-colors">
              Dokumentasi API
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-slate-400">{user.name}</span>
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#090b14]/50 md:flex">
          <div className="p-4">
            <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Navigation</p>
            <nav className="space-y-1">
              {[
                ['/', 'Overview All'],
                ['/organization', 'Organization'],
                ['/software', 'Software Catalog']
              ].map(([to, label]) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className={`w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                <svg className="mr-3 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <p className="px-2 mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">API Catalog</p>
            <nav className="space-y-1">
              {catalog.map((item) => (
                <Link
                  key={item.id}
                  to={`/apis/${item.id}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    location.pathname === `/apis/${item.id}` ? 'bg-sky-500/10 text-sky-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{item.endpoint_count || 0}</span>
                </Link>
              ))}
              {catalog.length === 0 && <p className="px-3 py-2 text-xs text-slate-600">No APIs yet</p>}
            </nav>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#05070a] relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
