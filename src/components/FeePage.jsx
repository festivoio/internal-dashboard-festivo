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

  const [scopeFilter, setScopeFilter] = useState('ALL')
  const [currencyFilter, setCurrencyFilter] = useState('ALL')
  const [activeOnly, setActiveOnly] = useState(false)

  const [effectiveFilters, setEffectiveFilters] = useState({
    eventId: '',
    organizationId: '',
    userId: '',
    currency: 'BDT'
  })
  const [effectiveLoading, setEffectiveLoading] = useState(false)
  const [effectiveResult, setEffectiveResult] = useState(null)

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
    const active = policies.filter((policy) => getPolicyStatus(policy) === 'ACTIVE').length
    const upcoming = policies.filter((policy) => getPolicyStatus(policy) === 'SCHEDULED').length
    const expired = policies.filter((policy) => {
      const status = getPolicyStatus(policy)
      return status === 'EXPIRED' || status === 'INACTIVE'
    }).length

    return { active, upcoming, expired }
  }, [policies])

  const filteredPolicies = useMemo(() => {
    let rows = [...policies]

    if (scopeFilter !== 'ALL') {
      rows = rows.filter((policy) => normalizeScope(policy.subjectType) === scopeFilter)
    }

    if (currencyFilter !== 'ALL') {
      rows = rows.filter((policy) => formatCurrencyLabel(policy.currency) === currencyFilter)
    }

    if (activeOnly) {
      rows = rows.filter((policy) => getPolicyStatus(policy) === 'ACTIVE')
    }

    const resolvePolicyDate = (policy) => {
      const rawDate = policy.activeFrom || policy.activeTo || policy.createdAt || policy.updatedAt
      const time = rawDate ? new Date(rawDate).getTime() : 0
      return Number.isFinite(time) ? time : 0
    }

    return rows.sort((a, b) => resolvePolicyDate(b) - resolvePolicyDate(a))
  }, [policies, scopeFilter, currencyFilter, activeOnly])

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
          method: 'PATCH',
          body: {
            perTicket: Boolean(policy.perTicket),
            rounding: policy.rounding || 'ROUND',
            rules: policy.rules || { tiers: [] },
            isActive: false,
            activeFrom: policy.activeFrom ? new Date(policy.activeFrom) : null,
            activeTo: policy.activeTo ? new Date(policy.activeTo) : null
          }
        })
        fetchPolicies()
      } catch (requestError) {
        setError(`Error deactivating policy: ${requestError.message}`)
      }
      return
    }

    if (action === 'activate') {
      const confirmed = window.confirm('Activating this policy deactivates other active policies in same scope/currency. Continue?')
      if (!confirmed) return

      try {
        await apiRequest(`/api/fees/policies/${policy.id}/activate`, {
          method: 'POST',
          body: {}
        })
        fetchPolicies()
      } catch (requestError) {
        setError(`Error activating policy: ${requestError.message}`)
      }
    }
  }

  const runEffectiveLookup = async () => {
    try {
      setEffectiveLoading(true)
      const params = new URLSearchParams()

      if (effectiveFilters.eventId) params.set('eventId', effectiveFilters.eventId)
      if (effectiveFilters.organizationId) params.set('organizationId', effectiveFilters.organizationId)
      if (effectiveFilters.userId) params.set('userId', effectiveFilters.userId)
      if (effectiveFilters.currency) params.set('currency', effectiveFilters.currency)

      const result = await apiRequest(`/api/fees/effective?${params.toString()}`, {
        method: 'GET'
      })

      setEffectiveResult(result?.data || result)
    } catch (lookupError) {
      setError(`Effective lookup failed: ${lookupError.message}`)
      setEffectiveResult(null)
    } finally {
      setEffectiveLoading(false)
    }
  }

  const currencyOptions = useMemo(() => {
    const set = new Set(['BDT'])
    policies.forEach((policy) => set.add(formatCurrencyLabel(policy.currency)))
    return Array.from(set)
  }, [policies])

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

              <section className="fee-form-card fee-filter-row">
                <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}>
                  <option value="ALL">All scopes</option>
                  <option value="GLOBAL">Global</option>
                  <option value="ORGANIZATION">Organization</option>
                  <option value="EVENT">Event</option>
                  <option value="USER">User</option>
                </select>
                <select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)}>
                  <option value="ALL">All currencies</option>
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <label className="fee-inline-check">
                  <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
                  Active only
                </label>
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
                      <th>isActive</th>
                      <th>Active From</th>
                      <th>Active To</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPolicies.map((policy) => {
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
                          <td>{policy.isActive ? 'Yes' : 'No'}</td>
                          <td>{formatDateLabel(policy.activeFrom)}</td>
                          <td>{policy.activeTo ? formatDateLabel(policy.activeTo) : 'No end date'}</td>
                          <td>
                            <PolicyActionsDropdown policy={policy} onAction={handlePolicyAction} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <section className="fee-form-card effective-inspector">
                <div className="fee-section-header">
                  <h3>Effective Policy Inspector</h3>
                </div>

                <div className="effective-grid">
                  <input
                    placeholder="Event ID"
                    value={effectiveFilters.eventId}
                    onChange={(event) => setEffectiveFilters((prev) => ({ ...prev, eventId: event.target.value }))}
                  />
                  <input
                    placeholder="Organization ID"
                    value={effectiveFilters.organizationId}
                    onChange={(event) => setEffectiveFilters((prev) => ({ ...prev, organizationId: event.target.value }))}
                  />
                  <input
                    placeholder="User ID"
                    value={effectiveFilters.userId}
                    onChange={(event) => setEffectiveFilters((prev) => ({ ...prev, userId: event.target.value }))}
                  />
                  <input
                    placeholder="Currency"
                    value={effectiveFilters.currency}
                    onChange={(event) => setEffectiveFilters((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                  />
                  <button type="button" className="primary-btn" onClick={runEffectiveLookup} disabled={effectiveLoading}>
                    {effectiveLoading ? 'Checking...' : 'Inspect Effective Policy'}
                  </button>
                </div>

                {effectiveResult ? (
                  <pre className="effective-result">{JSON.stringify(effectiveResult, null, 2)}</pre>
                ) : null}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default FeePage
