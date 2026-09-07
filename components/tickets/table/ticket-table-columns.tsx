'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Ticket } from '@/types/bon-livraison.model';
import { formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { formatMontant } from '@/utils/format.utils';
import {
  Button,
  Spinner,
  ComboBox,
  DateField,
  DatePicker,
  Calendar,
  Input,
  ListBox,
  NumberField,
  TextField,
  TimeField,
  Tooltip,
} from '@heroui-v3/react';
import { CalendarDate, Time } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import { Check, ChevronLeft, ChevronRight, Pen, ShieldCheck, Trash2, X } from 'lucide-react';
import { SelecteurZone } from '@/features/tickets/components/selecteur-zone';
import { StatutTicket } from './statut-ticket';
import { Checkbox } from '@/components/ui/checkbox';
import { StatutControle } from '@/types/statut-controle.enum';

/** « 2026-09-04 » vers une date calendaire, sans heure ni fuseau. */
const enCalendaire = (iso: string): CalendarDate | null => {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  return a && m && j ? new CalendarDate(a, m, j) : null;
};

/** « 19h22 », « 19:22 », « 19:22:04 » ou « 1922 » vers une heure typee. */
const enHeure = (v: string): Time | null => {
  const m = (v ?? '').match(/^(\d{1,2})\s*[h:]?\s*(\d{2})/);
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  return h < 24 && min < 60 ? new Time(h, min) : null;
};

/** Une liste FILTRABLE : react-select l'etait, un menu deroulant simple ne l'est pas. */
const Liste = ({
  options,
  valeur,
  onChoix,
  invite,
}: {
  options: { value: string; label: string }[];
  valeur: string;
  onChoix: (v: string) => void;
  invite: string;
}) => (
  <ComboBox onSelectionChange={(c) => onChoix(String(c ?? ''))} selectedKey={valeur || null}>
    <ComboBox.InputGroup>
      <Input placeholder={invite} />
      <ComboBox.Trigger />
    </ComboBox.InputGroup>
    <ComboBox.Popover>
      <ListBox items={options}>
        {(o: { value: string; label: string }) => (
          <ListBox.Item id={o.value} textValue={o.label}>
            {o.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        )}
      </ListBox>
    </ComboBox.Popover>
  </ComboBox>
);

export interface TicketColumnMeta {
  livreurOptions: { value: string; label: string }[];
  restaurantOptions: { value: string; label: string }[];
  editingIds: Set<string>;
  editedTickets: Map<string, Ticket>;
  newTicketIds: Set<string>;
  permissions: { canCreate: boolean; canUpdate: boolean; canDelete: boolean; canAuthentifier: boolean; isAdmin: boolean };
  authenticatedIds: Set<string>;
  onTicketChange: (id: string, field: keyof Ticket, value: string) => void;
  onTicketPatch: (id: string, patch: Partial<Ticket>) => void;
  onSaveNew: (id: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelNew: (id: string) => void;
  onCancelEdit: (id: string) => void;
  onEditRow: (id: string) => void;
  onDeleteRow: (id: string) => void;
  onAuthentifier: (id: string) => void;
  isSavingNew: boolean;
  isSavingEdit: boolean;
  getDisplayTicket: (ticket: Ticket) => Ticket;
}

const isEditing = (ticket: Ticket, meta: TicketColumnMeta): boolean => {
  return ticket.isNew === true || meta.editingIds.has(ticket.id);
};

const isNew = (ticket: Ticket, meta: TicketColumnMeta): boolean => {
  return meta.newTicketIds.has(ticket.id);
};

export const createTicketColumns = (): ColumnDef<Ticket>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'code',
    header: 'Code Check',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <TextField
            onChange={(v) => meta.onTicketChange(ticket.id, 'code', v)}
            value={ticket.code ?? ''}
          >
            <Input autoComplete="off" placeholder="Code check" />
          </TextField>
        );
      }
      return <span className="text-xs">{ticket.code}</span>;
    },
  },
  {
    accessorKey: 'livreur',
    header: 'Livreur',
    size: 260,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <Liste
            invite="Rechercher un livreur…"
            onChoix={(v) => meta.onTicketChange(ticket.id, 'livreurId', v)}
            options={meta.livreurOptions}
            valeur={ticket.livreurId}
          />
        );
      }
      return <span className="text-xs">{ticket.livreur}</span>;
    },
  },
  {
    accessorKey: 'restaurant',
    header: 'Partner',
    size: 320,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <Liste
            invite="Rechercher un partenaire…"
            onChoix={(v) => meta.onTicketChange(ticket.id, 'restaurantId', v)}
            options={meta.restaurantOptions}
            valeur={ticket.restaurantId}
          />
        );
      }
      return <span className="text-xs">{ticket.restaurant}</span>;
    },
  },
  {
    accessorKey: 'nomZone',
    header: 'Zone',
    size: 260,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <SelecteurZone
            libelleVisible={false}
            onPatch={meta.onTicketPatch}
            restaurantId={ticket.restaurantId}
            ticketId={ticket.id}
            zoneId={ticket.zoneId}
          />
        );
      }
      /* Un nom de zone long — « ZONE 3 (Limite feu de Bernabé) | ÉGLISE MÉTHODISTE » —
         ne tient pas dans une cellule : il se tronque, et l'info-bulle rend le texte
         entier. Tooltip v3 est composite : le declencheur est l'enfant, le contenu va
         dans `Tooltip.Content`. */
      return (
        <Tooltip>
          <span className="line-clamp-2 max-w-56 text-xs">{ticket.nomZone ?? 'Inconnue'}</span>
          <Tooltip.Content>{ticket.nomZone ?? 'Zone inconnue'}</Tooltip.Content>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'montantLivraison',
    header: 'Montant de Livraison',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <NumberField
            isDisabled={!ticket.restaurantId}
            minValue={0}
            onChange={(v) =>
              meta.onTicketChange(ticket.id, 'montantLivraison', Number.isFinite(v) ? String(v) : '')
            }
            value={Number(ticket.montantLivraison) || 0}
          >
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
        );
      }
      return <span className="block text-right text-xs tabular-nums">{formatMontant(Number(ticket.montantLivraison) || 0)}</span>;
    },
  },
  {
    accessorKey: 'montantCommande',
    header: 'Montant de Commande',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <NumberField
            minValue={0}
            onChange={(v) =>
              meta.onTicketChange(ticket.id, 'montantCommande', Number.isFinite(v) ? String(v) : '')
            }
            value={Number(ticket.montantCommande) || 0}
          >
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
        );
      }
      return <span className="block text-right text-xs tabular-nums">{formatMontant(Number(ticket.montantCommande) || 0)}</span>;
    },
  },
  {
    accessorKey: 'coutLivraison',
    header: 'Commission',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        /*
         * La commission se CALCULE, elle ne se saisit pas. Le champ lisait `commission`,
         * que rien ne renseigne pendant l'edition : `applyTicketPatch` et la grille
         * tarifaire ecrivent tous deux `coutLivraison`. La case restait donc vide du debut
         * a la fin. Elle lit desormais la valeur reellement calculee, en se repliant sur
         * `commission` pour les tickets deja enregistres, qui la portent.
         */
        return (
          <TextField isReadOnly value={String(ticket.coutLivraison ?? ticket.commission ?? '')}>
            <Input placeholder="Calculée" />
          </TextField>
        );
      }
      return <span className="block text-right text-xs tabular-nums">{formatMontant(Number(ticket?.commission ?? 0) || 0)}</span>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <DatePicker
            onChange={(d: DateValue | null) => meta.onTicketChange(ticket.id, 'date', d ? d.toString() : '')}
            value={enCalendaire(ticket.date)}
          >
            <DateField.Group>
              <DateField.Input>
                {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                  <DateField.Segment segment={segment} />
                )}
              </DateField.Input>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar>
                <Calendar.Header>
                  <Calendar.NavButton slot="previous">
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </Calendar.NavButton>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="next">
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Calendar.NavButton>
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(jour: string) => <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date: CalendarDate) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        );
      }
      return <span className="text-xs">{formatDateFR(ticket.date)}</span>;
    },
  },
  {
    accessorKey: 'heure',
    header: 'Heure',
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);
      if (isEditing(ticket, meta)) {
        return (
          <TimeField
            onChange={(h: Time | null) =>
              meta.onTicketChange(
                ticket.id,
                'heure',
                h ? `${String(h.hour).padStart(2, '0')}:${String(h.minute).padStart(2, '0')}` : '',
              )
            }
            value={enHeure(ticket.heure)}
          >
            <TimeField.Group>
              <TimeField.Input>
                {(segment: React.ComponentProps<typeof TimeField.Segment>['segment']) => (
                  <TimeField.Segment segment={segment} />
                )}
              </TimeField.Input>
            </TimeField.Group>
          </TimeField>
        );
      }
      return <span className="text-xs">{formatHoursMinutes(ticket.heure)}</span>;
    },
  },
  {
    id: 'statut',
    header: 'Statut',
    enableSorting: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = row.original;
      const isNouveau = meta.newTicketIds.has(ticket.id);
      const optimisticAuthentifie = meta.authenticatedIds.has(ticket.id);
      const effectiveStatut = optimisticAuthentifie ? 'AUTHENTIFIE' : (ticket.statutControle ?? 'PENDING');
      const canAuthentifier = !isNouveau && meta.permissions.canAuthentifier && (effectiveStatut === 'PENDING' || effectiveStatut === 'TARDIF');

      return (
        <div className="flex items-center gap-2">
          <StatutTicket statut={effectiveStatut} />
          {canAuthentifier && (
            <Tooltip>
              <Button
                aria-label="Authentifier ce ticket"
                isIconOnly
                onPress={() => meta.onAuthentifier(ticket.id)}
                size="sm"
                variant="secondary"
              >
                <ShieldCheck aria-hidden="true" className="size-4" />
              </Button>
              <Tooltip.Content>Authentifier ce ticket</Tooltip.Content>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  {
    id: 'createdByUser',
    header: 'Créé par',
    enableSorting: false,
    cell: ({ row }) => {
      const u = row.original.createdByUser;
      return <span className="text-xs">{u ? `${u.prenoms} ${u.nom}` : '—'}</span>;
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketColumnMeta;
      const ticket = meta.getDisplayTicket(row.original);

      /*
       * Les actions etaient six `<button>` bruts, chacun avec sa couleur ecrite en dur
       * — vert, rouge, bleu — sans variante sombre et sans libelle accessible. Elles
       * passent aux boutons de la bibliotheque : `primary` pour confirmer, `ghost` pour
       * annuler ou modifier, `danger-soft` pour supprimer. L'attente se dit par
       * `isPending`, ce qui evite un rond qui tourne pose a la main.
       */

      // Nouveau ticket, pas encore enregistre.
      if (isNew(ticket, meta)) {
        return (
          <div className="flex gap-1">
            <Button
              aria-label="Enregistrer ce ticket"
              isIconOnly
              isPending={meta.isSavingNew}
              onPress={() => meta.onSaveNew(ticket.id)}
              size="sm"
              variant="primary"
            >
              {meta.isSavingNew ? <Spinner color="current" size="sm" /> : <Check aria-hidden="true" className="size-4" />}
            </Button>
            <Button
              aria-label="Abandonner cette ligne"
              isIconOnly
              onPress={() => meta.onCancelNew(ticket.id)}
              size="sm"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        );
      }

      // Ticket existant, en cours de modification.
      if (meta.editingIds.has(ticket.id)) {
        return (
          <div className="flex gap-1">
            <Button
              aria-label="Enregistrer les modifications"
              isDisabled={!meta.permissions.canUpdate}
              isIconOnly
              isPending={meta.isSavingEdit}
              onPress={() => meta.onSaveEdit(ticket.id)}
              size="sm"
              variant="primary"
            >
              {meta.isSavingEdit ? <Spinner color="current" size="sm" /> : <Check aria-hidden="true" className="size-4" />}
            </Button>
            <Button
              aria-label="Annuler les modifications"
              isIconOnly
              onPress={() => meta.onCancelEdit(ticket.id)}
              size="sm"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        );
      }

      // Ticket existant, en lecture.
      if (meta.permissions.canUpdate) {
        const MODIFIABLE_STATUTS = new Set<string>([
          StatutControle.PENDING,
          StatutControle.TARDIF,
          StatutControle.REJETE_FRAUDE,
        ]);
        const originalStatut = row.original.statutControle;
        const canMutate = !originalStatut || MODIFIABLE_STATUTS.has(originalStatut);
        // L'admin/direction peut MODIFIER ou SUPPRIMER un ticket quel que soit son statut
        // (V2 inclus, ex. corriger le restaurant lie) ; les autres roles restent limites
        // aux statuts non figes.
        const canEdit = meta.permissions.isAdmin || canMutate;
        /*
         * `meta.permissions.canDelete` etait renseigne puis jamais lu : tout le bloc
         * lecture etait garde par `canUpdate`, et la corbeille de ligne s'affichait pour
         * des roles qui n'ont pas `delete` sur `Ticket`. Ces comptes voyaient la corbeille
         * active sur chaque ligne alors que le bouton Supprimer de la barre du bas, lui,
         * leur etait grise. Le droit compte desormais, comme pour la suppression en masse.
         */
        const canDelete = meta.permissions.canDelete && (meta.permissions.isAdmin || canMutate);

        return (
          <div className="flex gap-1">
            <Tooltip>
              {/* Un bouton natif DESACTIVE n'emet ni survol ni focus : l'info-bulle ne
                  s'ouvrait donc jamais, et c'est precisement quand le bouton est grise
                  que son motif de blocage doit se lire. Le declencheur, lui, n'est pas
                  desactive et porte l'evenement a sa place. */}
              <Tooltip.Trigger>
                <Button
                  aria-label="Modifier ce ticket"
                  isDisabled={!canEdit}
                  isIconOnly
                  onPress={() => meta.onEditRow(ticket.id)}
                  size="sm"
                  variant="ghost"
                >
                  <Pen aria-hidden="true" className="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {canEdit ? 'Modifier ce ticket' : "Ce ticket n'est pas modifiable"}
              </Tooltip.Content>
            </Tooltip>
            <Tooltip>
              {/* Un bouton natif DESACTIVE n'emet ni survol ni focus : l'info-bulle ne
                  s'ouvrait donc jamais, et c'est precisement quand le bouton est grise
                  que son motif de blocage doit se lire. Le declencheur, lui, n'est pas
                  desactive et porte l'evenement a sa place. */}
              <Tooltip.Trigger>
                <Button
                  aria-label="Supprimer ce ticket"
                  isDisabled={!canDelete}
                  isIconOnly
                  onPress={() => meta.onDeleteRow(ticket.id)}
                  size="sm"
                  variant="danger-soft"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {canDelete ? 'Supprimer ce ticket' : "Ce ticket n'est pas supprimable"}
              </Tooltip.Content>
            </Tooltip>
          </div>
        );
      }

      return null;
    },
  },
];
