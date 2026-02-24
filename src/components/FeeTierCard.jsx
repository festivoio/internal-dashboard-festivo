function FeeTierCard({ index, tier, onChange, onRemove, canRemove }) {
  const upperLimitDisabled = tier.max === null

  return (
    <div className="tier-card">
      <div className="tier-card-head">
        <h4>Tier {index + 1}</h4>
        {canRemove ? (
          <button type="button" className="tier-remove-btn" onClick={onRemove} aria-label={`Remove tier ${index + 1}`}>
            ✕
          </button>
        ) : null}
      </div>

      <div className="tier-card-grid">
        <div>
          <label>From</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tier.min ?? ''}
            onChange={(event) => onChange('min', event.target.value)}
          />
        </div>
        <div>
          <label>To</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={upperLimitDisabled ? '' : tier.max ?? ''}
            disabled={upperLimitDisabled}
            onChange={(event) => onChange('max', event.target.value)}
          />
          <label className="fee-inline-check">
            <input
              type="checkbox"
              checked={upperLimitDisabled}
              onChange={(event) => onChange('noUpperLimit', event.target.checked)}
            />
            No upper limit
          </label>
        </div>
        <div>
          <label>Fee (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={Number(tier.pct || 0) * 100}
            onChange={(event) => onChange('pct', event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default FeeTierCard
