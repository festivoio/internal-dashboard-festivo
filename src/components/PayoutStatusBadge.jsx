function normalizeStatus(status) {
  if (!status) return 'Unknown'
  return status
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function PayoutStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase()

  const classMap = {
    REQUESTED: 'payout-status-requested',
    APPROVED: 'payout-status-approved',
    PROCESSING: 'payout-status-approved',
    PAID: 'payout-status-paid',
    REJECTED: 'payout-status-rejected'
  }

  return (
    <span className={`payout-status-badge ${classMap[normalized] || 'payout-status-default'}`}>
      {normalizeStatus(status)}
    </span>
  )
}

export default PayoutStatusBadge
