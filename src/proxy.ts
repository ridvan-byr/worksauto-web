import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isTenantSession = request.cookies.has('worksauto_session');
  const isAdminSession = request.cookies.has('worksauto_admin_session');

  // 1. Admin Routes Isolation
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (isAdminSession) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }
    // Protected admin routes: /admin, /admin/audit-logs, etc.
    if (!isAdminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Tenant Auth Routes (/sign-in, /login)
  if (pathname === '/sign-in' || pathname === '/login') {
    if (isTenantSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. Public Booking Routes (/book/[slug])
  if (pathname.startsWith('/book')) {
    return NextResponse.next();
  }

  // 4. Protected Tenant Routes (/customers, /vehicles, /appointments, /work-orders, /inventory, /invoices, /current-accounts, /settings, /audit-logs, /onboarding, /)
  if (!isTenantSession) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static chunks)
     * - _next/image (image optimization)
     * - favicon, icons, and static assets (.png, .jpg, .svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
