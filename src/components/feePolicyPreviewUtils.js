export function computePreviewFallback(items = []) {
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.unitPrice || 0)
    const qty = Number(item.quantity || 0)
    return sum + (Number.isFinite(price) ? price : 0) * (Number.isFinite(qty) ? qty : 0)
  }, 0)

  return {
    subtotal,
    platformFee: 0,
    grossTotal: subtotal,
    breakdown: items.map((item) => ({ ...item, lineTotal: Number(item.unitPrice || 0) * Number(item.quantity || 0), fee: 0 })),
    source: 'N/A'
  }
}

function findTierForAmount(tiers, amount) {
  for (const tier of tiers) {
    if (tier.to === null) return tier
    if (amount <= tier.to) return tier
  }
  return tiers[tiers.length - 1] || { from: 0, to: null, pct: 0, min: 0 }
}

export function calculateTieredBreakdown(uiTiers = [], items = [], perTicket = false) {
  const tiers = [...uiTiers].sort((a, b) => {
    const aTo = a.to === null ? Number.POSITIVE_INFINITY : Number(a.to)
    const bTo = b.to === null ? Number.POSITIVE_INFINITY : Number(b.to)
    return aTo - bTo
  })

  return items.map((item, index) => {
    const unitPrice = Number(item.unitPrice || 0)
    const quantity = Number(item.quantity || 0)
    const lineTotal = unitPrice * quantity
    const selectorAmount = perTicket ? unitPrice : lineTotal
    const tier = findTierForAmount(tiers, selectorAmount)
    const pct = Number(tier?.pct || 0)
    const min = Number(tier?.min || 0)

    const fee = perTicket
      ? Math.max(min, unitPrice * pct) * quantity
      : Math.max(min, lineTotal * pct)

    const tierLabel = `${tier?.from ?? 0}–${tier?.to === null ? '∞' : tier.to}`

    return {
      index,
      unitPrice,
      quantity,
      lineTotal,
      fee,
      tierLabel,
      pct,
      tier: {
        from: tier?.from ?? 0,
        to: tier?.to ?? null,
        min,
        pct
      }
    }
  })
}

export function normalizePreviewResponse(response, fallbackItems, localBreakdown = []) {
  const data = response?.data || response || {}
  const subtotal = Number(data.subtotal ?? data.baseAmount ?? 0)
  const platformFee = Number(data.platformFee ?? data.fee ?? 0)
  const grossTotal = Number(data.grossTotal ?? data.total ?? subtotal + platformFee)

  let breakdown
  if (Array.isArray(data.breakdown)) {
    breakdown = data.breakdown.map((serverRow, index) => {
      const localRow = localBreakdown[index] || {}
      const serverLineTotal = Number(serverRow?.lineTotal)
      const serverFee = Number(serverRow?.fee)

      return {
        ...localRow,
        ...serverRow,
        lineTotal: Number.isFinite(serverLineTotal) ? serverLineTotal : Number(localRow.lineTotal || 0),
        fee: Number.isFinite(serverFee) ? serverFee : Number(localRow.fee || 0),
        tierLabel: serverRow?.tierLabel || localRow?.tierLabel || 'N/A',
        quantity: Number(serverRow?.quantity ?? localRow?.quantity ?? 0),
        unitPrice: Number(serverRow?.unitPrice ?? localRow?.unitPrice ?? 0)
      }
    })
  } else {
    breakdown = localBreakdown.length ? localBreakdown : computePreviewFallback(fallbackItems).breakdown
  }

  return {
    subtotal,
    platformFee,
    grossTotal,
    breakdown,
    source: data?.policySource || data?.resolvedFrom || 'N/A'
  }
}
