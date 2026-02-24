function FeeTierCard({ index, tier, errors, onChange, onRemove, canRemove }) {
  const upperLimitDisabled = tier.to === null

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
            value={tier.from ?? ''}
            readOnly
          />
          {errors?.from ? <p className="tier-error">{errors.from}</p> : null}
        </div>
        <div>
          <label>To</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={upperLimitDisabled ? '' : tier.to ?? ''}
            disabled={upperLimitDisabled}
            onChange={(event) => onChange('to', event.target.value)}
          />
          <label className="fee-inline-check">
            <input
              type="checkbox"
              checked={upperLimitDisabled}
              onChange={(event) => onChange('noUpperLimit', event.target.checked)}
            />
            No upper limit
          </label>
          {errors?.to ? <p className="tier-error">{errors.to}</p> : null}
        </div>
        <div>
          <label>Fee Rate (decimal)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tier.pct ?? 0}
            onChange={(event) => onChange('pct', event.target.value)}
          />
          {errors?.pct ? <p className="tier-error">{errors.pct}</p> : null}
        </div>
        <div>
          <label>Min Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tier.min ?? 0}
            onChange={(event) => onChange('min', event.target.value)}
          />
          {errors?.min ? <p className="tier-error">{errors.min}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default FeeTierCard
