import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = Boolean(req.cookies.get('st_auth')?.value);
  const isApiRoute = pathname.startsWith('/api');
  const isNextAsset = pathname.startsWith('/_next');
  const isStaticFile = /\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|json|map|css|js|woff2?|ttf|otf|webmanifest)$/i.test(pathname);

  if (isApiRoute || isNextAsset || isStaticFile) {
    return NextResponse.next();
  }
  if (pathname === '/login') {
    // Already signed in? Send to the menu instead of showing the login page again.
    if (authed) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    const destination = `${pathname}${req.nextUrl.search || ''}`;
    url.search = '';
    url.searchParams.set('next', destination);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*']
};
