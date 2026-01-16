import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for subdomain-based routing AND authentication validation
 * 
 * URL Structure:
 * - recapvideo.ai → Marketing/Landing pages
 * - studio.recapvideo.ai → Dashboard/App pages
 * - api.recapvideo.ai → Backend API (handled by DNS/proxy)
 * 
 * Auth Features:
 * - Token presence check for protected routes
 * - Redirect to login if not authenticated
 * - Redirect to dashboard if already authenticated (auth pages)
 */

// Simple JWT decode without verification (verification happens on API calls)
function decodeJWT(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  // Add 10 second buffer for clock skew
  return payload.exp * 1000 < Date.now() - 10000;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Get the subdomain
  const subdomain = hostname.split('.')[0];
  
  // Check if we're on localhost for development
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  // Get token from cookie (for server-side check)
  // Note: We also check localStorage on client-side via auth-guard
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  // Check authentication status
  const hasValidToken = accessToken && !isTokenExpired(accessToken);
  const hasRefreshToken = !!refreshToken;
  const isAuthenticated = hasValidToken || hasRefreshToken;
  
  // Production subdomain handling
  const isStudioSubdomain = subdomain === 'studio' || subdomain === 'app';
  const isMainDomain = hostname === 'recapvideo.ai' || hostname === 'www.recapvideo.ai';
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/videos', '/credits', '/buy', '/profile', '/admin'];
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path));
  
  // Auth paths (login, signup, callback)
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some(path => url.pathname.startsWith(path));
  
  // Auth callback path (should always be accessible)
  const isAuthCallback = url.pathname.startsWith('/auth/callback');
  
  // Marketing paths (pages that should stay on main domain)
  const marketingPaths = ['/', '/pricing', '/features', '/about', '/contact', '/blog', '/faq', '/terms', '/privacy'];
  const isMarketingPath = marketingPaths.includes(url.pathname) || url.pathname.startsWith('/blog/');
  
  // For local development
  if (isLocalhost) {
    // Auth validation for protected paths
    if (isProtectedPath && !isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Redirect authenticated users away from auth pages
    if (isAuthPath && isAuthenticated && !isAuthCallback) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return NextResponse.next();
  }
  
  // If on main domain (recapvideo.ai)
  if (isMainDomain) {
    // Allow marketing pages (including terms, privacy, faq, contact)
    if (isMarketingPath) {
      return NextResponse.next();
    }
    
    // If trying to access protected/app routes, redirect to studio subdomain
    if (isProtectedPath || isAuthPath || isAuthCallback) {
      return NextResponse.redirect(new URL(`https://studio.recapvideo.ai${url.pathname}${url.search}`, request.url));
    }
    
    // Default: allow on main domain (don't redirect unknown routes)
    return NextResponse.next();
  }
  
  // If on studio/app subdomain (studio.recapvideo.ai)
  if (isStudioSubdomain) {
    // Auth callback should always be accessible
    if (isAuthCallback) {
      return NextResponse.next();
    }
    
    // Protected path without auth → redirect to login
    if (isProtectedPath && !isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Auth page with valid auth → redirect to dashboard
    if (isAuthPath && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Root path on studio subdomain → redirect to dashboard (if auth) or login
    if (url.pathname === '/') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
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
