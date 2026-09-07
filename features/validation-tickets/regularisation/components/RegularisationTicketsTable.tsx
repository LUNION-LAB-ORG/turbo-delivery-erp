'use client';

/*
 * Le bloc « Tickets par statut & créneau » de l'écran de régularisation, en HeroUI V3.
 *
 * <h3>Ce qui n'allait pas</h3>
 * <ul>
 *   <li>Le filtre de statut venait du Select maison (Radix): une liste NON filtrable,
 *       dont le menu porte ses propres couleurs. Depuis que la bascule de theme est dans
 *       l'en-tete, ce menu restait clair sur fond fonce, donc illisible.</li>
 *   <li>La croix qui efface le creneau etait un `<button>` brut, avec sa bordure, son
 *       survol et sa taille recopies a la main a cote du theme. Rien n'annoncait ce
 *       qu'elle faisait avant de cliquer.</li>
 *   <li>Le cadre du bloc et les cartes mobiles etaient des `div` habilles a la main
 *       (fond, bordure, arrondi, ombre). Ces valeurs recopiees derivent des que le theme
 *       bouge, et l'ecart ne se voit qu'une fois l'ecran ouvert.</li>
 *   <li>Les gabarits de chargement etaient des `div` en `animate-pulse`: ni la couleur ni
 *       la cadence ne suivaient quoi que ce soit.</li>
 *   <li>La pastille de statut de la carte mobile s'affichait en pastel clair sur fond
 *       fonce, pour la meme raison que le menu ci-dessus.</li>
 * </ul>
 *
 * <p>Ce qui ne change pas: les memes tickets, les memes colonnes, la meme pagination, le
 * meme echec de lecture distingue d'une liste vide, et les memes actions par statut,
 * toujours rendues par `regularisation-tickets-columns` pour que tableau et carte ne
 * puissent pas diverger.</p>
 */

import { flexRender } from '@tanstack/react-table';
import {
  Button,
  Card,
  Chip,
  ComboBox,
  Input,
  ListBox,
  Skeleton,
  Table,
  Tooltip,
} from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { Ticket as TicketIcon, X } from 'lucide-react';
import type { ReactNode } from 'react';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import EtatErreur from '@/components/commons/EtatErreur';
import { cn } from '@/lib/utils';
import { StatutControle } from '@/types/statut-controle.enum';
import { formatMontant } from '@/utils/format.utils';
import type { RegularisationTicketsColumnMeta } from './regularisation-tickets-columns';
import useRegularisationTicketsTable from '../hooks/use-regularisation-tickets-table';
import {
  STATUT_FILTER_OPTIONS,
  getRegularisationStatutConfig,
  renderRegularisationActions,
} from './regularisation-tickets-columns';
import RegularisationRejetModal from './RegularisationRejetModal';

/**
 * Teinte de la pastille de statut sur la carte mobile.
 *
 * <p>Les classes rendues par `getRegularisationStatutConfig` sont ecrites en
 * `bg-*-100 text-*-700` sans variante sombre: sous le theme sombre, la pastille sortait
 * en pastel clair sur fond fonce et le statut devenait illisible. La teinte est donc
 * redonnee ici avec ses deux themes, comme le fait deja la pastille des tickets.</p>
 *
 * <p>La cle est le LIBELLE, pas le statut, pour ne pas recopier la regle
 * d'authentification optimiste (un ticket en attente deja authentifie se lit
 * « Authentifié »): elle reste dans `getRegularisationStatutConfig`, seule source. Un
 * libelle inconnu retombe sur une pastille neutre, jamais sur rien.</p>
 */
const TEINTE_STATUT: Record<string, string> = {
  'En attente': 'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300',
  Tardif: 'bg-orange-100 text-orange-900 dark:bg-orange-400/15 dark:text-orange-300',
  Authentifié: 'bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300',
  'V1 Validé': 'bg-teal-100 text-teal-900 dark:bg-teal-400/15 dark:text-teal-300',
  'V2 Validé': 'bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300',
  'Rejeté (Fraude)': 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-300',
};

const TEINTE_INCONNUE = 'bg-surface-tertiary text-foreground';

/** Une valeur de la carte mobile: libelle a gauche, valeur a droite, alignees d'une ligne a l'autre. */
function Champ({
  libelle,
  className,
  children,
}: {
  libelle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted">{libelle}</span>
      <span className={cn('truncate text-right text-sm text-foreground', className)}>{children}</span>
    </div>
  );
}

