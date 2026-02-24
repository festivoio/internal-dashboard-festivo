import EventStatusBadge from './EventStatusBadge'
import EventActionsDropdown from './EventActionsDropdown'

const numberFormatter = new Intl.NumberFormat('en-US')

function formatEventDate(dateTime) {
  if (!dateTime) {
    return { date: 'N/A', time: '' }
  }

  const date = new Date(dateTime)
  return {
    date: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }
}

function getTicketsSold(event) {
  return event?.ticketGenres?.reduce((total, genre) => total + (genre.soldSeats || 0), 0) || 0
}

function formatEventType(type) {
  if (!type) return 'General'
  return type.toString().replace(/_/g, ' ')
}

function EventRow({ event, onAction }) {
  const { date, time } = formatEventDate(event.startDateTime)
  const ticketsSold = getTicketsSold(event)
  const totalViews = event.totalViews || 0

  return (
    <tr className="event-row" onClick={() => onAction('view', event)}>
      <td className="event-cell-primary">
        <button
          type="button"
          className="event-name-link"
          onClick={(e) => {
            e.stopPropagation()
            onAction('view', event)
          }}
        >
          {event.name}
        </button>
        <div className="event-meta-line">
          <span className="event-type-tag">{formatEventType(event.type)}</span>
          <span className="event-meta-dot">·</span>
          <span className="event-org-name">{event.organization?.name || 'Unknown org'}</span>
        </div>
      </td>
      <td>
        <div className="event-date-main">{date}</div>
        {time && <div className="event-date-sub">{time}</div>}
      </td>
      <td className="event-cell-number" title="Tickets Sold">🎟 {numberFormatter.format(ticketsSold)}</td>
      <td className="event-cell-number" title="Views">👁 {numberFormatter.format(totalViews)}</td>
      <td>
        <EventStatusBadge status={event.status} />
      </td>
      <td className="event-cell-actions" onClick={(e) => e.stopPropagation()}>
        <EventActionsDropdown event={event} onAction={onAction} />
      </td>
    </tr>
  )
}

export default EventRow
