export interface PrimaryBank {
  id?: string
  type?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  branch?: string
  provider?: string
  walletNumber?: string
  country?: string
  currency?: string
  status?: string
  isPrimary?: boolean
  meta?: Record<string, unknown>
}

export interface AdminPayoutRow {
  id?: string
  eventName?: string
  organizationName?: string
  status?: string
  amountNet?: number
  currency?: string
  createdAt?: string
  approvedAt?: string
  paidAt?: string
  primaryBank?: PrimaryBank | null
}
