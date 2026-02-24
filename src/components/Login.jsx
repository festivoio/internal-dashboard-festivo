import { useState } from 'react'
import { ApiError, loginAdmin } from '../lib/apiClient'
import './Login.css'

function Login({ onRetry, onLoginSuccess, isChecking, error }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getLoginErrorMessage = (loginError) => {
    if (!(loginError instanceof ApiError)) {
      return loginError?.message || 'Unable to login. Please try again.'
    }

    if (loginError.status === 400) return 'Please provide a valid email and password.'
    if (loginError.status === 401) return 'Invalid admin credentials.'
    if (loginError.status >= 500) return 'Server error while logging in. Please try again shortly.'

    return loginError.message || 'Unable to login. Please try again.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const response = await loginAdmin({
        email: formData.email.trim(),
        password: formData.password
      })

      const user = response?.data?.user || response?.user || null
      if (!user) {
        throw new Error('Login succeeded but user payload was missing.')
      }

      onLoginSuccess(user)
    } catch (loginError) {
      setSubmitError(getLoginErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Festivo Admin Dashboard</h1>
            <p>Sign in with admin credentials to continue.</p>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {submitError && (
            <div className="login-error">
              {submitError}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <button
              type="submit"
              className="login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-actions">
            <button
              type="button"
              className="login-link-btn"
              onClick={onRetry}
              disabled={isChecking}
            >
              {isChecking ? 'Checking Session...' : 'Retry Session Check'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
