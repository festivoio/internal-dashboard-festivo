import { useState, useEffect, useCallback, useMemo } from 'react'
import Navigation from './Navigation'
import EventsList from './EventList'
import { ApiError, apiRequest } from '../lib/apiClient'
import './EventsPage.css'

function normalizeEventType(type) {
  if (!type) return 'GENERAL'
  return type.toString().toUpperCase()
}

function getEventTimeValue(event) {
  const dateValue = event?.startDateTime || event?.createdAt || event?.updatedAt || 0
  const time = new Date(dateValue).getTime()
  return Number.isFinite(time) ? time : 0
}

function sortEventsForReviewAndRecency(rows) {
  return [...rows].sort((a, b) => {
    const statusA = (a?.status || '').toUpperCase()
    const statusB = (b?.status || '').toUpperCase()

    const inReviewA = statusA === 'IN_REVIEW' ? 1 : 0
    const inReviewB = statusB === 'IN_REVIEW' ? 1 : 0

    if (inReviewA !== inReviewB) {
      return inReviewB - inReviewA
    }

    return getEventTimeValue(b) - getEventTimeValue(a)
  })
}

function EventsPage() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const eventTypes = useMemo(() => {
    const types = Array.from(new Set(events.map((event) => normalizeEventType(event.type))))
    return types.sort((a, b) => a.localeCompare(b))
  }, [events])

  const filterAndSearchEvents = useCallback(() => {
    let filtered = [...events]

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase()
      filtered = filtered.filter((event) => {
        const name = event.name?.toLowerCase() || ''
        const orgName = event.organization?.name?.toLowerCase() || ''
        const type = event.type?.toLowerCase() || ''
        return name.includes(query) || orgName.includes(query) || type.includes(query)
      })
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((event) => (event.status || '').toUpperCase() === statusFilter)
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((event) => normalizeEventType(event.type) === typeFilter)
    }

    if (dateFrom) {
      const minDate = new Date(`${dateFrom}T00:00:00`)
      filtered = filtered.filter((event) => new Date(event.startDateTime) >= minDate)
    }

    if (dateTo) {
      const maxDate = new Date(`${dateTo}T23:59:59`)
      filtered = filtered.filter((event) => new Date(event.startDateTime) <= maxDate)
    }

    setFilteredEvents(sortEventsForReviewAndRecency(filtered))
  }, [events, searchTerm, statusFilter, typeFilter, dateFrom, dateTo])

  useEffect(() => {
    filterAndSearchEvents()
  }, [filterAndSearchEvents])

  const fetchEvents = async () => {
    try {
      setLoading(true)

      const data = await apiRequest('/api/events/admin/getEvents', {
        method: 'POST',
        body: {}
      })

      const fetchedEvents = data?.data?.events || []
      const sorted = sortEventsForReviewAndRecency(fetchedEvents)
      setEvents(sorted)
      setFilteredEvents(sorted)
      setError('')
    } catch (err) {
      setError('Error loading events: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEventUrl = (event, mode = 'view') => {
    const customBase = import.meta.env.VITE_EVENT_DETAILS_BASE_URL || 'https://festivo.io/events'
    const eventId = event?.id

    if (!eventId) return

    const pathSuffix = mode === 'edit' ? `/edit/${eventId}` : `/${eventId}`
    window.open(`${customBase}${pathSuffix}`, '_blank', 'noopener,noreferrer')
  }

  const handleEventAction = async (action, event) => {
    const eventId = event?.id
    if (!eventId) return

    try {
      if (action === 'view') {
        openEventUrl(event, 'view')
        return
      }

      if (action === 'edit') {
        openEventUrl(event, 'edit')
        return
      }

      if (action === 'publish') {
        await apiRequest(`/api/events/${eventId}/publish`, {
          method: 'PATCH'
        })

        setEvents((prevEvents) => prevEvents.map((item) => (
          item.id === eventId ? { ...item, status: 'PUBLISHED' } : item
        )))
        return
      }

      if (action === 'unpublish') {
        try {
          await apiRequest(`/api/events/${eventId}/unpublish`, {
            method: 'PATCH'
          })

          setEvents((prevEvents) => prevEvents.map((item) => (
            item.id === eventId ? { ...item, status: 'DRAFT' } : item
          )))
        } catch (unpublishError) {
          if (!(unpublishError instanceof ApiError) || ![404, 405].includes(unpublishError.status)) {
            throw unpublishError
          }

          await apiRequest(`/api/events/${eventId}/cancel`, {
            method: 'PATCH'
          })

          setEvents((prevEvents) => prevEvents.map((item) => (
            item.id === eventId ? { ...item, status: 'CANCELLED' } : item
          )))
        }
        return
      }

      if (action === 'delete') {
        const confirmed = window.confirm('Delete this event? This action cannot be undone.')
        if (!confirmed) return

        await apiRequest(`/api/events/${eventId}`, {
          method: 'DELETE'
        })

        setEvents((prevEvents) => prevEvents.filter((item) => item.id !== eventId))
      }
    } catch (actionError) {
      setError(`Error while performing action: ${actionError.message}`)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="events-page">
      <Navigation />

      <main className="events-content">
        <div className="container">
          <h1>Events Management</h1>
          <p>Manage and review all events from one place.</p>

          {!loading && !error && (
            <div className="events-admin-toolbar">
              <input
                className="events-admin-search"
                type="text"
                placeholder="Search events, organizations, or type"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="events-admin-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                className="events-admin-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                className="events-admin-filter"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Date from"
              />

              <input
                className="events-admin-filter"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Date to"
              />

              <button
                type="button"
                className="events-admin-clear-btn"
                onClick={clearFilters}
              >
                Reset
              </button>

            </div>
          )}

          {loading ? (
            <div className="loading">Loading events...</div>
          ) : error ? (
            <div className="error">
              {error}
              <button onClick={fetchEvents} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <EventsList
              events={filteredEvents}
              onAction={handleEventAction}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default EventsPage
