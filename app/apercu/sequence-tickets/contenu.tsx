'use client';

import { Button, Table } from '@heroui-v3/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { TicketTableFilters } from '@/components/tickets/table/ticket-table-filters';
import {
  createTicketColumns,
  type TicketColumnMeta,
} from '@/components/tickets/table/ticket-table-columns';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
import type { Ticket } from '@/types/bon-livraison.model';

/**
 * Banc de SEQUENCE : rejoue, commit par commit, ce que fait l'ecran des tickets quand on
 * pose un filtre livreur sur une plage d'UN SEUL jour et que le resultat est vide.
 *
 * <p>Il reprend la structure COMPLETE de l'ecran, la ou le banc du corps de tableau ne
 * rendait que le corps : `Table.Footer` avec la pagination (qui rend `null` des que le
 * total retombe a 1), la hauteur MESUREE sur `Table.ScrollContainer`, et le
 * `renderEmptyState` a trois branches.</p>
 */

const LIGNE = (i: number): Ticket =>
  ({
    code: `0005${4550 + i}`,
    coutLivraison: '1500',
    date: '2026-09-03',
    heure: '12:46',
    id: `t-${i}`,
    livreur: 'Kouamé Yannick Kouadio',
    livreurId: 'l1',
    montantCommande: '5000',
    montantLivraison: '1500',
    nomZone: 'ZONE 3 (Limite feu de Bernabé) | ÉGLISE MÉTHODISTE',
    restaurant: 'AGHA ZONE 4',
    restaurantId: 'r1',
    statut: 'EN_ATTENTE',
    zoneId: 'z1',
  }) as unknown as Ticket;

const META: TicketColumnMeta = {
  authenticatedIds: new Set(),
  editedTickets: new Map(),
  editingIds: new Set(),
  getDisplayTicket: (t: Ticket) => t,
  isSavingEdit: false,
  isSavingNew: false,
  livreurOptions: [{ label: 'Kouamé Yannick Kouadio', value: 'l1' }],
  newTicketIds: new Set(),
  onAuthentifier: () => undefined,
  onCancelEdit: () => undefined,
  onCancelNew: () => undefined,
  onDeleteRow: () => undefined,
  onEditRow: () => undefined,
  onSaveEdit: () => undefined,
  onSaveNew: () => undefined,
  onTicketChange: () => undefined,
  onTicketPatch: () => undefined,
  permissions: {
    canAuthentifier: true,
    canCreate: true,
    canDelete: true,
    canUpdate: true,
    isAdmin: true,
  },
  restaurantOptions: [{ label: 'AGHA ZONE 4', value: 'r1' }],
};

interface Etat {
  isError: boolean;
  isLoading: boolean;
  lignes: Ticket[];
  pageAffichee: number;
  pageEnAttente: boolean;
  totalPages: number;
}

const AUCUNE_LIGNE: Ticket[] = [];

class Filet extends React.Component<
  { children: React.ReactNode; onErreur: (e: Error) => void },
  { tombe: boolean }
> {
  state = { tombe: false };
  static getDerivedStateFromError() {
    return { tombe: true };
  }
  componentDidCatch(erreur: Error) {
    this.props.onErreur(erreur);
  }
  render() {
    if (this.state.tombe) {
      return <p className="py-8 text-center text-sm text-muted">Le tableau est tombé.</p>;
    }
    return this.props.children;
  }
}

