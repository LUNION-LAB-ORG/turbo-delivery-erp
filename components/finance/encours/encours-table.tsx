'use client';

import { ReactNode } from 'react';
import { Chip, Table } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import { IEncoursFacture, IEncoursReleve, cycleLabel, formatFcfa, formatNombre } from '@/features/encours';
import { formatPeriodeFacturee, formatPeriodeFactureeEncours } from '@/lib/finance/periode-facturee';

import { STATUT_EN_RETARD, estAVenir, facturesDuPartenaire, sommeAcomptes } from './encours-derive';

type Cell = { node: ReactNode; cn?: string };
type Line = { key: string; cn?: string; cells: Cell[] };

const STATUT_COLOR: Record<string, 'danger' | 'default' | 'success' | 'warning'> = {
  'En cours': 'default',
  'En retard': 'danger',
  Partiel: 'warning',
  Payé: 'success',
};

/**
 * §5.1 - la periode reellement couverte.
 *
 * Une facture sur plage libre n'a pas de cycle : ses bornes SONT sa periode, et les
 * afficher telles quelles est la seule reponse juste. La reconstruction depuis
 * (annee, mois, cycle) affichait le mois entier pour une facture du 1er au 7 aout,
 * c'est-a-dire une periode que la facture ne couvre pas. Les factures de cycle
 * continuent de passer par le formateur partage, pour que le rendu reste identique a
 * celui de Finance-Recouvrement.
 */
function formatPeriodeLibre(
  debut: string,
  fin: string | null | undefined,
  mode: string | null | undefined,
  cycle: string,
): string {
  const cycleEffectif = mode === 'Plage de dates' ? 'HEBDOMADAIRE' : cycle;
  return formatPeriodeFacturee(cycleEffectif, debut, fin ?? debut);
}

function StatutChip({ statut }: { statut: string }) {
  return (
    <Chip color={STATUT_COLOR[statut] ?? 'default'} size="sm" variant="soft">
      <Chip.Label>{statut}</Chip.Label>
    </Chip>
  );
}

/**
 * Le releve, facture par facture. C'est le coeur de l'ecran : tout le reste le situe.
 *
 * <h3>Trois choses ont change, et pourquoi</h3>
 *
 * <p><b>1. Le bloc d'un partenaire s'ouvre sur son total.</b> Il s'ouvrait sur une bande
 * portant le seul nom du groupe, et se fermait sur une seconde bande « Sous-total » avec
 * les memes couleurs : deux lignes pour delimiter un bloc, et le montant du partenaire
 * n'arrivait qu'en bas. Un etat financier annonce son total puis le detaille. Les deux
 * bandes n'en font plus qu'une, en tete de bloc, et aucun montant n'a ete perdu.</p>
 *
 * <p><b>2. La colonne « Acompte » du sous-total affichait la DEDUCTION.</b> Deux notions
 * differentes dans la meme colonne : ce qui a ete encaisse, et ce qui a ete deduit d'une
 * avance. La ligne etait donc arithmetiquement illisible. La colonne porte desormais la
 * somme des acomptes du partenaire, et la deduction se lit NOMMEE, sur une seconde ligne
 * de la meme colonne d'argent. Elle etait passee sous « Periode facturee » : un montant
 * range sous un intitule qui annonce autre chose, et hors de tout alignement de chiffres.
 * Les deux valeurs sont a droite, en tabulaire, sous les autres montants, et la ligne se
 * verifie : facture − acompte − deduction = reste.</p>
 *
 * <p><b>3. Les periodes « A venir » ne sont plus des lignes de tirets.</b> Une periode non
 * encore facturee n'a ni total, ni acompte, ni solde : elle remplissait le tableau de
 * rangees entierement vides, entre des lignes qui, elles, portent de l'argent. Elle n'a
 * pas disparu - elle est annoncee en une ligne, sous SON point de vente, avec le nom de
 * chaque periode a venir. Au niveau du partenaire, l'operateur lisait « 2 periodes a
 * venir » sans savoir quel etablissement n'etait pas encore facture ; et un point de
 * vente dont TOUTES les periodes sont a venir ne sortait plus aucune rangee, donc plus
 * aucune cellule portant son nom : il disparaissait de l'ecran.</p>
 *
 * <p>Le total general est colle en bas du cadre de defilement : sur un releve long, il
 * sortait de l'ecran des la premiere molette.</p>
 */
