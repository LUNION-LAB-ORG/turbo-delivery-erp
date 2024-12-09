import { NextResponse, NextRequest } from 'next/server';

import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
    // const session = await auth();
    // const { pathname } = request.nextUrl;

    // // Si l'utilisateur n'est pas authentifié
    // if (!session) {
    //     // Redirige toutes les pages non authentifiées vers la page de connexion sauf la page d'accueil
    //     if (!pathname.startsWith('/auth') && pathname !== '/') {
    //         return NextResponse.redirect(new URL('/auth', request.url));
    //     }
    // } else {
    //     // Gestion des erreurs de rafraîchissement du token
    //     if (session.error === 'RefreshAccessTokenError') {
    //         return NextResponse.redirect(new URL('/auth/signout', request.url));
    //     }

    //     // Si l'utilisateur a complété son profil mais accède à une page d'authentification
    //     if (session.user?.isProfileCompleted && pathname.startsWith('/auth')) {
    //         return NextResponse.redirect(new URL('/', request.url));
    //     }

    //     // Si l'utilisateur n'a pas complété son profil et accède à une autre page que /auth
    //     if (!session.user?.isProfileCompleted && !pathname.startsWith('/auth') && pathname !== '/auth?step=3') {
    //         return NextResponse.redirect(new URL('/auth?step=3', request.url));
    //     }
    // }

    // Permet à la requête de continuer si aucune condition n'est remplie
    return NextResponse.next();
}

// Configuration des chemins à surveiller
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|faqs|about|help|terms|auth|api/auth|auth/signout|pricing|portal).*)', '/workspaces/:path*', '/'],
};
