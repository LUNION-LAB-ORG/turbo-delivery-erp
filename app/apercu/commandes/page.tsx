import { notFound } from 'next/navigation';

import ApercuCommandes from './contenu';

/**
 * L'ecran des commandes, sur donnees d'exemple.
 *
 * <p>Il existe pour REGARDER l'ecran a la taille reelle d'un poste (environ 1000 x 563 px,
 * coquille comprise) : le nombre de colonnes, la place de l'etat quand le tableau defile,
 * et la tenue de la fiche en hauteur ne se verifient pas autrement. La page n'existe qu'en
 * developpement.</p>
 */
export default function PageApercuCommandes() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuCommandes />;
}
