import { useState, useEffect } from 'react'
import Navigation from './Navigation'

function PayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [filteredPayouts, setFilteredPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const API_URL = import.meta.env.VITE_API_URL || 'https://test-api.festivo.io'

  // Admin credentials
  const ADMIN_CREDENTIALS = {
    username: 'rique',
    password: '213nbu340eseAS&^$Usds^%h9'
  }

  useEffect(() => {
    fetchPayouts()
    // fetchSummary() // Remove if summary endpoint not available
  }, [])

  useEffect(() => {
    filterPayouts()
  }, [payouts, statusFilter])

  const filterPayouts = () => {
    if (statusFilter === 'all') {
      setFilteredPayouts(payouts)
    } else if (statusFilter === 'pending') {
      setFilteredPayouts(payouts.filter(p =>
        p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING'
      ))
    } else if (statusFilter === 'paid') {
      setFilteredPayouts(payouts.filter(p => p.status === 'PAID'))
    } else if (statusFilter === 'requested') {
      setFilteredPayouts(payouts.filter(p => p.status === 'REQUESTED'))
    } else if (statusFilter === 'approved') {
      setFilteredPayouts(payouts.filter(p => p.status === 'APPROVED'))
    }
  }

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch payouts: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setPayouts(data.data.rows || [])
      } else {
        setPayouts([])
      }
      setError('')
    } catch (err) {
      setError('Error loading payouts: ' + err.message)
    } finally {
      setLoading(false)
    }
  }


  const handleApprove = async (payoutId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/payouts/${payoutId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) {
        throw new Error('Failed to approve payout')
      }

      // Refresh payouts after approval
      fetchPayouts()
    } catch (err) {
      setError('Error approving payout: ' + err.message)
    }
  }

  const handleMarkPaid = async (payoutId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/payouts/${payoutId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) {
        throw new Error('Failed to mark payout as paid')
      }

      // Refresh payouts after marking as paid
      fetchPayouts()
    } catch (err) {
      setError('Error marking payout as paid: ' + err.message)
    }
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'REQUESTED':
        return 'status-draft'
      case 'APPROVED':
        return 'status-published'
      case 'PROCESSING':
        return 'status-processing'
      case 'PAID':
        return 'status-completed'
      case 'REJECTED':
        return 'status-cancelled'
      default:
        return 'status-default'
    }
  }

  return (
    <div className="payouts-page">
      <Navigation />
      
      <main className="payouts-content">
        <div className="container">
          <h1>Payouts Management</h1>
          <p>Manage event payouts and withdrawals.</p>

          {!loading && !error && (
            <div className="search-filter-container">
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({payouts.length})
                </button>
                <button
                  className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending ({payouts.filter(p => p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING').length})
                </button>
                <button
                  className={`filter-btn ${statusFilter === 'requested' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('requested')}
                >
                  Requested ({payouts.filter(p => p.status === 'REQUESTED').length})
                </button>
                <button
                  className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('approved')}
                >
                  Approved ({payouts.filter(p => p.status === 'APPROVED').length})
                </button>
                <button
                  className={`filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('paid')}
                >
                  Paid ({payouts.filter(p => p.status === 'PAID').length})
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading payouts...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button onClick={fetchPayouts} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <PayoutsList
              payouts={filteredPayouts}
              onApprove={handleApprove}
              onMarkPaid={handleMarkPaid}
              formatCurrency={formatCurrency}
              getStatusColor={getStatusColor}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function PayoutsList({ payouts, onApprove, onMarkPaid, formatCurrency, getStatusColor }) {
  if (!payouts.length) {
    return (
      <div className="no-payouts">
        <p>No payouts found.</p>
      </div>
    )
  }

  return (
    <div className="payouts-list">
      <div className="payouts-header">
        <h2>Payouts ({payouts.length})</h2>
      </div>

      <div className="table-container">
        <table className="payouts-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Organization</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Created</th>
              <th>Approved</th>
              <th>Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className="event-name">{payout.eventName}</td>
                <td>{payout.organizationName}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </span>
                </td>
                <td>{formatCurrency(payout.amountNet, payout.currency)}</td>
                <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                <td>{payout.approvedAt ? new Date(payout.approvedAt).toLocaleDateString() : '-'}</td>
                <td>{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="action-buttons">
                    {payout.status === 'REQUESTED' && (
                      <button
                        onClick={() => onApprove(payout.id)}
                        className="action-btn approve-btn"
                      >
                        Approve
                      </button>
                    )}
                    {(payout.status === 'APPROVED' || payout.status === 'PROCESSING') && (
                      <button
                        onClick={() => onMarkPaid(payout.id)}
                        className="action-btn paid-btn"
                      >
                        Mark Paid
                      </button>
                    )}
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

export default PayoutsPage