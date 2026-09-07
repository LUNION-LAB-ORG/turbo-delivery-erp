'use client';

import { ChevronRight, Download, ListFilter } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
/*
 * `Button`, `Skeleton` et le groupe de bascules viennent de la V3.
 *
 * <p>Le bouton d'export portait `variant="bordered"`, `color="primary"` et
 * `startContent` : trois props de la V2. Posees sur le composant V3 elles sont ignorees
 * SANS ERREUR — le bouton se serait affiche sans son icone de telechargement, et rien
 * dans la console ne l'aurait signale.</p>
 *
 * <p>`Skeleton` venait de `components/ui`, ou il se peint en `bg-primary/10`, c'est-a-dire
 * dans le rouge de la marque : les quatre blocs d'attente en tete d'ecran se lisaient
 * comme une alerte. Le composant V3 se peint sur la surface du theme, en clair comme en
 * sombre.</p>
 */
import { Button, Skeleton, Table, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { buttonVariants } from '@heroui-v3/styles';
import Link from 'next/link';
import EtatErreur from '@/components/commons/EtatErreur';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import useHistoriqueCreneaux from '../hooks/use-historique-creneaux';
import HistoriqueCreneauxStats from './HistoriqueCreneauxStats';
import { historiqueCreneauxColumns, fmtDate } from './historique-creneaux-columns';
import { getLotStatutConfig } from '../utils/lot-statut.utils';
import CreneauActifToggleCell from './CreneauActifToggleCell';
import type { StatutFilter } from '../hooks/use-historique-creneaux';

const STATUT_FILTERS: { value: StatutFilter; label: string }[] = [
  { value: 'tous',              label: 'Tous' },
  { value: 'EN_ATTENTE',        label: 'En attente' },
  { value: 'CALCUL_EN_COURS',   label: 'En préparation' },
  { value: 'SOUMIS_DGA',        label: 'Soumis DGA' },
  { value: 'VALIDE_DGA',        label: 'Visé DGA' },
  { value: 'APPROUVE_DG',       label: 'Approuvé PDG' },
  { value: 'PAIEMENT_EN_COURS', label: 'Paiement en cours' },
  { value: 'SOLDE',             label: 'Soldé' },
  { value: 'REJETE',            label: 'Rejeté' },
];

export default function HistoriqueCreneauxContent() {
  const {
    filtered,
    stats,
    statutFilter,
    setStatutFilter,
    exportXlsx,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useHistoriqueCreneaux();

  const table = useReactTable({
    data: filtered,
    columns: historiqueCreneauxColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Historique des créneaux</h1>
        <Button isDisabled={filtered.length === 0} onPress={exportXlsx} variant="outline">
          <Download aria-hidden="true" className="size-4" />
          Exporter Excel
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <HistoriqueCreneauxStats stats={stats} />
      )}

      {/* Filtres de statut */}
      <div className="rounded-xl border border-separator bg-surface p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted">
            <ListFilter aria-hidden="true" className="size-3.5" />
            Statut :
          </span>
          {/*
           * Neuf `<button>` nus, dont le filtre actif se peignait en `bg-red-500`.
           *
           * <p>Deux consequences. D'abord le rouge de l'accent, reserve a ce qui appelle
           * une action, servait ici a marquer un simple etat de lecture : sur cet ecran
           * la pastille du filtre criait plus fort que le seul vrai bouton, l'export.
           * Ensuite rien ne disait quel filtre etait actif a un lecteur d'ecran : aucun
           * role, aucun etat selectionne, et neuf arrets de tabulation independants.</p>
           *
           * <p>Le groupe V3 porte la selection, la navigation au clavier et les roles
           * ARIA. `disallowEmptySelection` evite l'etat impossible « aucun filtre » :
           * re-cliquer le filtre actif le laissait sinon sans selection alors que la
           * liste, elle, restait filtree. `flex-wrap` parce que neuf libelles ne tiennent
           * pas sur la largeur d'un telephone, et que le groupe ne se replie pas seul.</p>
           */}
          <ToggleButtonGroup
            aria-label="Filtrer par statut"
            className="flex-wrap"
            disallowEmptySelection
            isDetached
            onSelectionChange={(cles) => {
              const premiere = [...cles][0];
              if (premiere) setStatutFilter(premiere as StatutFilter);
            }}
            selectedKeys={new Set([statutFilter])}
            selectionMode="single"
            size="sm"
          >
            {STATUT_FILTERS.map((f) => (
              <ToggleButton id={f.value} key={f.value}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>

      {/* Table — desktop uniquement (≥ md) */}
      <div className="hidden overflow-hidden rounded-xl border border-separator bg-surface md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Historique des créneaux">
              <Table.Header>
                {table.getFlatHeaders().map((header, i) => (
                  <Table.Column
                    className="text-[10px] font-bold tracking-wide uppercase"
                    id={header.id}
                    isRowHeader={i === 0}
                    key={header.id}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  /* Un echec de chargement ne doit pas se lire comme « Aucun creneau trouve ». */
                  isError ? (
                    <div className="py-6">
                      <EtatErreur
                        enCours={isFetching}
                        onReessayer={() => refetch()}
                        quoi="les créneaux"
                      />
                    </div>
                  ) : isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">Aucun créneau trouvé</p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Table.Row id={`skel-${i}`} key={`skel-${i}`}>
                        {historiqueCreneauxColumns.map((col, j) => (
                          <Table.Cell key={String(col.id ?? j)}>
                            <Skeleton className="h-4 rounded" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <Table.Row id={row.id} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell className="px-4 py-4" key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`m-skel-${i}`} className="h-44 rounded-xl" />
          ))
        ) : isError ? (
          <EtatErreur quoi="les créneaux" onReessayer={() => refetch()} enCours={isFetching} />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun créneau trouvé</p>
        ) : (
          filtered.map((creneau) => {
            const config = getLotStatutConfig(creneau.lotStatut);
            return (
              <div
                key={creneau.id}
                className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{creneau.label}</p>
                    <p className="text-xs text-muted">
                      {fmtDate(creneau.dateDebut)} → {fmtDate(creneau.dateFin)}
                    </p>
                  </div>
                  {/* La pastille garde ses huit teintes : la chaine de validation compte
                      huit etats et l'echelle d'etat du theme n'en offre que trois. Les
                      couples clair/sombre sont fournis par `lot-statut.utils`. */}
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
                  >
                    {config.label}
                  </span>
                </div>

                {creneau.commentaireRejet && (
                  <p className="line-clamp-2 text-xs text-muted">{creneau.commentaireRejet}</p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Livreurs</span>
                  <span className="text-right text-sm text-foreground">{creneau.nbLivreurs}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Tickets</span>
                  <span className="text-right text-sm text-foreground">{creneau.totalTickets}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">En attente</span>
                  {/* `text-amber-600` n'avait pas de variante sombre : sur fond sombre, le
                      seul chiffre qui reclame un traitement passait inapercu. Le jeton
                      d'etat porte ses deux themes. */}
                  <span
                    className={`text-right text-sm font-medium ${creneau.nbTicketsPending > 0 ? 'text-warning-soft-foreground' : 'text-muted'}`}
                  >
                    {creneau.nbTicketsPending}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Net (FCFA)</span>
                  <span className="text-right text-sm font-semibold text-foreground">{formatCFA(creneau.totalNet)}</span>
                </div>
                {creneau.soumisAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-xs text-muted">Soumis le</span>
                    <span className="text-right text-sm text-foreground">
                      {fmtDate(creneau.soumisAt)}
                      {creneau.soumisParNom && (
                        <span className="text-muted"> · {creneau.soumisParNom}</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Visible</span>
                  <CreneauActifToggleCell creneau={creneau} />
                </div>

                <div className="pt-1">
                  {/*
                   * Le lien de detail etait peint a la main en `border-red-200`,
                   * `text-red-500` et `hover:bg-red-50`, sans variante sombre : en theme
                   * sombre, l'appui posait un aplat presque blanc sous un libelle clair,
                   * et le seul chemin vers le detail du creneau disparaissait le temps du
                   * toucher. `buttonVariants` est la facon documentee d'habiller un lien
                   * de routage avec les styles V3 : la navigation reste celle de Next,
                   * l'apparence vient du theme.
                   */}
                  <Link
                    className={buttonVariants({ fullWidth: true, variant: 'outline' })}
                    href={`/validation-tickets/historique-creneaux/${creneau.id}`}
                  >
                    Voir le détail
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
