'use client';

import { Button, Link } from '@heroui-v3/react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChampListe } from '@/components/commons/champs-formulaire';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useEngagerCarburantMutation, useEtatCarburantQuery } from '@/features/turboys/queries/programme.query';
import type { IEtatCarburantSemaine, IProgramme } from '@/features/turboys/types/programme.types';
import { type ContexteExport, pdfProgrammesBlob } from '@/features/turboys/utils/programmes-export.utils';
import { useAbility } from '@/hooks/use-ability';
import { formatMontant } from '@/utils/format.utils';

/**
 * L'engagement du carburant de la semaine dans le circuit finance.
 *
 * <h3>Ce que c'est</h3>
 * <p>Le total carburant des programmes publiés devient une charge variable, une par
 * semaine, qui suit le circuit existant : Comptable, visa DGA, approbation DG,
 * décaissement. Le PDF des programmes publiés part en justificatif. C'est un geste
 * explicite, et c'est le seul geste de cet écran qui engage de l'argent : il porte donc
 * l'accent, et il demande confirmation avec le montant écrit en gros.</p>
 *
 * <h3>Ce qui bouge, ce qui ne bouge plus</h3>
 * <p>Tant que la charge n'est pas visée, engager à nouveau la met à jour au total publié
 * du moment. Dès qu'elle est visée, approuvée ou décaissée, l'écran le dit et renvoie au
 * tableau de bord finance pour un complément : ici, on ne retouche pas un montant qu'un
 * DGA a vu.</p>
 *
 * <p>Qui peut engager : ceux qui peuvent créer une charge variable, la même règle CASL que
 * le module finance. Les autres voient l'état, pas le bouton.</p>
 */

const LIBELLE_STATUT: Record<string, string> = {
  APPROUVE_DG: 'approuvé par le DG, à décaisser',
  DECAISSE: 'décaissé',
  EN_ATTENTE_DGA: 'en attente du visa DGA',
  REJETE_DG: 'rejeté par le DG',
  REJETE_DGA: 'rejeté par le DGA',
  VALIDE_DGA: 'visé par le DGA, en attente du DG',
};

const MODIFIABLES = new Set(['EN_ATTENTE_DGA', 'REJETE_DGA', 'REJETE_DG']);

/** Un écart signé : le signe fait partie du nombre, pas de la couleur. */
const formatEcart = (n: number) => `${n > 0 ? '+' : '−'}${formatMontant(Math.abs(n))}`;

