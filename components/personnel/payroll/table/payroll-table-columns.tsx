'use client';

import { Button, Chip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { IPayroll } from '@/features/personnel/types/payroll.types';

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date && isValid(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }

  return null;
};

const formatDateFr = (value: unknown, dateFormat = 'dd MMM yyyy'): string => {
  const date = toDate(value);
  return date ? format(date, dateFormat, { locale: fr }) : '-';
};

export const formatCfa = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export { formatDateFr };

/**
 * Une colonne d'argent.
 *
 * <p>Les quatre colonnes de francs de cet ecran se lisaient calees a GAUCHE, et trois
 * d'entre elles en chasse proportionnelle : deux montants du meme ordre de grandeur
 * n'avaient ni la meme largeur ni le meme point de depart, et un salaire brut ne se
 * comparait pas d'un coup d'oeil au net qui en decoule. Toutes quatre sont desormais en
 * chasse tabulaire, alignees a droite.</p>
 */
const CelluleMontant = ({ epais, montant }: { epais?: boolean; montant: number }) => (
  <span className={`block text-right tabular-nums ${epais ? 'font-semibold' : ''}`}>
    {formatCfa(montant)}
  </span>
);

/**
 * L'en-tete d'une colonne d'argent.
 *
 * <p>Le tableau enveloppe chaque en-tete dans le bandeau triable de la bibliotheque, une
 * boite en `flex` occupant toute la cellule : `ml-auto` y pousse le libelle du cote des
 * chiffres. Sans lui, l'intitule reste a gauche pendant que la colonne se lit a droite,
 * et l'oeil ne sait plus quel nombre appartient a quel titre.</p>
 */
const enTeteNombre = (libelle: string) => () => <span className="ml-auto text-right">{libelle}</span>;

type TonPaie = 'danger' | 'default' | 'success';

/**
 * Le ton d'un statut de bulletin.
 *
 * <p>« En attente » était peint en ambre : c'est pourtant l'état NORMAL d'un bulletin
 * du mois en cours, et l'ambre y annonçait un problème qui n'existe pas. Reste ce qui
 * dit vraiment quelque chose : payé (bon), annulé (défait).</p>
 */
export const getStatusTon = (status: string): TonPaie => {
  const normalized = status?.toUpperCase?.() || '';
  if (normalized.includes('PAID') || normalized.includes('PAYE')) return 'success';
  if (normalized.includes('CANCEL')) return 'danger';
  return 'default';
};

/**
 * Le salaire est-il versé.
 *
 * <p>C'était binaire vert/ROUGE : un salaire pas encore versé le 3 du mois s'affichait
 * en rouge sur toute la colonne, comme un impayé. Non versé n'est pas une faute, c'est
 * l'état de départ.</p>
 */
export const getSalaryStatusTon = (status: string): TonPaie =>
  status === 'PAID' ? 'success' : 'default';

/** La pastille de statut, montée une fois pour la colonne et pour la carte tactile. */
export const ChipStatutPaie = ({ statut, ton }: { statut: string; ton: TonPaie }) => (
  <Chip color={ton} size="sm" variant="soft">
    <Chip.Label className="whitespace-nowrap capitalize">{statut || '-'}</Chip.Label>
  </Chip>
);

export const createPayrollTableColumns = (onPayClick?: (payroll: IPayroll) => void): ColumnDef<IPayroll>[] => [
  {
    accessorKey: 'name',
    header: 'Employé',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name || '-'}</span>
        <span className="text-xs text-muted">{row.original.email || '-'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'position',
    header: 'Poste',
    cell: ({ row }) => <span>{row.original.position || '-'}</span>,
  },
  {
    accessorKey: 'department',
    header: 'Département',
    cell: ({ row }) => <span>{row.original.department || '-'}</span>,
  },
  {
    accessorKey: 'salaryBrut',
    header: enTeteNombre('Salaire brut'),
    cell: ({ row }) => <CelluleMontant epais montant={row.original.salaryBrut} />,
  },
  {
    accessorKey: 'totalDeductionsPending',
    header: enTeteNombre('Déductions en attente'),
    /* L'ambre peignait ici une CATEGORIE, pas un retard : une deduction en attente est
       l'etat de depart de toute deduction du mois en cours. */
    cell: ({ row }) => <CelluleMontant montant={row.original.totalDeductionsPending} />,
  },
  {
    accessorKey: 'totalDeductionsPaid',
    header: enTeteNombre('Déductions payées'),
    /* Un montant deduit n'est pas une bonne nouvelle : le vert n'y disait rien. */
    cell: ({ row }) => <CelluleMontant montant={row.original.totalDeductionsPaid} />,
  },
  {
    accessorKey: 'netToPay',
    /* L'en-tete du tableau perdait l'accent grave du mot « a », que la carte tactile
       du meme ecran portait : deux orthographes pour la meme colonne. */
    header: enTeteNombre('Net à payer'),
    cell: ({ row }) => <CelluleMontant epais montant={row.original.netToPay} />,
  },
  {
    accessorKey: 'salary_status',
    header: 'Statut paiement',
    cell: ({ row }) => (
      <ChipStatutPaie
        statut={row.original.salary_status === 'PAID' ? 'Payé' : 'Non payé'}
        ton={getSalaryStatusTon(row.original.salary_status)}
      />
    ),
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => (
      <ChipStatutPaie statut={row.original.statut} ton={getStatusTon(row.original.statut)} />
    ),
  },
  {
    accessorKey: 'entryDate',
    header: 'Date entrée',
    cell: ({ row }) => <span>{formatDateFr(row.original.entryDate)}</span>,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Dernière maj',
    cell: ({ row }) => <span>{formatDateFr(row.original.updatedAt, 'dd MMM yyyy HH:mm')}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    /*
     * LE BOUTON DE PAIEMENT ECOUTE `onPress`.
     *
     * <p>Il venait de shadcn et ecoutait `onClick`, que le `Button` de la v3 ignore EN
     * SILENCE : repris tel quel, il se serait affiche, survole et enfonce sans jamais
     * declencher le paiement. Meme chose pour `disabled`, devenu `isDisabled` : un
     * bulletin deja paye redevenait payable.</p>
     */
    cell: ({ row }) => (
      <Button
        isDisabled={row.original.salary_status === 'PAID'}
        onPress={() => onPayClick?.(row.original)}
        size="sm"
        variant={row.original.salary_status === 'PAID' ? 'outline' : 'primary'}
      >
        {row.original.salary_status === 'PAID' ? 'Payé' : 'Payer'}
      </Button>
    ),
  },
];