function TableauComme({ etat }: { etat: Etat }) {
  const zoneTableRef = React.useRef<HTMLDivElement>(null);
  const hauteurTable = useHauteurDisponible(zoneTableRef);
  const columns = React.useMemo(() => createTicketColumns(), []);
  const allTickets = React.useMemo(() => [...etat.lignes], [etat.lignes]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const table = useReactTable({
    columns,
    data: allTickets,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: META,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const colsCount = table.getAllColumns().length;
  const { isError, isLoading, pageAffichee, pageEnAttente, totalPages } = etat;

  return (
    <Table>
      <Table.ScrollContainer
        className="md:h-[calc(100vh-15rem)] md:min-h-[320px]"
        ref={zoneTableRef}
        style={hauteurTable ? { height: hauteurTable } : undefined}
      >
        <Table.Content aria-label="Tickets de livraison">
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
            renderEmptyState={
              isError
                ? () => (
                    <div className="py-6">
                      <EtatErreur enCours={false} onReessayer={() => undefined} quoi="les tickets" />
                    </div>
                  )
                : isLoading || pageEnAttente
                  ? () => null
                  : () => (
                      <p className="py-8 text-center text-sm text-muted">Aucun ticket trouvé</p>
                    )
            }
          >
            {isLoading || pageEnAttente
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
      </Table.ScrollContainer>
      <Table.Footer>
        <PaginationTableau
          onPage={() => undefined}
          page={pageAffichee + 1}
          total={totalPages}
        />
      </Table.Footer>
    </Table>
  );
}

const CHARGE: Etat = {
  isError: false,
  isLoading: false,
  lignes: Array.from({ length: 20 }, (_, i) => LIGNE(i)),
  pageAffichee: 4,
  pageEnAttente: false,
  totalPages: 15,
};

// Le filtre vient de changer : la requete repart de zero, `pageAffichee` vaut ENCORE 4
// (l'effet de remise a zero n'a pas encore tourne), donc `pageEnAttente` est vrai.
const ATTENTE_PAGE_4: Etat = {
  isError: false,
  isLoading: true,
  lignes: AUCUNE_LIGNE,
  pageAffichee: 4,
  pageEnAttente: true,
  totalPages: 15,
};

const ATTENTE_PAGE_0: Etat = { ...ATTENTE_PAGE_4, pageAffichee: 0, totalPages: 1 };

// La reponse vide arrive : squelettes ET pagination disparaissent dans le MEME commit,
// et `renderEmptyState` change de forme au meme instant.
const VIDE: Etat = {
  isError: false,
  isLoading: false,
  lignes: AUCUNE_LIGNE,
  pageAffichee: 0,
  pageEnAttente: false,
  totalPages: 1,
};

const ERREUR: Etat = { ...VIDE, isError: true, pageEnAttente: true, totalPages: 1 };

export default function ApercuSequenceTickets() {
  const [etat, setEtat] = React.useState<Etat>(ATTENTE_PAGE_0);
  const [journal, setJournal] = React.useState<string[]>([]);
  const [cle, setCle] = React.useState(0);
  const [livreurId, setLivreurId] = React.useState('');
  const [periode, setPeriode] = React.useState({
    debut: new Date('2026-09-01'),
    fin: new Date('2026-09-07'),
  });

  const noter = React.useCallback((e: Error) => {
    setJournal((l) => [...l, `ATTRAPE — ${e.name}: ${e.message}`]);
  }, []);

  React.useEffect(() => {
    const surErreur = (e: ErrorEvent) => setJournal((l) => [...l, `window.onerror — ${e.message}`]);
    window.addEventListener('error', surErreur);
    return () => window.removeEventListener('error', surErreur);
  }, []);

  const pas = (nom: string, e: Etat) => {
    setJournal((l) => [...l, nom]);
    setEtat(e);
  };

  const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Le trajet reel : page 5 d'une semaine chargee, on pose livreur + un seul jour.
  const rejouerProduction = async () => {
    setJournal([]);
    setEtat(CHARGE);
    await attendre(400);
    pas('filtre pose — squelettes, pageAffichee encore 4', ATTENTE_PAGE_4);
    await attendre(60);
    pas('effet de remise a zero — pageAffichee 0', ATTENTE_PAGE_0);
    await attendre(400);
    pas('reponse vide — 10 squelettes -> etat vide, pagination -> null', VIDE);
  };

  // La meme chose SANS respiration : les deux transitions dans le meme tour de boucle.
  const rejouerSerre = async () => {
    setJournal([]);
    setEtat(CHARGE);
    await attendre(400);
    setEtat(ATTENTE_PAGE_4);
    setEtat(ATTENTE_PAGE_0);
    setEtat(VIDE);
    setJournal((l) => [...l, 'trois etats dans le meme lot']);
  };

  // Arrivee directe sur l'URL : squelettes au montage, puis reponse vide.
  const rejouerArrivee = async () => {
    setJournal([]);
    setCle((k) => k + 1);
    setEtat(ATTENTE_PAGE_0);
    await attendre(400);
    pas('reponse vide', VIDE);
  };

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc de séquence — tickets</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Structure complète de l&apos;écran : pied de tableau avec pagination, hauteur
        mesurée, `renderEmptyState` à trois branches.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onPress={rejouerProduction} size="sm" variant="primary">
          Trajet de production
        </Button>
        <Button onPress={rejouerSerre} size="sm" variant="ghost">
          Même lot
        </Button>
        <Button onPress={rejouerArrivee} size="sm" variant="ghost">
          Arrivée sur l&apos;URL
        </Button>
        <Button onPress={() => pas('chargé', CHARGE)} size="sm" variant="ghost">
          Chargé
        </Button>
        <Button onPress={() => pas('squelettes', ATTENTE_PAGE_0)} size="sm" variant="ghost">
          Squelettes
        </Button>
        <Button onPress={() => pas('vide', VIDE)} size="sm" variant="ghost">
          Vide
        </Button>
        <Button onPress={() => pas('erreur', ERREUR)} size="sm" variant="ghost">
          Erreur
        </Button>
      </div>

      <ul className="mb-4 space-y-1 text-xs text-muted" data-journal>
        {journal.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>

      {/*
        * Le GESTE reel : l'operateur choisit un livreur dans la liste deroulante, puis une
        * plage d'un seul jour. La fenetre surgissante de la liste (un PORTAIL) se ferme au
        * moment meme ou le tableau echange tout son contenu.
        */}
      <TicketTableFilters
        debut={periode.debut}
        fin={periode.fin}
        livreurId={livreurId}
        livreurOptions={[
          { label: 'Kouamé Yannick Kouadio', value: 'l1' },
          { label: 'Adama Traoré', value: 'l2' },
          { label: 'Salif Koné', value: 'l3' },
        ]}
        onFilterChange={(cle, valeur) => {
          if (cle === 'livreurId') {
            setLivreurId(String(valeur));
            setJournal((l) => [...l, `livreur choisi: ${String(valeur)}`]);
            // Exactement l'ecran : squelettes tout de suite, reponse vide 300 ms plus tard.
            setEtat(ATTENTE_PAGE_4);
            window.setTimeout(() => setEtat(ATTENTE_PAGE_0), 30);
            window.setTimeout(() => setEtat(VIDE), 300);
          } else if (cle === 'debut') {
            setPeriode((p) => ({ ...p, debut: new Date(String(valeur)) }));
          } else if (cle === 'fin') {
            setPeriode((p) => ({ ...p, fin: new Date(String(valeur)) }));
            setEtat(ATTENTE_PAGE_4);
            window.setTimeout(() => setEtat(ATTENTE_PAGE_0), 30);
            window.setTimeout(() => setEtat(VIDE), 300);
          }
        }}
        onReset={() => undefined}
        restaurantId=""
        restaurantOptions={[{ label: 'AGHA ZONE 4', value: 'r1' }]}
        search=""
      />

      <Filet key={cle} onErreur={noter}>
        <TableauComme etat={etat} />
      </Filet>
    </div>
  );
}
