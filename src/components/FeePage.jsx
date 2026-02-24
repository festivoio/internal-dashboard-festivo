import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from './Navigation'
import PolicyActionsDropdown from './PolicyActionsDropdown'
import PolicyStatusBadge from './PolicyStatusBadge'
import PolicySummaryCard from './PolicySummaryCard'
import { apiRequest } from '../lib/apiClient'
import {
  buildTierPreview,
  formatCurrencyLabel,
  formatDateLabel,
  formatScopeLabel,
  getPolicyStatus,
  normalizeScope
} from './feePolicyUtils'
import './FeePolicyModule.css'

function FeePage() {
  const navigate = useNavigate()

  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjectLabelMap, setSubjectLabelMap] = useState({
    USER: {},
    ORGANIZATION: {},
    EVENT: {}
  })

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const result = await apiRequest('/api/fees/policies', {
        method: 'POST',
        body: {}
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to load policies')
      }

      const rows = result.data || []
      setPolicies(rows)
      setError('')

      hydrateSubjectLabels(rows)
    } catch (loadError) {
      setError(`Error loading policies: ${loadError.message}`)
    } finally {
      setLoading(false)
    }
  }

  const hydrateSubjectLabels = async (rows) => {
    const requiredTypes = Array.from(new Set(rows.map((policy) => normalizeScope(policy.subjectType))))
      .filter((type) => ['USER', 'ORGANIZATION', 'EVENT'].includes(type))

    if (!requiredTypes.length) return

    const nextMap = {
      USER: {},
      ORGANIZATION: {},
      EVENT: {}
    }

    await Promise.all(requiredTypes.map(async (type) => {
      try {
        const endpoint = type === 'ORGANIZATION'
          ? '/api/fees/admin/organizations'
          : type === 'EVENT'
            ? '/api/fees/admin/events'
            : '/api/fees/admin/users'

        const result = await apiRequest(endpoint, {
          method: 'POST',
          body: {}
        })

        if (!result.success) return

        ;(result.data || []).forEach((item) => {
          nextMap[type][item.id] = item.name || item.email || item.id
        })
      } catch {
        // fallback to id display if label fetch fails
      }
    }))

    setSubjectLabelMap(nextMap)
  }

  const summary = useMemo(() => {
    const now = new Date()
    const active = policies.filter((policy) => getPolicyStatus(policy) === 'ACTIVE').length
    const upcoming = policies.filter((policy) => getPolicyStatus(policy) === 'SCHEDULED').length
    const expired = policies.filter((policy) => {
      const status = getPolicyStatus(policy)
      return status === 'EXPIRED' || status === 'INACTIVE'
    }).length

    return { active, upcoming, expired, total: policies.length, now }
  }, [policies])

  const resolveSubjectLabel = (policy) => {
    const scope = normalizeScope(policy.subjectType)
    if (scope === 'GLOBAL') return 'Global Policy'

    const mapped = subjectLabelMap[scope]?.[policy.subjectId]
    if (mapped) return mapped

    return policy.subjectName || policy.subjectLabel || 'Unknown subject'
  }

  const handlePolicyAction = async (action, policy) => {
    if (action === 'view' || action === 'edit') {
      navigate(`/fee/update/${policy.id}`)
      return
    }

    if (action === 'duplicate') {
      navigate('/fee/create', {
        state: {
          duplicatePolicy: {
            subjectType: policy.subjectType,
            subjectId: policy.subjectId,
            currency: policy.currency,
            perTicket: policy.perTicket,
            rounding: policy.rounding,
            isActive: policy.isActive,
            activeFrom: policy.activeFrom,
            activeTo: policy.activeTo,
            tiers: policy.rules?.tiers || []
          }
        }
      })
      return
    }

    if (action === 'delete') {
      const confirmed = window.confirm('Delete this policy permanently?')
      if (!confirmed) return

      try {
        await apiRequest(`/api/fees/policies/${policy.id}`, {
          method: 'DELETE'
        })
        fetchPolicies()
      } catch (requestError) {
        setError(`Error deleting policy: ${requestError.message}`)
      }
      return
    }

    if (action === 'deactivate') {
      try {
        await apiRequest(`/api/fees/policies/${policy.id}`, {
          method: 'PUT',
          body: {
            perTicket: Boolean(policy.perTicket),
            rounding: policy.rounding || 'ROUND',
            rules: { tiers: policy.rules?.tiers || [] },
            isActive: false,
            activeFrom: policy.activeFrom ? new Date(policy.activeFrom) : null,
            activeTo: policy.activeTo ? new Date(policy.activeTo) : null
          }
        })
        fetchPolicies()
      } catch (requestError) {
        setError(`Error deactivating policy: ${requestError.message}`)
      }
    }
  }

  return (
    <div className="events-page">
      <Navigation />

      <main className="events-content">
        <div className="container">
          <header className="fee-page-head">
            <div>
              <h1>Fee Policies</h1>
              <p>Manage platform fee rules by scope and currency.</p>
            </div>
            <button className="fee-new-policy-btn" onClick={() => navigate('/fee/create')}>
              + New Policy
            </button>
          </header>

          {loading ? (
            <div className="loading">Loading fee policies...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button onClick={fetchPolicies} className="retry-btn">Retry</button>
            </div>
          ) : (
            <>
              <section className="fee-summary-row">
                <PolicySummaryCard label="Active Policies" value={summary.active} />
                <PolicySummaryCard label="Upcoming Policies" value={summary.upcoming} />
                <PolicySummaryCard label="Expired Policies" value={summary.expired} />
              </section>

              <div className="fee-policy-table-wrap">
                <table className="fee-policy-table">
                  <thead>
                    <tr>
                      <th>Scope</th>
                      <th>Subject</th>
                      <th>Currency</th>
                      <th>Fee Structure</th>
                      <th>Status</th>
                      <th>Active Period</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {policies.map((policy) => {
                      const status = getPolicyStatus(policy)
                      const tierPreview = buildTierPreview(policy.rules?.tiers || [])
                      const subjectLabel = resolveSubjectLabel(policy)

                      return (
                        <tr key={policy.id}>
                          <td>
                            <span className="scope-pill">{formatScopeLabel(policy.subjectType)}</span>
                          </td>
                          <td>
                            <p className="subject-title">{subjectLabel}</p>
                            {policy.subjectId ? <p className="subject-sub">ID: {policy.subjectId}</p> : null}
                          </td>
                          <td>{formatCurrencyLabel(policy.currency)}</td>
                          <td>
                            <div className="tier-inline-list">
                              {tierPreview.map((item) => (
                                <span className="tier-inline-pill" key={`${policy.id}-${item}`}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <PolicyStatusBadge status={status} />
                          </td>
                          <td>
                            {formatDateLabel(policy.activeFrom)}
                            {' - '}
                            {policy.activeTo ? formatDateLabel(policy.activeTo) : 'No end date'}
                          </td>
                          <td>
                            <PolicyActionsDropdown policy={policy} onAction={handlePolicyAction} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default FeePage
