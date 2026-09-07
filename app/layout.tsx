import 'react-perfect-scrollbar/dist/css/styles.css';
// Point d'entree CSS UNIQUE. `globals.css` est desormais inlinee depuis
// `styles/tailwind.css` : deux imports paralleles faisaient emettre la base
// Tailwind DEUX FOIS, pour 311 ko de CSS strictement redondant a chaque page.
import '../styles/tailwind.css';
import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import NextAuthSessionProvider from '@/providers/next-auth-session.provider';
import ProviderComponent from '@/components/layouts/provider-component';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AppToaster } from '@/components/layouts/app-toaster';
export const metadata: Metadata = {
  title: {
    template: '%s | Turbo Delivery - management platform',
    default: 'TURBO DELIVERY - MANAGEMENT PLATFORM',
    absolute: 'TURBO DELIVERY - MANAGEMENT PLATFORM',
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
    title: 'TURBO DELIVERY - MANAGEMENT PLATFORM',
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
    title: 'TURBO DELIVERY - MANAGEMENT PLATFORM',
    description: "Turbo Delivery, leader de la livraison de à Abidjan. Spécialistes en livraison de en Côte d'Ivoire. Expertise locale, service personnalisé.",
    images: ['https://www.turbo-delivery.com/twitter-image.png'],
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

const nunito = Inter({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {/*
        * `lang` etait « en » sur une interface ENTIEREMENT francaise.
        *
        * <p>Ce n'est pas qu'une etiquette. Un lecteur d'ecran lisait le francais avec
        * une voix anglaise, et surtout Chrome, voyant une page declaree anglaise remplie
        * de francais, propose de la traduire — et la traduit a chaque visite si
        * l'utilisateur a accepte une fois. Or la traduction FUSIONNE les noeuds de texte
        * voisins dans un `<font>` : les noeuds que React possede disparaissent sous lui,
        * et le demontage suivant echoue sur
        * « removeChild: The node to be removed is not a child of this node ».</p>
        */}
      <html lang="fr" className="light">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {/*
           * La feuille de style de Leaflet a ete retiree. Elle etait declaree en chemin
           * RELATIF — « assets/… », sans barre initiale — donc elle ne se resolvait qu'a
           * la racine du site : partout ailleurs le serveur renvoyait la page 404 en HTML,
           * que le navigateur refusait comme feuille de style. Une erreur de console sur
           * chaque ecran de l'ERP.
           *
           * Et elle ne servait a rien : aucun fichier du projet n'importe Leaflet, les
           * cartes sont passees a Google Maps. Les paquets `leaflet`, `react-leaflet` et
           * `@types/leaflet` ont ete retires avec elle.
           */}
        </head>
        <body className={nunito.variable}>
          <ProviderComponent>
            <NuqsAdapter>{children}</NuqsAdapter>
          </ProviderComponent>
          <AppToaster />
        </body>
      </html>
    </NextAuthSessionProvider>
  );
}
