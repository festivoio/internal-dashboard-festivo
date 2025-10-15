import { useState } from 'react'
import Navigation from './Navigation'
import SubjectIdSelector from './SubjectIdSelector'
import './CreatePolicyPage.css'

function CreateFeePolicyPage() {
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'https://test-api.festivo.io'

  const ADMIN_CREDENTIALS = {
    username: 'rique',
    password: '213nbu340eseAS&^$Usds^%h9'
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
        subjectType: formData.subjectType,
        subjectId: formData.subjectType === 'GLOBAL' ? null : formData.subjectId,
        currency: formData.currency,
        perTicket: formData.perTicket,
        rounding: formData.rounding,
        rules: { tiers: formData.tiers },
        isActive: formData.isActive,
        activeFrom: formData.activeFrom ? new Date(formData.activeFrom) : null,
        activeTo: formData.activeTo ? new Date(formData.activeTo) : null
      }

      const response = await fetch(`${API_URL}/api/fees/policies/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to create policy')

      const result = await response.json()
      if (result.success) {
        setSuccess(true)
        setFormData({
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
      } else {
        throw new Error(result.message || 'API returned error')
      }
    } catch (err) {
      setError('Error creating policy: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="events-page create-policy-page">
      <Navigation />

      <main className="events-content">
        <div className="container">
          <div className="page-header-section">
            <h1>Create Fee Policy</h1>
            <p className="page-description">Configure and add a new platform fee policy</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              Fee policy created successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="fee-policy-form">
            {/* BASIC INFO */}
            <div className="form-section card">
              <div className="section-header">
                <h3>Basic Information</h3>
                <p className="section-description">Define the scope and currency for this policy</p>
              </div>
              <div className="form-group">
                <label htmlFor="subjectType">Subject Type</label>
                <select
                  id="subjectType"
                  name="subjectType"
                  value={formData.subjectType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="GLOBAL">Global</option>
                  <option value="ORGANIZATION">Organization</option>
                  <option value="EVENT">Event</option>
                  <option value="USER">User</option>
                </select>
              </div>

              {formData.subjectType !== 'GLOBAL' && (
                <>
                  <div className="form-group">
                    <label htmlFor="subjectId">Subject ID</label>
                    <input
                      type="text"
                      id="subjectId"
                      name="subjectId"
                      value={formData.subjectId}
                      onChange={handleInputChange}
                      placeholder="Enter subject ID or browse below"
                      required
                    />
                  </div>
                  <SubjectIdSelector
                    subjectType={formData.subjectType}
                    currentId={formData.subjectId}
                    onSelectId={(id) => setFormData(prev => ({ ...prev, subjectId: id }))}
                  />
                </>
              )}

              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="BDT">BDT</option>
                </select>
              </div>
            </div>

            {/* POLICY CONFIG */}
            <div className="form-section card">
              <div className="section-header">
                <h3>Policy Configuration</h3>
                <p className="section-description">Set calculation rules and activation schedule</p>
              </div>

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
              <div className="section-header">
                <h3>Fee Tiers</h3>
                <p className="section-description">Define pricing tiers based on transaction amounts</p>
              </div>

              {formData.tiers.map((tier, index) => (
                <div key={index} className="tier-group">
                  <div className="tier-header">
                    <h4>Tier {index + 1}</h4>
                  </div>

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
                className="submit-btn primary-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Policy'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => window.history.back()}
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

export default CreateFeePolicyPage
