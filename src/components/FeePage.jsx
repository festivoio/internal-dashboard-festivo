import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from './Navigation'

function FeePage() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState([])
  const [filteredPolicies, setFilteredPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'https://test-api.festivo.io'

  const ADMIN_CREDENTIALS = {
    username: 'rique',
    password: '213nbu340eseAS&^$Usds^%h9'
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const filterAndSearchPolicies = useCallback(() => {
    let filtered = policies

    if (searchTerm) {
      filtered = filtered.filter(policy =>
        (policy.subjectId && policy.subjectId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (policy.currency && policy.currency.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (policy.subjectType && policy.subjectType.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredPolicies(filtered)
  }, [policies, searchTerm])

  useEffect(() => {
    filterAndSearchPolicies()
  }, [filterAndSearchPolicies])

  const fetchPolicies = async () => {
    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/fees/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch policies')
      }

      const result = await response.json()
      if (result.success) {
        setPolicies(result.data)
        setFilteredPolicies(result.data)
        setError('')
      } else {
        throw new Error('API returned error')
      }
    } catch (err) {
      setError('Error loading policies: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const deletePolicy = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/fees/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) {
        throw new Error('Failed to delete policy')
      }

      const result = await response.json()
      if (result.success) {
        // Refresh the policies list after successful deletion
        fetchPolicies()
      } else {
        throw new Error(result.message || 'Delete operation failed')
      }
    } catch (err) {
      alert('Error deleting policy: ' + err.message)
    }
  }

  return (
    <div className="events-page">
      <Navigation />

      <main className="events-content">
        <div className="container">
          <div className="page-header">
            <h1>Fee Management</h1>
            <button
              className="btn action-btn create-new-btn"
              onClick={() => navigate('create')}
            >
              <span className="btn-icon">+</span>
              Create New Policy
            </button>
          </div>
          <p>Manage platform fee policies and configurations</p>

          {!loading && !error && (
            <div className="search-filter-container">
              <input
                className="search-input"
                type="text"
                placeholder="Search policies by type, currency, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="clear-filter-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading fee policies...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button onClick={fetchPolicies} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <FeesList policies={filteredPolicies} navigate={navigate} deletePolicy={deletePolicy} />
          )}
        </div>
      </main>
    </div>
  )
}

function FeesList({ policies, navigate, deletePolicy }) {
  if (policies.length === 0) {
    return (
      <div className="no-events">
        <p>No fee policies found.</p>
      </div>
    )
  }

  return (
    <div className="events-list">
      <div className="events-header">
        <h2>Fee Policies ({policies.length})</h2>
      </div>

      <div className="table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>Subject Type</th>
              <th>Subject ID</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Active From</th>
              <th>Fee Tiers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, index) => (
              <tr key={index}>
                <td>
                  <span className={`status-badge ${
                    policy.subjectType === 'GLOBAL' ? 'status-published' :
                    policy.subjectType === 'ORGANIZATION' ? 'event-type' :
                    'status-default'
                  }`}>
                    {policy.subjectType}
                  </span>
                </td>
                <td className="event-name">
                  {policy.subjectId || 'Global Policy'}
                </td>
                <td>
                  <strong>{policy.currency}</strong>
                </td>
                <td>
                  <span className={`status-badge ${
                    policy.isActive ? 'status-published' : 'status-cancelled'
                  }`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {policy.activeFrom ? new Date(policy.activeFrom).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <TiersTable tiers={policy.rules?.tiers || []} />
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn approve-btn"
                      onClick={() => navigate(`/fee/update/${policy.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn paid-btn"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TiersTable({ tiers }) {
  if (!tiers || tiers.length === 0) return <em>No tiers defined</em>

  return (
    <table className="tiers-table">
      <thead>
        <tr>
          <th>Min</th>
          <th>Max</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        {tiers.map((tier, i) => (
          <tr key={i}>
            <td>{tier.min}</td>
            <td>{tier.max !== null ? tier.max : '∞'}</td>
            <td>{(tier.pct * 100).toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default FeePage