/** Le lien profond que le backend lui-même écrit dans ses notifications. */
function lienFinance(engagement: NonNullable<IEtatCarburantSemaine['engagement']>): string {
  const base = `/finance/dashboard?depense=${engagement.id}`;
  const d = engagement.dateDepense ? new Date(engagement.dateDepense) : null;
  if (!d || Number.isNaN(d.getTime())) return base;
  return `${base}&mois=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** La ligne d'état, sans aucune requête : ce que le banc montre. */
export function EngagementCarburant({
  enCours = false,
  etat,
  onEngager,
  peutEngager,
}: {
  enCours?: boolean;
  etat: IEtatCarburantSemaine | null | undefined;
  onEngager: () => void;
  peutEngager: boolean;
}) {
  if (!etat) return null;
  const publie = etat.totalPublie ?? 0;
  const detail = `${etat.nbProgrammesPublies} programme${etat.nbProgrammesPublies > 1 ? 's' : ''} publié${etat.nbProgrammesPublies > 1 ? 's' : ''}${
    etat.nbProgrammesSansMontant > 0 ? `, ${etat.nbProgrammesSansMontant} sans montant` : ''
  }`;

  if (!etat.engagement) {
    if (etat.totalPublie === null) {
      return <p className="text-sm text-muted">Rien à engager : aucun programme publié ne porte de carburant.</p>;
    }
    return (
      <div className="flex flex-wrap items-center gap-3">
        {peutEngager ? (
          <Button isPending={enCours} onPress={onEngager} variant="primary">
            Engager {formatMontant(publie)}
          </Button>
        ) : (
          <span className="text-sm text-foreground">
            <span className="font-semibold tabular-nums">{formatMontant(publie)}</span> publiés, à engager par la comptabilité
          </span>
        )}
        <span className="text-xs text-muted">{detail}</span>
      </div>
    );
  }

  const e = etat.engagement;
  const ecart = etat.ecart ?? 0;
  const modifiable = MODIFIABLES.has(String(e.statut));
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-sm text-foreground">
        Engagé <span className="font-semibold tabular-nums">{formatMontant(e.montant)}</span>
        <span className="text-muted">, {LIBELLE_STATUT[String(e.statut)] ?? e.statut}</span>
        {e.creerPar ? <span className="text-muted"> par {e.creerPar}</span> : null}
      </span>
      <Link className="text-sm" href={lienFinance(e)}>
        Voir dans la finance
      </Link>
      {ecart !== 0 &&
        (modifiable && peutEngager ? (
          <Button isPending={enCours} onPress={onEngager} size="sm" variant="outline">
            Mettre à jour ({formatEcart(ecart)})
          </Button>
        ) : (
          <span className="text-xs text-muted">
            Le total publié a bougé de {formatEcart(ecart)} depuis l&apos;engagement
            {modifiable ? '' : ' ; un complément se crée depuis la finance'}
          </span>
        ))}
    </div>
  );
}

/** La ligne branchée : état, droit, catégorie, PDF, envoi. */
export function EngagementCarburantConnecte({
  annee,
  contexteExport,
  programmes,
  semaine,
}: {
  annee: number;
  /** Tous les programmes de la semaine, non filtrés : le justificatif en retient les publiés. */
  programmes: IProgramme[];
  semaine: number;
  /**
   * Ce que l'export sait des sites. Sans lui, un programme rattaché à un site sortirait
   * « Site inconnu » dans la pièce que le DGA et le DG vont lire.
   */
  contexteExport?: ContexteExport;
}) {
  const ability = useAbility();
  const peutEngager = ability.can('create', 'ChargeVariable');
  const etatQuery = useEtatCarburantQuery(annee, semaine);
  const { categories } = useCategorieDepense();
  const [ouvert, setOuvert] = React.useState(false);
  const [categorieId, setCategorieId] = React.useState('');
  const engager = useEngagerCarburantMutation(() => setOuvert(false));

  // La catégorie qui s'appelle carburant est proposée d'office ; l'opérateur peut en
  // choisir une autre, et doit en choisir une s'il n'y en a pas.
  React.useEffect(() => {
    if (categorieId || categories.length === 0) return;
    const carburant = categories.find((c) => /carburant|essence|fuel/i.test(c.nomCategorie ?? ''));
    if (carburant) setCategorieId(carburant.id);
  }, [categories, categorieId]);

  const etat = etatQuery.data ?? null;
  const publies = React.useMemo(
    () => programmes.filter((p) => p.statut === 'NOTIFIE' || p.statut === 'ACCEPTE'),
    [programmes],
  );
  const montant = etat?.totalPublie ?? 0;
  const misAJour = Boolean(etat?.engagement);

  const confirmer = () => {
    if (!categorieId) return;
    engager.mutate({
      annee,
      categorieId,
      justificatif: pdfProgrammesBlob(publies, annee, semaine, 'Programmes publiés', contexteExport),
      semaine,
    });
  };

  return (
    <>
      <EngagementCarburant
        enCours={engager.isPending}
        etat={etat}
        onEngager={() => setOuvert(true)}
        peutEngager={peutEngager}
      />
      <FenetreAction
        enAttente={engager.isPending}
        libelleAction={misAJour ? `Mettre à jour à ${formatMontant(montant)}` : `Engager ${formatMontant(montant)}`}
        onAction={confirmer}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre={`Carburant de la semaine ${semaine} / ${annee}`}
      >
        <p className="text-3xl font-bold tabular-nums text-foreground">{formatMontant(montant)}</p>
        <p className="text-sm text-muted">
          {etat?.nbProgrammesPublies ?? 0} programme{(etat?.nbProgrammesPublies ?? 0) > 1 ? 's' : ''} publié
          {(etat?.nbProgrammesPublies ?? 0) > 1 ? 's' : ''}
          {etat && etat.nbProgrammesSansMontant > 0
            ? `, ${etat.nbProgrammesSansMontant} sans montant, qui ne sont pas comptés`
            : ''}
          . Les programmes encore en brouillon ne sont pas comptés non plus : publiez-les d&apos;abord, ou
          mettez l&apos;engagement à jour ensuite.
        </p>
        <ChampListe
          label="Catégorie de dépense"
          onChange={setCategorieId}
          options={categories.map((c) => ({ label: c.nomCategorie, value: c.id }))}
          placeholder="Rechercher une catégorie"
          valeur={categorieId}
        />
        <p className="text-xs text-muted">
          Une charge variable «&nbsp;Carburant programmes semaine {semaine}/{annee}&nbsp;» part au visa du DGA,
          puis à l&apos;approbation du DG, avec le PDF des programmes publiés en justificatif.
          {misAJour ? ' La charge existante est mise à jour ; elle n’a pas encore été visée.' : ''}
        </p>
        {!categorieId && <p className="text-xs text-danger-soft-foreground">Choisissez une catégorie pour engager.</p>}
      </FenetreAction>
    </>
  );
}
