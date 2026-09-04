import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RegisterApi from './pages/RegisterApi'
import ApiDetail from './pages/ApiDetail'
import EndpointDetail from './pages/EndpointDetail'
import Organization from './pages/Organization'
import SoftwareCatalog from './pages/SoftwareCatalog'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#090b14] text-slate-400">Loading workspace...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading, refresh } = useAuth()

  useEffect(() => {
    refresh()
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#090b14] text-slate-400">Loading workspace...</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="organization" element={<Organization />} />
        <Route path="software" element={<SoftwareCatalog />} />
        <Route path="register" element={<RegisterApi />} />
        <Route path="apis/:apiId" element={<ApiDetail />} />
        <Route path="endpoints/:endpointId" element={<EndpointDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
