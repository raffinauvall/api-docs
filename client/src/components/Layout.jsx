import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

export default function Layout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  const { data: apis = [] } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/api/apis').then((r) => r.apis)
  })
  const catalog = groupApis(apis)

  return (
    <div className="hub-shell flex h-screen flex-col overflow-hidden font-sans selection:bg-sky-500/30">
      {/* Header */}
      <header className="z-50 shrink-0 border-b border-white/10 bg-[#08090D]">
        <div className="mx-auto flex h-16 w-full max-w-none items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-slate-100 transition-opacity hover:opacity-90">
            <img src="/logo-serba-mulia.png" alt="Serba Mulia" className="h-7 w-auto object-contain" />
            <span className="hidden border-l border-white/15 pl-3 text-sm font-bold tracking-tight sm:inline">Hub API</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-white/5 px-3 font-semibold text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              Menu
            </button>
            <span className="hidden font-medium text-slate-400 sm:inline">{user.name}</span>
            <button
              className="min-h-11 rounded-lg border border-white/10 bg-white/5 px-4 font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
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
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#101219] md:flex">
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

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <aside id="mobile-navigation" className="absolute inset-y-16 left-0 z-50 flex w-[min(84vw,280px)] flex-col border-r border-white/10 bg-[#101219] md:hidden">
              <div className="p-4">
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-slate-500">Navigation</p>
                <nav className="space-y-1">
                  {[
                    ['/', 'Overview All'],
                    ['/organization', 'Organization'],
                    ['/software', 'Software Catalog']
                  ].map(([to, label]) => (
                    <button
                      key={to}
                      onClick={() => { setMenuOpen(false); navigate(to) }}
                      className={`min-h-11 w-full rounded-lg px-3 text-left text-sm font-medium transition-colors ${location.pathname === to ? 'bg-sky-500/10 text-sky-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-slate-500">API Catalog</p>
                <nav className="space-y-1">
                  {catalog.map((item) => (
                    <Link
                      key={item.id}
                      to={`/apis/${item.id}`}
                      onClick={() => setMenuOpen(false)}
                      className={`flex min-h-11 items-center justify-between rounded-lg px-3 text-sm ${location.pathname === `/apis/${item.id}` ? 'bg-sky-500/10 text-sky-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="ml-2 shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{item.endpoint_count || 0}</span>
                    </Link>
                  ))}
                  {catalog.length === 0 && <p className="px-3 py-2 text-xs text-slate-600">No APIs yet</p>}
                </nav>
              </div>
            </aside>
          </>
        )}

        {/* Dynamic Page Content */}
        <main className="relative flex-1 overflow-y-auto bg-[#08090D]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
