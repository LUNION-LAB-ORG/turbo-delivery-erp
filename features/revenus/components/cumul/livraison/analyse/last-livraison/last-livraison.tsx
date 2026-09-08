'use client';

import { Card } from '@heroui-v3/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';

import { ILivraison } from '@/features/revenus/types/livraison.types';
import { formatMontant } from '@/utils/format.utils';

interface LastLivraisonProps {
  lastlivraisons?: ILivraison[];
}

function formatDateHeure(dateString: string) {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    // Une date illisible se rend telle quelle : elle reste une information, la remplacer
    // par du vide ferait croire a une livraison sans horodatage.
    return dateString;
  }
}

/**
 * Les livraisons du mois en cours, la plus rentable d'abord a l'oeil.
 *
 * <h3>Ce qui change</h3>
 * <p>Le bloc s'intitulait « Investissements du mois courant » et comptait des
 * « investissement(s) » : il n'a jamais montre que des LIVRAISONS. Le libelle etait
 * simplement FAUX, et il cotoyait le module Investissements de la meme page, ou le mot a
 * un tout autre sens.</p>
 *
 * <p>Les montants portaient eux aussi deux etiquettes fausses : « Cout » sur le total de
 * la commande, et « commission » sur les FRAIS DE LIVRAISON, alors que le total du pied
 * additionnait, lui, le champ `commission`, un chiffre qui n'apparaissait nulle part
 * dans la liste. Le total etait donc invérifiable a l'oeil. Chaque valeur porte
 * desormais le nom de son champ, et la commission de chaque ligne est visible.</p>
 *
 * <p>La liste defilait TOUTE SEULE, une carte par seconde, en boucle : sur des chiffres
 * d'argent, un operateur ne peut ni finir de lire une ligne, ni comparer deux lignes, ni
 * revenir sur celle qui vient de passer. Le carrousel (embla, une bibliotheque de plus)
 * laisse place a une liste qu'on parcourt soi-meme, ou toutes les lignes sont atteignables
 * et alignees les unes sous les autres.</p>
 */
export default function LastLivraison({ lastlivraisons }: LastLivraisonProps) {
  const livraisonsMoisCourant = useMemo(() => {
    if (!lastlivraisons) return [];

    const maintenant = new Date();
    const moisCourant = maintenant.getMonth();
    const anneeCourante = maintenant.getFullYear();

    return lastlivraisons.filter((livraison) => {
      const dateLivraison = new Date(livraison.createdAt);
      return (
        dateLivraison.getMonth() === moisCourant && dateLivraison.getFullYear() === anneeCourante
      );
    });
  }, [lastlivraisons]);

  const totalCommission = useMemo(
    () => livraisonsMoisCourant.reduce((somme, l) => somme + (l.commission ?? 0), 0),
    [livraisonsMoisCourant],
  );

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title>Livraisons du mois en cours</Card.Title>
      </Card.Header>

      <Card.Content className="p-0">
        {livraisonsMoisCourant.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Aucune livraison enregistrée ce mois-ci.
          </p>
        ) : (
          <ul className="max-h-96 divide-y divide-separator overflow-y-auto">
            {livraisonsMoisCourant.map((livraison) => (
              <li
                className="flex items-start justify-between gap-4 px-4 py-3"
                key={`${livraison.commandeId}-${livraison.createdAt}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {livraison.nomLivreur}
                  </p>
                  <p className="truncate text-xs text-muted">{livraison.nomRestaurant}</p>
                  <p className="text-xs tabular-nums text-muted">
                    {formatDateHeure(livraison.createdAt)}
                  </p>
                </div>

                {/* La commission est ce que la societe GAGNE sur la course : c'est elle
                    qu'on aligne en gros, et elle seule qui s'additionne dans le pied. Le
                    cout et les frais restent en dessous, a la meme place sur chaque ligne,
                    pour qu'une colonne de chiffres se compare sans relire les libelles. */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatMontant(livraison.commission)}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    Coût {formatMontant(livraison.totalAmount)}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    Frais {formatMontant(livraison.fraisLivraison)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>

      <Card.Footer className="flex items-center justify-between gap-3 border-t border-separator">
        <span className="text-sm text-muted">
          {livraisonsMoisCourant.length} livraison{livraisonsMoisCourant.length > 1 ? 's' : ''} ce
          mois
        </span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          Commissions : {formatMontant(totalCommission)}
        </span>
      </Card.Footer>
    </Card>
  );
}
