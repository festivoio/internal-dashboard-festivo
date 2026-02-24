import PayoutStatusBadge from './PayoutStatusBadge'
import TransferDetailsCollapse from './TransferDetailsCollapse'
import PayoutActionsMenu from './PayoutActionsMenu'

function formatDate(dateString) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function PayoutRow({ payout, isExpanded, onToggleExpand, onAction, formatMoney }) {
  return (
    <>
      <tr className="payout-row" onClick={() => onToggleExpand(payout.id)}>
        <td className="payout-expand-col">
          <button
            type="button"
            className={`payout-expand-btn ${isExpanded ? 'open' : ''}`}
            aria-label="Toggle transfer details"
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand(payout.id)
            }}
          >
            ▸
          </button>
        </td>

        <td className="payout-event-col">
          <p className="payout-event-name">{payout.eventName || 'Untitled event'}</p>
          <p className="payout-event-subtitle">{payout.organizationName || 'Unknown organizer'}</p>
        </td>

        <td>{payout.organizationName || '-'}</td>

        <td className="payout-money-cell">{formatMoney(payout.amountNet, payout.currency)}</td>

        <td>
          <PayoutStatusBadge status={payout.status} />
        </td>

        <td>{formatDate(payout.createdAt)}</td>
        <td>{formatDate(payout.approvedAt)}</td>
        <td>{formatDate(payout.paidAt)}</td>

        <td className="payout-actions-col" onClick={(event) => event.stopPropagation()}>
          <PayoutActionsMenu payout={payout} onAction={onAction} />
        </td>
      </tr>

      {isExpanded ? (
        <tr className="payout-row-expanded">
          <td colSpan={9}>
            <TransferDetailsCollapse payout={payout} onCopyDetails={(item) => onAction('copyDetails', item)} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

export default PayoutRow
