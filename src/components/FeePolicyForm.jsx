import { useMemo, useState } from 'react'
import DateRangePicker from './DateRangePicker'
import FeeTierCard from './FeeTierCard'
import ScopeSelector from './ScopeSelector'
import { apiRequest } from '../lib/apiClient'
import { calculateTieredBreakdown, normalizePreviewResponse } from './feePolicyPreviewUtils'
import {
  apiRulesToUiTiers,
  hasTierValidationErrors,
  nextTierFrom,
  uiTiersToApiRules,
  validateUiTiers,
  withComputedFrom
} from './feePolicyTierUtils'

function blankPreviewItem() {
  return { unitPrice: '', quantity: 1 }
}

function formatCurrency(value, currency) {
  const amount = Number(value || 0)
  return `${amount.toFixed(2)} ${currency}`
}

function FeePolicyForm({ mode, initialData, loading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => ({
    subjectType: initialData.subjectType || 'ORGANIZATION',
    subjectId: initialData.subjectId || '',
    subjectLabel: initialData.subjectLabel || '',
    currency: initialData.currency || 'BDT',
    perTicket: Boolean(initialData.perTicket),
    rounding: initialData.rounding || 'ROUND',
    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
    activeFrom: initialData.activeFrom || new Date().toISOString().split('T')[0],
    activeTo: initialData.activeTo || '',
    noEndDate: !initialData.activeTo,
    uiTiers: withComputedFrom(apiRulesToUiTiers({ tiers: initialData.tiers || [] }))
  }))

  const [formError, setFormError] = useState('')
  const [tierErrors, setTierErrors] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)
  const [previewItems, setPreviewItems] = useState([blankPreviewItem()])
  const [useOrganizerPreview, setUseOrganizerPreview] = useState(false)

  const computedTiers = useMemo(() => withComputedFrom(formData.uiTiers), [formData.uiTiers])
  const tierPreview = useMemo(() => {
    return computedTiers.map((tier) => {
      const toLabel = tier.to === null ? '∞' : tier.to
      return `${tier.from}–${toLabel} → ${(Number(tier.pct || 0) * 100).toFixed(2)}%`
    })
  }, [computedTiers])

  const updateTier = (index, field, value) => {
    setFormData((prev) => {
      const updatedTiers = prev.uiTiers.map((tier, tierIndex) => {
        if (tierIndex !== index) return tier

        if (field === 'noUpperLimit') {
          return { ...tier, to: value ? null : nextTierFrom(prev.uiTiers) }
        }

        if (field === 'to') {
          return { ...tier, to: value === '' ? '' : Number(value) }
        }

        if (field === 'pct') {
          return { ...tier, pct: value === '' ? '' : Number(value) }
        }

        if (field === 'min') {
          return { ...tier, min: value === '' ? '' : Number(value) }
        }

        return tier
      })

      return {
        ...prev,
        uiTiers: withComputedFrom(updatedTiers)
      }
    })
  }

  const addTier = () => {
    setFormData((prev) => ({
      ...prev,
      uiTiers: withComputedFrom([
        ...prev.uiTiers,
        { from: nextTierFrom(prev.uiTiers), to: null, pct: 0.05, min: 0 }
      ])
    }))
  }

  const removeTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      uiTiers: withComputedFrom(prev.uiTiers.filter((_, rowIndex) => rowIndex !== index))
    }))
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    setFormError('')

    try {
      const parsedItems = previewItems.map((item) => ({
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 1)
      }))

      const localBreakdown = calculateTieredBreakdown(computedTiers, parsedItems, formData.perTicket)
      const endpoint = useOrganizerPreview ? '/api/fees/preview/organizer' : '/api/fees/preview'
      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: {
          currency: formData.currency,
          subjectType: formData.subjectType,
          subjectId: formData.subjectId || undefined,
          items: parsedItems
        }
      })

      setPreviewResult(normalizePreviewResponse(result, parsedItems, localBreakdown))
    } catch (previewError) {
      setFormError(`Preview failed: ${previewError.message}`)
      const parsedItems = previewItems.map((item) => ({
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 1)
      }))
      const localBreakdown = calculateTieredBreakdown(computedTiers, parsedItems, formData.perTicket)
      setPreviewResult(normalizePreviewResponse(null, parsedItems, localBreakdown))
    } finally {
      setPreviewLoading(false)
    }
  }

  const resetForm = () => {
    const confirmed = window.confirm('Discard unsaved changes and reset form?')
    if (!confirmed) return

    setFormData({
      subjectType: initialData.subjectType || 'ORGANIZATION',
      subjectId: initialData.subjectId || '',
      subjectLabel: initialData.subjectLabel || '',
      currency: initialData.currency || 'BDT',
      perTicket: Boolean(initialData.perTicket),
      rounding: initialData.rounding || 'ROUND',
      isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      activeFrom: initialData.activeFrom || new Date().toISOString().split('T')[0],
      activeTo: initialData.activeTo || '',
      noEndDate: !initialData.activeTo,
      uiTiers: withComputedFrom(apiRulesToUiTiers({ tiers: initialData.tiers || [] }))
    })
    setFormError('')
    setTierErrors([])
  }

  const handleCancel = () => {
    const confirmed = window.confirm('Discard unsaved changes and leave this page?')
    if (!confirmed) return
    onCancel()
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (formData.subjectType !== 'GLOBAL' && !formData.subjectId) {
      setFormError('Please select a scope target before saving.')
      return
    }

    const validation = validateUiTiers(computedTiers)
    setTierErrors(validation.rows)

    if (hasTierValidationErrors(validation)) {
      setFormError(validation.form[0] || 'Please fix tier validation errors.')
      return
    }

    setFormError('')

    onSubmit({
      subjectType: formData.subjectType,
      subjectId: formData.subjectType === 'GLOBAL' ? null : formData.subjectId,
      currency: formData.currency,
      perTicket: formData.perTicket,
      rounding: formData.rounding,
      isActive: formData.isActive,
      activeFrom: formData.activeFrom || null,
      activeTo: formData.noEndDate ? null : (formData.activeTo || null),
      rules: uiTiersToApiRules(computedTiers)
    })
  }

  return (
    <form className="fee-policy-shell" onSubmit={handleSubmit}>
      <ScopeSelector
        value={formData.subjectType}
        selectedId={formData.subjectId}
        selectedLabel={formData.subjectLabel}
        readOnly={mode === 'edit'}
        onChange={(scope) => setFormData((prev) => ({ ...prev, subjectType: scope, subjectId: '' }))}
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
            >
              <option value="BDT">BDT</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
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
                  checked={!formData.perTicket}
                  onChange={() => setFormData((prev) => ({ ...prev, perTicket: false }))}
                />
                Percentage of total
              </label>
              <label>
                <input
                  type="radio"
                  checked={formData.perTicket}
                  onChange={() => setFormData((prev) => ({ ...prev, perTicket: true }))}
                />
                Per ticket fixed
              </label>
              <label className="is-disabled">
                <input type="radio" disabled />
                Mixed (future)
              </label>
            </div>

            <p className="muted-text">Percentage is decimal rate (example 0.05 = 5%).</p>
          </div>

          <div>
            <label htmlFor="rounding">Rounding</label>
            <select
              id="rounding"
              value={formData.rounding}
              onChange={(event) => setFormData((prev) => ({ ...prev, rounding: event.target.value }))}
            >
              <option value="ROUND">Round Nearest</option>
              <option value="CEIL">Round Up</option>
              <option value="FLOOR">Round Down</option>
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
          <p className="muted-text">Final tier applies to all amounts above previous tier.</p>
          <p className="muted-text">If multiple policies match same subject, newest active policy overrides older ones.</p>
        </div>

        <div className="tier-stack">
          {computedTiers.map((tier, index) => (
            <FeeTierCard
              key={`${tier.from}-${index}`}
              index={index}
              tier={tier}
              errors={tierErrors[index]}
              canRemove={computedTiers.length > 1}
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

        <div className="preview-panel">
          <div className="preview-head">
            <h4>Preview Calculator</h4>
            <label className="fee-inline-check">
              <input
                type="checkbox"
                checked={useOrganizerPreview}
                onChange={(event) => setUseOrganizerPreview(event.target.checked)}
              />
              Use organizer preview endpoint
            </label>
          </div>

          {previewItems.map((item, idx) => (
            <div className="preview-item-row" key={`preview-${idx}`}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Unit price"
                value={item.unitPrice}
                onChange={(event) => {
                  const value = event.target.value
                  setPreviewItems((prev) => prev.map((row, rowIndex) => rowIndex === idx ? { ...row, unitPrice: value } : row))
                }}
              />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(event) => {
                  const value = event.target.value
                  setPreviewItems((prev) => prev.map((row, rowIndex) => rowIndex === idx ? { ...row, quantity: value } : row))
                }}
              />
              {previewItems.length > 1 ? (
                <button
                  type="button"
                  className="tier-remove-btn"
                  onClick={() => setPreviewItems((prev) => prev.filter((_, rowIndex) => rowIndex !== idx))}
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}

          <div className="preview-actions">
            <button type="button" className="add-tier-inline" onClick={() => setPreviewItems((prev) => [...prev, blankPreviewItem()])}>
              + Add sample item
            </button>
            <button type="button" className="primary-btn" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? 'Calculating...' : 'Run Preview'}
            </button>
          </div>

          {previewResult ? (
            <div className="preview-result-wrap">
              <div className="preview-result-grid">
                <p>Subtotal: {previewResult.subtotal.toFixed(2)} {formData.currency}</p>
                <p>Platform Fee: {previewResult.platformFee.toFixed(2)} {formData.currency}</p>
                <p>Gross Total: {previewResult.grossTotal.toFixed(2)} {formData.currency}</p>
                <p>Resolved Source: {previewResult.source}</p>
              </div>

              {Array.isArray(previewResult.breakdown) && previewResult.breakdown.length ? (
                <div className="preview-breakdown-wrap">
                  <table className="preview-breakdown-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="is-right">Unit Price</th>
                        <th className="is-right">Qty</th>
                        <th className="is-right">Line Total</th>
                        <th>Applied Tier</th>
                        <th className="is-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.breakdown.map((row, index) => (
                        <tr key={`preview-row-${index}`}>
                          <td>#{index + 1}</td>
                          <td className="is-right">{formatCurrency(row.unitPrice, formData.currency)}</td>
                          <td className="is-right">{Number(row.quantity || 0)}</td>
                          <td className="is-right">{formatCurrency(row.lineTotal, formData.currency)}</td>
                          <td>{row.tierLabel || 'N/A'}</td>
                          <td className="is-right">{formatCurrency(row.fee, formData.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {formError ? <p className="error-text">{formError}</p> : null}
      </section>

      <div className="fee-sticky-actions">
        <button type="button" className="secondary-btn" onClick={resetForm}>Reset</button>
        <div className="sticky-right-actions">
          <button type="button" className="secondary-btn" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Policy' : 'Update Policy'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default FeePolicyForm