export default function RegularisationTicketsTable() {
  const {
    table,
    isLoading,
    isFetching,
    isError,
    refetch,
    columnsCount,
    statut,
    setStatut,
    creneaux,
    creneauId,
    setCreneauId,
    isLoadingCreneaux,
    page,
    setPage,
    totalPages,
    ticketToReject,
    motif,
    setMotif,
    closeReject,
    confirmReject,
    isRejecting,
  } = useRegularisationTicketsTable();

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* `text-indigo-500` ne disait rien: aucune des sept teintes de l'ecran ne
              designait cette section plutot qu'une autre. L'icone redevient neutre, et
              l'accent reste disponible pour ce qui appelle une action. */}
          <TicketIcon aria-hidden="true" className="size-4 text-muted" />
          {/* Le titre reste un h2: cette section est fille du h1 de la page. */}
          <Card.Title render={(props) => <h2 {...props} />}>
            Tickets par statut &amp; créneau
          </Card.Title>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ComboBox
            aria-label="Statut"
            className="w-full sm:w-52"
            /* Une liste ne se vide pas: le tableau interroge toujours un statut. Un choix
               efface laisse donc le filtre courant en place. */
            onSelectionChange={(cle) => {
              if (cle != null) setStatut(cle as StatutControle);
            }}
            selectedKey={statut}
          >
            <ComboBox.InputGroup>
              <Input placeholder="Statut" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={STATUT_FILTER_OPTIONS}>
                {(o: { value: StatutControle; label: string }) => (
                  <ListBox.Item id={o.value} textValue={o.label}>
                    {o.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <div className="flex items-center gap-1.5">
            <CreneauSelectPicker
              creneaux={creneaux}
              selectedCreneauId={creneauId}
              onSelectCreneau={setCreneauId}
              disabled={isLoadingCreneaux}
            />
            {creneauId && (
              <Tooltip>
                <Button
                  aria-label="Effacer le créneau"
                  isIconOnly
                  onPress={() => setCreneauId(undefined)}
                  size="sm"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
                {/* Une croix seule n'annonce pas ce qu'elle efface: le creneau, pas le statut. */}
                <Tooltip.Content>Effacer le créneau</Tooltip.Content>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Tableau, desktop uniquement (a partir de md) */}
      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Tickets par statut et créneau" className="text-sm">
              <Table.Header>
                {table.getFlatHeaders().map((header, i) => (
                  <Table.Column
                    className="text-[10px] font-semibold tracking-wider uppercase"
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
                  /* Un echec de chargement ne doit pas se lire comme un filtre trop etroit. */
                  isError ? (
                    <div className="py-6">
                      <EtatErreur
                        enCours={isFetching}
                        onReessayer={() => refetch()}
                        quoi="les tickets"
                      />
                    </div>
                  ) : isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucun ticket ne correspond à ces filtres
                    </p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                        {Array.from({ length: columnsCount }).map((_, j) => (
                          <Table.Cell key={`skeleton-${i}-${j}`}>
                            <Skeleton className="h-4 w-full" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : table.getRowModel().rows.map((row) => (
                      <Table.Row
                        className={isFetching ? 'opacity-60' : undefined}
                        id={row.id}
                        key={row.id}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell className="px-4 py-3" key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          {totalPages > 1 && (
            <Table.Footer>
              <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={totalPages} />
            </Table.Footer>
          )}
        </Table>
      </div>

      {/* Mobile: cartes tactiles, en remplacement du tableau sous md */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            /* Le gabarit garde la hauteur et l'arrondi de la carte qu'il remplace: sans
               cela, la liste saute au moment ou les vraies cartes arrivent. */
            <Skeleton key={`m-skel-${i}`} className="h-36 rounded-3xl" />
          ))
        ) : isError ? (
          <EtatErreur quoi="les tickets" onReessayer={() => refetch()} enCours={isFetching} />
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun ticket ne correspond à ces filtres</p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const ticket = row.original;
            const meta = table.options.meta as RegularisationTicketsColumnMeta;
            const cfg = getRegularisationStatutConfig(ticket, meta.authenticatedIds);
            const actions = renderRegularisationActions(ticket, meta, true);
            return (
              /* Carte secondaire: sans cela, elle porterait le fond du panneau qui la
                 contient et l'oeil ne separerait plus un ticket du suivant. */
              <Card
                key={row.id}
                className={cn('gap-2', isFetching && 'opacity-60')}
                variant="secondary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{ticket.reference}</p>
                    <p className="truncate text-xs text-muted">{ticket.livreur}</p>
                  </div>
                  <Chip
                    className={cn('shrink-0', TEINTE_STATUT[cfg.label] ?? TEINTE_INCONNUE)}
                    size="sm"
                    variant="soft"
                  >
                    {cfg.label}
                  </Chip>
                </div>

                <Champ libelle="Restaurant">{ticket.restaurant}</Champ>
                <Champ className="tabular-nums" libelle="Montant CMD">
                  {formatMontant(ticket.coutCommande)}
                </Champ>
                {/* Le cout de livraison est ce que la regularisation met en jeu: il garde
                    sa teinte, avec la variante sombre qui lui manquait. */}
                <Champ
                  className="font-medium tabular-nums text-orange-600 dark:text-orange-400"
                  libelle="Coût livraison"
                >
                  {formatMontant(ticket.coutLivraison)}
                </Champ>
                <Champ libelle="Date / Heure">
                  {ticket.date} <span className="text-muted">· {ticket.heure}</span>
                </Champ>

                {actions && <div className="pt-1">{actions}</div>}
              </Card>
            );
          })
        )}
        {totalPages > 1 && (
          <div className="flex justify-center pt-1">
            <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={totalPages} />
          </div>
        )}
      </div>

      <RegularisationRejetModal
        open={ticketToReject !== null}
        reference={ticketToReject?.reference ?? ''}
        motif={motif}
        onMotifChange={setMotif}
        onClose={closeReject}
        onConfirm={confirmReject}
        isLoading={isRejecting}
      />
    </Card>
  );
}
