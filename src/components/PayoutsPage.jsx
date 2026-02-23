import { useState, useEffect } from 'react'
import Navigation from './Navigation'

/**
 * @typedef {Object} PrimaryBank
 * @property {string=} id
 * @property {string=} type
 * @property {string=} bankName
 * @property {string=} accountName
 * @property {string=} accountNumber
 * @property {string=} routingNumber
 * @property {string=} branch
 * @property {string=} provider
 * @property {string=} walletNumber
 * @property {string=} country
 * @property {string=} currency
 * @property {string=} status
 * @property {boolean=} isPrimary
 * @property {Record<string, unknown>=} meta
 */

/**
 * @typedef {Object} AdminPayoutRow
 * @property {string=} id
 * @property {string=} eventName
 * @property {string=} organizationName
 * @property {string=} status
 * @property {number=} amountNet
 * @property {string=} currency
 * @property {string=} createdAt
 * @property {string=} approvedAt
 * @property {string=} paidAt
 * @property {PrimaryBank | null=} primaryBank
 */

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

const PRIMARY_BANK_FIELD_LABELS = {
  id: 'Bank ID',
  type: 'Type',
  bankName: 'Bank Name',
  accountName: 'Account Name',
  accountNumber: 'Account Number',
  routingNumber: 'Routing Number',
  branch: 'Branch',
  provider: 'Provider',
  walletNumber: 'Wallet Number',
  country: 'Country',
  currency: 'Currency',
  status: 'Status',
  isPrimary: 'Is Primary',
  meta: 'Meta'
}

const hasValue = (value) => value !== null && value !== undefined && value !== ''

const safeText = (value) => (hasValue(value) ? String(value) : null)

const getTransferDisplayFields = (primaryBank) => {
  if (!primaryBank) return []

  const baseFields = primaryBank.type === 'BANK'
    ? [
        ['Bank Name', primaryBank.bankName],
        ['Account Name', primaryBank.accountName],
        ['Account Number', primaryBank.accountNumber],
        ['Routing Number', primaryBank.routingNumber],
        ['Branch', primaryBank.branch]
      ]
    : [
        ['Provider', primaryBank.provider],
        ['Wallet Number', primaryBank.walletNumber],
        ['Account Name', primaryBank.accountName]
      ]

  baseFields.push(['Country', primaryBank.country], ['Currency', primaryBank.currency])

  return baseFields.filter(([, value]) => hasValue(value))
}

const buildTransferDetailsText = (payout) => {
  const amountValue = hasValue(payout?.amountNet) ? payout.amountNet : '-'
  const amountCurrency = safeText(payout?.currency) || ''
  const amountText = `${amountValue}${amountCurrency ? ` ${amountCurrency}` : ''}`

  const lines = [
    `Organization: ${safeText(payout?.organizationName) || '-'}`,
    `Payout ID: ${safeText(payout?.id) || '-'}`,
    `Amount: ${amountText}`
  ]

  if (!payout?.primaryBank) {
    lines.push('Bank info: unavailable')
    return lines.join('\n')
  }

  const primaryBank = payout.primaryBank
  const fieldOrder = [
    'type',
    'bankName',
    'accountName',
    'accountNumber',
    'routingNumber',
    'branch',
    'provider',
    'walletNumber',
    'country',
    'currency',
    'status',
    'isPrimary',
    'id',
    'meta'
  ]

  fieldOrder.forEach((key) => {
    const value = primaryBank[key]
    if (!hasValue(value)) return

    if (key === 'meta' && typeof value === 'object') {
      lines.push(`${PRIMARY_BANK_FIELD_LABELS[key]}: ${JSON.stringify(value)}`)
      return
    }

    lines.push(`${PRIMARY_BANK_FIELD_LABELS[key]}: ${String(value)}`)
  })

  return lines.join('\n')
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'absolute'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

function PayoutsList({ payouts, onApprove, onMarkPaid, formatCurrency, getStatusColor }) {
  const [copyingPayoutId, setCopyingPayoutId] = useState(null)
  const [copiedPayoutId, setCopiedPayoutId] = useState(null)

  const handleCopyTransferDetails = async (payout) => {
    if (!payout?.primaryBank) return

    try {
      setCopyingPayoutId(payout.id)
      await copyToClipboard(buildTransferDetailsText(payout))
      setCopiedPayoutId(payout.id)

      setTimeout(() => {
        setCopiedPayoutId((currentId) => (currentId === payout.id ? null : currentId))
      }, 1500)
    } catch (error) {
      console.error('Failed to copy transfer details', error)
    } finally {
      setCopyingPayoutId(null)
    }
  }

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
              <th>Transfer Info</th>
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
                  {!payout.primaryBank ? (
                    <span className="transfer-unavailable">Bank info unavailable</span>
                  ) : (
                    <div className="transfer-info">
                      {getTransferDisplayFields(payout.primaryBank).map(([label, value]) => (
                        <div className="transfer-line" key={`${payout.id}-${label}`}>
                          <span className="transfer-label">{label}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleCopyTransferDetails(payout)}
                      className="action-btn copy-transfer-btn"
                      disabled={!payout.primaryBank || copyingPayoutId === payout.id}
                    >
                      {!payout.primaryBank
                        ? 'Copy Unavailable'
                        : copiedPayoutId === payout.id
                          ? 'Copied'
                          : copyingPayoutId === payout.id
                            ? 'Copying...'
                            : 'Copy transfer details'}
                    </button>
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
