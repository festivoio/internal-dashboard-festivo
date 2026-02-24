import { useEffect, useRef, useState } from 'react'

function PayoutActionsMenu({ payout, onAction }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isPaid = (payout?.status || '').toUpperCase() === 'PAID'

  const run = (action) => {
    onAction(action, payout)
    setOpen(false)
  }

  return (
    <div className="payout-actions-menu" ref={menuRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="payout-actions-trigger"
        aria-label="Open payout actions"
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋯
      </button>

      {open ? (
        <div className="payout-actions-dropdown">
          <button type="button" onClick={() => run('approve')} disabled={isPaid}>Approve</button>
          <button type="button" onClick={() => run('reject')} disabled={isPaid}>Reject</button>
          <button type="button" onClick={() => run('markPaid')} disabled={isPaid}>Mark as Paid</button>
          <button type="button" onClick={() => run('viewEvent')}>View Event</button>
          <button type="button" onClick={() => run('copyDetails')}>Copy Details</button>
        </div>
      ) : null}
    </div>
  )
}

export default PayoutActionsMenu
