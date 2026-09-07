'use client';

import { useMemo, useState } from 'react';
import { ColumnDef, getCoreRowModel, flexRender, useReactTable } from '@tanstack/react-table';
import { Alert, Button, Card, Chip, Input, Switch, Table, TextField, Tooltip } from '@heroui-v3/react';
import { AlertTriangle, CheckCircle2, HelpCircle, Pencil, ShieldCheck } from 'lucide-react';

import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { cn } from '@/lib/utils';
import { IGrillePaiementLigne, StatutLignePaiement, TypeLivreur } from '../types/grille-paiement.type';
import FichePaieButton from './FichePaieButton';

interface Props {
  lignes: IGrillePaiementLigne[];
  onRowClick: (ligne: IGrillePaiementLigne) => void;
  onUpdateWave: (turboyId: string, value: string) => void;
  onValiderLigne: (ligne: IGrillePaiementLigne) => void;
  /**
   * V54 (2026-05) — Demande d'override Comptable sur l'inclusion d'une
   * ligne dans le "Total à payer". {@code nextValue} = état cible que la
   * bascule veut atteindre. La modale de justification est ouverte par
   * le parent ; on ne mute pas directement ici.
   */
  onToggleInclusion?: (ligne: IGrillePaiementLigne, nextValue: boolean) => void;
  /**
   * V54 (2026-05) — true si l'utilisateur courant est Comptable (les
   * autres rôles voient la colonne en lecture seule).
   */
  canEditInclusion?: boolean;
  waveManquants: number;
  creneauDebut: Date;
  creneauFin: Date;
  readOnly?: boolean;
}

/**
 * V54 (2026-05) — Détermine l'inclusion effective dans le totalAPayer en
 * appliquant la même règle que le backend : si {@code inclusDansPaie} est
 * explicitement set (override Comptable), on l'utilise ; sinon défaut basé
 * sur le type ({@code INDEPENDANT} → true, {@code JOURNALIER/SUPERVISEUR_LIVREUR}
 * → false, null → false aussi en attendant la catégorisation RH).
 */
function effectiveInclusion(ligne: IGrillePaiementLigne): boolean {
  if (ligne.inclusDansPaie !== null && ligne.inclusDansPaie !== undefined) {
    return ligne.inclusDansPaie;
  }
  return ligne.typeLivreur === 'INDEPENDANT';
}

/**
 * Pastille du type de collaborateur — partagée colonne + carte mobile.
 *
 * <h3>Ce qui change</h3>
 * <p>Cet écran peignait les quatre types en vert, bleu, violet et ambre, avec ce
 * raisonnement écrit dans le fichier : « quatre valeurs qui doivent se distinguer d'un
 * coup d'œil dans un tableau de paie ». Sauf que ce qu'elles décident — être incluses ou
 * non dans le « Total à payer » — a sa PROPRE colonne juste à côté, avec un interrupteur
 * qui le dit, son état, son infobulle et sa dérogation Comptable. La couleur du type
 * répétait donc, en moins précis, ce que la colonne voisine énonçait.</p>
 *
 * <p>Surtout, les mêmes quatre valeurs étaient neutres dans la liste des livreurs et
 * colorées ici : l'ERP se contredisait d'un écran à l'autre sur le sens de la couleur.
 * Le référentiel `getTurboyTypeDisplay` tranche pour tout le monde — neutre pour les
 * trois types réels, et une teinte pour le seul « À catégoriser », qui n'est pas une
 * catégorie mais une LACUNE : un contrat que la RH n'a pas qualifié, et qui tombe donc
 * hors du circuit de paie sans que personne l'ait décidé.</p>
 */
function TypeLivreurChip({ type }: { type: null | TypeLivreur | undefined }) {
  const { chipColor, label } = getTurboyTypeDisplay(type);
  return (
    <Chip className="whitespace-nowrap" color={chipColor} size="sm" variant="soft">
      {!type && <HelpCircle aria-hidden="true" className="size-3" />}
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

function WaveReadOnlyCell({ ligne }: { ligne: IGrillePaiementLigne }) {
  return ligne.numeroWave ? (
    <span className="text-foreground tabular-nums">{ligne.numeroWave}</span>
  ) : (
    <span className="italic text-muted">non renseigné</span>
  );
}

function WaveCell({ ligne, onUpdateWave }: { ligne: IGrillePaiementLigne; onUpdateWave: (turboyId: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ligne.numeroWave ?? '');

  const commit = () => {
    setEditing(false);
    onUpdateWave(ligne.turboy.id, draft.trim());
  };

  if (editing) {
    return (
      /*
       * Le champ etait un `input` brut sans etiquette, habille d'un bleu ecrit en dur
       * (bordure, fond, anneau de focus) sans equivalent sombre : en theme sombre, la
       * saisie du numero Wave se faisait en bleu pale sur bleu pale. `TextField` porte
       * l'etiquette accessible, `Input` porte le cadre et suit le theme.
       *
       * Le `div` reste : la LIGNE du tableau a son propre `onClick` qui ouvre le detail,
       * et un clic dans le champ ne doit pas l'ouvrir par dessus la saisie.
       */
      <div onClick={(e) => e.stopPropagation()}>
        <TextField
          aria-label={`Numéro Wave de ${ligne.turboy.nom}`}
          fullWidth
          onChange={setDraft}
          value={draft}
        >
          <Input
            autoFocus
            fullWidth
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(ligne.numeroWave ?? '');
                setEditing(false);
              }
            }}
            placeholder="N° Wave…"
          />
        </TextField>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/*
       * Le declencheur d'edition etait un `div` avec un `onClick` et un crayon revele au
       * survol. Deux consequences concretes : un operateur au clavier ne pouvait pas
       * atteindre le champ, et sur telephone — ou le meme composant est rendu et ou il
       * n'y a pas de survol — le crayon n'apparaissait JAMAIS, donc rien n'indiquait que
       * le numero etait modifiable. `Button` porte le role, le clavier et le focus ; le
       * crayon reste affiche en permanence.
       */}
      <Button
        aria-label={`Modifier le numéro Wave de ${ligne.turboy.nom}`}
        onPress={() => {
          setDraft(ligne.numeroWave ?? '');
          setEditing(true);
        }}
        size="sm"
        variant="ghost"
      >
        {ligne.numeroWave ? (
          <span className="tabular-nums">{ligne.numeroWave}</span>
        ) : (
          <span className="italic text-muted">non renseigné</span>
        )}
        <Pencil aria-hidden="true" className="size-3" />
      </Button>
    </div>
  );
}

function formatNumber(n: number) {
  return n.toLocaleString('fr-FR');
}

/**
 * V54 (2026-05) — Bascule d'inclusion dans le « Total à payer ». Extraite pour
 * être réutilisée à l'identique par la colonne du tableau et la carte mobile
 * (même règle d'override Comptable, même rendu). Le clic ouvre la modale
 * justification dans le parent — pas de mutation directe ici.
 */
function InclusionToggle({
  ligne,
  canEditInclusion,
  readOnly,
  onToggleInclusion,
}: {
  ligne: IGrillePaiementLigne;
  canEditInclusion: boolean;
  readOnly: boolean;
  onToggleInclusion?: (ligne: IGrillePaiementLigne, nextValue: boolean) => void;
}) {
  const included = effectiveInclusion(ligne);
  const isOverride = ligne.inclusDansPaie !== null && ligne.inclusDansPaie !== undefined;
  const canEdit = canEditInclusion && !readOnly && onToggleInclusion;
  const etatInclusion = isOverride
    ? 'Override Comptable (cf. journal)'
    : included
      ? 'Inclus par défaut (Indépendant)'
      : 'Exclu par défaut (Journalier/Superviseur/À catégoriser)';
  // L'interrupteur grise ne disait que son etat, jamais pourquoi il refuse le clic : on fait
  // preceder l'etat par la cause du blocage, le droit d'abord.
  const motifBlocage = !canEditInclusion
    ? "Votre rôle ne permet pas de modifier l'inclusion en paie"
    : readOnly
      ? 'Grille en lecture seule'
      : !onToggleInclusion
        ? 'Modification indisponible sur cet écran'
        : '';
  /*
   * `Switch` porte le role, l'etat, le clavier et le theme. La derogation Comptable, elle,
   * reste signalee par un anneau : c'est une information que le composant n'a pas.
   *
   * La piste et la pastille sont des ENFANTS explicites. Sans elles, `Switch` ne dessine
   * rien : la colonne "Inclus" apparaissait vide sur toutes les lignes, et la derogation
   * Comptable — la seule facon de sortir un livreur du "Total a payer" — n'etait plus
   * atteignable qu'au clavier, a l'aveugle.
   */
  const infobulle = motifBlocage ? `${motifBlocage}. ${etatInclusion}` : etatInclusion;

  return (
    <Tooltip>
      {/*
       * Le declencheur doit etre un `Tooltip.Trigger`, pas la bascule elle-meme.
       *
       * <p>`TooltipTrigger` publie ses gestionnaires par un CONTEXTE que le composant
       * enfant doit consommer ; `Switch` ne le fait pas. Poser la bascule nue dans le
       * `Tooltip` ne branchait donc rien : l'info-bulle ne s'ouvrait dans AUCUN cas. Et
       * quand la bascule est desactivee, elle n'emet de toute facon ni survol ni focus.</p>
       *
       * <p>Consequence : les trois motifs de blocage — role insuffisant, grille en lecture
       * seule, modification indisponible sur cet ecran — devenaient invisibles, alors
       * qu'ils sont la SEULE explication d'un clic qui ne fait rien. Le `<label>` d'origine
       * portait un `title` natif, qui lui s'affichait dans tous les cas.</p>
       */}
      <Tooltip.Trigger>
        <span aria-label={infobulle} className="inline-flex" role="presentation" title={infobulle}>
          <Switch
            aria-label="Inclure ce livreur dans la paie"
            className={isOverride ? 'rounded-full ring-2 ring-warning/50 ring-offset-1' : undefined}
            isDisabled={!canEdit}
            isSelected={included}
            onChange={(v) => onToggleInclusion?.(ligne, v)}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>{infobulle}</Tooltip.Content>
    </Tooltip>
  );
}

/** Badge statut OK / Wave manquant — partagé colonne + carte mobile. */
function StatutBadge({ statut }: { statut?: StatutLignePaiement }) {
  /*
   * Les deux etats tombent pile sur l'echelle semantique de la bibliotheque, contrairement
   * au type de collaborateur : le vert et l'orange etaient ecrits en dur et sans variante
   * sombre, `color` les porte et suit le theme.
   */
  return statut === 'OK' ? (
    <Chip color="success" size="sm" variant="soft">
      <CheckCircle2 aria-hidden="true" className="size-3" />
      <Chip.Label>OK</Chip.Label>
    </Chip>
  ) : (
    <Chip color="warning" size="sm" variant="soft">
      <AlertTriangle aria-hidden="true" className="size-3" />
      <Chip.Label>Wave</Chip.Label>
    </Chip>
  );
}

export default function GrillePaiementTable({
  lignes,
  onRowClick,
  onUpdateWave,
  onValiderLigne,
  onToggleInclusion,
  canEditInclusion = false,
  waveManquants,
  creneauDebut,
  creneauFin,
  readOnly = false,
}: Props) {
  const columns = useMemo<ColumnDef<IGrillePaiementLigne>[]>(
    () => [
      {
        id: 'turboy',
        header: 'Turboy',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-foreground">{row.original.turboy.nom}</p>
            <p className="text-[11px] text-muted">{row.original.turboy.telephone || row.original.turboy.code}</p>
          </div>
        ),
      },
      // V54 (2026-05) — Type de collaborateur. Teinte par type ;
      // "À catégoriser" en orange pour signaler une action RH requise.
      {
        id: 'typeLivreur',
        header: 'Type',
        cell: ({ row }) => <TypeLivreurChip type={row.original.typeLivreur} />,
      },
      // V54 (2026-05) — Inclusion dans le "Total à payer". Bascule éditable
      // uniquement si Comptable + lot pas verrouillé ; sinon lecture seule.
      // Le clic ouvre la modale justification dans le parent — pas de mutation
      // directe ici pour éviter une bascule sans audit.
      {
        id: 'inclusion',
        header: () => <div className="w-full text-center">Inclus</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <InclusionToggle
              ligne={row.original}
              canEditInclusion={canEditInclusion}
              readOnly={readOnly}
              onToggleInclusion={onToggleInclusion}
            />
          </div>
        ),
      },
      {
        id: 'tickets',
        header: () => <div className="w-full text-right">Tickets</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums text-foreground">{row.original.tickets}</div>
        ),
      },
      {
        id: 'totalFraisLivraison',
        header: () => <div className="w-full text-right">Total realise</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums text-foreground">
            {formatNumber(row.original.totalFraisLivraison ?? 0)}
          </div>
        ),
      },
      {
        id: 'taux',
        header: () => <div className="w-full text-right">Taux</div>,
        cell: ({ row }) => <div className="text-right tabular-nums text-foreground">{row.original.taux}%</div>,
      },
      {
        id: 'net',
        header: () => <div className="w-full text-right">Commission</div>,
        // `text-emerald-600` etait ecrit en dur, sans variante sombre : le montant a verser
        // restait vert clair sur fond fonce, illisible au moment de verifier une paie.
        // `text-success-soft-foreground` porte le meme sens et a ses deux themes.
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-success-soft-foreground">
            {formatNumber(row.original.netAPayer)}
          </div>
        ),
      },
      // CDC RG-19 — Prime hebdomadaire (10 % du brut) versée séparément ; 0 si
      // non éligible. Montant déjà renvoyé par ligne par le backend (prime).
      {
        id: 'prime',
        header: () => <div className="w-full text-right">Prime 10%</div>,
        cell: ({ row }) => {
          const prime = row.original.prime ?? 0;
          // Le violet distingue la prime de la commission, deux montants voisins dans la
          // meme ligne ; aucun jeton ne le porte, on garde la teinte et on lui ajoute son
          // cran sombre.
          return prime > 0 ? (
            <div className="text-right font-medium tabular-nums text-violet-600 dark:text-violet-400">
              {formatNumber(prime)}
            </div>
          ) : (
            <div className="text-right text-muted">—</div>
          );
        },
      },
      {
        id: 'wave',
        header: 'N° Wave',
        cell: ({ row }) =>
          readOnly ? <WaveReadOnlyCell ligne={row.original} /> : <WaveCell ligne={row.original} onUpdateWave={onUpdateWave} />,
      },
      {
        id: 'statut',
        header: () => <div className="w-full text-center">Statut</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatutBadge statut={row.original.statut} />
          </div>
        ),
      },
      {
        id: 'action',
        header: '',
        cell: ({ row }) =>
          row.original.flagAttente && !readOnly ? (
            <div onClick={(e) => e.stopPropagation()}>
              {/*
               * Le bouton etait un contour habille d'ambre ecrit en dur, sans variante
               * sombre. En retirant cet habillage il devenait le jumeau visuel de
               * « Fiche de paie », qui ne fait que telecharger un PDF : sur une ligne en
               * attente, la seule action qui engage la paie doit se voir en premier.
               */}
              <Button onPress={() => onValiderLigne(row.original)} size="sm" variant="primary">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Valider
              </Button>
            </div>
          ) : null,
      },
      {
        id: 'fiche',
        header: '',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <FichePaieButton
              turboyId={row.original.turboy.id}
              turboyNom={row.original.turboy.nom}
              creneauDebut={creneauDebut}
              creneauFin={creneauFin}
            />
          </div>
        ),
      },
      {
        id: 'arrow',
        header: '',
        cell: () => (
          <span aria-hidden="true" className="text-muted">
            ›
          </span>
        ),
      },
    ],
    [onUpdateWave, onValiderLigne, onToggleInclusion, canEditInclusion, creneauDebut, creneauFin, readOnly],
  );

  const table = useReactTable({
    data: lignes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-separator bg-surface overflow-hidden overflow-x-auto">
      {!readOnly && waveManquants > 0 && (
        /*
         * Le bandeau etait un rouge ecrit en dur (fond, bordure, titre, texte) sans une
         * seule variante sombre : le blocage le plus important de l'ecran devenait un
         * rectangle rouge pale illisible en theme sombre. `Alert` porte le statut, son
         * icone et ses deux themes.
         */
        <div className="p-4 pb-0">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {waveManquants} numéro{waveManquants > 1 ? 's' : ''} Wave manquant{waveManquants > 1 ? 's' : ''}
              </Alert.Title>
              <Alert.Description>
                Le Créneau ne peut pas être soumis tant que toutes les lignes ne sont pas validées.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      {/* Tableau — desktop uniquement (≥ md) */}
      {/*
       * Tableau — poste de travail (≥ md).
       *
       * <p>`onRowAction` et non un `onClick` sur la rangee : la v3 rend un
       * `<table role="grid">` de react-aria, ou la selection et le clavier passent par la
       * collection. Un `onClick` pose sur `Table.Row` n'y ouvrait le detail qu'a la
       * souris — la rangee restait muette a la touche Entree.</p>
       */}
      <Table className="hidden md:block">
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Grille de paiement"
            className="text-sm"
            onRowAction={(cle) => {
              const ligne = table.getRowModel().rows.find((r) => r.id === String(cle));
              if (ligne) onRowClick(ligne.original);
            }}
          >
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
              renderEmptyState={() => (
                <p className="py-8 text-center text-sm text-muted">Aucune ligne de paiement</p>
              )}
            >
              {table.getRowModel().rows.map((row) => (
                <Table.Row
                  className={cn(
                    'cursor-pointer',
                    // Le surlignage des lignes en attente n'avait pas de cran sombre : elles se
                    // confondaient avec les autres, alors que ce sont justement celles qui
                    // reclament une validation.
                    row.original.flagAttente && 'bg-warning-soft',
                  )}
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
            {/*
             * La rangee de TOTAUX etait ici, en commentaire, avec la mention « desactive
             * temporairement ». Elle peignait ses cellules en `[&>td]:bg-red-600
             * [&>td]:text-white` : une bande rouge pleine largeur pour le total d'une
             * paie ordinaire. Elle est retiree plutot que laissee dormante — la remettre
             * en l'etat reintroduirait ce rouge, et les totaux ont leur place dans
             * `GrillePaiementStats`, au-dessus du tableau, ou ils sont deja rendus.
             */}
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {lignes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucune ligne de paiement</p>
        ) : (
          lignes.map((ligne) => (
            /*
             * Le cadre etait un `div` habille a la main (fond, bordure, arrondi, ombre,
             * rembourrage). C'est une carte de la bibliotheque : elle porte ce cadre et
             * suit le theme sans qu'on le redise. Ne restent que l'ecart entre les lignes
             * et l'etat « en attente », qui lui n'avait pas de cran sombre.
             *
             * `onClick` et non `onPress` : `Card` est un conteneur passif, pas un element
             * pressable de React Aria. Il rend un `div` et lui transmet ses props DOM, donc
             * le rappel arrive bien. C'est la carte ENTIERE qui ouvre le detail, comme la
             * ligne du tableau cote bureau.
             */
            <Card
              key={ligne.turboy.id}
              onClick={() => onRowClick(ligne)}
              className={cn(
                'cursor-pointer gap-2 active:bg-surface-secondary',
                ligne.flagAttente && 'bg-amber-50 active:bg-amber-100 dark:bg-amber-400/10 dark:active:bg-amber-400/20',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{ligne.turboy.nom}</p>
                  <p className="text-[11px] text-muted">{ligne.turboy.telephone || ligne.turboy.code}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatutBadge statut={ligne.statut} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Type</span>
                <TypeLivreurChip type={ligne.typeLivreur} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Tickets</span>
                <span className="text-right text-sm font-medium tabular-nums text-foreground">{ligne.tickets}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Total réalisé</span>
                <span className="text-right text-sm tabular-nums text-foreground">
                  {formatNumber(ligne.totalFraisLivraison ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Taux</span>
                <span className="text-right text-sm tabular-nums text-foreground">{ligne.taux}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Commission</span>
                <span className="text-right text-sm font-semibold tabular-nums text-success-soft-foreground">
                  {formatNumber(ligne.netAPayer)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Prime 10%</span>
                <span className="text-right text-sm font-medium tabular-nums text-violet-600 dark:text-violet-400">
                  {(ligne.prime ?? 0) > 0 ? formatNumber(ligne.prime ?? 0) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">Inclus</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <InclusionToggle
                    ligne={ligne}
                    canEditInclusion={canEditInclusion}
                    readOnly={readOnly}
                    onToggleInclusion={onToggleInclusion}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="shrink-0 text-xs text-muted">N° Wave</span>
                <div className="min-w-0 text-right" onClick={(e) => e.stopPropagation()}>
                  {readOnly ? (
                    <WaveReadOnlyCell ligne={ligne} />
                  ) : (
                    <WaveCell ligne={ligne} onUpdateWave={onUpdateWave} />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {ligne.flagAttente && !readOnly && (
                  <Button fullWidth onPress={() => onValiderLigne(ligne)} size="sm" variant="primary">
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                    Valider
                  </Button>
                )}
                <FichePaieButton
                  turboyId={ligne.turboy.id}
                  turboyNom={ligne.turboy.nom}
                  creneauDebut={creneauDebut}
                  creneauFin={creneauFin}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
