'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button, Card, Chip, Label, SearchField } from '@heroui-v3/react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

import { CardHeader } from '@/components/commons/card-header';
import { ChampListe } from '@/components/commons/champs-formulaire';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { PageWrapper } from '@/components/commons/page-wrapper';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { FiltreStatut } from '@/components/finance/common/filtre-statut';
import {
  useNotificationsListQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  type NotificationVm,
} from '@/features/notifications';

/**
 * Page /notification refactorée V44 :
 * - TanStack Query (au lieu du fetch SSR figé)
 * - Filtres : recherche texte, statut (lu/non-lu/tous), type
 * - Pagination client-side (les notifs sont <= 100 typiquement)
 * - Mark-as-read par card (click sur le bouton ✓)
 * - Mark-all-as-read globale (CTA en header)
 */
const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { label: 'Toutes', value: 'Tous' },
  { label: 'Non lues', value: 'unread' },
  { label: 'Lues', value: 'read' },
] as const;

// Tous les types possibles (alignés sur l'enum backend TypeNotification V44)
const TYPE_GROUPS = [
  { label: 'Tous types', value: 'all' },
  { label: 'Tickets — à valider V1', value: 'TICKET_AUTHENTIFIE' },
  { label: 'Tickets — à valider V2', value: 'TICKET_V1_VALIDE' },
  { label: 'Tickets — validés V2', value: 'TICKET_V2_VALIDE' },
  { label: 'Dépenses — à viser DGA', value: 'CHARGE_A_VISER_DGA' },
  { label: 'Dépenses — à approuver DG', value: 'CHARGE_A_APPROUVER_DG' },
  { label: 'Dépenses — à décaisser', value: 'CHARGE_A_DECAISSER' },
  { label: 'Dépenses — décaissées', value: 'CHARGE_DECAISSEE' },
  { label: 'Dépenses — rejetées', value: 'CHARGE_REJETEE' },
  { label: 'Livraison — nouvelle course', value: 'NOUVELLE_COURSE' },
  { label: 'Livraison — course acceptée', value: 'ACCEPTATION_COURSE' },
] as const;

/**
 * Le libellé d'un type, tel que le filtre l'écrit juste au-dessus.
 *
 * <p>La page en avait DEUX versions : celle du filtre (« Dépenses — à viser DGA ») et une
 * `prettyType` qui remettait l'enum en forme au petit bonheur (« Charge A Viser Dga »).
 * C'est cette seconde qui s'affichait sur les cartes, si bien qu'on filtrait sur un nom et
 * qu'on en lisait un autre juste en dessous.</p>
 */
