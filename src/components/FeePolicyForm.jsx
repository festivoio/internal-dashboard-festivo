import { useMemo, useState } from 'react'
import DateRangePicker from './DateRangePicker'
import FeeTierCard from './FeeTierCard'
import ScopeSelector from './ScopeSelector'
import { buildTierPreview, validateTiers } from './feePolicyUtils'

function getNextMinValue(tiers) {
  if (!tiers.length) return 0
  const lastTier = tiers[tiers.length - 1]

  if (lastTier.max === null || lastTier.max === undefined) {
    return Number(lastTier.min || 0) + 1
  }

  return Number(lastTier.max || 0) + 1
}

function FeePolicyForm({ mode, initialData, loading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => ({
    subjectType: initialData.subjectType || 'ORGANIZATION',
    subjectId: initialData.subjectId || '',
    subjectLabel: initialData.subjectLabel || '',
    currency: initialData.currency || 'BDT',
    calculationType: initialData.perTicket ? 'PER_TICKET' : 'PERCENTAGE',
    rounding: initialData.rounding || 'ROUND',
    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
    activeFrom: initialData.activeFrom || new Date().toISOString().split('T')[0],
    activeTo: initialData.activeTo || '',
    noEndDate: !initialData.activeTo,
    tiers: initialData.tiers?.length
      ? initialData.tiers
      : [{ min: 0, max: null, pct: 0.03 }]
  }))

  const [formError, setFormError] = useState('')

  const tierPreview = useMemo(() => buildTierPreview(formData.tiers), [formData.tiers])

  const updateTier = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier, tierIndex) => {
        if (tierIndex !== index) return tier

        if (field === 'noUpperLimit') {
          return { ...tier, max: value ? null : Number(tier.min || 0) + 1 }
        }

        if (field === 'pct') {
          return { ...tier, pct: value === '' ? 0 : Number(value) / 100 }
        }

        return {
          ...tier,
          [field]: value === '' ? '' : Number(value)
        }
      })
    }))
  }

  const addTier = () => {
    setFormData((prev) => ({
      ...prev,
      tiers: [...prev.tiers, { min: getNextMinValue(prev.tiers), max: null, pct: 0.03 }]
    }))
  }

  const removeTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, tierIndex) => tierIndex !== index)
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (formData.calculationType === 'MIXED') {
      setFormError('Mixed calculation is reserved for a future release.')
      return
    }

    if (!formData.subjectId && mode === 'create') {
      setFormError('Please select a scope target before saving.')
      return
    }

    const normalizedTiers = formData.tiers.map((tier) => ({
      min: Number(tier.min || 0),
      max: tier.max === '' || tier.max === null ? null : Number(tier.max),
      pct: Number(tier.pct || 0)
    }))

    const tierValidationError = validateTiers(normalizedTiers)
    if (tierValidationError) {
      setFormError(tierValidationError)
      return
    }

    setFormError('')

    onSubmit({
      subjectType: formData.subjectType,
      subjectId: formData.subjectId,
      currency: formData.currency,
      perTicket: formData.calculationType === 'PER_TICKET',
      rounding: formData.rounding,
      isActive: formData.isActive,
      activeFrom: formData.activeFrom || null,
      activeTo: formData.noEndDate ? null : (formData.activeTo || null),
      tiers: normalizedTiers
    })
  }

  return (
    <form className="fee-policy-shell" onSubmit={handleSubmit}>
      <ScopeSelector
        value={formData.subjectType}
        selectedId={formData.subjectId}
        selectedLabel={formData.subjectLabel}
        readOnly={mode === 'edit'}
        onChange={(scope) => setFormData((prev) => ({ ...prev, subjectType: scope }))}
        onSelectId={(id) => setFormData((prev) => ({ ...prev, subjectId: id }))}
      />

      <section className="fee-form-card">
        <div className="fee-section-header fee-section-inline">
          <h3>Section 2: Fee Configuration</h3>
          <div className="fee-inline-control">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(event) => setFormData((prev) => ({ ...prev, currency: event.target.value }))}
              disabled={mode === 'edit'}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="BDT">BDT</option>
            </select>
          </div>
        </div>

        <div className="fee-config-grid">
          <div>
            <label>Fee Calculation Type</label>
            <div className="calc-type-group">
              <label>
                <input
                  type="radio"
                  name="calcType"
                  checked={formData.calculationType === 'PERCENTAGE'}
                  onChange={() => setFormData((prev) => ({ ...prev, calculationType: 'PERCENTAGE' }))}
                />
                Percentage of total
              </label>
              <label>
                <input
                  type="radio"
                  name="calcType"
                  checked={formData.calculationType === 'PER_TICKET'}
                  onChange={() => setFormData((prev) => ({ ...prev, calculationType: 'PER_TICKET' }))}
                />
                Per ticket fixed
              </label>
              <label className="is-disabled">
                <input
                  type="radio"
                  name="calcType"
                  checked={formData.calculationType === 'MIXED'}
                  onChange={() => setFormData((prev) => ({ ...prev, calculationType: 'MIXED' }))}
                />
                Mixed (future)
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="rounding">Rounding</label>
            <select
              id="rounding"
              value={formData.rounding}
              onChange={(event) => setFormData((prev) => ({ ...prev, rounding: event.target.value }))}
            >
              <option value="CEIL">Round Up</option>
              <option value="FLOOR">Round Down</option>
              <option value="ROUND">Round Nearest</option>
            </select>

            <label className="switch-row">
              <span>Active policy</span>
              <button
                type="button"
                className={`switch-control ${formData.isActive ? 'on' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
              >
                <span />
              </button>
            </label>
          </div>
        </div>
      </section>

      <DateRangePicker
        startDate={formData.activeFrom || ''}
        endDate={formData.activeTo || ''}
        noEndDate={formData.noEndDate}
        onChange={({ field, value }) => {
          if (field === 'startDate') {
            setFormData((prev) => ({ ...prev, activeFrom: value }))
            return
          }

          if (field === 'endDate') {
            setFormData((prev) => ({ ...prev, activeTo: value }))
            return
          }

          if (field === 'noEndDate') {
            setFormData((prev) => ({ ...prev, noEndDate: value, activeTo: value ? '' : prev.activeTo }))
          }
        }}
      />

      <section className="fee-form-card">
        <div className="fee-section-header">
          <h3>Section 4: Review</h3>
          <p className="muted-text">If multiple policies match the same subject, the newest active policy overrides older ones.</p>
        </div>

        <div className="tier-stack">
          {formData.tiers.map((tier, index) => (
            <FeeTierCard
              key={index}
              index={index}
              tier={tier}
              canRemove={formData.tiers.length > 1}
              onRemove={() => removeTier(index)}
              onChange={(field, value) => updateTier(index, field, value)}
            />
          ))}
        </div>

        <button type="button" className="add-tier-inline" onClick={addTier}>
          + Add tier
        </button>

        <div className="tier-preview-box">
          <p>Tier Preview</p>
          <div className="tier-preview-items">
            {tierPreview.map((preview) => (
              <span key={preview}>{preview}</span>
            ))}
          </div>
        </div>

        {formError ? <p className="error-text">{formError}</p> : null}
      </section>

      <div className="fee-sticky-actions">
        <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Saving...' : mode === 'create' ? 'Create Policy' : 'Update Policy'}
        </button>
      </div>
    </form>
  )
}

export default FeePolicyForm
