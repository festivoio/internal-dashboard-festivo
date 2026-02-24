import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navigation from './Navigation'
import FeePolicyForm from './FeePolicyForm'
import './FeePolicyModule.css'
import { apiRequest } from '../lib/apiClient'

function UpdatePolicyPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [policy, setPolicy] = useState(null)
  const [loadingPolicy, setLoadingPolicy] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    loadPolicy()
  }, [id])

  const loadPolicy = async () => {
    try {
      setLoadingPolicy(true)
      setError('')

      const result = await apiRequest('/api/fees/policies', {
        method: 'POST',
        body: {}
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to load fee policies')
      }

      const found = (result.data || []).find((item) => item.id === id)
      if (!found) {
        throw new Error('Policy not found')
      }

      setPolicy(found)
    } catch (loadError) {
      setError(`Error loading policy: ${loadError.message}`)
    } finally {
      setLoadingPolicy(false)
    }
  }

  const handleUpdate = async (payload) => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await apiRequest(`/api/fees/policies/${id}`, {
        method: 'PATCH',
        body: {
          perTicket: payload.perTicket,
          rounding: payload.rounding,
          rules: payload.rules,
          isActive: payload.isActive,
          activeFrom: payload.activeFrom ? new Date(payload.activeFrom) : null,
          activeTo: payload.activeTo ? new Date(payload.activeTo) : null
        }
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to update policy')
      }

      setSuccess(true)
      setTimeout(() => navigate('/fee'), 1200)
    } catch (requestError) {
      setError(`Error updating policy: ${requestError.message}`)
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

  if (!policy) {
    return (
      <div className="events-page">
        <Navigation />
        <main className="events-content">
          <div className="container">
            <div className="error">{error || 'Policy not found.'}</div>
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
          <header className="fee-page-head">
            <div>
              <h1>Update Fee Policy</h1>
              <p>Refine fee logic, schedule, and activation settings.</p>
            </div>
          </header>

          {error ? <div className="error">{error}</div> : null}
          {success ? <div className="success">Policy updated successfully. Redirecting...</div> : null}

          <FeePolicyForm
            mode="edit"
            loading={loading}
            initialData={{
              subjectType: policy.subjectType,
              subjectId: policy.subjectId,
              subjectLabel: policy.subjectName || policy.subjectId,
              currency: policy.currency,
              perTicket: policy.perTicket,
              rounding: policy.rounding,
              isActive: policy.isActive,
              activeFrom: policy.activeFrom ? new Date(policy.activeFrom).toISOString().split('T')[0] : '',
              activeTo: policy.activeTo ? new Date(policy.activeTo).toISOString().split('T')[0] : '',
              tiers: policy.rules?.tiers || [{ min: 0, max: null, pct: 0.03 }]
            }}
            onSubmit={handleUpdate}
            onCancel={() => navigate('/fee')}
          />
        </div>
      </main>
    </div>
  )
}

export default UpdatePolicyPage
