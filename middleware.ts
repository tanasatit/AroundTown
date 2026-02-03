import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
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