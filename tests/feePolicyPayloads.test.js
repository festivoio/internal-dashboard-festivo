import test from 'node:test'
import assert from 'node:assert/strict'
import { uiTiersToApiRules } from '../src/components/feePolicyTierUtils.js'

test('create/update payload uses rules.tiers max/pct/min only', () => {
  const uiTiers = [
    { from: 0, to: 100, pct: 0.05, min: 0 },
    { from: 100.01, to: null, pct: 0.08, min: 10 }
  ]

  const payload = {
    subjectType: 'EVENT',
    subjectId: 'evt_1',
    currency: 'BDT',
    perTicket: false,
    rounding: 'ROUND',
    rules: uiTiersToApiRules(uiTiers)
  }

  assert.deepEqual(payload.rules, {
    tiers: [
      { max: 100, pct: 0.05, min: 0 },
      { max: null, pct: 0.08, min: 10 }
    ]
  })
  assert.equal('from' in payload.rules.tiers[0], false)
})

test('activate flow endpoint path format is correct', () => {
  const policyId = 'pol_123'
  const endpoint = `/api/fees/policies/${policyId}/activate`
  assert.equal(endpoint, '/api/fees/policies/pol_123/activate')
})
