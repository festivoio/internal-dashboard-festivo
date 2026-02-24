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
  const sorted = [...tiers].sort((a, b) => {
    const aMax = a?.max === null ? Number.POSITIVE_INFINITY : Number(a?.max)
    const bMax = b?.max === null ? Number.POSITIVE_INFINITY : Number(b?.max)
    return aMax - bMax
  })

  return sorted.map((tier) => {
    const min = tier?.min ?? 0
    const max = tier?.max
    const pct = Number(tier?.pct || 0) * 100

    if (max === null || max === undefined) {
      return `${min}+ → ${pct.toFixed(2)}%`
    }

    return `${min}–${max} → ${pct.toFixed(2)}%`
  })
}
