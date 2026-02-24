function normalizeStatus(status) {
  if (!status) return 'Unknown'
  return status
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function EventStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase()

  const statusClassMap = {
    DRAFT: 'event-status-draft',
    PUBLISHED: 'event-status-published',
    ONGOING: 'event-status-ongoing',
    COMPLETED: 'event-status-completed',
    CANCELLED: 'event-status-cancelled'
  }

  const className = statusClassMap[normalized] || 'event-status-default'

  return (
    <span className={`event-status-badge ${className}`}>
      {normalizeStatus(status)}
    </span>
  )
}

export default EventStatusBadge
