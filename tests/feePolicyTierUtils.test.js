import test from 'node:test'
import assert from 'node:assert/strict'
import {
  apiRulesToUiTiers,
  hasTierValidationErrors,
  uiTiersToApiRules,
  validateUiTiers,
  withComputedFrom
} from '../src/components/feePolicyTierUtils.js'

test('apiRulesToUiTiers computes from values and keeps Infinity last', () => {
  const rules = {
    tiers: [
      { max: 100, pct: 0.05, min: 0 },
      { max: 200, pct: 0.1, min: 10 },
      { max: null, pct: 0.15, min: 20 }
    ]
  }

  const ui = apiRulesToUiTiers(rules)

  assert.equal(ui[0].from, 0)
  assert.equal(ui[1].from, 100.01)
  assert.equal(ui[2].from, 200.01)
  assert.equal(ui[2].to, null)
})

test('uiTiersToApiRules only returns max/pct/min', () => {
  const ui = [
    { from: 0, to: 100, pct: 0.05, min: 0 },
    { from: 100.01, to: null, pct: 0.1, min: 10 }
  ]

  const api = uiTiersToApiRules(ui)

  assert.deepEqual(api, {
    tiers: [
      { max: 100, pct: 0.05, min: 0 },
      { max: null, pct: 0.1, min: 10 }
    ]
  })
})

test('validateUiTiers blocks non-final Infinity and invalid pct', () => {
  const ui = [
    { from: 0, to: null, pct: 0.05, min: 0 },
    { from: 0.01, to: 100, pct: 1.5, min: 0 }
  ]

  const result = validateUiTiers(ui)
  assert.equal(hasTierValidationErrors(result), true)
  assert.match(result.rows[0].to, /Only final tier/)
  assert.match(result.rows[1].pct, /<= 1/)
})

test('validateUiTiers catches gaps and overlaps', () => {
  const uiGap = [
    { from: 0, to: 100, pct: 0.05, min: 0 },
    { from: 101.02, to: null, pct: 0.1, min: 0 }
  ]
  const gapResult = validateUiTiers(uiGap)
  assert.equal(hasTierValidationErrors(gapResult), true)
  assert.match(gapResult.rows[1].from, /no gaps or overlaps/)

  const uiOverlap = [
    { from: 0, to: 100, pct: 0.05, min: 0 },
    { from: 100.01, to: 100, pct: 0.1, min: 0 },
    { from: 100.01, to: null, pct: 0.15, min: 0 }
  ]
  const overlapResult = validateUiTiers(withComputedFrom(uiOverlap))
  assert.equal(hasTierValidationErrors(overlapResult), true)
  assert.ok(overlapResult.rows.some((row) => row.to))
})
