function EventsList({ events, onStatusChange }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'status-published'
      case 'DRAFT':
        return 'status-draft'
      case 'CANCELLED':
        return 'status-cancelled'
      default:
        return 'status-default'
    }
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PUBLISHED':
        return 'CANCELLED'
      case 'CANCELLED':
        return 'PUBLISHED'
      case 'DRAFT':
        return 'PUBLISHED'
      default:
        return 'PUBLISHED'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!events.length) {
    return (
      <div className="no-events">
        <p>No events found.</p>
      </div>
    )
  }

  return (
    <div className="events-list">
      <div className="events-header">
        <h2>Events ({events.length})</h2>
      </div>
      
      <div className="table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Type</th>
              <th>Organization Name</th>
              <th>Organization Owner</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Views</th>
              <th>Tickets Sold</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="event-name">{event.name}</td>
                <td className="event-type">{event.type}</td>
                <td>{event.organization.name}</td>
                <td>{event.organization.owner || event.organization.name}</td>
                <td>{event.phone || 'N/A'}</td>
                <td>{formatDate(event.startDateTime)}</td>
                <td>{event.totalViews || 0}</td>
                <td>{event.ticketGenres?.reduce((total, genre) => total + (genre.soldSeats || 0), 0) || 0}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onStatusChange(event.id, getNextStatus(event.status))}
                    className={`action-btn ${getStatusColor(getNextStatus(event.status))}`}
                  >
                    Mark as {getNextStatus(event.status)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EventsList