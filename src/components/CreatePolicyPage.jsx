import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Navigation from './Navigation'
import FeePolicyForm from './FeePolicyForm'
import './FeePolicyModule.css'
import { apiRequest } from '../lib/apiClient'

function CreateFeePolicyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const duplicatePolicy = location.state?.duplicatePolicy || null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleCreate = async (payload) => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await apiRequest('/api/fees/policies/create', {
        method: 'POST',
        body: {
          subjectType: payload.subjectType,
          subjectId: payload.subjectId,
          currency: payload.currency,
          perTicket: payload.perTicket,
          rounding: payload.rounding,
          rules: { tiers: payload.tiers },
          isActive: payload.isActive,
          activeFrom: payload.activeFrom ? new Date(payload.activeFrom) : null,
          activeTo: payload.activeTo ? new Date(payload.activeTo) : null
        }
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to create policy')
      }

      setSuccess(true)
      setTimeout(() => navigate('/fee'), 1200)
    } catch (requestError) {
      setError(`Error creating policy: ${requestError.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="events-page">
      <Navigation />

      <main className="events-content">
        <div className="container">
          <header className="fee-page-head">
            <div>
              <h1>Create Fee Policy</h1>
              <p>Configure fee rules with clear scope, tier logic, and schedule.</p>
            </div>
          </header>

          {error ? <div className="error">{error}</div> : null}
          {success ? <div className="success">Policy created successfully. Redirecting...</div> : null}

          <FeePolicyForm
            mode="create"
            loading={loading}
            initialData={duplicatePolicy || {
              subjectType: 'ORGANIZATION',
              subjectId: '',
              currency: 'BDT',
              perTicket: false,
              rounding: 'ROUND',
              isActive: true,
              activeFrom: new Date().toISOString().split('T')[0],
              activeTo: '',
              tiers: [{ min: 0, max: null, pct: 0.03 }]
            }}
            onSubmit={handleCreate}
            onCancel={() => navigate('/fee')}
          />
        </div>
      </main>
    </div>
  )
}

export default CreateFeePolicyPage
