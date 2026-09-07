import { notFound } from 'next/navigation';

import ApercuChargeTableau from './contenu';

/** Banc de CHARGE du tableau v3. N'existe qu'en développement. */
export default function PageApercuChargeTableau() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuChargeTableau />;
}
