import { useState, useEffect } from 'react'
import './SubjectIdSelector.css'

function SubjectIdSelector({ subjectType, onSelectId, currentId }) {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'https://test-api.festivo.io'

  const ADMIN_CREDENTIALS = {
    username: 'rique',
    password: '213nbu340eseAS&^$Usds^%h9'
  }

  useEffect(() => {
    if (subjectType !== 'GLOBAL') {
      fetchItems()
    }
  }, [subjectType])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm])

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredItems(items)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = items.filter(item => {
      if (subjectType === 'ORGANIZATION') {
        return item.name?.toLowerCase().includes(term) || item.id?.toLowerCase().includes(term)
      } else if (subjectType === 'EVENT') {
        return item.name?.toLowerCase().includes(term) || item.id?.toLowerCase().includes(term)
      } else if (subjectType === 'USER') {
        return item.email?.toLowerCase().includes(term) ||
               item.name?.toLowerCase().includes(term) ||
               item.id?.toLowerCase().includes(term)
      }
      return false
    })
    setFilteredItems(filtered)
  }

  const fetchItems = async () => {
    if (subjectType === 'GLOBAL') return

    setLoading(true)
    setError('')

    try {
      let endpoint = ''
      if (subjectType === 'ORGANIZATION') {
        endpoint = `${API_URL}/api/fees/admin/organizations`
      } else if (subjectType === 'EVENT') {
        endpoint = `${API_URL}/api/fees/admin/events`
      } else if (subjectType === 'USER') {
        endpoint = `${API_URL}/api/fees/admin/users`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ADMIN_CREDENTIALS)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${subjectType.toLowerCase()}s`)
      }

      const data = await response.json()
      if (data.success) {
        setItems(data.data || [])
        setFilteredItems(data.data || [])
      } else {
        throw new Error('API returned error')
      }
    } catch (err) {
      setError(`Error loading ${subjectType.toLowerCase()}s: ` + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectItem = (item) => {
    onSelectId(item.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id)
    alert('ID copied to clipboard!')
  }

  if (subjectType === 'GLOBAL') {
    return null
  }

  return (
    <div className="subject-id-selector">
      <button
        type="button"
        className="selector-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide' : 'Browse'} {subjectType}s
      </button>

      {isOpen && (
        <div className="selector-modal">
          <div className="selector-header">
            <h3>Select {subjectType}</h3>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="selector-search">
            <input
              type="text"
              placeholder={`Search ${subjectType.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="selector-loading">Loading...</div>
          ) : error ? (
            <div className="selector-error">{error}</div>
          ) : (
            <div className="selector-list">
              {filteredItems.length === 0 ? (
                <div className="no-items">No {subjectType.toLowerCase()}s found</div>
              ) : (
                <table className="selector-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      {subjectType === 'USER' && <th>Email</th>}
                      <th>ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className={currentId === item.id ? 'selected' : ''}
                      >
                        <td className="item-name">{item.name}</td>
                        {subjectType === 'USER' && <td>{item.email}</td>}
                        <td className="item-id">
                          <code>{item.id}</code>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn select-btn"
                              onClick={() => handleSelectItem(item)}
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              className="action-btn copy-btn"
                              onClick={() => copyToClipboard(item.id)}
                            >
                              Copy ID
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SubjectIdSelector
