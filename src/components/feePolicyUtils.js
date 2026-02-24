export function normalizeScope(scope) {
  return (scope || '').toUpperCase()
}

export function formatScopeLabel(scope) {
  const normalized = normalizeScope(scope)
  if (!normalized) return 'Unknown'
  return normalized.charAt(0) + normalized.slice(1).toLowerCase()
}

export function formatCurrencyLabel(currency) {
  return (currency || 'BDT').toUpperCase()
}

export function formatDateLabel(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getPolicyStatus(policy) {
  const now = new Date()
  const activeFrom = policy?.activeFrom ? new Date(policy.activeFrom) : null
  const activeTo = policy?.activeTo ? new Date(policy.activeTo) : null

  if (!policy?.isActive) return 'INACTIVE'

  if (activeFrom && activeFrom > now) return 'SCHEDULED'
  if (activeTo && activeTo < now) return 'EXPIRED'

  return 'ACTIVE'
}

export function buildTierPreview(tiers = []) {
  return tiers.map((tier) => {
    const min = tier?.min ?? 0
    const max = tier?.max
    const pct = Number(tier?.pct || 0) * 100

    if (max === null || max === undefined) {
      return `${min}+ → ${pct.toFixed(2)}%`
    }

    return `${min}–${max} → ${pct.toFixed(2)}%`
  })
}

export function sortTiersAscending(tiers = []) {
  return [...tiers].sort((a, b) => Number(a?.min || 0) - Number(b?.min || 0))
}

export function validateTiers(tiers = []) {
  if (!tiers.length) {
    return 'At least one tier is required.'
  }

  const sorted = sortTiersAscending(tiers)

  for (let i = 0; i < sorted.length; i += 1) {
    const tier = sorted[i]
    const min = Number(tier?.min)
    const max = tier?.max === null || tier?.max === '' ? null : Number(tier?.max)
    const pct = Number(tier?.pct)

    if (Number.isNaN(min) || min < 0) {
      return `Tier ${i + 1}: minimum value must be 0 or greater.`
    }

    if (max !== null && (Number.isNaN(max) || max < min)) {
      return `Tier ${i + 1}: max value must be greater than or equal to min value.`
    }

    if (Number.isNaN(pct) || pct < 0) {
      return `Tier ${i + 1}: fee percentage must be valid.`
    }

    const next = sorted[i + 1]
    if (!next || max === null) continue

    const nextMin = Number(next?.min)
    if (nextMin <= max) {
      return `Tier ${i + 2} overlaps with Tier ${i + 1}.`
    }
  }

  return null
}
