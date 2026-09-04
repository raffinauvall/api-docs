import { createContext, useContext, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const data = await api.get('/api/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const data = await api.post('/api/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }

  async function devLogin() {
    const data = await api.post('/api/auth/dev-login', {})
    setUser(data.user)
    return data.user
  }

  async function logout() {
    await api.post('/api/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, login, devLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
