'use client';

import { CheckCircle, Package, Receipt, ShoppingBag } from 'lucide-react';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import {
  IFinancialDetails,
  IMainKPIs,
} from '@/features/rapports-performance/types/performance.type';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

interface TopStatsSectionProps {
  mainKPIs?: IMainKPIs;
  /**
   * Les montants du detail financier, remontes en tete de page.
   *
   * <p>La carte « Montant total de livraisons » porte ce que TURBO facture. Ce nombre
   * existait deja, mais seulement en bas de page, au terme d'une addition que le lecteur
   * devait faire de tete : il lisait les frais, puis la commission, puis leur total, sans
   * qu'aucun des trois ne soit en tete.</p>
   */
  financialDetails?: IFinancialDetails;
  /**
   * Vrai pendant la PREMIERE lecture. Sans lui, les cartes affirmaient « 0 » le temps de
   * la reponse, a chaque changement de periode ou de partenaire : un zero affirme se lit
   * comme une mesure, pas comme une absence de reponse.
   */
  enChargement?: boolean;
  /** Bornes de la periode lue, pour dire la moyenne par jour sur CETTE periode. */
  debut: Date;
  fin: Date;
}

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Nombre de jours ECOULES de la periode, bornes comprises : du 1er au 30 avril fait
 * 30 jours, pas 29. Les bornes sont ramenees a minuit local, sinon un changement d'heure
 * ou une heure de saisie differente ajoute ou retire un jour au quotient.
 *
 * <p>⚠ L'arrivee est BORNEE A AUJOURD'HUI, et c'est le point important. La periode par
 * defaut de la page est le mois EN COURS en entier (`performance.filters.ts` : de
 * `startOfMonth` a `endOfMonth`). Diviser par les jours du calendrier ferait donc, un
 * 10 septembre, une moyenne calculee sur 30 jours quand 10 se sont ecoules : le rythme
 * affiche vaudrait le tiers du reel, et le 1er du mois le trentieme. C'est l'etat par
 * defaut de la page, celui que tout le monde voit en l'ouvrant.</p>
 */
function joursEcoules(debut: Date, fin: Date): number | null {
  const minuit = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const depart = minuit(debut);
  const aujourdhui = minuit(new Date());
  const arrivee = Math.min(minuit(fin), aujourdhui);

  if (Number.isNaN(depart) || Number.isNaN(arrivee) || arrivee < depart) {
    return null;
  }

  return Math.round((arrivee - depart) / MS_PAR_JOUR) + 1;
}

