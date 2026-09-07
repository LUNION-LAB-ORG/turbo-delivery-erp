import { notFound } from 'next/navigation';

import ApercuExportBons from './contenu';

/** Rendu de la fenêtre d'export des bons de livraison. N'existe qu'en développement. */
export default function PageApercuExportBons() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuExportBons />;
}
