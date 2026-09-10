import { notFound } from 'next/navigation';

import ApercuClassement from './contenu';

/**
 * Le banc de la CLASSIFICATION DES PARTENAIRES, sur donnees d'exemple.
 *
 * <p>La page n'existe qu'en developpement : en production, la route repond 404. Aucune
 * donnee reelle ne la traverse, et aucun appel reseau n'en part.</p>
 */
export default function PageApercuClassement() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuClassement />;
}
