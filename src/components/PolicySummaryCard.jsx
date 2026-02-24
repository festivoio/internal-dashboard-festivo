function PolicySummaryCard({ label, value }) {
  return (
    <article className="policy-summary-card">
      <p className="policy-summary-label">{label}</p>
      <p className="policy-summary-value">{value}</p>
    </article>
  )
}

export default PolicySummaryCard
