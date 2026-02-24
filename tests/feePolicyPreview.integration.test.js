import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { calculateTieredBreakdown, normalizePreviewResponse } from '../src/components/feePolicyPreviewUtils.js'

test('preview response is normalized and rendered in admin summary block', () => {
  const normalized = normalizePreviewResponse(
    {
      data: {
        subtotal: 1000,
        platformFee: 50,
        grossTotal: 1050,
        policySource: 'EVENT'
      }
    },
    [{ unitPrice: 1000, quantity: 1 }]
  )

  const PreviewSummary = ({ result }) => React.createElement(
    'div',
    null,
    React.createElement('p', null, `Subtotal: ${result.subtotal}`),
    React.createElement('p', null, `Platform Fee: ${result.platformFee}`),
    React.createElement('p', null, `Gross Total: ${result.grossTotal}`),
    React.createElement('p', null, `Resolved Source: ${result.source}`)
  )

  const html = renderToStaticMarkup(React.createElement(PreviewSummary, { result: normalized }))

  assert.match(html, /Subtotal: 1000/)
  assert.match(html, /Platform Fee: 50/)
  assert.match(html, /Gross Total: 1050/)
  assert.match(html, /Resolved Source: EVENT/)
})

test('preview breakdown keeps tier-applied rows for item calculations', () => {
  const localBreakdown = calculateTieredBreakdown(
    [
      { from: 0, to: 100, pct: 0.05, min: 0 },
      { from: 100.01, to: null, pct: 0.1, min: 2 }
    ],
    [{ unitPrice: 200, quantity: 2 }],
    false
  )

  const normalized = normalizePreviewResponse(
    {
      data: {
        subtotal: 400,
        platformFee: 40,
        grossTotal: 440,
        policySource: 'GLOBAL'
      }
    },
    [{ unitPrice: 200, quantity: 2 }],
    localBreakdown
  )

  const html = renderToStaticMarkup(
    React.createElement(
      'div',
      null,
      React.createElement('p', null, `Tier: ${normalized.breakdown[0].tierLabel}`),
      React.createElement('p', null, `Fee: ${normalized.breakdown[0].fee}`)
    )
  )

  assert.match(html, /Tier: 100.01–∞/)
  assert.match(html, /Fee: 40/)
})
