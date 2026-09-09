import { notFound } from 'next/navigation';

import ApercuOnglets from './contenu';

/** Banc des onglets v3, deux variantes. N'existe qu'en développement. */
export default function PageApercuOnglets() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuOnglets />;
}
