import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import EventsPage from './components/EventsPage'
import PayoutsPage from './components/PayoutsPage'
import FeePage from './components/FeePage'
import CreateFeePolicyPage from './components/CreatePolicyPage'
import UpdatePolicyPage from './components/UpdatePolicyPage'
import ForbiddenPage from './components/ForbiddenPage'
import {
  clearStoredAccessToken,
  isAdminUser,
  logoutSession,
  verifyAdminSession
} from './lib/apiClient'
import './App.css'

function App() {
  const [authState, setAuthState] = useState({
    status: 'loading',
    user: null,
    error: ''
  })

  const checkSession = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, status: 'loading', error: '' }))

    const result = await verifyAdminSession()

    if (result.status === 'authorized') {
      setAuthState({ status: 'authorized', user: result.user, error: '' })
      return
    }

    if (result.status === 'forbidden') {
      setAuthState({ status: 'forbidden', user: result.user || null, error: '' })
      return
    }

    if (result.status === 'error') {
      setAuthState({ status: 'unauthorized', user: null, error: result.message || 'Session verification failed.' })
      return
    }

    clearStoredAccessToken()
    setAuthState({ status: 'unauthorized', user: null, error: '' })
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    const onUnauthorized = () => {
      clearStoredAccessToken()
      setAuthState({ status: 'unauthorized', user: null, error: 'Session expired. Please log in again.' })
    }

    const onForbidden = () => {
      setAuthState((prev) => ({ ...prev, status: 'forbidden' }))
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)
    window.addEventListener('auth:forbidden', onForbidden)

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized)
      window.removeEventListener('auth:forbidden', onForbidden)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logoutSession()
    } catch {
      // If logout endpoint fails, still clear local token fallback and session state.
    }

    clearStoredAccessToken()
    setAuthState({ status: 'unauthorized', user: null, error: '' })
  }, [])

  const handleLoginSuccess = useCallback((user) => {
    if (isAdminUser(user)) {
      setAuthState({ status: 'authorized', user, error: '' })
      return
    }

    setAuthState({ status: 'forbidden', user: user || null, error: '' })
  }, [])

  useEffect(() => {
    window.logout = handleLogout

    return () => {
      delete window.logout
    }
  }, [handleLogout])

  if (authState.status === 'loading') {
    return <div className="loading">Loading...</div>
  }

  const protectedElement = (element) => {
    if (authState.status === 'authorized') return element
    if (authState.status === 'forbidden') return <Navigate to="/forbidden" replace />
    return <Navigate to="/login" replace />
  }

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={
            authState.status === 'authorized'
              ? <Navigate to="/dashboard" replace />
              : <Login onRetry={checkSession} onLoginSuccess={handleLoginSuccess} isChecking={authState.status === 'loading'} error={authState.error} />
          }
        />
        <Route
          path="/forbidden"
          element={
            authState.status === 'authorized'
              ? <Navigate to="/dashboard" replace />
              : <ForbiddenPage onRetry={checkSession} />
          }
        />
        <Route
          path="/dashboard"
          element={protectedElement(<Dashboard />)}
        />
        <Route
          path="/events"
          element={protectedElement(<EventsPage />)}
        />
        <Route
          path="/payouts"
          element={protectedElement(<PayoutsPage />)}
        />
        <Route
          path="/fee"
          element={protectedElement(<FeePage />)}
        />
        <Route
          path="/fee/create"
          element={protectedElement(<CreateFeePolicyPage />)}
        />
        <Route
          path="/fee/update/:id"
          element={protectedElement(<UpdatePolicyPage />)}
        />
        <Route
          path="*"
          element={<Navigate to={authState.status === 'authorized' ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </div>
  )
}

export default App
