import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAccessToken,
  setAccessToken,
  setSessionCookie,
  apiClient,
  ApiError,
} from './api-client'

describe('apiClient & In-Memory Token Management', () => {
  beforeEach(() => {
    setAccessToken(null)
    setSessionCookie(false)
    vi.restoreAllMocks()
  })

  it('correctly stores and retrieves in-memory access token', () => {
    expect(getAccessToken()).toBeNull()
    setAccessToken('mock_access_token_123')
    expect(getAccessToken()).toBe('mock_access_token_123')
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })

  it('sets and removes worksauto_session cookie via setSessionCookie', () => {
    setSessionCookie(true)
    expect(document.cookie).toContain('worksauto_session=1')

    setSessionCookie(false)
    // Cookie is set to max-age=0 so in jsdom it is cleared
    expect(document.cookie).not.toContain('worksauto_session=1')
  })

  it('ApiError preserves statusCode, message, and error data', () => {
    const err = new ApiError('Not found', 404, 'RESOURCE_NOT_FOUND', { resource: 'customer' })
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err.errorCode).toBe('RESOURCE_NOT_FOUND')
    expect(err.data).toEqual({ resource: 'customer' })
  })

  it('includes Authorization header in requests when token is present', async () => {
    setAccessToken('token_abc_xyz')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      headers: new Headers({ 'content-type': 'application/json' }),
    })
    global.fetch = fetchMock

    await apiClient.get('/test-endpoint')

    expect(fetchMock).toHaveBeenCalled()
    const callArgs = fetchMock.mock.calls[0]
    const headers = callArgs[1].headers
    expect(headers['Authorization']).toBe('Bearer token_abc_xyz')
  })
})
