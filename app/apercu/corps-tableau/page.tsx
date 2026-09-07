import { notFound } from 'next/navigation';

import ApercuCorpsTableau from './contenu';

/** Banc de reproduction du NotFoundError removeChild. N'existe qu'en développement. */
export default function PageApercuCorpsTableau() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuCorpsTableau />;
}
