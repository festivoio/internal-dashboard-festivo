import { useEffect, useMemo, useState } from 'react'
import EventRow from './EventRow'

const PAGE_SIZE = 10

function buildPageNumbers(currentPage, totalPages) {
  const pages = []
  const start = Math.max(1, currentPage - 1)
  const end = Math.min(totalPages, currentPage + 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (!pages.includes(1)) pages.unshift(1)
  if (!pages.includes(totalPages)) pages.push(totalPages)

  return Array.from(new Set(pages))
}

function EventsList({ events, onAction }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalItems = events.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage(1)
  }, [totalItems])

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return events.slice(startIndex, endIndex)
  }, [events, currentPage])

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalItems)

  const pages = buildPageNumbers(currentPage, totalPages)

  if (!events.length) {
    return (
      <div className="no-events">
        <p>No events found.</p>
      </div>
    )
  }

  return (
    <div className="events-admin-table-shell">
      <div className="events-header">
        <h2>Events ({events.length})</h2>
      </div>

      <div className="events-admin-table-wrap">
        <table className="events-admin-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th className="event-col-number">Tickets Sold</th>
              <th className="event-col-number">Views</th>
              <th>Status</th>
              <th className="event-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.map((event) => (
              <EventRow key={event.id} event={event} onAction={onAction} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="events-pagination-bar">
        <p>
          Showing {rangeStart}-{rangeEnd} of {totalItems}
        </p>
        <div className="events-pagination-controls">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Previous
          </button>
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={currentPage === pageNumber ? 'active' : ''}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventsList
