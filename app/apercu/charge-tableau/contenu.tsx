'use client';

import { Button, Table } from '@heroui-v3/react';
import React from 'react';
import { TableLayout, Virtualizer } from 'react-aria-components';

/**
 * Banc de charge : combien coûte le `Table` v3 quand les lignes s'accumulent ?
 *
 * <p>Le tableau des tickets charge ses pages par cinquante et les empile. On mesure ici
 * le temps de rendu et la mémoire du tas à chaque palier, pour savoir si la croissance
 * est linéaire ou si elle part.</p>
 */
const COLONNES = [
  'Code',
  'Livreur',
  'Partenaire',
  'Zone',
  'Livraison',
  'Commande',
  'Commission',
  'Date',
  'Heure',
  'Statut',
  'Créé par',
] as const;

/** Enveloppe le tableau dans le virtualiseur de react-aria, ou non. */
function MaybeVirtualizer({ actif, children }: { actif: boolean; children: React.ReactNode }) {
  if (!actif) return <>{children}</>;
  return (
    <Virtualizer layout={TableLayout} layoutOptions={{ headingHeight: 40, rowHeight: 40 }}>
      {children}
    </Virtualizer>
  );
}

interface Mesure {
  lignes: number;
  memoire: number;
  ms: number;
}

export default function ApercuChargeTableau() {
  const [pages, setPages] = React.useState(1);
  const [mode, setMode] = React.useState<'brut' | 'v3' | 'virtuel'>('v3');
  const brut = mode === 'brut';
  const [mesures, setMesures] = React.useState<Mesure[]>([]);
  const debut = React.useRef(0);
  const compteChargements = React.useRef(0);

  const lignes = React.useMemo(
    () =>
      Array.from({ length: pages * 50 }, (_, i) => ({
        code: `16870${String(i).padStart(4, '0')}`,
        commande: 13000 + i,
        commission: 200,
        date: '03/09/2026',
        heure: '19h22',
        id: String(i),
        livraison: 1500,
        livreur: 'OTE Azo',
        par: 'TIALIGA RAMATA COULIBALY',
        partenaire: 'AGHA ZONE 4',
        statut: 'V2 validé',
        zone: 'ZONE 4 | BIÉTRY',
      })),
    [pages],
  );

  React.useLayoutEffect(() => {
    if (!debut.current) return;
    const ms = Math.round(performance.now() - debut.current);
    debut.current = 0;
    // @ts-expect-error mesure de tas, propriete non standard
    const memoire = Math.round((performance.memory?.usedJSHeapSize ?? 0) / 1048576);
    setMesures((p) => [...p, { lignes: lignes.length, memoire, ms }]);
  }, [lignes]);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-background p-4 text-foreground">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onPress={() => {
            debut.current = performance.now();
            setPages((p) => p + 1);
          }}
          variant="primary"
        >
          Charger 50 lignes de plus
        </Button>
        <Button
          onPress={() =>
            setMode((m) => (m === 'v3' ? 'brut' : m === 'brut' ? 'virtuel' : 'v3'))
          }
          variant="outline"
        >
          {mode === 'v3' ? 'Table v3' : mode === 'brut' ? 'Tableau HTML simple' : 'Table v3 virtualisée'}
        </Button>
        <span className="text-sm tabular-nums">{lignes.length} lignes</span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
        {mesures.map((m, i) => (
          <span key={i}>
            {m.lignes} lignes : {m.ms} ms, {m.memoire} Mo
          </span>
        ))}
      </div>

      {brut ? (
        <div className="h-[400px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {COLONNES.map((c) => (
                  <th className="px-3 py-2 text-left" key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">{l.code}</td>
                  <td className="px-3 py-2">{l.livreur}</td>
                  <td className="px-3 py-2">{l.partenaire}</td>
                  <td className="px-3 py-2">{l.zone}</td>
                  <td className="px-3 py-2">{l.livraison}</td>
                  <td className="px-3 py-2">{l.commande}</td>
                  <td className="px-3 py-2">{l.commission}</td>
                  <td className="px-3 py-2">{l.date}</td>
                  <td className="px-3 py-2">{l.heure}</td>
                  <td className="px-3 py-2">{l.statut}</td>
                  <td className="px-3 py-2">{l.par}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <Table>
        <Table.ScrollContainer className="h-[400px]">
          <MaybeVirtualizer actif={mode === 'virtuel'}>
          <Table.Content aria-label="Banc de charge">
            <Table.Header>
              {COLONNES.map((c, i) => (
                <Table.Column id={c} isRowHeader={i === 0} key={c}>
                  {c}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {/* La sentinelle de chargement vit DANS la collection : c'est ce que
                  `Table.LoadMore` fait, et c'est la seule facon de la faire cohabiter
                  avec le virtualiseur, qui ne rend que ce qui est visible. */}
              {lignes.map((l) => (
                <Table.Row id={l.id} key={l.id}>
                  <Table.Cell>{l.code}</Table.Cell>
                  <Table.Cell>{l.livreur}</Table.Cell>
                  <Table.Cell>{l.partenaire}</Table.Cell>
                  <Table.Cell>{l.zone}</Table.Cell>
                  <Table.Cell>{l.livraison}</Table.Cell>
                  <Table.Cell>{l.commande}</Table.Cell>
                  <Table.Cell>{l.commission}</Table.Cell>
                  <Table.Cell>{l.date}</Table.Cell>
                  <Table.Cell>{l.heure}</Table.Cell>
                  <Table.Cell>{l.statut}</Table.Cell>
                  <Table.Cell>{l.par}</Table.Cell>
                </Table.Row>
              ))}
              <Table.LoadMore
                isLoading={false}
                onLoadMore={() => {
                  compteChargements.current += 1;
                  setPages((p) => (p < 20 ? p + 1 : p));
                }}
              >
                <Table.LoadMoreContent>
                  Chargement… ({compteChargements.current} appels)
                </Table.LoadMoreContent>
              </Table.LoadMore>
            </Table.Body>
          </Table.Content>
          </MaybeVirtualizer>
        </Table.ScrollContainer>
      </Table>
      )}
    </div>
  );
}
