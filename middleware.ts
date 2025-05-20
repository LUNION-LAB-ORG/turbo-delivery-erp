import { NextResponse, NextRequest } from 'next/server';

// import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
    // const session = await auth();
    const { pathname } = request.nextUrl;
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/analystics', request.url));
    }

    // Permet à la requête de continuer si aucune condition n'est remplie
    return NextResponse.next();
}

// Configuration des chemins à surveiller
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth|api/auth).*)', '/'],
};
