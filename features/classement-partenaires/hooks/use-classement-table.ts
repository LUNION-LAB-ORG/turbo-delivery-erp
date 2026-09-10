'use client';

import type { SortDescriptor } from '@heroui-v3/react';
import { useQueryStates } from 'nuqs';
import React from 'react';

import { COLONNES_CLASSEMENT } from '@/features/classement-partenaires/components/classement-table-columns';
import { classementFiltersClient } from '@/features/classement-partenaires/filters/classement.filters';
import { useClassementQuery } from '@/features/classement-partenaires/queries/classement.query';
import type { IParamsClassement, SensTri } from '@/features/classement-partenaires/types/classement.types';
import { COLONNE_DE_TRI, sensNaturel, triDeColonne } from '@/features/classement-partenaires/utils/classement-tri.utils';

/**
 * L'instance du tableau de classement : ses filtres, sa requete, son tri.
 *
 * <h3>Le tri est SERVEUR, et c'est la seule facon honnete de le faire</h3>
 * <p>Chaque indicateur produit un classement PROPRE : changer de critere ne reordonne pas
 * les lignes, il recalcule le RANG de chacune, ex aequo compris. Trier dans le navigateur
 * donnerait le bon ordre avec les rangs de l'ancien critere, c'est-a-dire un tableau qui
 * se contredit lui-meme. Un clic sur un en-tete ecrit donc `tri` et `sens` dans l'URL, et
 * la requete repart.</p>
 *
 * <p>Consequence voulue : le classement affiche est partageable par simple copie du lien,
 * et il revient identique. C'est aussi ce qui permet au bouton d'acces du rapport de
 * performance de n'etre qu'un lien.</p>
 */
export function useClassementTable() {
  const [filtres, setFiltres] = useQueryStates(
    classementFiltersClient.filters,
    classementFiltersClient.options,
  );

  const params: IParamsClassement = {
    debut: filtres.debut,
    fin: filtres.fin,
    sens: filtres.sens,
    tri: filtres.tri,
    ...(filtres.groupeId ? { groupeId: filtres.groupeId } : {}),
    ...(filtres.restaurantIds.length ? { restaurantIds: filtres.restaurantIds } : {}),
    ...(filtres.restaurantId ? { restaurantId: filtres.restaurantId } : {}),
  };

  const query = useClassementQuery(params);

  /*
   * Le descripteur de tri est DERIVE de l'URL, jamais tenu en etat local. Un etat local
   * se desynchroniserait du retour arriere du navigateur : la fleche de l'en-tete
   * montrerait un critere pendant que le tableau en affiche un autre.
   */
  const descripteurTri: SortDescriptor = {
    column: COLONNE_DE_TRI[filtres.tri],
    direction: filtres.sens === 'ASC' ? 'ascending' : 'descending',
  };

  const changerTri = React.useCallback(
    (descripteur: SortDescriptor) => {
      const tri = triDeColonne(String(descripteur.column));
      if (!tri) return;

      /*
       * Premier clic sur une colonne : on prend son sens NATUREL (un montant du plus gros,
       * un nom de A a Z) plutot que le sens de la colonne precedente. Passer de « total
       * decroissant » a « nom decroissant » donnerait une liste de Z a A, que personne ne
       * demande.
       */
      const sens: SensTri =
        tri === filtres.tri
          ? descripteur.direction === 'ascending'
            ? 'ASC'
            : 'DESC'
          : sensNaturel(tri);

      void setFiltres({ sens, tri });
    },
    [filtres.tri, setFiltres],
  );

  const classement = query.data;

  return {
    changerTri,
    classement,
    colonnes: COLONNES_CLASSEMENT,
    descripteurTri,
    filtres,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    /* Jamais `?? []` sur les totaux : une absence de totaux est une absence, pas des zeros. */
    lignes: classement?.lignes ?? [],
    refetch: query.refetch,
    setFiltres,
    totaux: classement?.totaux,
  };
}
