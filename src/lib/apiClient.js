const API_URL = import.meta.env.VITE_API_URL || ''

const TOKEN_KEYS = ['token', 'authToken', 'accessToken', 'adminToken']
let inMemoryAccessToken = null

function readFromStorage(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeToStorage(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    // no-op when storage is unavailable
  }
}

function removeFromStorage(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    // no-op when storage is unavailable
  }
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getStoredAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken

  for (const key of TOKEN_KEYS) {
    const value = readFromStorage(sessionStorage, key) || readFromStorage(localStorage, key)
    if (value) return value
  }

  return null
}

export function setInMemoryAccessToken(token) {
  inMemoryAccessToken = token || null

  if (!token) return

  // Keep refresh-safe fallback without requiring full persistent login state.
  writeToStorage(sessionStorage, 'accessToken', token)
}

export function clearStoredAccessToken() {
  inMemoryAccessToken = null
  TOKEN_KEYS.forEach((key) => {
    removeFromStorage(sessionStorage, key)
    removeFromStorage(localStorage, key)
  })
}

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  if (!API_URL) return path
  return `${API_URL}${path}`
}

function extractMessage(status, data) {
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error
  }

  if (status === 401) return 'Session expired. Please log in again.'
  if (status === 403) return 'You do not have admin access.'

  return `Request failed with status ${status}`
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function dispatchAuthEvent(eventName, detail, suppressAuthEvents) {
  if (suppressAuthEvents) return
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'include',
    suppressAuthEvents = false
  } = options

  const requestHeaders = new Headers(headers)
  const token = getStoredAccessToken()

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
    requestHeaders.set('x-auth-token', token)
  }

  let requestBody
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      requestBody = body
    } else {
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json')
      }
      requestBody = JSON.stringify(body)
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: requestBody,
    credentials
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      dispatchAuthEvent('auth:unauthorized', { path }, suppressAuthEvents)
    }

    if (response.status === 403) {
      dispatchAuthEvent('auth:forbidden', { path }, suppressAuthEvents)
    }

    throw new ApiError(extractMessage(response.status, data), response.status, data)
  }

  return data
}

export function isAdminUser(user) {
  if (!user) return false
  return user.userType === 'ADMIN' || user.isAdmin === true
}

function extractUser(data) {
  return data?.user || data?.data?.user || data?.data || null
}

export async function verifyAdminSession() {
  const configuredEndpoints = import.meta.env.VITE_AUTH_PROFILE_ENDPOINTS
    ? import.meta.env.VITE_AUTH_PROFILE_ENDPOINTS.split(',').map((endpoint) => endpoint.trim()).filter(Boolean)
    : []

  const endpoints = configuredEndpoints.length > 0
    ? configuredEndpoints
    : ['/api/auth/profile', '/api/auth/me']

  for (const endpoint of endpoints) {
    try {
      const data = await apiRequest(endpoint, {
        method: 'GET',
        suppressAuthEvents: true
      })

      const user = extractUser(data)
      if (!user) continue

      if (isAdminUser(user)) {
        return { status: 'authorized', user }
      }

      return { status: 'forbidden', user }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) continue
        if (error.status === 401) return { status: 'unauthorized' }
        if (error.status === 403) return { status: 'forbidden' }
      }

      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to verify session'
      }
    }
  }

  return { status: 'unauthorized' }
}

export async function loginAdmin({ email, password }) {
  const data = await apiRequest('/api/auth/admin/login', {
    method: 'POST',
    body: { email, password },
    suppressAuthEvents: true
  })

  const token = data?.data?.token
  if (token) {
    setInMemoryAccessToken(token)
  }

  return data
}

export async function logoutSession() {
  const endpoint = import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/api/auth/logout'

  try {
    await apiRequest(endpoint, {
      method: 'POST',
      body: {},
      suppressAuthEvents: true
    })
  } catch (error) {
    if (error instanceof ApiError && [401, 404, 405].includes(error.status)) {
      return
    }

    throw error
  }
}
