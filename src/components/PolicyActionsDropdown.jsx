import { useEffect, useRef, useState } from 'react'

function PolicyActionsDropdown({ policy, onAction }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (!containerRef.current || containerRef.current.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

  const run = (action) => {
    onAction(action, policy)
    setOpen(false)
  }

  return (
    <div className="policy-actions" ref={containerRef} onClick={(event) => event.stopPropagation()}>
      <button type="button" className="policy-actions-trigger" onClick={() => setOpen((prev) => !prev)}>
        ⋯
      </button>
      {open ? (
        <div className="policy-actions-dropdown">
          <button type="button" onClick={() => run('view')}>View</button>
          <button type="button" onClick={() => run('edit')}>Edit</button>
          <button type="button" onClick={() => run('duplicate')}>Duplicate</button>
          <button type="button" onClick={() => run('deactivate')}>Deactivate</button>
          <button type="button" className="danger" onClick={() => run('delete')}>Delete</button>
        </div>
      ) : null}
    </div>
  )
}

export default PolicyActionsDropdown
