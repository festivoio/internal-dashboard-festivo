const STEP = 0.01

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const asNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const sortByToAsc = (tiers) => {
  return [...tiers].sort((a, b) => {
    const aTo = a.to === null ? Number.POSITIVE_INFINITY : Number(a.to)
    const bTo = b.to === null ? Number.POSITIVE_INFINITY : Number(b.to)
    return aTo - bTo
  })
}

export function apiRulesToUiTiers(rules) {
  const apiTiers = Array.isArray(rules?.tiers) ? rules.tiers : []
  if (!apiTiers.length) {
    return [{ from: 0, to: null, pct: 0.05, min: 0 }]
  }

  const sortedApi = [...apiTiers].sort((a, b) => {
    const aMax = a?.max === null ? Number.POSITIVE_INFINITY : Number(a?.max)
    const bMax = b?.max === null ? Number.POSITIVE_INFINITY : Number(b?.max)
    return aMax - bMax
  })

  let currentFrom = 0

  return sortedApi.map((tier) => {
    const to = tier?.max === null || tier?.max === undefined ? null : round2(Number(tier.max))
    const uiTier = {
      from: round2(currentFrom),
      to,
      pct: Number(tier?.pct ?? 0),
      min: Number(tier?.min ?? 0)
    }

    if (to !== null) {
      currentFrom = round2(to + STEP)
    }

    return uiTier
  })
}

export function uiTiersToApiRules(uiTiers) {
  const sorted = sortByToAsc(uiTiers)

  return {
    tiers: sorted.map((tier) => ({
      max: tier.to === null || tier.to === '' ? null : round2(Number(tier.to)),
      pct: Number(tier.pct),
      min: Number(tier.min)
    }))
  }
}

export function validateUiTiers(uiTiers) {
  const errors = {
    form: [],
    rows: uiTiers.map(() => ({ from: '', to: '', pct: '', min: '' }))
  }

  if (!Array.isArray(uiTiers) || uiTiers.length === 0) {
    errors.form.push('At least 1 tier is required.')
    return errors
  }

  const rows = uiTiers.map((tier, index) => ({
    index,
    from: asNumber(tier.from),
    to: tier.to === '' ? null : asNumber(tier.to),
    pct: asNumber(tier.pct),
    min: asNumber(tier.min)
  }))

  rows.forEach((row) => {
    if (row.min === null || row.min < 0) {
      errors.rows[row.index].min = 'Min must be a number >= 0.'
    }

    if (row.pct === null || row.pct < 0) {
      errors.rows[row.index].pct = 'Pct must be >= 0.'
    } else if (row.pct > 1) {
      errors.rows[row.index].pct = 'Pct must be <= 1 (0.05 = 5%).'
    }
  })

  for (let i = 0; i < rows.length - 1; i += 1) {
    const row = rows[i]
    if (row.to === null) {
      errors.rows[row.index].to = 'Only final tier can be Infinity.'
    }
  }

  const lastRow = rows[rows.length - 1]
  if (lastRow.to !== null) {
    errors.rows[lastRow.index].to = 'Final tier must be Infinity (empty To).'
  }

  const finiteRows = rows.filter((row) => row.to !== null)
  const duplicates = new Set()
  const seen = new Set()
  finiteRows.forEach((row) => {
    const key = row.to
    if (seen.has(key)) duplicates.add(key)
    seen.add(key)
  })

  finiteRows.forEach((row) => {
    if (duplicates.has(row.to)) {
      errors.rows[row.index].to = 'Duplicate To value.'
    }
  })

  const sorted = sortByToAsc(rows)

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]

    if (current.to !== null && current.from !== null && current.to < current.from) {
      errors.rows[current.index].to = 'To must be greater than or equal to From.'
    }

    if (i === 0) continue

    const previous = sorted[i - 1]
    if (previous.to === null) continue

    const expectedFrom = round2(previous.to + STEP)
    if (current.from === null || round2(current.from) !== expectedFrom) {
      errors.rows[current.index].from = `From must be ${expectedFrom.toFixed(2)} (no gaps or overlaps).`
    }

    if (current.to !== null && current.to <= previous.to) {
      errors.rows[current.index].to = 'To values must be strictly increasing.'
    }
  }

  return errors
}

export function hasTierValidationErrors(result) {
  return result.form.length > 0 || result.rows.some((row) => Object.values(row).some(Boolean))
}

export function withComputedFrom(uiTiers) {
  const sorted = sortByToAsc(uiTiers)
  let from = 0

  return sorted.map((tier) => {
    const to = tier.to === '' ? null : asNumber(tier.to)
    const updated = {
      ...tier,
      from: round2(from),
      to
    }

    if (to !== null) {
      from = round2(to + STEP)
    }

    return updated
  })
}

export function nextTierFrom(uiTiers) {
  const normalized = withComputedFrom(uiTiers)
  const last = normalized[normalized.length - 1]

  if (!last || last.to === null) {
    return round2((last?.from ?? 0) + STEP)
  }

  return round2(last.to + STEP)
}
