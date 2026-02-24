function PolicyStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase()

  const map = {
    ACTIVE: 'policy-status-active',
    SCHEDULED: 'policy-status-scheduled',
    EXPIRED: 'policy-status-expired',
    INACTIVE: 'policy-status-inactive'
  }

  const label = normalized ? normalized.charAt(0) + normalized.slice(1).toLowerCase() : 'Unknown'

  return (
    <span className={`policy-status-badge ${map[normalized] || 'policy-status-expired'}`}>
      {label}
    </span>
  )
}

export default PolicyStatusBadge