export function TopStatsSection({
  debut,
  enChargement = false,
  financialDetails,
  fin,
  mainKPIs,
}: TopStatsSectionProps) {
  // La carte annoncait « Moyenne: 12.1 livraisons/jour » et « +12% vs mois precedent »,
  // deux valeurs ECRITES EN DUR depuis la maquette : aucun KPI ne les portait. Sur la
  // fiche de PLATO en avril 2026 elles cotoyaient un total de 18 livraisons sur le mois,
  // ce que 12,1 par jour contredit a l'oeil nu.
  // La moyenne est desormais CALCULEE sur la periode choisie. La comparaison au mois
  // precedent n'est pas reprise ici : elle existe pour de vrai plus bas, carte
  // « Croissance Mensuelle », et la repeter en ferait un second chiffre a maintenir.
  const jours = joursEcoules(debut, fin);
  const moyenneParJour =
    jours !== null && mainKPIs ? mainKPIs.totalDeliveries / jours : null;

  // La note dit sur combien de jours la moyenne est faite, et se termine par « ecoules »
  // quand la periode n'est pas finie : sans cela, un rythme calcule sur 10 jours se lit
  // comme un rythme mensuel.
  const periodeEnCours = jours !== null && fin.getTime() > Date.now();
  const noteLivraisons =
    moyenneParJour !== null && jours !== null
      ? `Moyenne ${moyenneParJour.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} par jour sur ${jours} jour${jours > 1 ? 's' : ''}${periodeEnCours ? ' écoulés' : ''}`
      : undefined;

  /*
   * Ce que TURBO facture, et sa DECOMPOSITION en une ligne.
   *
   * Le total ne se recompose pas ici a partir des deux parts : `totalFacture` est ce que
   * le serveur facture, et c'est LUI qui fait foi. Les additionner soi-meme donnerait un
   * total qui pourrait diverger de la facture reelle sans que rien ne le signale - et le
   * detail financier plus bas, lui, affiche la vraie. Deux nombres pour la meme grandeur,
   * c'est exactement la faute que la carte « Chiffre d'Affaires » avait commise.
   *
   * La note n'est ecrite QUE si les deux parts existent : « Frais 0 · Commission 0 » sous
   * un total juste se lirait comme une facture sans origine.
   */
  const fraisLivraison = financialDetails?.deliveryFeesCollected;
  const commission = financialDetails?.turboDeliveryServiceFees;
  const noteMontantLivraisons =
    fraisLivraison != null && commission != null
      ? `Frais de livraison ${formatNumber(fraisLivraison)} · Commission ${formatNumber(commission)}`
      : undefined;

  return (
    // Quatre cartes, et le rang de quatre n'ouvre qu'a `xl` (1280 px), pas a `lg`.
    //
    // Le chiffre le plus long de ce bandeau est un montant a neuf chiffres : « 74 976 175
    // FCFA » mesure environ 192 px a 24 px en chasse tabulaire, et la carte lui ajoute
    // 32 px de marge interne. A 1024 px de fenetre, quatre cartes de front en laissent 225,
    // soit 193 px utiles : le montant deborde d'un cheveu, et seulement dans cette bande de
    // largeur. A 1280 px il reste 290 px par carte, ce qui tient.
    //
    // La fenetre reelle du poste fait environ 1000 px : l'operateur voit donc deux rangs de
    // deux, ce qui est le cas nominal, pas un repli.
    <GrilleStats className="xl:grid-cols-4" colonnes={2}>
      <CarteStat
        libelle="Nombre de Livraisons"
        isLoading={enChargement}
        valeur={formatNumber(mainKPIs?.totalDeliveries ?? 0)}
        note={noteLivraisons}
        icone={Package}
        ton="danger"
      />

      {/* Ce que TURBO facture sur la periode : frais de livraison + commission. Le meme
          montant figure en bas de page sous le nom « Facture totale a regler » ; il est ici
          en tete parce que c'est le nombre que la Direction vient chercher. L'accent lui
          revient : c'est celui qui appelle un geste, encaisser. */}
      <CarteStat
        libelle="Montant total de livraisons"
        isLoading={enChargement}
        valeur={financialDetails ? formatMontant(financialDetails.totalFacture) : '—'}
        note={noteMontantLivraisons}
        icone={Receipt}
        ton="attention"
      />

      {/* « Valeur totale des commandes » ne disait pas a qui cet argent revient. C'est ce
          que le partenaire encaisse grace a nos courses, et non ce que nous facturons -
          d'ou le nom, et d'ou le ton neutre : ce nombre INFORME, il n'appelle aucun geste
          de notre cote. Le detail financier plus bas l'appelle « le partenaire a vendu ». */}
      <CarteStat
        libelle="Montant de commandes généré par les courses TURBO"
        isLoading={enChargement}
        valeur={formatMontant(mainKPIs?.totalOrderValue ?? 0)}
        note="Ce que le partenaire a vendu grâce à nos livraisons"
        icone={ShoppingBag}
        ton="neutre"
      />

      {/* Sans course conclue le taux n'existe pas : un tiret, pas « 0% », qui se lirait
          comme un echec total. La note dit sur quoi le taux est mesure ; « Livraisons sans
          litige » annoncait un critere que rien dans la donnee ne porte. */}
      <CarteStat
        libelle="Taux de Succès"
        isLoading={enChargement}
        valeur={mainKPIs?.successRate != null ? `${mainKPIs.successRate.toFixed(1)}%` : '—'}
        note="Courses terminées sur les courses conclues, terminées ou annulées"
        icone={CheckCircle}
        ton="succes"
      />
    </GrilleStats>
  );
}
