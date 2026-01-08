import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for subdomain-based routing
 * 
 * URL Structure:
 * - recapvideo.ai → Marketing/Landing pages
 * - studio.recapvideo.ai → Dashboard/App pages
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
  const isStudioSubdomain = subdomain === 'studio' || subdomain === 'app';
  const isMainDomain = hostname === 'recapvideo.ai' || hostname === 'www.recapvideo.ai';
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/videos', '/credits', '/buy', '/profile', '/admin'];
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path));
  
  // Auth paths (login, signup, callback)
  const authPaths = ['/login', '/signup', '/auth'];
  const isAuthPath = authPaths.some(path => url.pathname.startsWith(path));
  
  // Marketing paths (pages that should stay on main domain)
  const marketingPaths = ['/', '/pricing', '/features', '/about', '/contact', '/blog', '/faq', '/terms', '/privacy'];
  const isMarketingPath = marketingPaths.includes(url.pathname) || url.pathname.startsWith('/blog/');
  
  // If on main domain (recapvideo.ai)
  if (isMainDomain) {
    // Allow marketing pages (including terms, privacy, faq, contact)
    if (isMarketingPath) {
      return NextResponse.next();
    }
    
    // If trying to access protected/app routes, redirect to studio subdomain
    if (isProtectedPath || isAuthPath) {
      return NextResponse.redirect(new URL(`https://studio.recapvideo.ai${url.pathname}`, request.url));
    }
    
    // Default: allow on main domain (don't redirect unknown routes)
    return NextResponse.next();
  }
  
  // If on studio/app subdomain (studio.recapvideo.ai)
  if (isStudioSubdomain) {
    // Root path on studio subdomain → redirect to /dashboard
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If trying to access marketing pages, redirect to main domain
    if (isMarketingPath && url.pathname !== '/') {
      return NextResponse.redirect(new URL(`https://recapvideo.ai${url.pathname}`, request.url));
    }
    
    // Allow all other paths on studio subdomain
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
