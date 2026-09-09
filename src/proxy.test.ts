import { describe, it, expect } from 'vitest'
import { proxy } from './proxy'
import { NextRequest } from 'next/server'

function createMockRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(url)
  for (const [key, val] of Object.entries(cookies)) {
    req.cookies.set(key, val)
  }
  return req
}

describe('Next.js 16 Edge Route Guard (proxy)', () => {
  it('allows public booking routes without any cookies', () => {
    const req = createMockRequest('https://app.worksauto.com/book/istanbul-garaj')
    const res = proxy(req)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects unauthenticated users from protected tenant pages to /sign-in', () => {
    const req = createMockRequest('https://app.worksauto.com/customers')
    const res = proxy(req)
    expect(res.headers.get('location')).toBe('https://app.worksauto.com/sign-in')
  })

  it('allows access to protected tenant pages when worksauto_session is present', () => {
    const req = createMockRequest('https://app.worksauto.com/customers', {
      worksauto_session: 'valid_tenant_session',
    })
    const res = proxy(req)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects authenticated tenant away from /sign-in to /', () => {
    const req = createMockRequest('https://app.worksauto.com/sign-in', {
      worksauto_session: 'valid_tenant_session',
    })
    const res = proxy(req)
    expect(res.headers.get('location')).toBe('https://app.worksauto.com/')
  })

  it('redirects unauthenticated admin users from /admin to /admin/login', () => {
    const req = createMockRequest('https://app.worksauto.com/admin')
    const res = proxy(req)
    expect(res.headers.get('location')).toBe('https://app.worksauto.com/admin/login')
  })

  it('allows admin users with worksauto_admin_session into /admin', () => {
    const req = createMockRequest('https://app.worksauto.com/admin', {
      worksauto_admin_session: 'valid_admin_session',
    })
    const res = proxy(req)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects logged-in admin away from /admin/login to /admin', () => {
    const req = createMockRequest('https://app.worksauto.com/admin/login', {
      worksauto_admin_session: 'valid_admin_session',
    })
    const res = proxy(req)
    expect(res.headers.get('location')).toBe('https://app.worksauto.com/admin')
  })
})
