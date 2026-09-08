'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button, Checkbox, Chip } from '@heroui-v3/react';
import { FileText, Trash2, Wallet } from 'lucide-react';
import { Can } from '@/components/auth/Can';
import { IChargeFixe, StatutChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { formatMontant } from '@/utils/format.utils';

/**
 * Le ton d'un statut de paiement.
 *
 * <p>« En attente » et « En attente DGA » étaient en ambre : ce sont les états NORMAUX
 * d'une dépense qui monte la chaîne de visa, et l'ambre y annonçait un problème qui
 * n'existe pas. « Validé DGA » était en `primary`, la couleur de MARQUE, pour une étape
 * intermédiaire. Restent le décaissé (fini), l'approuvé (décidé) et le rejeté (bloqué).</p>
 */
const STATUT_CONFIG: Record<string, { color: 'danger' | 'default' | 'success'; label: string }> = {
  APPROUVE_DG: { color: 'success', label: 'Approuvé DG' },
  DECAISSE: { color: 'success', label: 'Décaissé' },
  EN_ATTENTE_DGA: { color: 'default', label: 'En attente DGA' },
  PAID: { color: 'success', label: 'Décaissé' },
  PENDING: { color: 'default', label: 'En attente' },
  REJETE_DG: { color: 'danger', label: 'Rejeté DG' },
  REJETE_DGA: { color: 'danger', label: 'Rejeté DGA' },
  VALIDE_DGA: { color: 'default', label: 'Validé DGA' },
};

const DECAISSE_STATUTS = ['DECAISSE', 'PAID'];

export function isDecaisse(row: IChargeFixe) {
  return DECAISSE_STATUTS.includes(row.statut);
}

/** Config de statut partagée colonne (desktop) + carte mobile — pas de divergence. */
export function getPaiementStatutConfig(statut: string) {
  return STATUT_CONFIG[statut] ?? { label: statut, color: 'default' as const };
}

type PaiementsColumnsOptions = {
  onDecaisser: (id: string) => void;
  isPending: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onDeleteFixe?: (id: string) => void;
  isDeletingFixe?: boolean;
  onRapport?: (charge: IChargeFixe) => void;
};

export function createPaiementsColumns({ onDecaisser, isPending, onDelete, isDeleting, onDeleteFixe, isDeletingFixe, onRapport }: PaiementsColumnsOptions): ColumnDef<IChargeFixe>[] {
  return [
    {
      id: 'select',
      /*
       * `slot={null}` : dans un `Table` v3, la case est branchee d'office sur le contexte
       * de selection de la table, qui exige `slot="selection"` et fait tomber la page en
       * 500 sans lui. Ici la selection est celle de TanStack, sur laquelle repose le
       * decaissement par lot : on sort du contexte au lieu de changer de modele.
       *
       * Les deux libelles accessibles etaient en ANGLAIS — « Select all », « Select row » —
       * sur un ecran entierement en francais.
       */
      header: ({ table }) => (
        <Checkbox
          aria-label="Tout sélectionner"
          isIndeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          isSelected={table.getIsAllPageRowsSelected()}
          onChange={(coche) => table.toggleAllPageRowsSelected(coche)}
          slot={null}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Sélectionner ${row.original.designation}`}
          isDisabled={isDecaisse(row.original)}
          isSelected={row.getIsSelected()}
          onChange={(coche) => row.toggleSelected(coche)}
          slot={null}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'designation',
      header: 'Désignation',
      cell: ({ row }) => <span className="text-sm text-foreground">{row.getValue('designation')}</span>,
    },
    {
      id: 'categorie',
      header: 'Catégorie',
      cell: ({ row }) => <span className="text-sm text-muted">{row.original.categorie?.nomCategorie ?? '—'}</span>,
    },
    {
      accessorKey: 'montant',
      /*
       * Une colonne d'ARGENT : alignee a gauche en chasse proportionnelle, deux montants
       * de la liste ne se comparaient pas, et « 1 200 000 » sous « 950 000 » ne se lisait
       * pas comme un ordre de grandeur au-dessus. En-tete compris, faute de quoi le titre
       * flotte au-dessus d'une colonne qui, elle, est calee a droite.
       */
      header: () => <span className="block text-right">Montant</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm font-medium text-foreground tabular-nums">
          {formatMontant(row.getValue<number>('montant'))}
        </span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }) => {
        const statut = row.getValue<StatutChargeFixe>('statut');
        const config = STATUT_CONFIG[statut] ?? { label: statut, color: 'default' as const };
        return (
          <Chip color={config.color} size="sm" variant="soft">
            <Chip.Label className="whitespace-nowrap">{config.label}</Chip.Label>
          </Chip>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            {!isDecaisse(row.original) && (
              /* « Décaisser » etait un bouton AMBRE : le geste principal de la ligne,
                 peint comme un avertissement. */
              <Button
                isPending={isPending}
                onPress={() => onDecaisser(row.original.id)}
                size="sm"
                variant="primary"
              >
                <Wallet aria-hidden="true" className="size-3.5" />
                Décaisser
              </Button>
            )}
            {isDecaisse(row.original) && row.original.codeSysteme === 'MASSE_SALARIALE_NETTE' && (
              <Button onPress={() => onRapport?.(row.original)} size="sm" variant="outline">
                <FileText aria-hidden="true" className="size-3.5" />
                Rapport
              </Button>
            )}
            {onDelete && (
              <Can I="delete" a="ChargeVariable">
                <Button
                  aria-label="Supprimer la charge variable"
                  isIconOnly
                  isPending={isDeleting}
                  onPress={() => onDelete(row.original.id)}
                  size="sm"
                  variant="danger-soft"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </Button>
              </Can>
            )}
            {onDeleteFixe && (
              <Can I="delete" a="ChargeFixe">
                <Button
                  aria-label="Supprimer la dépense du mois"
                  isIconOnly
                  isPending={isDeletingFixe}
                  onPress={() => onDeleteFixe(row.original.id)}
                  size="sm"
                  variant="danger-soft"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </Button>
              </Can>
            )}
          </div>
        );
      },
    },
  ];
}

