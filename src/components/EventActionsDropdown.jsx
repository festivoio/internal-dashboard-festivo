import { useEffect, useRef, useState } from 'react'

function EventActionsDropdown({ event, onAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (clickEvent) => {
      if (!menuRef.current || menuRef.current.contains(clickEvent.target)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const triggerAction = (action) => {
    onAction(action, event)
    setIsOpen(false)
  }

  const canPublish = event?.status !== 'PUBLISHED'
  const canUnpublish = event?.status === 'PUBLISHED' || event?.status === 'ONGOING'

  return (
    <div className={`event-actions-menu ${isOpen ? 'open' : ''}`} ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="event-actions-trigger"
        aria-label="Open event actions"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        ⋯
      </button>

      {isOpen && (
        <div className="event-actions-dropdown">
          <button type="button" onClick={() => triggerAction('view')}>View</button>
          <button type="button" onClick={() => triggerAction('edit')}>Edit</button>
          <button type="button" onClick={() => triggerAction('publish')} disabled={!canPublish}>Publish</button>
          <button type="button" onClick={() => triggerAction('unpublish')} disabled={!canUnpublish}>Unpublish</button>
          <button type="button" className="danger" onClick={() => triggerAction('delete')}>Delete</button>
        </div>
      )}
    </div>
  )
}

export default EventActionsDropdown
