import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth'
import { api } from '../api'
import { groupApis } from '../apiCatalog'

function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>
}

function FolderIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" /></svg>
}

function Navigation({ catalog, location, onNavigate }) {
  const items = [
    ['/', 'Overview', <GridIcon key="overview" />],
    ['/organization', 'Organization', <FolderIcon key="organization" />],
    ['/software', 'Software Catalog', <FolderIcon key="software" />]
  ]

  return (
    <>
      <p className="hub-sidebar-label">Workspace</p>
      <nav className="hub-nav">
        {items.map(([to, label, icon]) => (
          <button key={to} className={`hub-nav-item ${location.pathname === to ? 'active' : ''}`} onClick={() => onNavigate(to)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="hub-sidebar-catalog">
        <p className="hub-sidebar-label">API Catalog</p>
        <nav className="hub-nav">
          {catalog.map((item) => (
            <Link key={item.id} to={`/apis/${item.id}`} className={`hub-nav-item ${location.pathname === `/apis/${item.id}` ? 'active' : ''}`} onClick={() => onNavigate(location.pathname)}>
              <span className="truncate">{item.name}</span>
              <span className="hub-count">{item.endpoint_count || 0}</span>
            </Link>
          ))}
          {catalog.length === 0 && <p className="hub-count" style={{ padding: '0 10px' }}>No APIs yet</p>}
        </nav>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: apis = [] } = useQuery({ queryKey: ['apis'], queryFn: () => api.get('/api/apis').then((response) => response.apis) })
  const catalog = groupApis(apis)
  const go = (to) => { setMenuOpen(false); navigate(to) }

  return (
    <div className="hub-shell flex h-screen flex-col overflow-hidden">
      <header className="hub-header">
        <Link to="/" className="hub-brand"><img src="/logo-serba-mulia.png" alt="Serba Mulia" /><span className="hub-brand-name">Hub API</span></Link>
        <div className="hub-header-actions">
          <button className="hub-mobile-menu" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
          <span className="hub-user">{user.name}</span>
          <button className="hub-button hub-button-secondary" onClick={logout}>Logout</button>
        </div>
      </header>
      <div className="hub-layout">
        <aside className="hub-sidebar"><Navigation catalog={catalog} location={location} onNavigate={go} /></aside>
        {menuOpen && <><button className="hub-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /><aside id="mobile-navigation" className="hub-mobile-drawer"><Navigation catalog={catalog} location={location} onNavigate={go} /></aside></>}
        <main className="hub-content"><Outlet /></main>
      </div>
    </div>
  )
}
