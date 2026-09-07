'use client';

import { Pagination } from '@heroui-v3/react';
import React from 'react';

/** Nombre de pages voisines affichées de part et d'autre de la page courante. */
const VOISINES = 1;

/**
 * Les numéros à afficher, avec des trous là où la liste est repliée.
 *
 * <p>`null` marque un repli. Première et dernière page sont toujours là : ce sont les
 * deux seuls sauts qu'un opérateur fait sans réfléchir.</p>
 */
function numerosVisibles(page: number, total: number): (null | number)[] {
  // En deça, tout tient : afficher des points de suspension coûterait plus de place
  // qu'il n'en économise.
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const debut = Math.max(2, page - VOISINES);
  const fin = Math.min(total - 1, page + VOISINES);

  const numeros: (null | number)[] = [1];
  if (debut > 2) numeros.push(null);
  for (let p = debut; p <= fin; p += 1) numeros.push(p);
  if (fin < total - 1) numeros.push(null);
  numeros.push(total);
  return numeros;
}

/**
 * La pagination des tableaux de l'ERP.
 *
 * <h3>Ce qui change</h3>
 * <p>Elle était recopiée à l'identique dans quatre fichiers, sous la forme d'un
 * `<Pagination color="primary">` de la v2. Elle est montée une fois.</p>
 *
 * <p>Sa première version listait TOUTES les pages : sur un lot de paie de quarante
 * créneaux, quarante boutons sur une rangée qui débordait de l'écran. C'est d'ailleurs la
 * raison pour laquelle la grille de paiement avait gardé la pagination de la v2, avec ce
 * commentaire dans le code : « la recréer à la main perdrait les points de suspension sur
 * les longs lots ». Ils sont là.</p>
 */
export function PaginationTableau({
  onPage,
  page,
  total,
}: {
  onPage: (p: number) => void;
  page: number;
  total: number;
}) {
  if (total <= 1) return null;
  const numeros = numerosVisibles(page, total);

  return (
    <Pagination size="sm">
      <Pagination.Summary>
        Page {page} sur {total}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page === 1} onPress={() => onPage(page - 1)}>
            <Pagination.PreviousIcon />
            Précédent
          </Pagination.Previous>
        </Pagination.Item>
        {numeros.map((p, i) =>
          p === null ? (
            <Pagination.Item key={`repli-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={p}>
              <Pagination.Link isActive={p === page} onPress={() => onPage(p)}>
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next isDisabled={page === total} onPress={() => onPage(page + 1)}>
            Suivant
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
