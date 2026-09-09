'use client';

import { Button, Card, Checkbox, Table, Tabs } from '@heroui-v3/react';
import { Landmark, X } from 'lucide-react';
import React from 'react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import { formatMontant, formatNombre } from '@/utils/format.utils';

import { formatDateFr, type LigneOrientation } from './ligne-orientation';

/**
 * La file d'orientation des fonds, sur un poste de travail et au doigt.
 *
 * <h3>Pourquoi ce n'est plus une grille de cartes</h3>
 * <p>L'ecran affichait quatre cent cinquante-quatre operations homogenes en cartes, trois
 * par rangee, chacune portant un bouton pleine largeur « Orienter les fonds ». Ce qui
 * faisait mur, ce n'etait pas la couleur : c'etait la LARGEUR, cent cinquante-trois fois
 * repetee. Et trois montants poses a trois abscisses differentes ne se comparent pas.</p>
 *
 * <p>Ce sont des lignes comparables portant une seule decision : c'est un tableau, avec
 * les montants a droite en chasse tabulaire et une case a cocher par ligne. Le geste de la
 * ligne, lui, est le geste de l'ecran : il reprend l'accent, dans un bouton COMPACT qui
 * tient dans sa colonne. Une passe precedente l'avait passe en contour neutre et avait
 * neutralise l'ecran entier ; un mur de gris ne dit pas plus qu'un mur de rouge.</p>
 *
 * <h3>Ce que ce composant ne reprend pas de `TableauResponsive`</h3>
 * <p>Le tableau commun ne sait pas selectionner (ni case par ligne, ni en-tete portant un
 * noeud) alors que la selection est ici le mecanisme central. Le motif suivi est donc
 * celui, deja resolu dans ce module, de `responsable-financier-view.tsx`.</p>
 */

/** Une colonne, declaree UNE fois : en-tete, squelette et cellule en derivent ensemble. */
interface ColonneOrientation {
  cle: string;
  libelle: string;
  /** Un chiffre : chasse tabulaire et alignement a droite. */
  nombre?: boolean;
  rendu: (ligne: LigneOrientation) => React.ReactNode;
  /** L'en-tete n'a rien a dire a l'oeil, mais un lecteur d'ecran l'annonce. */
  sansEnTeteVisible?: boolean;
}

function CelluleVisa({ ligne }: { ligne: LigneOrientation }) {
  if (!ligne.numeroVisa) {
    return <span className="text-sm text-muted">À poser à la décision</span>;
  }
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-sm text-foreground">{ligne.numeroVisa}</span>
      <span className="text-xs text-muted">
        {formatDateFr(ligne.dateVisa)}
        {ligne.viseur ? ` · ${ligne.viseur}` : ''}
      </span>
    </span>
  );
}

