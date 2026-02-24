function MoneySummaryCard({ label, amount, trend }) {
  return (
    <article className="payouts-summary-card">
      <p className="payouts-summary-label">{label}</p>
      <p className="payouts-summary-amount">{amount}</p>
      {trend ? <p className="payouts-summary-trend">{trend}</p> : null}
    </article>
  )
}

export default MoneySummaryCard
