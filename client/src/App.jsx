import { useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RegisterApi from './pages/RegisterApi'
import ApiDetail from './pages/ApiDetail'
import EndpointDetail from './pages/EndpointDetail'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading">Memuat...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading, refresh, logout } = useAuth()

  useEffect(() => {
    refresh()
  }, [])

  if (loading) return <div className="page-loading">Memuat...</div>

  return (
    <div className="app">
      {user && (
        <header className="topbar">
          <div className="container topbar-inner">
            <Link to="/" className="brand">API Docs</Link>
            <div className="topbar-right">
              <span className="who">{user.name}</span>
              <button className="btn ghost" onClick={logout}>Logout</button>
            </div>
          </div>
        </header>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/register"
          element={
            <Protected>
              <RegisterApi />
            </Protected>
          }
        />
        <Route
          path="/apis/:apiId"
          element={
            <Protected>
              <ApiDetail />
            </Protected>
          }
        />
        <Route
          path="/endpoints/:endpointId"
          element={
            <Protected>
              <EndpointDetail />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
