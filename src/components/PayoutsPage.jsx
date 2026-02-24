import { useEffect, useMemo, useState } from 'react'
import Navigation from './Navigation'
import { apiRequest } from '../lib/apiClient'
import MoneySummaryCard from './MoneySummaryCard'
import PayoutRow from './PayoutRow'
import './PayoutsPage.css'

const PAGE_SIZE = 10

const SEGMENTS = [
  { key: 'all', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' }
]

const SORTABLE_FIELDS = {
  amount: 'amount',
  requestedDate: 'requestedDate',
  status: 'status'
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function moneyValue(amount) {
  if (!hasValue(amount)) return 0
  const parsed = Number(amount)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(amount, currency = 'BDT') {
  const safeAmount = moneyValue(amount)
  const normalizedCurrency = currency || 'BDT'

  if (normalizedCurrency.toUpperCase() === 'BDT') {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(safeAmount)
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(safeAmount)} ${normalizedCurrency}`
}

function buildTransferDetailsText(payout) {
  const lines = [
    `Payout ID: ${payout?.id || '-'}`,
    `Event: ${payout?.eventName || '-'}`,
    `Organizer: ${payout?.organizationName || '-'}`,
    `Amount: ${formatMoney(payout?.amountNet, payout?.currency)}`
  ]

  const primaryBank = payout?.primaryBank
  if (!primaryBank) {
    lines.push('Transfer details: unavailable')
    return lines.join('\n')
  }

  const provider = primaryBank.type === 'BANK' ? primaryBank.bankName : primaryBank.provider
  lines.push(`Bank / Provider: ${provider || '-'}`)
  lines.push(`Account Name: ${primaryBank.accountName || '-'}`)
  lines.push(`Account Number: ${primaryBank.accountNumber || primaryBank.walletNumber || '-'}`)
  lines.push(`Branch: ${primaryBank.branch || '-'}`)
  lines.push(`Country: ${primaryBank.country || '-'}`)
  lines.push(`Currency: ${primaryBank.currency || payout?.currency || '-'}`)

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

function getStatusCounts(rows) {
  return {
    all: rows.length,
    requested: rows.filter((row) => (row.status || '').toUpperCase() === 'REQUESTED').length,
    approved: rows.filter((row) => ['APPROVED', 'PROCESSING'].includes((row.status || '').toUpperCase())).length,
    paid: rows.filter((row) => (row.status || '').toUpperCase() === 'PAID').length,
    rejected: rows.filter((row) => (row.status || '').toUpperCase() === 'REJECTED').length
  }
}

function payoutMatchesFilter(payout, statusFilter) {
  const status = (payout.status || '').toUpperCase()

  if (statusFilter === 'requested') return status === 'REQUESTED'
  if (statusFilter === 'approved') return status === 'APPROVED' || status === 'PROCESSING'
  if (statusFilter === 'paid') return status === 'PAID'
  if (statusFilter === 'rejected') return status === 'REJECTED'

  return true
}

function sortPayouts(rows, sortConfig) {
  const sorted = [...rows]

  sorted.sort((a, b) => {
    let comparison = 0

    if (sortConfig.field === SORTABLE_FIELDS.amount) {
      comparison = moneyValue(a.amountNet) - moneyValue(b.amountNet)
    }

    if (sortConfig.field === SORTABLE_FIELDS.requestedDate) {
      comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    }

    if (sortConfig.field === SORTABLE_FIELDS.status) {
      comparison = (a.status || '').localeCompare(b.status || '')
    }

    return sortConfig.direction === 'asc' ? comparison : comparison * -1
  })

  return sorted
}

function buildSummaryCards(rows) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const totalRequestedAmount = rows.reduce((total, row) => total + moneyValue(row.amountNet), 0)
  const pendingApprovalRows = rows.filter((row) => (row.status || '').toUpperCase() === 'REQUESTED')
  const approvedNotPaidRows = rows.filter((row) => ['APPROVED', 'PROCESSING'].includes((row.status || '').toUpperCase()))
  const paidThisMonthRows = rows.filter((row) => {
    const paidAt = row.paidAt ? new Date(row.paidAt) : null
    if (!paidAt || Number.isNaN(paidAt.getTime())) return false

    return paidAt.getMonth() === currentMonth && paidAt.getFullYear() === currentYear
  })

  return [
    {
      key: 'requested',
      label: 'Total Requested Amount',
      amount: formatMoney(totalRequestedAmount, 'BDT'),
      trend: `${rows.length} payouts`
    },
    {
      key: 'pendingApproval',
      label: 'Pending Approval',
      amount: formatMoney(
        pendingApprovalRows.reduce((total, row) => total + moneyValue(row.amountNet), 0),
        'BDT'
      ),
      trend: `${pendingApprovalRows.length} awaiting review`
    },
    {
      key: 'approved',
      label: 'Approved (Not Paid)',
      amount: formatMoney(
        approvedNotPaidRows.reduce((total, row) => total + moneyValue(row.amountNet), 0),
        'BDT'
      ),
      trend: `${approvedNotPaidRows.length} ready for settlement`
    },
    {
      key: 'paidThisMonth',
      label: 'Paid This Month',
      amount: formatMoney(
        paidThisMonthRows.reduce((total, row) => total + moneyValue(row.amountNet), 0),
        'BDT'
      ),
      trend: `${paidThisMonthRows.length} payouts closed`
    }
  ]
}

function PayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({
    field: SORTABLE_FIELDS.requestedDate,
    direction: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState({})

  useEffect(() => {
    fetchPayouts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sortConfig.field, sortConfig.direction])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/api/admin/payouts', {
        method: 'POST',
        body: {}
      })

      if (data.success) {
        setPayouts(data?.data?.rows || [])
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

  const statusCounts = useMemo(() => getStatusCounts(payouts), [payouts])
  const summaryCards = useMemo(() => buildSummaryCards(payouts), [payouts])

  const filteredAndSorted = useMemo(() => {
    const filtered = payouts.filter((payout) => payoutMatchesFilter(payout, statusFilter))
    return sortPayouts(filtered, sortConfig)
  }, [payouts, statusFilter, sortConfig])

  const totalItems = filteredAndSorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const visibleRows = filteredAndSorted.slice(startIndex, endIndex)
  const rangeStart = totalItems === 0 ? 0 : startIndex + 1
  const rangeEnd = Math.min(endIndex, totalItems)

  const pages = useMemo(() => {
    const values = []
    const from = Math.max(1, currentPage - 1)
    const to = Math.min(totalPages, currentPage + 1)

    for (let page = from; page <= to; page += 1) {
      values.push(page)
    }

    if (!values.includes(1)) values.unshift(1)
    if (!values.includes(totalPages)) values.push(totalPages)

    return Array.from(new Set(values))
  }, [currentPage, totalPages])

  const toggleExpand = (payoutId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [payoutId]: !prev[payoutId]
    }))
  }

  const requestSort = (field) => {
    setSortConfig((prev) => {
      if (prev.field !== field) {
        return { field, direction: 'asc' }
      }

      return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  const openEvent = (payout) => {
    const eventId = payout?.eventId || payout?.event?.id
    if (!eventId) return

    window.open(`https://festivo.io/events/${eventId}`, '_blank', 'noopener,noreferrer')
  }

  const runPayoutAction = async (action, payout) => {
    try {
      if (action === 'copyDetails') {
        await copyToClipboard(buildTransferDetailsText(payout))
        return
      }

      if (action === 'viewEvent') {
        openEvent(payout)
        return
      }

      if (action === 'approve') {
        await apiRequest(`/api/admin/payouts/${payout.id}/approve`, {
          method: 'POST',
          body: {}
        })
      }

      if (action === 'reject') {
        await apiRequest(`/api/admin/payouts/${payout.id}/reject`, {
          method: 'POST',
          body: {}
        })
      }

      if (action === 'markPaid') {
        await apiRequest(`/api/admin/payouts/${payout.id}/mark-paid`, {
          method: 'POST',
          body: {}
        })
      }

      if (['approve', 'reject', 'markPaid'].includes(action)) {
        await fetchPayouts()
      }
    } catch (actionError) {
      setError(`Error while performing action: ${actionError.message}`)
    }
  }

  return (
    <div className="payouts-page">
      <Navigation />

      <main className="payouts-content">
        <div className="container">
          <h1>Payouts Management</h1>
          <p>Manage payout approvals and settlement operations.</p>

          {!loading && !error ? (
            <>
              <section className="payouts-admin-summary-grid">
                {summaryCards.map((card) => (
                  <MoneySummaryCard
                    key={card.key}
                    label={card.label}
                    amount={card.amount}
                    trend={card.trend}
                  />
                ))}
              </section>

              <div className="payouts-segmented" role="tablist" aria-label="Payout filters">
                {SEGMENTS.map((segment) => (
                  <button
                    key={segment.key}
                    type="button"
                    className={statusFilter === segment.key ? 'active' : ''}
                    onClick={() => setStatusFilter(segment.key)}
                  >
                    {segment.label}
                    <small>{statusCounts[segment.key] || 0}</small>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {loading ? (
            <div className="loading">Loading payouts...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button onClick={fetchPayouts} className="retry-btn">Retry</button>
            </div>
          ) : totalItems === 0 ? (
            <div className="no-payouts">
              <p>No payouts found.</p>
            </div>
          ) : (
            <>
              <div className="payouts-admin-table-wrap">
                <table className="payouts-admin-table">
                  <thead>
                    <tr>
                      <th className="payout-expand-col" />
                      <th>Event</th>
                      <th>Organizer</th>
                      <th className="sortable">
                        <button type="button" onClick={() => requestSort(SORTABLE_FIELDS.amount)}>
                          Amount
                        </button>
                      </th>
                      <th className="sortable">
                        <button type="button" onClick={() => requestSort(SORTABLE_FIELDS.status)}>
                          Status
                        </button>
                      </th>
                      <th className="sortable">
                        <button type="button" onClick={() => requestSort(SORTABLE_FIELDS.requestedDate)}>
                          Requested Date
                        </button>
                      </th>
                      <th>Approved Date</th>
                      <th>Paid Date</th>
                      <th className="payout-actions-col">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRows.map((payout) => (
                      <PayoutRow
                        key={payout.id}
                        payout={payout}
                        isExpanded={Boolean(expandedRows[payout.id])}
                        onToggleExpand={toggleExpand}
                        onAction={runPayoutAction}
                        formatMoney={formatMoney}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="payouts-pagination">
                <span>Showing {rangeStart}-{rangeEnd} of {totalItems}</span>
                <div className="payouts-pagination-controls">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  {pages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={pageNumber === currentPage ? 'active' : ''}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default PayoutsPage
