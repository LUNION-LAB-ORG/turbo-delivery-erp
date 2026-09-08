'use client';

import { Button, Chip, Dropdown } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, isValid } from 'date-fns';
import { MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useChangeStatusMutation, useSupprimerEmployeMutation } from '@/features/personnel/mutations/employee.mutation';
import { IEmployee } from '@/features/personnel/types/types';
import { useAbility } from '@/hooks/use-ability';

/**
 * Le ton du statut d'un employé.
 *
 * <p>C'étaient trois badges PLEINS et saturés : vert `600`, jaune `500`, et pour
 * « Inactif » la couleur de MARQUE, `bg-primary`. Trois pastilles pleines par ligne sur
 * cinquante lignes, dont une qui empruntait le rouge de l'entreprise pour dire « ce
 * compte ne sert plus ». Un employé inactif n'est pas une alerte, c'est une absence
 * d'activité : le neutre le dit. Un congé, lui, se remarque, c'est une personne qu'on
 * ne peut pas affecter aujourd'hui.</p>
 */
export const getEmployeeStatutTon = (
  statut: IEmployee['statut'],
): 'danger' | 'default' | 'success' | 'warning' => {
  switch (statut) {
    case 'Actif':
      return 'success';
    case 'Congé':
      return 'warning';
    default:
      return 'default';
  }
};

/** La pastille de statut, montée une fois pour la colonne et pour la carte tactile. */
export const ChipStatutEmploye = ({ statut }: { statut: IEmployee['statut'] }) => (
  <Chip color={getEmployeeStatutTon(statut)} size="sm" variant="soft">
    <Chip.Label>{statut}</Chip.Label>
  </Chip>
);

