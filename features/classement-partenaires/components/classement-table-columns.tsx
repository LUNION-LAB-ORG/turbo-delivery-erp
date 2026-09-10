'use client';

import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Tooltip } from '@heroui-v3/react';

import { IndicateurTendance } from '@/features/classement-partenaires/components/indicateur-tendance';
import type {
  ILigneClassement,
  ITotauxClassement,
  TriClassement,
} from '@/features/classement-partenaires/types/classement.types';
import { ABSENT, montant, nombre, taux } from '@/features/classement-partenaires/utils/classement-format.utils';

/**
 * LES COLONNES DU CLASSEMENT, declarees UNE fois.
 *
 * <h3>Pourquoi une seule declaration</h3>
 * <p>Deux raisons, dont une qui casse la page.</p>
 * <p>La premiere : un tableau de la v3 leve « Cell count must match column count » et
 * emporte l'ecran entier en 500 des que l'en-tete et le corps ne comptent pas le meme
 * nombre d'elements. Tant que les deux sont produits par un `map` sur CE tableau, l'ecart
 * est impossible a ecrire.</p>
 * <p>La seconde : la note demande les exports « avec la meme structure de colonnes ». Si
 * l'ecran, le fichier Excel et le PDF listaient chacun leurs colonnes, la troisieme
 * divergerait le jour ou l'on en ajoute une, et personne ne le verrait avant qu'un
 * destinataire ne compare deux documents. Chaque colonne porte donc ses trois rendus :
 * `rendu` pour l'ecran, `brut` pour le tableur (un NOMBRE, pour que les formules
 * fonctionnent), `texte` pour le PDF.</p>
 *
 * <h3>Ce que dit la commission vide</h3>
 * <p>`soumisCommission` faux rend une cellule VIDE, pas un zero : la note l'exige, et zero
 * se lirait comme « rien facture ce mois-ci » alors qu'il n'y a pas de commission du tout.
 * Le montant reste servi par le serveur, il est simplement tu ici. Quand le serveur
 * signale une incoherence (`commissionInattendue`), on affiche au contraire le montant AVEC
 * une alerte : cacher un montant que la facturation reclame serait le pire des deux.</p>
 */
export interface ColonneClassement {
  cle: string;
  libelle: string;
  /** L'indicateur de tri servi par cette colonne, ou `null` si elle ne se trie pas. */
  tri: TriClassement | null;
  /** Un nombre : chasse tabulaire et alignement a droite, pour que deux lignes se comparent. */
  nombre?: boolean;
  /** Largeur minimale de la colonne, pour que le tableau ne se tasse pas sous 1000 px. */
  largeur: string;
  rendu: (ligne: ILigneClassement) => React.ReactNode;
  /** La valeur pour le tableur. `null` = cellule vide, jamais zero. */
  brut: (ligne: ILigneClassement) => string | number | null;
  /** Le texte du PDF. Espaces ASCII uniquement, voir `classement-pdf.utils`. */
  texte: (ligne: ILigneClassement) => string;
  /** Le total de la colonne, ou `null` quand la grandeur ne s'additionne pas. */
  total: (totaux: ITotauxClassement) => React.ReactNode;
  totalBrut: (totaux: ITotauxClassement) => string | number | null;
  totalTexte: (totaux: ITotauxClassement) => string;
  /** Part de la largeur du tableau PDF. */
  partPdf: number;
}

/** Le nom, ou l'identifiant quand l'etablissement n'existe plus. Jamais une ligne muette. */
function nomPartenaire(ligne: ILigneClassement): string {
  return ligne.nom?.trim() || `Établissement ${ligne.restaurantId.slice(0, 8)}`;
}

/** La commission est-elle affichable ? Voir le bloc de tete. */
function commissionVisible(ligne: ILigneClassement): boolean {
  return ligne.soumisCommission || ligne.commissionInattendue;
}

