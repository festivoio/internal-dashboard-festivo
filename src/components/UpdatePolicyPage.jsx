import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navigation from './Navigation'

function UpdatePolicyPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    subjectType: 'ORGANIZATION',
    subjectId: '',
    currency: 'USD',
    perTicket: false,
    rounding: 'ROUND',
    isActive: true,
    activeFrom: new Date().toISOString().split('T')[0],
    activeTo: '',
    tiers: [{ min: 0, max: null, pct: 0.03 }]
  })

  const [loading, setLoading] = useState(false)
  const [loadingPolicy, setLoadingPolicy] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'https://test-api.festivo.io'

  const ADMIN_CREDENTIALS = {
    username: 'rique',
    password: '213nbu340eseAS&^$Usds^%h9'
  }

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('adminToken')

    if (!token) {
      return { 'Content-Type': 'application/json' }
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-auth-token': token
    }
  }

  useEffect(() => {
    if (id) {
      loadPolicy()
    }
  }, [id])

  const loadPolicy = async () => {
    try {
      setLoadingPolicy(true)
      setError('')

      const response = await fetch(`${API_URL}/api/fees/policies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) throw new Error('Failed to load policies')

      const result = await response.json()
      if (result.success && result.data) {
        // Find the specific policy by ID
        const policy = result.data.find(p => p.id === id)

        if (!policy) {
          throw new Error('Policy not found')
        }

        // Pre-fill form with policy data
        setFormData({
          subjectType: policy.subjectType || 'ORGANIZATION',
          subjectId: policy.subjectId || '',
          currency: policy.currency || 'USD',
          perTicket: policy.perTicket !== undefined ? policy.perTicket : false,
          rounding: policy.rounding || 'ROUND',
          isActive: policy.isActive !== undefined ? policy.isActive : true,
          activeFrom: policy.activeFrom ? new Date(policy.activeFrom).toISOString().split('T')[0] : '',
          activeTo: policy.activeTo ? new Date(policy.activeTo).toISOString().split('T')[0] : '',
          tiers: policy.rules?.tiers?.map(tier => ({
            min: tier.min || 0,
            max: tier.max === null ? null : tier.max,
            pct: tier.pct || 0.03
          })) || [{ min: 0, max: null, pct: 0.03 }]
        })
      } else {
        throw new Error(result.message || 'Failed to load policy data')
      }
    } catch (err) {
      setError('Error loading policy: ' + err.message)
    } finally {
      setLoadingPolicy(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleTierChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) =>
        i === index
          ? {
              ...tier,
              [field]:
                field === 'pct'
                  ? parseFloat(value) / 100
                  : value === ''
                  ? null
                  : parseFloat(value)
            }
          : tier
      )
    }))
  }

  const addTier = () => {
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { min: 0, max: null, pct: 0.03 }]
    }))
  }

  const removeTier = (index) => {
    if (formData.tiers.length > 1) {
      setFormData(prev => ({
        ...prev,
        tiers: prev.tiers.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const payload = {
        ...ADMIN_CREDENTIALS,
        perTicket: formData.perTicket,
        rounding: formData.rounding,
        rules: { tiers: formData.tiers },
        isActive: formData.isActive,
        activeFrom: formData.activeFrom ? new Date(formData.activeFrom) : null,
        activeTo: formData.activeTo ? new Date(formData.activeTo) : null
      }

      const response = await fetch(`${API_URL}/api/fees/policies/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to update policy')

      const result = await response.json()
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/fee')
        }, 2000)
      } else {
        throw new Error(result.message || 'API returned error')
      }
    } catch (err) {
      setError('Error updating policy: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingPolicy) {
    return (
      <div className="events-page">
        <Navigation />
        <main className="events-content">
          <div className="container">
            <div className="loading">Loading policy...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="events-page">
      <Navigation />

      <main className="events-content">
        <div className="container">
          <h1>Update Fee Policy</h1>
          <p>Modify existing platform fee policy</p>

          {error && <div className="error">{error}</div>}
          {success && (
            <div className="success">Fee policy updated successfully! Redirecting...</div>
          )}

          <form onSubmit={handleSubmit} className="fee-policy-form">
            {/* BASIC INFO - Read only in edit mode */}
            <div className="form-section card">
              <h3>Basic Information (Read Only)</h3>
              <div className="form-group">
                <label>Subject Type</label>
                <input
                  type="text"
                  value={formData.subjectType}
                  readOnly
                  className="readonly"
                />
              </div>

              {formData.subjectType !== 'GLOBAL' && (
                <div className="form-group">
                  <label>Subject ID</label>
                  <input
                    type="text"
                    value={formData.subjectId}
                    readOnly
                    className="readonly"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  readOnly
                  className="readonly"
                />
              </div>
            </div>

            {/* POLICY CONFIG */}
            <div className="form-section card">
              <h3>Policy Configuration</h3>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="perTicket"
                    checked={formData.perTicket}
                    onChange={handleInputChange}
                  />
                  Per Ticket Calculation
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="rounding">Rounding</label>
                <select
                  id="rounding"
                  name="rounding"
                  value={formData.rounding}
                  onChange={handleInputChange}
                  required
                >
                  <option value="CEIL">Round Up</option>
                  <option value="FLOOR">Round Down</option>
                  <option value="ROUND">Round Nearest</option>
                </select>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active Policy
                </label>
              </div>

              <div className="form-inline">
                <div className="form-group">
                  <label htmlFor="activeFrom">Active From</label>
                  <input
                    type="date"
                    id="activeFrom"
                    name="activeFrom"
                    value={formData.activeFrom}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="activeTo">Active To</label>
                  <input
                    type="date"
                    id="activeTo"
                    name="activeTo"
                    value={formData.activeTo}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* TIERS */}
            <div className="form-section card">
              <h3>Fee Tiers</h3>

              {formData.tiers.map((tier, index) => (
                <div key={index} className="tier-group">
                  <h4>Tier {index + 1}</h4>

                  <div className="form-inline">
                    <div className="form-group">
                      <label>Min Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={tier.min || ''}
                        onChange={(e) =>
                          handleTierChange(index, 'min', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={tier.max || ''}
                        onChange={(e) =>
                          handleTierChange(index, 'max', e.target.value)
                        }
                        placeholder="∞"
                      />
                    </div>

                    <div className="form-group">
                      <label>Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={(tier.pct * 100).toFixed(2)}
                        onChange={(e) =>
                          handleTierChange(index, 'pct', e.target.value)
                        }
                        required
                      />
                    </div>

                    {formData.tiers.length > 1 && (
                      <button
                        type="button"
                        className="remove-tier-btn danger-btn"
                        onClick={() => removeTier(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="add-tier-btn action-btn"
                onClick={addTier}
              >
                Add Tier
              </button>
            </div>

            {/* ACTIONS */}
            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn approve-btn"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Policy'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/fee')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default UpdatePolicyPage
