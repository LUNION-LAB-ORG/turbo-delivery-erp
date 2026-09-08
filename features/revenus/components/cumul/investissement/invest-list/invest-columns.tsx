'use client';

import { Button, Dropdown, Label } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { differenceInDays } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

import { IInvestissement } from '@/features/revenus/types/revenus.types';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';

import { InvestDetailModal } from './invest-detail-modal';
import { ModifierInvestModal } from '../modifier/modifier-invest-modal';
import SupprimerInvestModal from '../supprimer/supprimer-invest-modal';

/**
 * La couleur d'une echeance, partagee par la colonne et la carte tactile.
 *
 * <p>C'etait `text-red-600`, `text-orange-600`, `text-green-600` : de la palette brute,
 * identique dans les deux themes. Ces classes passent par les jetons, qui portent le mode
 * sombre.</p>
 *
 * <p>Le vert a disparu : il peignait l'etat NORMAL, celui de la plupart des lignes, et une
 * colonne entierement verte ne distingue plus rien. La couleur ne marque que ce qui appelle
 * un geste : l'echeance passee ou proche. La date, elle, reste lisible dans tous les cas.</p>
 */
export const getDeadlineColor = (deadline: string): string => {
  const daysUntilDeadline = differenceInDays(new Date(deadline), new Date());

  if (daysUntilDeadline < 7) return 'font-bold text-danger-soft-foreground';
  if (daysUntilDeadline < 30) return 'font-semibold text-warning-soft-foreground';
  return 'text-foreground';
};

type Geste = 'details' | 'modifier' | 'supprimer';

/**
 * Les trois gestes d'une ligne d'investissement.
 *
 * <h3>Ce qui change</h3>
 * <p>Chaque element du menu contenait une fenetre COMPLETE, avec son propre declencheur :
 * un `<button>` nu place a l'interieur de l'element de menu. Un element interactif dans un
 * autre element interactif n'a pas de comportement defini : le clavier n'atteignait le
 * bouton interne sur aucun des trois, et il fallait un `onSelect={(e) => e.preventDefault()}`
 * sur chaque element pour empecher le menu de se fermer avant l'ouverture de la fenetre.</p>
 *
 * <p>Ici le menu ne porte que des libelles, et c'est la LIGNE qui ouvre la fenetre choisie.
 * Le meme composant sert au tableau et aux cartes tactiles, qui recopiaient ce montage a
 * l'identique, donc deux fois la meme correction a faire, ou a oublier.</p>
 */
export function ActionsInvestissement({ investissement }: { investissement: IInvestissement }) {
  const [geste, setGeste] = useState<Geste | null>(null);

  return (
    <>
      <Dropdown>
        <Button
          aria-label={`Actions sur l'investissement de ${investissement.nomInvestisseur}`}
          isIconOnly
          size="sm"
          variant="ghost"
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu onAction={(cle) => setGeste(cle as Geste)}>
            <Dropdown.Item id="details" textValue="Voir détails">
              <Label>Voir détails</Label>
            </Dropdown.Item>
            <Dropdown.Item id="modifier" textValue="Modifier">
              <Label>Modifier</Label>
            </Dropdown.Item>
            <Dropdown.Item id="supprimer" textValue="Supprimer" variant="danger">
              <Label>Supprimer</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <InvestDetailModal
        investissement={investissement}
        onFermer={() => setGeste(null)}
        ouvert={geste === 'details'}
      />
      <ModifierInvestModal
        investissement={investissement}
        onFermer={() => setGeste(null)}
        ouvert={geste === 'modifier'}
      />
      <SupprimerInvestModal
        investissement={investissement}
        onFermer={() => setGeste(null)}
        ouvert={geste === 'supprimer'}
      />
    </>
  );
}

/**
 * Les colonnes qui portent un NOMBRE.
 *
 * <p>Un montant se compare d'une ligne a l'autre : chasse tabulaire et alignement a droite,
 * sans quoi les milliers ne tombent pas les uns sous les autres et l'oeil doit relire chaque
 * chiffre. Le tableau lit cette liste pour habiller l'en-tete ET la cellule, qui sont rendus
 * a deux endroits differents.</p>
 */
export const COLONNES_NOMBRE: readonly string[] = ['montant'];

export const investissementColumns: ColumnDef<IInvestissement>[] = [
  {
    accessorKey: 'dateInvestissement',
    cell: (info) => (
      <span className="font-medium tabular-nums">{formatDateFR(info.getValue() as string)}</span>
    ),
    header: 'Date',
  },
  {
    accessorKey: 'nomInvestisseur',
    // Le nom portait `rounded-full px-2 py-1` : le dessin d'une pastille, sans fond ni
    // bordure, donc rien qu'un decalage horizontal qui desalignait la colonne.
    cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
    header: 'Investisseur',
  },
  {
    accessorKey: 'montant',
    cell: (info) => formatCFA(info.getValue() as number),
    header: 'Montant du prêt',
  },
  {
    accessorKey: 'deadline',
    cell: (info) => {
      const deadline = info.getValue() as string;
      return <span className={`tabular-nums ${getDeadlineColor(deadline)}`}>{formatDateFR(deadline)}</span>;
    },
    header: 'Échéance',
  },
  {
    accessorKey: 'actions',
    cell: (info) => (
      <div className="text-center">
        <ActionsInvestissement investissement={info.row.original} />
      </div>
    ),
    enableSorting: false,
    header: 'Actions',
  },
];
