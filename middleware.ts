import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/collections') ||
    req.nextUrl.pathname.startsWith('/refills') ||
    req.nextUrl.pathname.startsWith('/api/collections') ||
    req.nextUrl.pathname.startsWith('/api/refills');

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/collections/:path*',
    '/refills/:path*',
    '/api/collections/:path*',
    '/api/refills/:path*',
  ],
};
