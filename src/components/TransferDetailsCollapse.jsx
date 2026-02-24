function valueOrDash(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function TransferDetailsCollapse({ payout, onCopyDetails }) {
  const bank = payout?.primaryBank || null

  if (!bank) {
    return (
      <div className="transfer-collapse-card">
        <p className="transfer-collapse-empty">No transfer details available for this payout.</p>
      </div>
    )
  }

  const provider = bank.type === 'BANK' ? bank.bankName : bank.provider

  return (
    <div className="transfer-collapse-card">
      <div className="transfer-collapse-header">
        <h4>Transfer Details</h4>
        <button type="button" onClick={() => onCopyDetails(payout)}>
          Copy All Details
        </button>
      </div>

      <dl className="transfer-collapse-grid">
        <div>
          <dt>Bank / Provider</dt>
          <dd>{valueOrDash(provider)}</dd>
        </div>
        <div>
          <dt>Account Name</dt>
          <dd>{valueOrDash(bank.accountName)}</dd>
        </div>
        <div>
          <dt>Account Number</dt>
          <dd>{valueOrDash(bank.accountNumber || bank.walletNumber)}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{valueOrDash(bank.branch)}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>{valueOrDash(bank.country)}</dd>
        </div>
        <div>
          <dt>Currency</dt>
          <dd>{valueOrDash(bank.currency || payout.currency)}</dd>
        </div>
      </dl>
    </div>
  )
}

export default TransferDetailsCollapse
