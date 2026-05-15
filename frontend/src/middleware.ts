// Middleware Next.js para proteção de rotas
// Redireciona para /login se o usuário não estiver autenticado
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifica se a rota é pública
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Verifica autenticação através do cookie ou header
  // Como usamos localStorage, usamos um cookie adicional para o middleware
  const authCookie = request.cookies.get('ontickets_authenticated')
  const isAuthenticated = authCookie?.value === 'true'

  // Redireciona para login se rota protegida e não autenticado
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redireciona para dashboard se já autenticado e tentar acessar login
  if (isPublicRoute && isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protege todas as rotas exceto arquivos estáticos e API
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
