import 'react-perfect-scrollbar/dist/css/styles.css';
import '../styles/tailwind.css';
import { Metadata, Viewport } from 'next';
import { Lato } from 'next/font/google';
import NextAuthSessionProvider from '@/providers/next-auth-session.provider';
import ProviderComponent from '@/components/layouts/provider-component';

export const metadata: Metadata = {
    title: {
        template: '%s | Turbo Delivery - management platform',
        default: 'Turbo Delivery - management platform',
        absolute: 'Turbo Delivery - management platform',
    },
    description: "Turbo Delivery, leader de la livraison de à Abidjan. Spécialistes en livraison de en Côte d'Ivoire. Expertise locale, service personnalisé.",
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-icon.png',

    },
    referrer: 'origin-when-cross-origin',
    keywords: [
        'Livraison de Abidjan',
        "Livraison de Côte d'Ivoire",
        'Livraison de en ligne',
        'Livraison de à domicile',
        "Livraison de en ligne Côte d'Ivoire",
        'Livraison de à domicile Abidjan',
        'Livraison de en ligne Abidjan',
        "Gestion de Côte d'Ivoire",
        'Programmes de Abidjan',
        "Expert livraison de Côte d'Ivoire",
        'Agence de livraison de de confiance',
    ],
    authors: [{ name: 'LUNION-LAB Developers', url: 'https://www.lunion-lab.com' }],
    creator: 'LUNION-LAB',
    publisher: 'LUNION-LAB',
    alternates: {
        canonical: 'https://www.turbo-delivery.com',
        languages: {
            'fr-CI': 'https://www.turbo-delivery.com',
            'en-US': 'https://www.turbo-delivery.com/en',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'fr_CI',
        url: 'https://www.turbo-delivery.com',
        siteName: 'Turbo Delivery',
        title: 'Turbo Delivery - management platform',
        description: "Turbo Delivery, leader de la livraison de à Abidjan. Spécialistes en livraison de en Côte d'Ivoire. Expertise locale, service personnalisé.",
        images: [
            {
                url: 'https://www.turbo-delivery.com/og-image.png',
                width: 630,
                height: 630,
                alt: 'Turbo Delivery - management platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@Turbo Delivery',
        creator: '@Turbo Delivery',
        title: 'Turbo Delivery - management platform',
        description: "Turbo Delivery, leader de la livraison de à Abidjan. Spécialistes en livraison de en Côte d'Ivoire. Expertise locale, service personnalisé.",
        images: ['https://www.turbo-delivery.com/twitter-image.png'],
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    category: 'food',
    verification: {
        google: 'google-site-verification=fFyjcvBvLd5IQC3thbjB7iTjZ9vdurwAWMCIyH_O-UE',
        yandex: '42c2b5a41dd6bade',
        other: {
            bing: '0C95FF49E95D55275C93B0A21CA0A039',
        },
    },
    other: {
        'fb:app_id': '1075289994232342',
        'og:phone_number': '+225 01 43 483 131',
        'og:email': 'info@turbo-delivery.com',
        'og:latitude': '5.284599',
        'og:longitude': '-3.974556',
        'og:street-address': "Marcory Zone 4, Rue du 7 décembre | Abidjan Côte d'Ivoire",
        'og:locality': 'Abidjan',
        'og:region': "Côte d'Ivoire",
        'og:postal-code': '22 BP 1022 Abidjan 22',
        'og:country-name': "Côte d'Ivoire",
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

const nunito = Lato({
    weight: ['100', '300', '400', '700', '900'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-nunito',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <NextAuthSessionProvider >
            <html lang="en" className="light ">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body className={nunito.variable}>
                    <ProviderComponent>{children}</ProviderComponent>
                </body>
            </html>
        </NextAuthSessionProvider>
    );
}
