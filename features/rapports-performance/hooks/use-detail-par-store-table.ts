'use client';

import type { SortDescriptor } from '@heroui-v3/react';
import React from 'react';

import type { ColonneStore } from '@/features/rapports-performance/components/detail-par-store/detail-par-store-table-columns';
import type { IStorePerformance } from '@/features/rapports-performance/types/performance.type';

/** Ce que le pied de tableau additionne. Le taux n'y figure pas : il ne s'additionne pas. */
export interface TotauxParStore {
  totalDeliveries: number;
  totalOrderValue: number;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  totalFacture: number;
}

const TOTAUX_VIDES: TotauxParStore = {
  totalDeliveries: 0,
  totalOrderValue: 0,
  deliveryFeesCollected: 0,
  turboDeliveryServiceFees: 0,
  totalFacture: 0,
};

/**
 * L'instance du tableau « Detail par store » : son tri et ses totaux.
 *
 * <h3>Le tri par defaut est celui du SERVEUR</h3>
 * <p>`parStore` arrive deja trie par livraisons decroissantes puis par nom. L'etat initial
 * reproduit ce tri, egalite sur le nom comprise : sans cette seconde cle, deux stores a
 * egalite de livraisons changeraient de place au premier rendu, et l'ordre affiche ne
 * serait plus celui que le serveur a envoye.</p>
 *
 * <h3>Pas de recherche dans ce tableau, et c'est delibere</h3>
 * <p>Un champ de recherche filtrerait les lignes, donc les totaux du pied. Or ce pied a
 * une fonction precise : retomber au franc pres sur les cartes de tete. Des totaux qui
 * suivent un filtre ne retombent plus sur rien, et l'operateur n'a aucun moyen de savoir
 * lequel des deux chiffres se trompe. Le tri, lui, reordonne sans rien retirer.</p>
 */
export function useDetailParStoreTable(lignes: IStorePerformance[]) {
  const [tri, setTri] = React.useState<SortDescriptor>({
    column: 'totalDeliveries',
    direction: 'descending',
  });

  const triees = React.useMemo(() => {
    const colonne = tri.column as ColonneStore;
    const signe = tri.direction === 'ascending' ? 1 : -1;

    // Le nom peut manquer : l'identifiant sert alors de cle de tri comme il sert
    // d'affichage, pour que la ligne garde une place stable et non la premiere.
    const nomDe = (l: IStorePerformance) => l.nom ?? l.restaurantId;

    return [...lignes].sort((a, b) => {
      if (colonne === 'nom') return signe * nomDe(a).localeCompare(nomDe(b), 'fr');

      const va = a[colonne];
      const vb = b[colonne];

      // `successRate` peut etre nul : une ligne sans taux se range EN DERNIER dans les deux
      // sens de tri. La faire remonter en tete d'un tri croissant reviendrait a la traiter
      // comme un taux de zero, c'est-a-dire a affirmer un echec la ou rien n'est mesure.
      if (va == null && vb == null) return nomDe(a).localeCompare(nomDe(b), 'fr');
      if (va == null) return 1;
      if (vb == null) return -1;

      const ecart = signe * (Number(va) - Number(vb));
      return ecart !== 0 ? ecart : nomDe(a).localeCompare(nomDe(b), 'fr');
    });
  }, [lignes, tri]);

  /*
   * Les totaux sont calcules SUR LES LIGNES AFFICHEES, et non recopies depuis le bloc
   * consolide. C'est le seul calcul qui verifie quelque chose : l'API garantit que la somme
   * des lignes vaut le total de tete - verifie en production au franc pres - et la seule
   * facon d'en tenir la promesse a l'ecran est de refaire l'addition que le lecteur fait
   * de l'oeil. Recopier les totaux d'en haut afficherait un accord que personne n'aurait
   * verifie.
   */
  const totaux = React.useMemo<TotauxParStore>(
    () =>
      lignes.reduce<TotauxParStore>(
        (t, l) => ({
          totalDeliveries: t.totalDeliveries + (l.totalDeliveries ?? 0),
          totalOrderValue: t.totalOrderValue + (l.totalOrderValue ?? 0),
          deliveryFeesCollected: t.deliveryFeesCollected + (l.deliveryFeesCollected ?? 0),
          turboDeliveryServiceFees:
            t.turboDeliveryServiceFees + (l.turboDeliveryServiceFees ?? 0),
          totalFacture: t.totalFacture + (l.totalFacture ?? 0),
        }),
        { ...TOTAUX_VIDES },
      ),
    [lignes],
  );

  return { lignes: triees, totaux, tri, setTri };
}
