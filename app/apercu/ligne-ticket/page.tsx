import { notFound } from 'next/navigation';

import ApercuLigneTicket from './contenu';

/** Rendu d'une ligne de ticket en cours de saisie. N'existe qu'en développement. */
export default function PageApercuLigneTicket() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuLigneTicket />;
}
