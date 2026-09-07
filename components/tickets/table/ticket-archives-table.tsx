'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Spinner,
  ComboBox,
  Table,
  Tooltip,
  Input as InputV3,
  Label,
  ListBox,
  SearchField,
} from '@heroui-v3/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { toast } from 'sonner';
import { ArchiveRestore, X } from 'lucide-react';

import ConfirmModal from '@/components/ui/confirm-modal';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { useAbility } from '@/hooks/use-ability';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useTicketArchivesInfiniteQuery } from '@/features/tickets/queries/ticket-archives.query';
import { useRestaurerArchives } from '@/features/tickets/queries/tickets.mutation';
import { IArchiveBonLivraisonVm } from '@/features/tickets/types/tickets.type';
import { ticketArchivesColumns, TicketArchivesColumnMeta } from './ticket-archives-columns';
import EtatErreur from '@/components/commons/EtatErreur';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';

interface TicketArchivesTableProps {
  restaurantOptions: { value: string; label: string }[];
  livreurOptions: { value: string; label: string }[];
}

/** Aucun filtre pose : la liste montre tout. */
const TOUS = '__tous__';

export function TicketArchivesTable({ restaurantOptions, livreurOptions }: TicketArchivesTableProps) {
  const ability = useAbility();
  const canRestore = ability.can('update', 'Ticket');

  const [numero, setNumero] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [livreurId, setLivreurId] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const zoneArchivesRef = useRef<HTMLDivElement>(null);
  const hauteurArchives = useHauteurDisponible(zoneArchivesRef);

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);

  const archivesQuery = useTicketArchivesInfiniteQuery({
    numero: numero || undefined,
    restaurantId: restaurantId || undefined,
    livreurId: livreurId || undefined,
  });

  const archives = useMemo<IArchiveBonLivraisonVm[]>(
    () => archivesQuery.data?.pages.flatMap((p) => p.content) ?? [],
    [archivesQuery.data],
  );
  const totalItems = archivesQuery.data?.pages[0]?.totalElements ?? 0;

  const observerTarget = useInfiniteScroll(archivesQuery.fetchNextPage, archivesQuery.hasNextPage ?? false);
  // Sentinelle dédiée aux cartes mobile (le sentinel desktop est masqué < md et n'intersecte jamais)
  const observerTargetMobile = useInfiniteScroll(archivesQuery.fetchNextPage, archivesQuery.hasNextPage ?? false);

  const restaurerMutation = useRestaurerArchives(
    // Sur succes seulement : la selection se vide et la modale se ferme.
    () => {
      setRowSelection({});
      setConfirmIds(null);
    },
    /*
     * Dans TOUS les cas : l'attente s'arrete. Elle etait remise a zero dans le seul
     * rappel de succes, donc sur echec le bouton tournait indefiniment et la modale
     * restait ouverte, sans que rien n'annonce l'echec ni ne rende la main. La modale
     * reste ouverte apres un echec, mais operable : on peut reessayer ou fermer.
     */
    () => setRestoringId(null),
  );

  const handleRestoreRow = useCallback((commandeId: string) => {
    setConfirmIds([commandeId]);
  }, []);

  const tableMeta: TicketArchivesColumnMeta = useMemo(
    () => ({ onRestoreRow: handleRestoreRow, isRestoringId: restoringId, canRestore }),
    [handleRestoreRow, restoringId, canRestore],
  );

  const table = useReactTable({
    data: archives,
    columns: ticketArchivesColumns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    meta: tableMeta,
    getRowId: (row) => row.commandeId,
  });

  const selectedIds = useMemo(
    () => table.getFilteredSelectedRowModel().rows.map((r) => r.original.commandeId),
    [table, rowSelection],
  );

  const handleBulkRestore = useCallback(() => {
    if (selectedIds.length === 0) {
      toast.warning('Aucune ligne sélectionnée');
      return;
    }
    setConfirmIds(selectedIds);
  }, [selectedIds]);

  const handleConfirmRestore = useCallback(() => {
    if (!confirmIds || confirmIds.length === 0) return;
    if (confirmIds.length === 1) setRestoringId(confirmIds[0]);
    restaurerMutation.mutate(confirmIds);
  }, [confirmIds, restaurerMutation]);

  const colsCount = table.getAllColumns().length;

  // Sans motif affiche, un bouton grise par le role passe pour un bug cote operateur.
  // On nomme la cause bloquante, le droit d'abord ; la restauration en cours a son spinner.
  const motifRestaurationBloquee = !canRestore
    ? 'Votre rôle ne permet pas de restaurer un ticket archivé'
    : selectedIds.length === 0
      ? 'Sélectionnez au moins un ticket à restaurer'
      : '';

  return (
    <div className="p-4">
      <div className="mb-6">
        {/* Memes composants que l'onglet « Tous les tickets » : deux listes FILTRABLES et
            un champ de recherche effacable. react-select apportait ses propres couleurs,
            qui ignorent le theme sombre, et une bibliotheque de plus a charger. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SearchField fullWidth onChange={setNumero} value={numero}>
            <Label>Code check</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Rechercher un code…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <ComboBox
            onSelectionChange={(c) => setLivreurId(c === TOUS ? '' : String(c ?? ''))}
            selectedKey={livreurId || TOUS}
          >
            <Label>Livreur</Label>
            <ComboBox.InputGroup>
              <InputV3 placeholder="Tous les livreurs" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={[{ value: TOUS, label: 'Tous les livreurs' }, ...livreurOptions]}>
                {(o: { value: string; label: string }) => (
                  <ListBox.Item id={o.value} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox
            onSelectionChange={(c) => setRestaurantId(c === TOUS ? '' : String(c ?? ''))}
            selectedKey={restaurantId || TOUS}
          >
            <Label>Partenaire</Label>
            <ComboBox.InputGroup>
              <InputV3 placeholder="Tous les partenaires" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={[{ value: TOUS, label: 'Tous les partenaires' }, ...restaurantOptions]}>
                {(o: { value: string; label: string }) => (
                  <ListBox.Item id={o.value} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* `totalElements` est indisponible sur echec et `?? 0` rendait « Total: 0 ticket(s)
            archive(s) », une affirmation de fait la ou la lecture avait simplement echoue. */}
        {!archivesQuery.isError && (
          <p className="text-xs text-muted sm:text-sm">Total : {totalItems} ticket(s) archivé(s)</p>
        )}
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button onPress={() => setRowSelection({})} size="sm" variant="ghost">
              <X aria-hidden="true" className="size-4" />
              Désélectionner
            </Button>
          )}
          {/* Un bouton desactive n'emet aucun survol : le span porte l'evenement a la place. */}
          {/* Le motif de blocage est nomme : un bouton grise sans explication passe pour
              une panne cote operateur. L'attente se dit par `isPending`, ce qui evite un
              rond qui tourne pose a la main. */}
          <Tooltip>
            <Button
              isDisabled={!canRestore || selectedIds.length === 0}
              isPending={restaurerMutation.isPending}
              onPress={handleBulkRestore}
              size="sm"
              variant="primary"
            >
              {restaurerMutation.isPending ? <Spinner color="current" size="sm" /> : <ArchiveRestore aria-hidden="true" className="size-4" />}
              Restaurer ({selectedIds.length})
            </Button>
            <Tooltip.Content>
              {motifRestaurationBloquee || `Restaurer ${selectedIds.length} ticket(s) archivé(s)`}
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Echec de LECTURE, distinct d'archives vides. Sans cette branche, le tableau
          affichait « Aucun ticket archive » et les cartes mobiles la meme phrase : cela se
          lit comme un resultat, pas comme une panne, et les trois colonnes monetaires
          (cout de livraison, cout de commande, commission) disparaissaient en silence. */}
      {archivesQuery.isError ? (
        <EtatErreur
          quoi="les tickets archivés"
          onReessayer={() => archivesQuery.refetch()}
          enCours={archivesQuery.isFetching}
        />
      ) : (
        <>
      <div className="hidden md:block -mx-4 sm:mx-0">
        {/* Hauteur MESUREE, comme l'onglet « Tous les tickets ». Le plafond de 420 px
            ecrit en dur laissait environ 340 px de tableau sur la fenetre reelle des
            postes (1000x563) et perdait une rangee des qu'un titre passait sur deux
            lignes. C'est le defaut deja corrige a cote, et nomme dans son commentaire.
            La mesure porte sur `Table.ScrollContainer`, qui EST le defilement de la v3 :
            un div `overflow-y-auto` par-dessus en aurait fait deux imbriques. */}
        <Table>
          <Table.ScrollContainer
            className="md:h-[calc(100vh-15rem)] md:min-h-[320px]"
            ref={zoneArchivesRef}
            style={hauteurArchives ? { height: hauteurArchives } : undefined}
          >
            <Table.Content aria-label="Tickets archivés">
              <Table.Header>
                {table.getFlatHeaders().map((header, i) => (
                  <Table.Column
                    className="text-xs font-medium whitespace-nowrap sm:text-sm"
                    id={header.id}
                    isRowHeader={i === 0}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  archivesQuery.isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">Aucun ticket archivé</p>
                  )
                }
              >
                {archivesQuery.isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                        {Array.from({ length: colsCount }).map((_, j) => (
                          <Table.Cell className="h-12" key={`skeleton-cell-${j}`}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <Table.Row
                        className={row.getIsSelected() ? 'bg-accent-soft' : undefined}
                        id={row.id}
                        key={row.id}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell className="px-2 py-1 text-xs whitespace-nowrap" key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
              </Table.Body>
            </Table.Content>
            {/* La sentinelle vit DANS la zone qui defile : posee dessous, elle restait en
                permanence dans la fenetre et enchainait le chargement de toutes les pages
                jusqu'a faire tomber l'onglet. */}
            <div className="h-0.5" ref={observerTarget}>
              {archivesQuery.isFetchingNextPage && (
                <p className="w-full py-2 text-center text-xs text-muted">
                  Chargement des données...
                </p>
              )}
            </div>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {archivesQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-secondary" />)
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun ticket archivé</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const a = row.original;
            const deletedBy = a.deletedByUser ? `${a.deletedByUser.prenoms} ${a.deletedByUser.nom}` : '—';
            return (
              <div key={row.id} className={`space-y-2 rounded-xl border bg-surface p-4 shadow-xs ${row.getIsSelected() ? 'border-accent bg-accent-soft/40' : 'border-separator'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">Code Check</p>
                    <p className="truncate text-sm font-semibold text-foreground">{a.reference}</p>
                    <p className="text-xs text-blue-500 truncate">{a.restaurant}</p>
                  </div>
                  <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Sélectionner la ligne" />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Livreur</span>
                  <span className="truncate text-right text-sm text-foreground">{a.livreur}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Zone</span>
                  <span className="truncate text-right text-sm text-foreground">{a.nomZone ?? 'Inconnue'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Montant de Livraison</span>
                  <span className="text-right text-sm text-foreground">{formatCFA(a.coutLivraison)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Montant de Commande</span>
                  <span className="text-right text-sm text-foreground">{formatCFA(a.coutCommande)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Commission</span>
                  <span className="text-right text-sm text-foreground">{formatCFA(a.commission ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Date</span>
                  <span className="text-right text-sm text-foreground">{formatDateFR(a.date)} · {formatHoursMinutes(a.heure)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Supprimé par</span>
                  <span className="truncate text-right text-sm text-foreground">{deletedBy}</span>
                </div>
                {a.motifAnnulation && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-xs text-muted">Motif</span>
                    <span className="truncate text-right text-sm text-foreground">{a.motifAnnulation}</span>
                  </div>
                )}

                {canRestore && (
                  <div className="pt-1">
                    <Button
                      className="w-full"
                      isPending={restoringId === a.commandeId}
                      onPress={() => handleRestoreRow(a.commandeId)}
                      variant="primary"
                    >
                      {restoringId === a.commandeId ? <Spinner color="current" size="sm" /> : <ArchiveRestore aria-hidden="true" className="size-4" />}
                      Restaurer
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="h-0.5" ref={observerTargetMobile}>
          {archivesQuery.isFetchingNextPage && <p className="w-full py-2 text-center text-xs text-muted">Chargement des données...</p>}
        </div>
      </div>
        </>
      )}

      <ConfirmModal
        isOpen={confirmIds !== null}
        onClose={() => setConfirmIds(null)}
        title={confirmIds?.length === 1 ? 'Restaurer le ticket' : `Restaurer ${confirmIds?.length ?? 0} ticket(s)`}
        isLoading={restaurerMutation.isPending}
        actions={[{ label: 'Restaurer', onPress: handleConfirmRestore }]}
      >
        {confirmIds?.length === 1
          ? 'Confirmez-vous la restauration de ce ticket ?'
          : `Confirmez-vous la restauration de ${confirmIds?.length ?? 0} ticket(s) ?`}
      </ConfirmModal>
    </div>
  );
}
