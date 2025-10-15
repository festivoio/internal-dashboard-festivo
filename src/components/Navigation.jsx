import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    if (window.logout) {
      window.logout()
    }
  }

  return (
    <nav className="dashboard-nav">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-brand" onClick={closeMobileMenu}>
          Festivo Dashboard
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link
            to="/dashboard"
            className={isActive('/dashboard') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Dashboard
          </Link>
          <Link
            to="/events"
            className={isActive('/events') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Events
          </Link>
          <Link
            to="/payouts"
            className={isActive('/payouts') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Payouts
          </Link>
          <Link
            to="/fee"
            className={isActive('/fee') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            Fee Policy
          </Link>
          <button
            className="logout-btn"
            onClick={() => {
              closeMobileMenu()
              handleLogout()
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation