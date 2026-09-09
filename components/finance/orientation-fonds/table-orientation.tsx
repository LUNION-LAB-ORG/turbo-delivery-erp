'use client';

import { Button, Card, Checkbox, Table } from '@heroui-v3/react';
import { Landmark, X } from 'lucide-react';
import React from 'react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import { formatMontant } from '@/utils/format.utils';

import { formatDateFr, type LigneOrientation } from './ligne-orientation';

/**
 * La file d'orientation des fonds, sur un poste de travail et au doigt.
 *
 * <h3>Pourquoi ce n'est plus une grille de cartes</h3>
 * <p>L'ecran affichait quatre cent cinquante-quatre operations homogenes en cartes, trois
 * par rangee, chacune portant un bouton rouge pleine largeur « Orienter les fonds ». Cent
 * cinquante-trois boutons rouges identiques a l'ecran : quand chaque ligne appelle le MEME
 * geste, la couleur ne distingue plus rien, elle fait un mur. Et trois montants poses a
 * trois abscisses differentes ne se comparent pas.</p>
 *
 * <p>Ce sont des lignes comparables portant une seule decision : c'est un tableau, avec
 * les montants a droite en chasse tabulaire, une case a cocher par ligne, et l'accent
 * deplace sur le geste EN LOT (voir `BarreLotOrientation`). Le geste ligne a ligne ne
 * disparait pas : il reste, en bouton secondaire, pour la decision isolee.</p>
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
       * Bouton SECONDAIRE, et c'est le coeur de la correction : toutes les lignes
       * appellent le meme geste, donc aucune ne merite l'accent. Le rouge de marque est
       * garde pour le geste en lot, qui est le seul a distinguer quelque chose.
       */
      rendu: (ligne) => (
        <Button onPress={() => onAction(ligne)} size="sm" variant="outline">
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
              actions={
                <Button className="w-full" onPress={() => onAction(ligne)} variant="outline">
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
 * Le geste en lot, et le seul accent de l'ecran.
 *
 * <p>Elle dit ce qu'elle engage AVANT d'ouvrir la fenetre : combien d'operations, et
 * surtout combien d'argent. Un decideur qui coche vingt lignes ne sait pas de tete ce
 * qu'elles pesent.</p>
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
