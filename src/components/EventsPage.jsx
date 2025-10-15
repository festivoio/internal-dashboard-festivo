import { useState, useEffect, useCallback } from 'react'
import Navigation from './Navigation'
import EventsList from './EventList'

function EventsPage() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'https://test-api.festivo.io'

  // Admin credentials from environment variables
  const ADMIN_CREDENTIALS = {
    username: 'rique',
    password: '213nbu340eseAS&^$Usds^%h9'
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filterAndSearchEvents = useCallback(() => {
    let filtered = events

    // Search by event name, organization name, or phone
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.phone && event.phone.includes(searchTerm))
      )
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm])

  useEffect(() => {
    filterAndSearchEvents()
  }, [filterAndSearchEvents])

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/events/admin/getEvents`, {
        method: 'POST', // Changed from GET to POST to send credentials in body
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS) // Include admin credentials
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      // Filter out draft and cancelled events
      const filteredEvents = data.data.events.filter(event => 
        event.status !== 'DRAFT' && event.status !== 'CANCELLED'
      );
      setEvents(filteredEvents);
      setFilteredEvents(filteredEvents);
      setError('');
      
    } catch (err) {
      setError('Error loading events: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      // Determine which endpoint to call based on status change
      let endpoint = ''
      if (newStatus === 'CANCELLED') {
        endpoint = `${API_URL}/api/events/${eventId}/cancel`
      } else if (newStatus === 'PUBLISHED') {
        endpoint = `${API_URL}/api/events/${eventId}/publish`
      } else {
        throw new Error('Invalid status change')
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS) // Include admin credentials
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${newStatus.toLowerCase()} event`)
      }

      // Update local state only after successful API call
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, status: newStatus }
            : event
        )
      )
    } catch (err) {
      console.error('Error updating status:', err)
      setError(`Error updating event status: ${err.message}`)
    }
  }

  return (
    <div className="events-page">
      <Navigation />
      
      <main className="events-content">
        <div className="container">
          <h1>Events Management</h1>
          <p>Manage all your events from this page.</p>
          
          {!loading && !error && (
            <div className="search-filter-container">
              <input
                className="search-input"
                type="text"
                placeholder="Search events, organizations, or phone numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="clear-filter-btn"
                  onClick={() => {
                    setSearchTerm('')
                  }}
                >
                  Clear
                </button>
              )}
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
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default EventsPage