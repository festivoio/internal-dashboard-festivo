import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/apiClient'

const OPTIONS = ['GLOBAL', 'USER', 'ORGANIZATION', 'EVENT']

function formatScopeLabel(scope) {
  return scope.charAt(0) + scope.slice(1).toLowerCase()
}

function ScopeSelector({ value, onChange, selectedId, onSelectId, selectedLabel, readOnly = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (readOnly) return
    if (value === 'GLOBAL') {
      setItems([])
      setLoading(false)
      setError('')
      return
    }
    loadItems(value)
  }, [value, readOnly])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items

    return items.filter((item) => {
      const name = item?.name?.toLowerCase() || ''
      const email = item?.email?.toLowerCase() || ''
      const id = item?.id?.toLowerCase() || ''
      return name.includes(term) || email.includes(term) || id.includes(term)
    })
  }, [items, query])

  const loadItems = async (scopeType) => {
    setLoading(true)
    setError('')

    try {
      if (scopeType === 'GLOBAL') {
        setItems([])
        return
      }

      const endpoint = scopeType === 'ORGANIZATION'
        ? '/api/fees/admin/organizations'
        : scopeType === 'EVENT'
          ? '/api/fees/admin/events'
          : '/api/fees/admin/users'

      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: {}
      })

      if (result.success) {
        setItems(result.data || [])
      } else {
        setItems([])
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load options')
    } finally {
      setLoading(false)
    }
  }

  const getItemLabel = (item) => {
    return item?.name || item?.email || item?.id || 'Unnamed'
  }

  const handleSelect = (item) => {
    onSelectId(item.id)
    setQuery(getItemLabel(item))
    setOpen(false)
  }

  return (
    <section className="fee-form-card">
      <div className="fee-section-header">
        <h3>Section 1: Scope</h3>
      </div>

      <div className="scope-type-segmented" role="tablist" aria-label="Scope type">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'active' : ''}
            onClick={() => {
              onChange(option)
              onSelectId('')
              setQuery('')
            }}
            disabled={readOnly}
          >
            {formatScopeLabel(option)}
          </button>
        ))}
      </div>

      <div className="scope-grid">
        <div>
          <label htmlFor="scope-search">Select {formatScopeLabel(value)}</label>
          {readOnly ? (
            <div className="readonly-value">
              <strong>{selectedLabel || selectedId || 'N/A'}</strong>
              {selectedId ? <small>ID: {selectedId}</small> : null}
            </div>
          ) : (
            value === 'GLOBAL' ? (
              <div className="readonly-value">
                <strong>Global policy</strong>
                <small>No subject selection required.</small>
              </div>
            ) : (
              <div className="scope-search-wrap">
                <input
                  id="scope-search"
                  type="text"
                  value={query}
                  placeholder={`Search ${formatScopeLabel(value)}...`}
                  onFocus={() => setOpen(true)}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setOpen(true)
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setOpen(false), 150)
                  }}
                />
                <button
                  type="button"
                  className="scope-toggle-btn"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setOpen((prev) => !prev)}
                >
                  ▾
                </button>

                {open ? (
                  <div className="scope-options">
                    {loading ? <p className="scope-meta">Loading...</p> : null}
                    {error ? <p className="scope-meta error-text">{error}</p> : null}
                    {!loading && !error && filtered.length === 0 ? <p className="scope-meta">No matches found</p> : null}

                    {!loading && !error && filtered.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`scope-option-item ${selectedId === item.id ? 'active' : ''}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelect(item)}
                      >
                        <span>{getItemLabel(item)}</span>
                        <small>ID: {item.id}</small>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}

export default ScopeSelector