export const COLONNES_CLASSEMENT: readonly ColonneClassement[] = [
  {
    brut: (l) => l.rang,
    cle: 'rang',
    largeur: 'w-[6.5rem]',
    libelle: 'Rang',
    partPdf: 8,
    /*
     * Le rang est EN TETE DE LIGNE, comme la note le demande, et il n'est pas peint : un
     * classement ou le premier serait dore ne se lirait pas mieux, il se lirait comme une
     * recompense. Ce qui le rend lisible, c'est sa graisse et sa position.
     *
     * Les ex aequo arrivent tels quels du serveur (1, 2, 2, 4). On ne renumerote pas :
     * une renumerotation ferait disparaitre l'egalite, qui est une information.
     */
    rendu: (l) => (
      <span className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold tabular-nums text-foreground">{l.rang}</span>
        <IndicateurTendance tendance={l.tendance} />
      </span>
    ),
    texte: (l) => String(l.rang),
    total: () => null,
    totalBrut: () => null,
    totalTexte: () => '',
    tri: null,
  },
  {
    brut: (l) => nomPartenaire(l),
    cle: 'nom',
    largeur: 'min-w-[14rem]',
    libelle: 'Partenaire',
    partPdf: 26,
    rendu: (l) => (
      <span className="flex items-center gap-1.5">
        <span className="truncate font-medium text-foreground">{nomPartenaire(l)}</span>
        {/* ⚠ `Tooltip.Trigger` EST OBLIGATOIRE ici, et le commentaire se pose AU-DESSUS de
            l'expression : place apres un `&&` ouvrant, il casse la compilation. Un `<Button>`
            nu suffit comme declencheur, mais tout autre element - span, div, Chip - doit etre
            enveloppe, faute de quoi React Aria ne recoit aucun declencheur et l'infobulle ne
            s'ouvre JAMAIS, sans la moindre erreur. Documentation v3, « Custom Triggers ». */}
        {l.commissionInattendue && (
          <Tooltip>
            <Tooltip.Trigger aria-label="Régime de commission incohérent">
              <span className="inline-flex shrink-0 text-warning-soft-foreground">
                <AlertTriangle aria-hidden="true" className="size-3.5" />
                <span className="sr-only">Régime de commission incohérent</span>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content>
              Une commission a été figée sur les courses alors que ce partenaire n&apos;est
              soumis à aucun régime. Le montant est affiché pour qu&apos;il puisse être
              vérifié.
            </Tooltip.Content>
          </Tooltip>
        )}
      </span>
    ),
    texte: (l) => nomPartenaire(l),
    total: (t) => (
      <span className="font-semibold text-foreground">
        Total, {nombre(t.nbPartenairesClasses)} partenaire
        {t.nbPartenairesClasses > 1 ? 's' : ''}
      </span>
    ),
    totalBrut: (t) => `Total (${t.nbPartenairesClasses} partenaires)`,
    totalTexte: (t) => `Total (${t.nbPartenairesClasses} partenaires)`,
    tri: 'NOM',
  },
  {
    brut: (l) => l.nbLivraisons,
    cle: 'nbLivraisons',
    largeur: 'w-[7rem]',
    libelle: 'Livraisons',
    nombre: true,
    partPdf: 10,
    rendu: (l) => nombre(l.nbLivraisons),
    texte: (l) => nombre(l.nbLivraisons),
    total: (t) => nombre(t.nbLivraisons),
    totalBrut: (t) => t.nbLivraisons,
    totalTexte: (t) => nombre(t.nbLivraisons),
    tri: 'LIVRAISONS',
  },
  {
    brut: (l) => l.montantLivraison,
    cle: 'montantLivraison',
    largeur: 'w-[10rem]',
    libelle: 'Montant de livraison',
    nombre: true,
    partPdf: 15,
    rendu: (l) => montant(l.montantLivraison),
    texte: (l) => montant(l.montantLivraison),
    total: (t) => montant(t.montantLivraison),
    totalBrut: (t) => t.montantLivraison,
    totalTexte: (t) => montant(t.montantLivraison),
    tri: 'MONTANT_LIVRAISON',
  },
  {
    brut: (l) => (commissionVisible(l) ? l.commission : null),
    cle: 'commission',
    largeur: 'w-[10rem]',
    libelle: 'Commission',
    nombre: true,
    partPdf: 14,
    rendu: (l) =>
      commissionVisible(l) ? (
        <span className={l.commissionInattendue ? 'text-warning-soft-foreground' : undefined}>
          {montant(l.commission)}
        </span>
      ) : (
        <Tooltip>
          <Tooltip.Trigger aria-label="Aucune commission">
            <span className="text-muted">{ABSENT}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>Ce partenaire n&apos;est soumis à aucune commission.</Tooltip.Content>
        </Tooltip>
      ),
    texte: (l) => (commissionVisible(l) ? montant(l.commission) : ABSENT),
    total: (t) => montant(t.commission),
    totalBrut: (t) => t.commission,
    totalTexte: (t) => montant(t.commission),
    tri: 'COMMISSION',
  },
  {
    brut: (l) => l.totalARegler,
    cle: 'totalARegler',
    largeur: 'w-[10rem]',
    libelle: 'Total à régler',
    nombre: true,
    partPdf: 15,
    /* Ce que TURBO facture au partenaire : la colonne pour laquelle on ouvre l'ecran. */
    rendu: (l) => <span className="font-semibold text-foreground">{montant(l.totalARegler)}</span>,
    texte: (l) => montant(l.totalARegler),
    total: (t) => montant(t.totalARegler),
    totalBrut: (t) => t.totalARegler,
    totalTexte: (t) => montant(t.totalARegler),
    tri: 'TOTAL',
  },
  {
    brut: (l) => l.valeurCommandes,
    cle: 'valeurCommandes',
    largeur: 'w-[10rem]',
    libelle: 'Valeur des commandes',
    nombre: true,
    partPdf: 15,
    /* Le prix des commandes livrees. Ce n'est PAS ce que TURBO facture, d'ou la teinte
       attenuee : la colonne informe, elle ne se regle pas. */
    rendu: (l) => <span className="text-muted">{montant(l.valeurCommandes)}</span>,
    texte: (l) => montant(l.valeurCommandes),
    total: (t) => <span className="text-muted">{montant(t.valeurCommandes)}</span>,
    totalBrut: (t) => t.valeurCommandes,
    totalTexte: (t) => montant(t.valeurCommandes),
    tri: 'VALEUR_COMMANDES',
  },
  {
    brut: (l) => l.tauxSucces,
    cle: 'tauxSucces',
    largeur: 'w-[7rem]',
    libelle: 'Taux de succès',
    nombre: true,
    partPdf: 10,
    rendu: (l) => (l.tauxSucces === null ? <span className="text-muted">{ABSENT}</span> : taux(l.tauxSucces)),
    texte: (l) => taux(l.tauxSucces),
    /*
     * PAS de total, et ce n'est pas un oubli : le serveur ne sert deliberement aucun taux
     * d'ensemble. Un taux consolide se calcule sur les numerateurs et denominateurs
     * cumules, jamais sur la moyenne des taux de chaque ligne. Le tiret dit « cette
     * grandeur ne s'additionne pas », le pied de tableau l'ecrit en toutes lettres.
     */
    total: () => <span className="text-muted">{ABSENT}</span>,
    totalBrut: () => null,
    totalTexte: () => ABSENT,
    tri: 'TAUX_SUCCES',
  },
] as const;