/** Un fait de la fiche, dans la fenetre de suppression. */
const LigneFiche = ({ libelle, valeur }: { libelle: string; valeur?: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-0.5">
    <span className="shrink-0 text-xs text-muted">{libelle}</span>
    <span className="truncate text-right text-sm text-foreground">{valeur || '-'}</span>
  </div>
);

interface GesteEmploye {
  Icone: typeof Pencil;
  danger?: boolean;
  id: string;
  libelle: string;
  onAction: () => void;
}

/**
 * Les gestes sur un employe : modifier, basculer l'activite, supprimer.
 *
 * <h3>Ce qui change</h3>
 * <p>Le menu venait de shadcn, et chacun de ses trois articles enveloppait un `div`
 * portant le vrai `onClick` : le clic ne partait donc que du texte, jamais de la bande
 * complete de l'article, et l'article annulait sa propre selection
 * (`onSelect preventDefault`) pour que le `div` puisse agir. Le geste tient maintenant
 * sur l'article, ou le clavier le trouve aussi.</p>
 *
 * <p>La fenetre de confirmation etait IMBRIQUEE dans l'article de menu : un dialogue
 * enfant d'un article de liste, ouvert par un `div` cliquable peint `text-red-600` sans
 * variante sombre, et dont le bouton d'action portait `bg-red-600 hover:bg-red-700` a la
 * main. Elle sort du menu et passe a la fenetre commune, dont la variante `destructif`
 * porte deja la couleur du geste.</p>
 *
 * <p>Sans aucun droit, le menu s'ouvrait VIDE. Il ne s'affiche plus.</p>
 */
export const EmployeeActions = React.memo(
  ({
    employee,
    onEdit,
    onDeactivate,
    onRemove,
  }: {
    employee: IEmployee;
    onEdit: (employee: IEmployee) => void;
    onDeactivate: (employee: IEmployee) => void;
    onRemove: (employee: IEmployee) => void;
  }) => {
    const supprimerEmployeMutation = useSupprimerEmployeMutation();
    const changeStatusMutation = useChangeStatusMutation();
    const ability = useAbility();
    const canUpdate = ability.can('update', 'Personnel');
    const canDelete = ability.can('delete', 'Personnel');
    const [suppressionOuverte, setSuppressionOuverte] = useState(false);

    const estActif = employee.statut === 'Actif';

    const handleDeactivate = () => {
      changeStatusMutation.mutate({
        id: employee.id,
        status: estActif ? 'Inactif' : 'Actif',
      });

      onDeactivate(employee);
    };

    const handleDeleteConfirm = () => {
      supprimerEmployeMutation.mutate(employee.id, {
        onSuccess: () => {
          setSuppressionOuverte(false);
          onRemove(employee);
        },
      });
    };

    const gestes: GesteEmploye[] = [];
    if (canUpdate) {
      gestes.push({
        Icone: Pencil,
        id: 'modifier',
        libelle: 'Modifier',
        onAction: () => onEdit(employee),
      });
      gestes.push({
        Icone: estActif ? PowerOff : Power,
        id: 'basculer',
        libelle: estActif ? 'Désactiver' : 'Activer',
        onAction: handleDeactivate,
      });
    }
    if (canDelete) {
      gestes.push({
        Icone: Trash2,
        danger: true,
        id: 'supprimer',
        libelle: 'Supprimer',
        onAction: () => setSuppressionOuverte(true),
      });
    }

    if (gestes.length === 0) return null;

    return (
      <>
        {/*
         * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` est enfant DIRECT du
         * `Dropdown`, faute de quoi on obtient un bouton dans un bouton.
         */}
        <Dropdown>
          <Button aria-label={`Actions sur ${employee.name}`} isIconOnly size="sm" variant="ghost">
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu aria-label={`Actions sur ${employee.name}`}>
              {gestes.map((geste) => (
                <Dropdown.Item
                  className={geste.danger ? 'text-danger-soft-foreground' : undefined}
                  id={geste.id}
                  key={geste.id}
                  onAction={geste.onAction}
                  textValue={geste.libelle}
                >
                  <geste.Icone aria-hidden="true" className="size-4" />
                  {geste.libelle}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <FenetreAction
          destructif
          enAttente={supprimerEmployeMutation.isPending}
          libelleAction="Supprimer"
          onAction={handleDeleteConfirm}
          onFermer={() => setSuppressionOuverte(false)}
          ouvert={suppressionOuverte}
          titre="Confirmer la suppression"
        >
          <p className="text-sm text-muted">
            Supprimer l&#39;employé{' '}
            <span className="font-semibold text-foreground">{employee.name}</span> ?
          </p>

          {/* La fiche etait dans un `div` INTERIEUR au paragraphe de description : un bloc
              dans un `<p>`, que le navigateur ferme d'office. Elle est a cote. */}
          <div className="rounded-lg border border-separator bg-surface-secondary px-3 py-2">
            <LigneFiche libelle="Email" valeur={employee.email} />
            <LigneFiche libelle="Poste" valeur={employee.position} />
            <LigneFiche libelle="Département" valeur={employee.department} />
          </div>

          <p className="text-sm text-danger-soft-foreground">
            Cette action est irréversible et supprimera définitivement toutes les données
            associées.
          </p>
        </FenetreAction>
      </>
    );
  },
);

EmployeeActions.displayName = 'EmployeeActions';

const formaterSalaire = (montant: number): string =>
  new Intl.NumberFormat('fr-FR', {
    currency: 'XOF',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(montant || 0);

export const employeeColumns: ColumnDef<IEmployee>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Nom & Email',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted">{row.original.email}</div>
      </div>
    ),
    enableSorting: true,
  },
  {
    id: 'position',
    accessorKey: 'position',
    header: 'Poste',
    cell: ({ row }) => row.original.position,
    enableSorting: false,
  },
  {
    id: 'department',
    accessorKey: 'department',
    header: 'Département',
    cell: ({ row }) => row.original.department,
    enableSorting: false,
  },
  {
    id: 'salary',
    accessorKey: 'salary',
    /* Le bandeau triable est une boite `flex` pleine largeur : `ml-auto` amene l'intitule
       au-dessus des chiffres, qui se lisent a droite. */
    header: () => <span className="ml-auto text-right">Salaire</span>,
    /* Une colonne d'argent se lit de haut en bas : chasse tabulaire, alignee a droite. */
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">{formaterSalaire(row.original.salary)}</span>
    ),
    enableSorting: true,
  },
  {
    id: 'statut',
    accessorKey: 'statut',
    header: 'Statut',
    cell: ({ row }) => {
      return <ChipStatutEmploye statut={row.original.statut} />;
    },
    enableSorting: false,
  },
  {
    id: 'entryDate',
    accessorKey: 'entryDate',
    header: "Date d'entrée",
    /* Une date absente faisait lever `format` : la ligne, et avec elle la page, tombait. */
    cell: ({ row }) => {
      const date = new Date(row.original.entryDate);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : '-';
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      // Accéder aux callbacks depuis le meta du tableau
      const meta = table.options.meta as any;

      return <EmployeeActions employee={row.original} onEdit={meta?.onEdit} onDeactivate={meta?.onDeactivate} onRemove={meta?.onRemove} />;
    },
    enableSorting: false,
  },
];
