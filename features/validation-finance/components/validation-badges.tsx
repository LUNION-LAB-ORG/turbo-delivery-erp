import { Chip } from '@heroui-v3/react';

import { S_REJETE_DG, S_REJETE_DGA } from './validation.constants';

/**
 * Les deux etiquettes de la validation des charges.
 *
 * <h3>Ce qui change</h3>
 * <p>Les deux etiquettes etaient peintes a la palette brute : jaune pour VARIABLE, bleu
 * pour PAIE, et neuf teintes de statut. Aucune de ces couleurs ne disait quoi que ce soit.
 * Le type d'une charge est une CATEGORIE, et une categorie coloriee n'annonce ni alerte,
 * ni succes, ni geste : elle se lit en toutes lettres, c'est deja son role. Les teintes
 * pastels de palette n'avaient par ailleurs aucune variante sombre, donc du texte fonce
 * sur fond clair des que le theme bascule.</p>
 *
 * <p>Une seule couleur survit, et elle dit quelque chose : le REJET. Un dossier refuse est
 * la seule anomalie de cette liste, celle que l'operateur doit reperer sans lire. Tout le
 * reste du parcours (en attente, vise, approuve, decaisse) est le cours normal des choses
 * et reste neutre.</p>
 */
const STATUTS_REJET = new Set<string>([S_REJETE_DGA, S_REJETE_DG, 'REJETE_DGA', 'REJETE_DG']);

export function TypeBadge({ type }: { type: string }) {
  const t = (type ?? '').toUpperCase();
  return (
    <Chip color="default" size="sm" variant="soft">
      <Chip.Label>{t || 'N/A'}</Chip.Label>
    </Chip>
  );
}

export function StatusBadge({ statut }: { statut: string }) {
  return (
    <Chip color={STATUTS_REJET.has(statut) ? 'danger' : 'default'} size="sm" variant="soft">
      <Chip.Label>{statut}</Chip.Label>
    </Chip>
  );
}
