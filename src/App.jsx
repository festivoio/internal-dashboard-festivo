import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import EventsPage from './components/EventsPage'
import PayoutsPage from './components/PayoutsPage'
import FeePage from './components/FeePage'
import './App.css'
import CreateFeePolicyPage from './components/CreatePolicyPage'
import UpdatePolicyPage from './components/UpdatePolicyPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on mount
    const authStatus = localStorage.getItem('isAuthenticated')
    setIsAuthenticated(authStatus === 'true')
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
  }

  // Add logout function to window for Navigation component
  useEffect(() => {
    window.logout = handleLogout
  }, [])

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="App">
      <Routes>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/events"
          element={<EventsPage />}
        />
        <Route
          path="/payouts"
          element={<PayoutsPage />}
        />
        <Route
          path="/fee"
          element={<FeePage />}
        />
        <Route
          path="/fee/create"
          element={<CreateFeePolicyPage />}
        />
        <Route
          path="/fee/update/:id"
          element={<UpdatePolicyPage />}
        />
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </div>
  )
}

export default App