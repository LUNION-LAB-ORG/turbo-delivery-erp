'use client';

import { Button, Table } from '@heroui-v3/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

import {
  createTicketColumns,
  type TicketColumnMeta,
} from '@/components/tickets/table/ticket-table-columns';
import type { Ticket } from '@/types/bon-livraison.model';

/**
 * Banc de reproduction : le corps du tableau qui change entièrement de lignes.
 *
 * <p>En production, l'écran des tickets tombe sur
 * `NotFoundError: Failed to execute 'removeChild' on 'Node'` quand on filtre par livreur
 * sur une plage d'un seul jour, c'est-à-dire quand le résultat est vide.</p>
 *
 * <p>La séquence soupçonnée : de vraies lignes, puis dix lignes de squelette dont AUCUN
 * identifiant n'est commun aux précédentes, puis zéro ligne et l'état vide. Trois jeux
 * d'enfants entièrement disjoints dans la même collection react-aria, avec un
 * `renderEmptyState` réécrit à chaque rendu.</p>
 *
 * <p>Ce banc rejoue cette séquence sur commande et attrape ce qui tombe, au lieu de
 * perdre la page.</p>
 */

type Etat = 'lignes' | 'squelettes' | 'vide';

/**
 * Les VRAIES colonnes.
 *
 * <p>Une premiere version du banc rendait des cellules de texte : la sequence passait
 * sans broncher. Les cellules reelles contiennent des composants a PORTAIL — l'info-bulle
 * du nom de zone, les fenetres surgissantes des listes deroulantes. Un portail dont le
 * declencheur disparait pendant qu'il est ouvert est le cas classique du removeChild.</p>
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

/** Attrape l'erreur pour la MONTRER, au lieu de perdre le banc avec elle. */
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

function CorpsQuiChange({ etat }: { etat: Etat }) {
  const donnees = React.useMemo(
    () => (etat === 'lignes' ? Array.from({ length: 20 }, (_, i) => LIGNE(i)) : []),
    [etat],
  );
  const columns = React.useMemo(() => createTicketColumns(), []);
  const table = useReactTable({
    columns,
    data: donnees,
    getCoreRowModel: getCoreRowModel(),
    meta: META,
  });
  const nbColonnes = table.getAllLeafColumns().length;

  return (
    <Table>
      <Table.ScrollContainer className="h-96">
        <Table.Content aria-label="Reproduction">
          <Table.Header>
            {table.getFlatHeaders().map((header, i) => (
              <Table.Column
                className="text-xs font-medium whitespace-nowrap"
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
            /* Exactement comme l'ecran : une fleche ecrite en ligne, donc une identite
               neuve a chaque rendu, et dont la valeur de retour change de forme. */
            renderEmptyState={
              etat === 'squelettes'
                ? () => null
                : () => <p className="py-8 text-center text-sm text-muted">Aucun ticket trouvé</p>
            }
          >
            {etat === 'squelettes'
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Table.Row id={`skeleton-${i}`} key={`skeleton-${i}`}>
                    {Array.from({ length: nbColonnes }).map((_, j) => (
                      <Table.Cell className="h-12" key={`sq-${j}`}>
                        <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : table.getRowModel().rows.map((row) => (
                  <Table.Row id={row.id} key={row.id}>
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
    </Table>
  );
}

export default function ApercuCorpsTableau() {
  const [etat, setEtat] = React.useState<Etat>('lignes');
  const [erreurs, setErreurs] = React.useState<string[]>([]);
  const [cle, setCle] = React.useState(0);

  const noter = React.useCallback((e: Error) => {
    setErreurs((liste) => [...liste, `${e.name}: ${e.message}`]);
  }, []);

  /*
   * Ce que fait Chrome quand il traduit une page.
   *
   * <p>Il n'ecrase pas le texte : il ENVELOPPE chaque noeud de texte dans un
   * `<font>`. Le noeud que React avait place n'est donc plus enfant de l'element ou
   * React croit l'avoir mis. Au demontage suivant, `removeChild` echoue avec
   * exactement « The node to be removed is not a child of this node ».</p>
   *
   * <p>C'est la seule mutation exterieure a React qui explique une pile de
   * `commitDeletion`. Le navigateur de la capture d'ecran est en francais, et
   * `app/layout.tsx` declarait `lang="en"` sur une interface entierement francaise :
   * Chrome proposait donc la traduction, et l'appliquait si elle avait ete acceptee
   * une fois.</p>
   */
  const simulerTraduction = () => {
    const zone = document.querySelector('[role="grid"]') ?? document.body;
    const parcours = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
    const noeuds: Text[] = [];
    let n = parcours.nextNode();
    while (n) {
      if (n.nodeValue && n.nodeValue.trim()) noeuds.push(n as Text);
      n = parcours.nextNode();
    }
    noeuds.forEach((noeud) => {
      const enveloppe = document.createElement('font');
      noeud.parentNode?.insertBefore(enveloppe, noeud);
      enveloppe.appendChild(noeud);
    });
    setErreurs((l) => [...l, `${noeuds.length} nœuds de texte enveloppés dans un <font>`]);
  };

  // La sequence de production : de vraies lignes, puis des squelettes, puis rien.
  const rejouer = async () => {
    setErreurs([]);
    setEtat('lignes');
    await new Promise((r) => setTimeout(r, 300));
    setEtat('squelettes');
    await new Promise((r) => setTimeout(r, 300));
    setEtat('vide');
  };

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc du corps de tableau</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Rejoue la séquence de l&apos;écran des tickets quand un filtre ne rend rien : vingt
        lignes, puis dix squelettes sans aucun identifiant commun, puis zéro ligne et
        l&apos;état vide.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onPress={rejouer} size="sm" variant="primary">
          Rejouer la séquence
        </Button>
        <Button onPress={() => setEtat('lignes')} size="sm" variant="ghost">
          Lignes
        </Button>
        <Button onPress={() => setEtat('squelettes')} size="sm" variant="ghost">
          Squelettes
        </Button>
        <Button onPress={() => setEtat('vide')} size="sm" variant="ghost">
          Vide
        </Button>
        <Button
          onPress={() => {
            setCle((k) => k + 1);
            setErreurs([]);
            setEtat('lignes');
          }}
          size="sm"
          variant="ghost"
        >
          Remonter
        </Button>
        <Button onPress={simulerTraduction} size="sm" variant="ghost">
          Simuler une traduction
        </Button>
      </div>

      <p className="mb-3 text-xs text-muted">
        État courant <span className="font-semibold text-foreground">{etat}</span>
      </p>

      {erreurs.length > 0 ? (
        <ul className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs text-danger-600">
          {erreurs.map((e, i) => (
            <li key={`err-${i}`}>{e}</li>
          ))}
        </ul>
      ) : null}

      <Filet key={cle} onErreur={noter}>
        <CorpsQuiChange etat={etat} />
      </Filet>
    </div>
  );
}