export function EncoursTable({
  hauteur,
  releve,
}: {
  /** Hauteur MESUREE du cadre de defilement. Absente, le tableau prend sa hauteur propre. */
  hauteur?: number;
  releve: IEncoursReleve;
}) {
  // `px-2.5` partout plutot que le `px-4` du composant : six colonnes a 32 px de marge
  // interne coutent 192 px de la zone de contenu, qui en fait environ 937 sur la fenetre
  // reelle. Ce n'est pas ce qui faisait deborder le tableau (voir le commentaire sur
  // `min-w`), c'est ce qui rend les 937 px suffisants une fois la cause retiree.
  const numCn = 'text-right tabular-nums whitespace-nowrap';
  const cols = [
    { key: 'store', label: 'Partenaire / point de vente', cn: 'text-left' },
    // « Periode facturee » : fusion des anciennes colonnes Periode + Facture,
    // formatee selon le cycle du partenaire (logique partagee avec Finance-Recouvrement).
    { key: 'periode', label: 'Période facturée', cn: 'text-left' },
    { key: 'tap', label: 'Total à payer', cn: 'text-right' },
    { key: 'acompte', label: 'Acompte', cn: 'text-right' },
    { key: 'solde', label: 'Solde', cn: 'text-right' },
    // Largeur fixe : sans elle la colonne se faisait ecraser par les montants et la puce
    // « En cours » se repliait sur deux lignes, ce qui epaississait toutes les rangees.
    { key: 'statut', label: 'Statut', cn: 'w-28 text-center whitespace-nowrap' },
  ];

  const partenaires = releve.partenaires ?? [];
  const lines: Line[] = [];

  // Le nom du point de vente s'ecrit au meme endroit qu'il porte des factures ou qu'il
  // n'ait que des periodes a venir : c'est la meme entite, elle doit avoir la meme forme.
  const nomStore = (store: string) => (
    <span className="flex max-w-[13rem] items-start gap-2 pl-3 font-medium text-foreground">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-surface-tertiary" />
      <span className="min-w-0 break-words">{store}</span>
    </span>
  );

  // Le backend n'envoie ni bornes ni libelle pour une periode non facturee : il envoie
  // « - ». Repeter ce tiret n'apprend rien, on ne garde que les libelles reels.
  const nomsDesPeriodes = (factures: IEncoursFacture[], cycle: string) =>
    Array.from(
      new Set(
        factures.map((f) =>
          f.periodeDebut
            ? formatPeriodeLibre(f.periodeDebut, f.periodeFin, f.mode, cycle)
            : formatPeriodeFactureeEncours(releve.annee, f.mois, cycle, f.libelle),
        ),
      ),
    ).filter((libelle) => libelle && libelle !== '—');

  partenaires.forEach((p, pi) => {
    const toutes = facturesDuPartenaire(p);
    const facturees = toutes.filter((f) => !estAVenir(f));
    const acomptes = sommeAcomptes(facturees);

    // La tete de bloc EST le sous-total : nom, cycle, et l'arithmetique complete du
    // partenaire, chaque montant sous la colonne qui l'annonce.
    lines.push({
      key: `g-${pi}`,
      cn: 'bg-surface-secondary',
      cells: [
        {
          node: (
            <div className="flex max-w-[13rem] items-baseline gap-1.5">
              <span className="min-w-0 font-semibold break-words text-foreground">{p.groupe}</span>
              {/* Le cycle est une ETIQUETTE de periodicite, pas un etat. En puce, il
                  portait la meme forme que « En retard » ou « Paye », qui eux disent le
                  statut de paiement, et il volait 24 px de large a la colonne la plus
                  serree du tableau. */}
              <span className="shrink-0 text-[11px] font-normal text-muted">
                {cycleLabel(p.cycle)}
              </span>
            </div>
          ),
        },
        { node: '' },
        { node: <span className="font-semibold text-foreground">{formatFcfa(p.sousTotalFacture)}</span>, cn: numCn },
        {
          // Les deux retenues qui menent au reste, dans la colonne d'argent : ce qui a ete
          // encaisse, puis ce qui a ete deduit d'une avance, NOMME. `whitespace-normal` sur
          // la seconde ligne : sans elle, la chaine entiere fixerait la largeur de la
          // colonne (elle est plus longue qu'un montant) et repousserait « Statut » hors
          // de la fenetre.
          node: (
            <div className="flex flex-col items-end leading-tight">
              {acomptes ? (
                <span className="font-medium text-foreground">{formatFcfa(acomptes)}</span>
              ) : (
                <span className="text-muted">—</span>
              )}
              {p.deduction ? (
                <span className="whitespace-normal text-[11px] font-normal text-muted">
                  déduction - {formatFcfa(p.deduction)}
                </span>
              ) : null}
            </div>
          ),
          cn: numCn,
        },
        { node: <span className="font-bold text-foreground">{formatFcfa(p.sousTotalReste)}</span>, cn: numCn },
        { node: '' },
      ],
    });

    p.stores.forEach((s, si) => {
      const facturesDuStore = (s.factures ?? []).filter((f) => !estAVenir(f));
      const aVenirDuStore = (s.factures ?? []).filter(estAVenir);

      facturesDuStore.forEach((f, fi) => {
        const enRetard = f.statut === STATUT_EN_RETARD;
        lines.push({
          key: `g${pi}-s${si}-f${fi}`,
          cells: [
            { node: fi === 0 ? nomStore(s.store) : '' },
            {
              // §5.1 - « L'affichage doit indiquer clairement la PERIODE COUVERTE ».
              // Quand le backend envoie les bornes reelles, on les utilise : la
              // reconstruction depuis (annee, mois, cycle) affichait le mois entier pour
              // une facture du 1er au 7 aout, c'est-a-dire une periode que la facture ne
              // couvre pas.
              node: f.complement ? (
                // Une periode facturee en frais + commission reste UNE periode : la
                // seconde ligne se presente comme un complement de celle du dessus,
                // sans repeter les dates (arbitrage du 17/08/2026).
                <div className="flex items-center gap-2 pl-6 text-[12px] text-muted">
                  <span>+</span>
                  <span>{f.objet}</span>
                  {f.factureLieeCode ? (
                    <span className="text-muted">liée à {f.factureLieeCode}</span>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="whitespace-nowrap">
                    {f.periodeDebut
                      ? formatPeriodeLibre(f.periodeDebut, f.periodeFin, f.mode, p.cycle)
                      : formatPeriodeFactureeEncours(releve.annee, f.mois, p.cycle, f.libelle)}
                  </span>
                  {f.objet && f.objet !== 'Globale' ? (
                    <span className="text-[11px] text-muted">
                      {f.objet}
                      {f.factureLieeCode ? ` · liée à ${f.factureLieeCode}` : ''}
                    </span>
                  ) : null}
                  {f.mode === 'Plage de dates' ? (
                    <span className="text-[11px] text-muted">
                      Plage de dates{f.origine === 'REPRISE' ? ' · reprise' : ''}
                    </span>
                  ) : null}
                </div>
              ),
            },
            { node: formatFcfa(f.totalAPayer), cn: numCn },
            {
              node: f.acompte ? formatFcfa(f.acompte) : <span className="text-muted">—</span>,
              cn: numCn,
            },
            {
              // Le solde d'une facture en retard est ce qu'on va reclamer : c'est la seule
              // valeur du tableau qui appelle un geste, et la puce de statut le dit deja.
              node: (
                <span className={cn('font-semibold', enRetard ? 'text-danger-soft-foreground' : 'text-foreground')}>
                  {formatFcfa(f.solde)}
                </span>
              ),
              cn: numCn,
            },
            { node: <StatutChip statut={f.statut} />, cn: 'text-center whitespace-nowrap' },
          ],
        });
      });

      // Les periodes annoncees mais pas encore facturees : une ligne pour toutes, au lieu
      // d'une rangee de tirets chacune, mais sous LEUR point de vente - c'est lui que
      // l'operateur doit pouvoir nommer. Quand le point de vente n'a aucune facture, cette
      // ligne est la seule qui porte son nom : sans elle il disparaissait de l'ecran.
      if (aVenirDuStore.length > 0) {
        const periodes = nomsDesPeriodes(aVenirDuStore, p.cycle);
        const pluriel = aVenirDuStore.length > 1 ? 's' : '';
        lines.push({
          key: `g${pi}-s${si}-avenir`,
          cells: [
            { node: facturesDuStore.length === 0 ? nomStore(s.store) : '' },
            {
              node: (
                <span className="text-xs text-muted">
                  {formatNombre(aVenirDuStore.length)} période{pluriel} à venir
                  {periodes.length > 0
                    ? ` · ${periodes.join(' · ')}`
                    : `, pas encore facturée${pluriel}`}
                </span>
              ),
            },
            { node: '' },
            { node: '' },
            { node: '' },
            { node: <StatutChip statut="À venir" />, cn: 'text-center whitespace-nowrap' },
          ],
        });
      }

      // Un point de vente sans aucune facture sur la selection existe quand meme : le
      // tableau le nomme, au lieu de le laisser tomber en silence.
      if (facturesDuStore.length === 0 && aVenirDuStore.length === 0) {
        lines.push({
          key: `g${pi}-s${si}-vide`,
          cells: [
            { node: nomStore(s.store) },
            {
              node: (
                <span className="text-xs text-muted">aucune facture sur cette sélection</span>
              ),
            },
            { node: '' },
            { node: '' },
            { node: '' },
            { node: '' },
          ],
        });
      }
    });
  });

  // 2026-07-27 - la ligne TOTAL n'affiche que les deductions reellement APPLIQUEES aux
  // groupes du releve courant (Σ partenaires[].deduction, deja soustraites de totalReste).
  // totalDeductions = registre ANNUEL (dont des groupes absents : AGHA, CHICKEN NATION…)
  // → l'afficher ici rendait la ligne arithmetiquement fausse (facture − deductions = reste).
  // Le registre annuel complet reste visible dans le « Recapitulatif des deductions ».
  const deductionsAppliquees = partenaires.reduce((s, p) => s + (p.deduction || 0), 0);
  const acomptesTotal = partenaires.reduce(
    (s, p) => s + sommeAcomptes(facturesDuPartenaire(p).filter((f) => !estAVenir(f))),
    0,
  );

  /*
   * Le total general reste une LIGNE du tableau, et non un pied `Table.Footer` : le pied
   * de la v3 est un simple `div`, hors du tableau, donc ses montants ne tomberaient plus
   * sous leurs colonnes. Sur un ecran d'argent, l'alignement des chiffres passe avant.
   * Il est colle en bas du cadre de defilement, ou il sortait de l'ecran des la premiere
   * molette.
   *
   * Il n'est ajoute que s'il y a quelque chose a totaliser : pousse sans condition, il
   * remplissait le corps du tableau et l'etat vide ne s'affichait JAMAIS.
   */
  if (partenaires.length > 0) {
    lines.push({
      key: 'total-general',
      cn: 'sticky bottom-0 z-10 border-t-2 border-separator bg-surface-tertiary',
      cells: [
        { node: <span className="font-bold text-foreground">TOTAL GÉNÉRAL</span> },
        { node: '' },
        { node: <span className="font-bold text-foreground">{formatFcfa(releve.totalFacture)}</span>, cn: numCn },
        {
          // Meme regle que sur la tete de bloc : les deux retenues sous la colonne
          // d'argent, alignees a droite, la deduction nommee sur sa propre ligne.
          node: (
            <div className="flex flex-col items-end leading-tight">
              {acomptesTotal ? (
                <span className="font-semibold text-foreground">{formatFcfa(acomptesTotal)}</span>
              ) : (
                <span className="text-muted">—</span>
              )}
              {deductionsAppliquees ? (
                <span className="whitespace-normal text-[11px] font-normal text-muted">
                  déductions - {formatFcfa(deductionsAppliquees)}
                </span>
              ) : null}
            </div>
          ),
          cn: numCn,
        },
        {
          node: <span className="text-base font-bold text-foreground">{formatFcfa(releve.totalReste)}</span>,
          cn: numCn,
        },
        { node: '' },
      ],
    });
  }

  return (
    <Table>
      <Table.ScrollContainer
        className="overflow-y-auto"
        style={hauteur ? { maxHeight: hauteur } : undefined}
      >
        {/*
         * 44rem = 704 px. La zone de contenu de l'ERP fait environ 937 px sur la fenetre
         * reelle (1000 px, moins la barre de defilement, moins le `p-6` de la coquille ;
         * la barre laterale ne prend sa place qu'a partir de 1024 px). L'ancienne valeur,
         * 52rem = 832 px, tenait donc dans cette zone : ce n'etait PAS elle qui debordait.
         * Ce qui debordait, c'etaient les deux chaines de deduction en `whitespace-nowrap`
         * posees sous « Periode facturee », qui portaient la largeur maximale du tableau
         * au-dela de la fenetre et repoussaient « Statut » hors de vue ; elles sont
         * maintenant dans la colonne d'argent et peuvent se replier. Le minimum descend
         * quand meme sous la zone la plus etroite que l'operateur puisse voir, pour qu'il
         * ne puisse plus jamais etre la cause d'un defilement horizontal.
         */}
        <Table.Content
          aria-label="Relevé des restes à payer, détail par facture"
          className="min-w-[44rem]"
        >
          <Table.Header>
            {cols.map((c) => (
              <Table.Column
                className={cn('sticky top-0 z-20 bg-surface-secondary px-2.5', c.cn)}
                id={c.key}
                isRowHeader={c.key === 'store'}
                key={c.key}
              >
                {c.label}
              </Table.Column>
            ))}
          </Table.Header>

          <Table.Body
            renderEmptyState={() => (
              <p className="py-8 text-center text-sm text-muted">
                Aucun reste à payer pour cette sélection.
              </p>
            )}
          >
            {lines.map((l) => (
              <Table.Row id={l.key} key={l.key}>
                {l.cells.map((cell, i) => (
                  <Table.Cell className={cn('px-2.5', l.cn, cell.cn)} key={cols[i].key}>
                    {cell.node}
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
