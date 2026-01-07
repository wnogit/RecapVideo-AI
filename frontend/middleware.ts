import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for subdomain-based routing
 * 
 * URL Structure:
 * - recapvideo.ai → Marketing/Landing pages
 * - app.recapvideo.ai → Dashboard/App pages
 * - api.recapvideo.ai → Backend API (handled by DNS/proxy)
 */

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Get the subdomain
  const subdomain = hostname.split('.')[0];
  
  // Check if we're on localhost for development
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  // For local development, check for app subdomain or use path-based routing
  if (isLocalhost) {
    // In development, /dashboard/* routes work as-is
    return NextResponse.next();
  }
  
  // Production subdomain handling
  const isAppSubdomain = subdomain === 'app';
  const isMainDomain = hostname === 'recapvideo.ai' || hostname === 'www.recapvideo.ai';
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/videos', '/credits', '/buy', '/profile', '/admin'];
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path));
  
  // Auth paths (login, callback)
  const authPaths = ['/login', '/auth'];
  const isAuthPath = authPaths.some(path => url.pathname.startsWith(path));
  
  // Marketing paths
  const marketingPaths = ['/', '/pricing', '/features', '/about', '/contact', '/blog'];
  const isMarketingPath = marketingPaths.includes(url.pathname) || url.pathname.startsWith('/blog/');
  
  // If on main domain (recapvideo.ai)
  if (isMainDomain) {
    // If trying to access protected/app routes, redirect to app subdomain
    if (isProtectedPath || isAuthPath) {
      return NextResponse.redirect(new URL(`https://app.recapvideo.ai${url.pathname}`, request.url));
    }
    
    // Allow marketing pages
    if (isMarketingPath) {
      return NextResponse.next();
    }
    
    // Default: redirect to app subdomain for unknown routes
    return NextResponse.redirect(new URL(`https://app.recapvideo.ai${url.pathname}`, request.url));
  }
  
  // If on app subdomain (app.recapvideo.ai)
  if (isAppSubdomain) {
    // Root path on app subdomain → redirect to /dashboard
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If trying to access marketing pages, redirect to main domain
    if (isMarketingPath && url.pathname !== '/') {
      return NextResponse.redirect(new URL(`https://recapvideo.ai${url.pathname}`, request.url));
    }
    
    // Allow all other paths on app subdomain
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all paths except static files and api routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
