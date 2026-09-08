import { notFound } from 'next/navigation';

import ApercuCourseExterne from './contenu';

/**
 * Le detail d'une course externe, sur donnees d'exemple.
 *
 * <p>Il existe pour REGARDER l'ecran a la taille reelle d'un poste (environ 1000 x 563 px,
 * coquille comprise) : la tenue du trajet, l'alignement du releve de montants et la
 * hauteur du tiroir ne se verifient pas autrement. La page n'existe qu'en developpement.</p>
 */
export default function PageApercuCourseExterne() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuCourseExterne />;
}
