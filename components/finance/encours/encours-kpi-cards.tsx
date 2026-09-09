'use client';

import { AlarmClock, TrendingUp, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { IEncoursReleve, computeKpis, formatFcfa, formatNombre } from '@/features/encours';

import { calculerRetard } from './encours-derive';

/** « 2026-09-05T10:00:00 » devient « 05/09/2026 a 10:00 ». Chaine vide si illisible. */
function formatDateGeneration(brut?: string | null): string {
  if (!brut) return '';
  const date = new Date(brut);
  if (Number.isNaN(date.getTime())) return '';
  const jour = String(date.getDate()).padStart(2, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const heure = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${jour}/${mois}/${date.getFullYear()} à ${heure}:${minute}`;
}

/** Au-dessus, on encaisse : la couleur du taux passe au vert. */
const SEUIL_ENCAISSE = 70;

/** En dessous, le recouvrement decroche : le palier est dit sous le chiffre. */
const SEUIL_ALERTE = 40;

function Figure({
  couleur,
  icone: Icone,
  libelle,
  note,
  valeur,
}: {
  /** Classe de couleur du CHIFFRE. Absente, il se lit en `foreground` : un montant informe. */
  couleur?: string;
  icone: LucideIcon;
  libelle: string;
  note: string;
  valeur: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 md:px-3 md:first:pl-0 md:last:pr-0">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        <Icone aria-hidden="true" className="size-3.5 shrink-0" />
        {libelle}
      </span>
      <span
        className={cn(
          'truncate text-xl font-semibold leading-tight tabular-nums',
          couleur ?? 'text-foreground',
        )}
      >
        {valeur}
      </span>
      <span className="truncate text-[11px] text-muted">{note}</span>
    </div>
  );
}

/**
 * Ce que le releve dit en un coup d'oeil.
 *
 * <h3>La couleur</h3>
 * <p>Quatre cartes de meme taille, dont deux peintes au rouge de marque : le total
 * facture et le reste a payer. Or le rouge de cet ERP est reserve a ce qui appelle un
 * geste, et un total facture n'appelle aucun geste. Quand tout est rouge, le rouge ne
 * dit plus rien. Un seul chiffre est colore ici, et c'est celui qu'on peut traiter
 * aujourd'hui : le montant EN RETARD, absent de l'ecran alors que la charge utile le
 * portait deja, eparpille dans une colonne de puces.</p>
 *
 * <h3>La hauteur</h3>
 * <p>Trois `CarteStat` mesurent 118 px chacune, plus la ligne de compteurs : 165 px de
 * bandeau. Sur une fenetre de 563 px, additionnes au titre et aux filtres, il ne restait
 * pas 150 px au releve, qui est le travail. Le bandeau tient maintenant en 105 px : meme
 * hierarchie, memes chiffres, un seul bloc au lieu de quatre. `CarteStat` impose `p-4` et
 * un chiffre en `text-2xl` ; il lui manque une variante dense, et c'est un composant
 * partage que ce lot ne touche pas.</p>
 *
 * <p>Aucun chiffre ne disparait : les avances, les compteurs et la date de generation
 * informent, ils passent sous le trait au lieu de porter le poids d'une carte. La date de
 * generation ne s'affichait nulle part. Le total facture, lui, se lit sous le reste a
 * payer, dont il est la reference - et une seule fois : il etait ecrit DEUX fois dans ce
 * bandeau, a 45 px d'ecart.</p>
 */
export function EncoursKpiCards({ releve }: { releve: IEncoursReleve }) {
  const { facture, reste, deductions, recouvre, taux } = computeKpis(releve);
  const retard = calculerRetard(releve);

  /*
   * TROIS paliers, comme avant, mais deux teintes seulement.
   *
   * <p>Le rouge de marque appartient a l'unique chiffre sur lequel on peut agir
   * aujourd'hui, le montant en retard ; peindre aussi le taux le diluerait. Seulement,
   * retirer la teinte du palier bas revenait a retirer le PALIER : un taux de 39 % et un
   * taux de 69 % se lisaient a l'identique alors que le premier est une alerte. Le
   * troisieme palier se dit donc en toutes lettres, sous le chiffre : c'est aussi la
   * seule forme que lit un operateur qui distingue mal les couleurs.</p>
   *
   * <p>Rien de facture, rien a juger : sur un releve vide, l'ambre dirait « attention »
   * a propos de rien.</p>
   */
  const couleurTaux =
    facture === 0
      ? undefined
      : taux >= SEUIL_ENCAISSE
        ? 'text-success-soft-foreground'
        : 'text-warning-soft-foreground';
  const noteTaux =
    facture > 0 && taux < SEUIL_ALERTE
      ? `${formatFcfa(recouvre)} recouvrés · sous ${SEUIL_ALERTE} %`
      : `${formatFcfa(recouvre)} recouvrés`;

  // Le total facture se lit deja sous « Reste a payer », qui le prend pour reference :
  // l'ecrire une seconde fois 45 px plus bas, c'est la phrase repetee du retour.
  const contexte: string[] = [
    `Avances & déductions ${formatFcfa(deductions)} (registre ${releve.annee})`,
    `${formatNombre(releve.nbPartenaires)} partenaire${releve.nbPartenaires > 1 ? 's' : ''}`,
    `${formatNombre(releve.nbStores)} point${releve.nbStores > 1 ? 's' : ''} de vente`,
    `${formatNombre(releve.nbFactures)} facture${releve.nbFactures > 1 ? 's' : ''}`,
  ];

  // La date de generation etait dans la charge utile et n'apparaissait nulle part : un
  // etat financier sans date d'arrete ne peut pas etre confronte a un autre.
  const genere = formatDateGeneration(releve.dateGeneration);
  if (genere) contexte.push(`Relevé du ${genere}`);

  return (
    <div className="rounded-large border border-separator bg-surface px-4 py-3">
      {/*
       * `md:` et non `lg:` : la fenetre reelle des postes fait 1000 px de large, le seuil
       * `lg` (1024) ne s'y ouvre jamais et les trois chiffres retombaient sur deux lignes.
       */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-0 md:divide-x md:divide-separator">
        <Figure
          icone={Wallet}
          libelle="Reste à payer"
          note={`sur ${formatFcfa(facture)} facturé`}
          valeur={formatFcfa(reste)}
        />
        <Figure
          couleur={retard.montant > 0 ? 'text-danger-soft-foreground' : undefined}
          icone={AlarmClock}
          libelle="En retard"
          note={
            retard.nbFactures > 0
              ? `${formatNombre(retard.nbFactures)} facture${retard.nbFactures > 1 ? 's' : ''} chez ${formatNombre(retard.nbPartenaires)} partenaire${retard.nbPartenaires > 1 ? 's' : ''}`
              : 'aucune facture en retard'
          }
          valeur={formatFcfa(retard.montant)}
        />
        <Figure
          couleur={couleurTaux}
          icone={TrendingUp}
          libelle="Taux de recouvrement"
          note={noteTaux}
          valeur={`${taux} %`}
        />
      </div>

      {/*
       * Sous le trait : ce qui situe le releve. Ces chiffres ne se comparent pas entre eux
       * et n'appellent aucun geste ; une carte de la taille des trois autres leur donnait
       * un poids qu'ils n'ont pas.
       */}
      <p className="mt-2.5 border-t border-separator pt-2 text-[11px] leading-snug tabular-nums text-muted">
        {contexte.join(' · ')}
      </p>
    </div>
  );
}
