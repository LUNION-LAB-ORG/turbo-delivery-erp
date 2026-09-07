import { notFound } from 'next/navigation';

import ApercuTurboys from './contenu';

/**
 * Le vocabulaire du module Turboys, sur données d'exemple.
 *
 * <p>C'est ici que se regarde ce qu'a change la refonte : le type de contrat perd sa
 * teinte, le statut garde la sienne, la cle d'activation redevient lisible en sombre, et
 * la matrice des privileges distingue enfin un refus d'une regle absente.</p>
 *
 * <p>La page n'existe qu'en développement.</p>
 */
export default function PageApercuTurboys() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuTurboys />;
}
