import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

function EventsCharts({ events }) {
  // Process data for different charts
  const processEventsByStatus = () => {
    const statusCounts = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1
      return acc
    }, {})

    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            '#10b981', // green for published
            '#f59e0b', // yellow for draft
            '#ef4444', // red for cancelled
            '#6b7280', // gray for others
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    }
  }

  const processEventsByType = () => {
    const typeCounts = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {})

    return {
      labels: Object.keys(typeCounts),
      datasets: [
        {
          label: 'Events by Type',
          data: Object.values(typeCounts),
          backgroundColor: '#646cff',
          borderColor: '#535bf2',
          borderWidth: 1,
        },
      ],
    }
  }

  const processTicketSales = () => {
    const eventNames = events.map(event => 
      event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name
    )
    const ticketsSold = events.map(event =>
      event.ticketGenres.reduce((total, genre) => total + genre.soldSeats, 0)
    )

    return {
      labels: eventNames,
      datasets: [
        {
          label: 'Tickets Sold',
          data: ticketsSold,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
        },
      ],
    }
  }

  const processViewsOverTime = () => {
    // Sort events by date and get views
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startDateTime) - new Date(b.startDateTime)
    )

    const labels = sortedEvents.map(event => 
      new Date(event.startDateTime).toLocaleDateString()
    )
    const views = sortedEvents.map(event => event.totalViews)

    return {
      labels,
      datasets: [
        {
          label: 'Event Views',
          data: views,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: true,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
    },
  }

  if (!events.length) {
    return (
      <div className="no-events">
        <p>No events data available for charts.</p>
      </div>
    )
  }

  return (
    <div className="events-charts">
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Events by Status</h3>
          <div className="chart-wrapper">
            <Doughnut data={processEventsByStatus()} options={doughnutOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Events by Type</h3>
          <div className="chart-wrapper">
            <Bar data={processEventsByType()} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Ticket Sales by Event</h3>
          <div className="chart-wrapper">
            <Bar data={processTicketSales()} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Event Views Over Time</h3>
          <div className="chart-wrapper">
            <Line data={processViewsOverTime()} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="events-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <h4>Total Events</h4>
            <p className="summary-number">{events.length}</p>
          </div>
          <div className="summary-card">
            <h4>Total Views</h4>
            <p className="summary-number">
              {events.reduce((total, event) => total + event.totalViews, 0).toLocaleString()}
            </p>
          </div>
          <div className="summary-card">
            <h4>Total Tickets Sold</h4>
            <p className="summary-number">
              {events.reduce((total, event) => 
                total + event.ticketGenres.reduce((sum, genre) => sum + genre.soldSeats, 0), 0
              ).toLocaleString()}
            </p>
          </div>
          <div className="summary-card">
            <h4>Published Events</h4>
            <p className="summary-number">
              {events.filter(event => event.status === 'PUBLISHED').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventsCharts