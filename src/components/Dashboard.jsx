import { useState, useEffect } from 'react'
import Navigation from './Navigation'
import EventsCharts from './EventsCharts'
import { apiRequest } from '../lib/apiClient'

function Dashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/api/events', { method: 'GET' })
      setEvents(data.data.events)
      setError('')
    } catch (err) {
      setError('Error loading events: ' + err.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="dashboard">
      <Navigation />
      
      <main className="dashboard-content">
        <div className="container">
          <h1>Events Dashboard</h1>
          <p>Analytics and insights for your events.</p>
          
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
            <EventsCharts events={events} />
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
