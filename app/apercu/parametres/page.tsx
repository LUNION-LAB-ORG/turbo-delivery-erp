import { notFound } from 'next/navigation';

import ApercuParametres from './contenu';

/**
 * La page Paramètres, sur un profil d'exemple.
 *
 * <p>L'écran vit derrière `app/(protected)/`, dont le layout exige une session : sans
 * identifiants il est invisible, et la seule façon de regarder sa mise en page était de
 * demander une capture. La page n'existe qu'en développement.</p>
 */
export default function PageApercuParametres() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuParametres />;
}
