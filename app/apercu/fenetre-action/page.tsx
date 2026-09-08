import { notFound } from 'next/navigation';

import ApercuFenetreAction from './contenu';

/** Banc de la coquille de dialogue partagée. N'existe qu'en développement. */
export default function PageApercuFenetreAction() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuFenetreAction />;
}