export function TableauOrientation({
  enChargement = false,
  estSelectionnee,
  libelle,
  libelleAction,
  lignes,
  onAction,
  onBasculer,
  onPage,
  page = 1,
  totalPages = 0,
  vide,
}: {
  enChargement?: boolean;
  /** Absent avec `onBasculer` : la file ne se selectionne pas (cas de la caisse). */
  estSelectionnee?: (id: string) => boolean;
  /** Nom accessible du tableau. */
  libelle: string;
  libelleAction: string;
  lignes: readonly LigneOrientation[];
  onAction: (ligne: LigneOrientation) => void;
  onBasculer?: (id: string) => void;
  onPage?: (p: number) => void;
  page?: number;
  totalPages?: number;
  vide: string;
}) {
  const selectionnable = typeof onBasculer === 'function' && typeof estSelectionnee === 'function';

  const colonnes: ColonneOrientation[] = [];

  if (selectionnable) {
    colonnes.push({
      cle: 'selection',
      libelle: 'Sélection',
      rendu: (ligne) => (
        <Checkbox
          aria-label={`Sélectionner ${ligne.numero}`}
          isSelected={estSelectionnee(ligne.id)}
          onChange={() => onBasculer(ligne.id)}
          /*
           * `slot={null}` : dans un `Table` v3, tout `Checkbox` est branche d'office sur
           * le contexte de selection de la table et exige `slot="selection"`, faute de
           * quoi React Aria leve « A slot prop is required » et la page tombe en 500. La
           * selection vit ici dans un `Set` de l'ecran, dont depend le geste en lot.
           */
          slot={null}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      ),
      sansEnTeteVisible: true,
    });
  }

  colonnes.push(
    {
      cle: 'numero',
      libelle: 'N° facture',
      rendu: (ligne) => (
        <span className="text-sm font-medium whitespace-nowrap text-foreground">{ligne.numero}</span>
      ),
    },
    {
      cle: 'partenaire',
      libelle: 'Partenaire',
      rendu: (ligne) => <span className="text-sm text-foreground">{ligne.partenaire}</span>,
    },
    {
      cle: 'montant',
      libelle: 'Montant',
      nombre: true,
      /*
       * Le montant INFORME : il n'est ni une alerte ni une perte, donc il n'est pas
       * colore. Ce qui compte ici, c'est qu'il se compare d'une ligne a l'autre.
       */
      rendu: (ligne) => (
        <span className="text-sm font-semibold whitespace-nowrap text-foreground">
          {formatMontant(ligne.montant)}
        </span>
      ),
    },
    {
      cle: 'visa',
      libelle: 'Visa DGA',
      rendu: (ligne) => <CelluleVisa ligne={ligne} />,
    },
    {
      cle: 'action',
      libelle: 'Décision',
      /*
       * L'ACCENT, et c'est le coeur de la correction. « Orienter » est l'action de cet
       * ecran : c'est exactement ce que l'accent est fait pour marquer. Le contour neutre
       * qui etait ici disait que rien n'appelait de geste, ce qui est faux de toutes les
       * lignes. Compact et enferme dans sa colonne, il ne refait pas le mur des cartes.
       */
      rendu: (ligne) => (
        <Button onPress={() => onAction(ligne)} size="sm" variant="primary">
          {libelleAction}
        </Button>
      ),
    },
  );

  return (
    <>
      {/* Tableau, poste de travail (>= md, soit la fenetre reelle de 1000 px) */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={libelle} className="min-w-[44rem]">
                <Table.Header>
                  {colonnes.map((c) => (
                    <Table.Column
                      className={c.nombre ? 'text-right' : undefined}
                      id={c.cle}
                      /* L'en-tete de ligne est le numero de facture, jamais la case a cocher. */
                      isRowHeader={c.cle === 'numero'}
                      key={c.cle}
                    >
                      {c.sansEnTeteVisible ? <span className="sr-only">{c.libelle}</span> : c.libelle}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    enChargement ? null : <p className="py-8 text-center text-sm text-muted">{vide}</p>
                  }
                >
                  {/*
                   * Le squelette compte ses cellules sur les MEMES colonnes que les lignes
                   * reelles : un compte tenu a la main derive des qu'on ajoute une colonne,
                   * et « Cell count must match column count » emporte la page en 500.
                   */}
                  {enChargement
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {colonnes.map((c) => (
                            <Table.Cell key={`sq-${i}-${c.cle}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : lignes.map((ligne) => (
                        <Table.Row id={ligne.id} key={ligne.id}>
                          {colonnes.map((c) => (
                            <Table.Cell
                              className={c.nombre ? 'text-right tabular-nums' : undefined}
                              key={c.cle}
                            >
                              {c.rendu(ligne)}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {/* `Table.Footer` est FRERE de `ScrollContainer` : dedans, il ne rend rien. */}
            {onPage && totalPages > 1 && (
              <Table.Footer className="justify-center">
                <PaginationTableau onPage={onPage} page={page} total={totalPages} />
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* Cartes tactiles, telephone (< md) */}
      <MobileCardList>
        {enChargement ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" key={i} />
          ))
        ) : lignes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{vide}</p>
        ) : (
          lignes.map((ligne) => (
            <FactureMobileCard
              /* Meme geste, meme accent qu'au poste de travail. Il n'est PAS pleine
                 largeur : empile sur une colonne de cartes, c'est la largeur qui refait
                 le mur, et le pouce atteint aussi bien un bouton pose a droite. */
              actions={
                <Button className="self-end" onPress={() => onAction(ligne)} variant="primary">
                  {libelleAction}
                </Button>
              }
              fields={[
                { label: 'Visa DGA', value: ligne.numeroVisa ?? 'À poser à la décision' },
                { label: 'Date du visa', value: ligne.numeroVisa ? formatDateFr(ligne.dateVisa) : '' },
                { label: 'Viseur', value: ligne.viseur ?? '' },
              ]}
              key={ligne.id}
              montant={formatMontant(ligne.montant)}
              numero={ligne.numero}
              partenaire={ligne.partenaire}
              statut={
                <span className="text-xs whitespace-nowrap text-muted">
                  {ligne.numeroVisa ? 'Visé DGA' : 'En attente visa DGA'}
                </span>
              }
            />
          ))
        )}
        {onPage && totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <PaginationTableau onPage={onPage} page={page} total={totalPages} />
          </div>
        )}
      </MobileCardList>
    </>
  );
}

/**
 * Le geste en lot.
 *
 * <p>Elle dit ce qu'elle engage AVANT d'ouvrir la fenetre : combien d'operations, et
 * surtout combien d'argent. Un decideur qui coche vingt lignes ne sait pas de tete ce
 * qu'elles pesent.</p>
 *
 * <p>Le bouton porte l'accent, comme celui de la ligne : c'est le meme geste, a une autre
 * echelle. La croix qui vide la selection n'engage rien, elle reste neutre.</p>
 */
export function BarreLotOrientation({
  montant,
  nombre,
  onEffacer,
  onOrienter,
  precision,
}: {
  montant: number;
  nombre: number;
  onEffacer: () => void;
  onOrienter: () => void;
  /** Ce que la selection recouvre quand elle deborde la page affichee. */
  precision?: string;
}) {
  if (nombre === 0) return null;

  return (
    <Card className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 shadow-xl">
      <Card.Content className="flex-row items-center gap-3 px-3 py-2">
        <Button aria-label="Vider la sélection" onPress={onEffacer} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
        </Button>
        <span className="flex flex-col leading-tight">
          <span className="text-sm text-foreground">
            <b className="tabular-nums">{nombre}</b> opération{nombre > 1 ? 's' : ''}
            <span className="text-muted"> · </span>
            <b className="tabular-nums">{formatMontant(montant)}</b>
          </span>
          {precision && <span className="text-xs text-muted">{precision}</span>}
        </span>
        <Button onPress={onOrienter} size="sm" variant="primary">
          <Landmark aria-hidden="true" className="size-4" />
          Orienter les fonds
        </Button>
      </Card.Content>
    </Card>
  );
}


/** Le trait de l'onglet ouvert. Voir le bloc de `OngletsOrientation` : `Tabs.Indicator`
 *  est inutilisable dans ce projet. Le reste ouvre la hauteur, que `.tabs__tab` fige a
 *  `h-8` : l'onglet porte DEUX lignes, son nom et ce qu'il pese. */
const MARQUE_ONGLET =
  'h-auto flex-col gap-0 border-b-2 border-transparent py-2 data-[selected=true]:border-accent data-[selected=true]:font-semibold';

/**
 * Ce que l'onglet annonce : un compte et un montant.
 *
 * <p>Un onglet qui ne porte que son nom cache ce qu'il y a derriere, exactement comme le
 * menu deroulant qu'il remplace. Une lecture qui echoue le DIT : elle n'annonce pas zero,
 * ce qui se lirait comme « plus rien a orienter ».</p>
 */
function ResumeOnglet({
  enChargement,
  enErreur,
  montant,
  nombre,
  precision,
}: {
  enChargement?: boolean;
  enErreur?: boolean;
  montant?: number;
  nombre: number;
  precision?: string;
}) {
  if (enChargement) {
    return <span className="mt-1 h-3 w-24 animate-pulse rounded bg-surface-secondary" />;
  }
  if (enErreur) {
    return <span className="text-xs font-normal text-muted">indisponible</span>;
  }
  return (
    <span className="text-xs font-normal tabular-nums text-muted">
      {formatNombre(nombre)}
      {typeof montant === 'number' && ` · ${formatMontant(montant)}`}
      {precision && ` · ${precision}`}
    </span>
  );
}

/** Un ensemble de l'ecran : son nom, ce qu'il pese, et ce qu'il y a dedans. */
export interface OngletOrientation {
  cle: string;
  enChargement?: boolean;
  enErreur?: boolean;
  libelle: string;
  /** Absent : l'onglet n'a pas de montant a annoncer (un registre, par exemple). */
  montant?: number;
  nombre: number;
  panneau: React.ReactNode;
  /** Une precision qui suit le montant. Une date de derniere piece, par exemple. */
  precision?: string;
}

/**
 * Les ensembles de l'ecran, en onglets plutot qu'empiles.
 *
 * <h3>Pourquoi des onglets</h3>
 * <p>L'ecran empilait un menu deroulant « File », un tableau de vingt lignes pagine, puis
 * un SECOND tableau de vingt lignes : on ne l'atteignait qu'au defilement, et le menu
 * deroulant cachait aussi bien ce qu'il contenait que ce qu'il pesait. Chaque onglet dit
 * son compte et son montant : on sait ce qu'il y a derriere sans l'ouvrir, et une seule
 * liste tient l'ecran a la fois.</p>
 *
 * <h3>Pourquoi le trait est dessine a la main</h3>
 * <p>`Tabs.Indicator` est la piece prevue pour cela, et elle NE FONCTIONNE PAS ici : rendue
 * telle quelle elle leve « &lt;SharedElement&gt; must be rendered inside a
 * &lt;SharedElementTransition&gt; » et emporte la page en 500 ; enveloppee dans un
 * `SharedElementTransition`, la page tient mais l'indicateur ne rend RIEN, zero noeud
 * `.tabs__indicator` dans le document. Mesure a l'ecran, dans
 * `recouvrement-content-tabs.tsx`, dont ce composant reprend le motif : `variant="secondary"`,
 * un `Tabs.ListContainer` autour de la liste, et le trait pose sur l'onglet lui-meme.</p>
 *
 * <p>Le trait prend l'accent, et c'est legitime : il ne colorie pas une categorie, il dit
 * ou l'on est.</p>
 */
export function OngletsOrientation({
  onSelection,
  onglets,
  selection,
}: {
  onSelection: (cle: string) => void;
  onglets: readonly OngletOrientation[];
  selection: string;
}) {
  return (
    <Tabs
      className="w-full"
      onSelectionChange={(cle) => onSelection(String(cle))}
      selectedKey={selection}
      variant="secondary"
    >
      {/* Le conteneur gere lui-meme le debordement et sort ses chevrons : sur la fenetre
          reelle des postes (1000 px), quatre onglets a deux lignes ne tiennent pas
          toujours d'un bloc. */}
      <Tabs.ListContainer>
        <Tabs.List>
          {onglets.map((o) => (
            <Tabs.Tab className={MARQUE_ONGLET} id={o.cle} key={o.cle}>
              <span className="text-sm">{o.libelle}</span>
              <ResumeOnglet
                enChargement={o.enChargement}
                enErreur={o.enErreur}
                montant={o.montant}
                nombre={o.nombre}
                precision={o.precision}
              />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      {onglets.map((o) => (
        <Tabs.Panel className="px-0 pt-4" id={o.cle} key={o.cle}>
          {o.panneau}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