function libelleType(type: string): string {
  return (
    TYPE_GROUPS.find((t) => t.value === type)?.label ??
    type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function NotificationContent() {
  const session = useSession();
  const userId = session.data?.user?.id;

  const { data = [], isPending: isLoading, isFetching, isError, refetch } = useNotificationsListQuery(userId);
  const markOneMut = useMarkAsReadMutation(userId);
  const markAllMut = useMarkAllAsReadMutation(userId);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [type, setType] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = data.filter((n: NotificationVm) => n.titre || n.message);
    if (status === 'unread') list = list.filter((n) => !n.lu);
    if (status === 'read') list = list.filter((n) => n.lu);
    if (type !== 'all') list = list.filter((n) => n.type === type);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          (n.titre || '').toLowerCase().includes(q) ||
          (n.message || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, search, status, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const unreadCount = data.filter((n) => !n.lu).length;

  return (
    <PageWrapper>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CardHeader title="Liste des notifications" />
        <div className="flex items-center gap-3">
          {/*
           * Le compteur etait peint en DANGER des qu'une notification n'etait pas lue.
           * Du courrier en attente n'est pas un danger : c'est ce qui appelle une action,
           * donc l'accent — et le neutre quand la boite est a jour.
           */}
          <Chip color={unreadCount > 0 ? 'accent' : 'default'} variant="soft">
            <Chip.Label>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Chip.Label>
          </Chip>
          <Button
            isDisabled={unreadCount === 0 || markAllMut.isPending}
            isPending={markAllMut.isPending}
            onPress={() => markAllMut.mutate()}
            size="sm"
            variant="outline"
          >
            <CheckCheck aria-hidden="true" className="size-4" />
            Tout marquer lu
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Content className="flex-row flex-wrap items-end gap-3">
          <SearchField
            className="min-w-[220px] flex-1"
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            value={search}
          >
            <Label>Rechercher</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Dans le titre ou le message" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {/* Trois options : une rangee sur un poste, une liste cherchable sur un
              telephone. Onze types : une liste cherchable partout. */}
          <FiltreStatut
            onChange={(v) => {
              setStatus((v || 'all') as 'all' | 'read' | 'unread');
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            valeur={status === 'all' ? '' : status}
          />
          <div className="w-full sm:w-[280px]">
            <ChampListe
              label="Type"
              onChange={(v) => {
                setType(v || 'all');
                setPage(1);
              }}
              options={TYPE_GROUPS}
              placeholder="Tous types"
              valeur={type}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Liste. `data = []` par defaut : un echec produisait une liste vide, donc
          « Aucune notification » — le message exact d'une boite reellement vide.
          L'erreur ouvre desormais la chaine. */}
      {isError ? (
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les notifications" />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="h-24 animate-pulse rounded-xl bg-surface-secondary" key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* « Aucune notification » etait ecrit en ROUGE DE MARQUE, en gras et en 20 px :
           une boite a jour se lisait comme une alerte. */
        <EmptyDataTable title="Aucune notification" />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {pageItems.map((notification) => (
              <Card
                className={notification.lu ? undefined : 'border-l-4 border-l-accent'}
                key={notification.id}
              >
                <Card.Content className="flex-row flex-wrap items-start gap-3 p-4 sm:flex-nowrap">
                  {/*
                   * La cloche etait dans un rond `bg-red-50 text-red-500` — deux classes
                   * de la palette brute, sans variante sombre, et sur CHAQUE ligne, lue ou
                   * non. Une liste de notifications ordinaires se lisait comme une liste
                   * d'incidents. Le seul signal utile, « pas encore lue », est porte par
                   * le liseret de gauche.
                   */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-muted">
                    <Bell aria-hidden="true" className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h6
                      className={
                        notification.lu
                          ? 'font-medium text-foreground'
                          : 'font-bold text-foreground'
                      }
                    >
                      {notification.titre}
                    </h6>
                    {notification.message && (
                      <p className={`text-sm text-muted ${notification.lu ? '' : 'font-medium'}`}>
                        {notification.message}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {notification.lien && (
                        /* C'etait un `<Link>` enveloppant un `<Button>` : un <a> contenant
                           un <button>, du HTML invalide. */
                        <LienBouton href={notification.lien} taille="sm" variante="outline">
                          {libelleType(notification.type)}
                          <ExternalLink aria-hidden="true" className="size-3" />
                        </LienBouton>
                      )}
                      <LienBouton
                        href={`/notification/${notification.id}`}
                        taille="sm"
                        variante="ghost"
                      >
                        Détail
                      </LienBouton>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-muted">{notification.tempsPasse}</span>
                    {!notification.lu && (
                      <Button
                        onPress={() => markOneMut.mutate({ notificationId: notification.id })}
                        size="sm"
                        variant="ghost"
                      >
                        <CheckCheck aria-hidden="true" className="size-3" />
                        Lu
                      </Button>
                    )}
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationTableau onPage={setPage} page={currentPage} total={totalPages} />
            </div>
          )}

          <p className="mt-3 text-center text-xs text-muted">
            {filtered.length} notification{filtered.length > 1 ? 's' : ''}
            {filtered.length !== data.length && ` (filtrées sur ${data.length})`}
          </p>
        </>
      )}
    </PageWrapper>
  );
}
