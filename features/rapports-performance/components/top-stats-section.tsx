'use client';

import { Package, DollarSign, CheckCircle } from 'lucide-react';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { IMainKPIs } from '@/features/rapports-performance/types/performance.type';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

interface TopStatsSectionProps {
  mainKPIs?: IMainKPIs;
  /**
   * Vrai pendant la PREMIERE lecture. Sans lui, deux cartes sur trois affirmaient « 0 »
   * le temps de la reponse, a chaque changement de periode ou de partenaire : un zero
   * affirme se lit comme une mesure, pas comme une absence de reponse. La carte du taux,
   * elle, disait deja un tiret.
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

export function TopStatsSection({ debut, enChargement = false, fin, mainKPIs }: TopStatsSectionProps) {
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

  return (
    // La fenetre reelle fait environ 1000 px de large : `lg:` (1024) ne s'ouvre jamais et
    // la grille resterait a 2 colonnes, la troisieme carte seule sur une ligne.
    <GrilleStats colonnes={3} className="md:grid-cols-3">
      <CarteStat
        libelle="Nombre de Livraisons"
        isLoading={enChargement}
        valeur={formatNumber(mainKPIs?.totalDeliveries ?? 0)}
        note={noteLivraisons}
        icone={Package}
        ton="danger"
      />

      {/* « Valeur totale des commandes » ne disait pas a qui cet argent revient. C'est le
          chiffre d'affaires que le partenaire realise grace a nos livraisons, exactement ce
          que le detail financier plus bas appelle « le partenaire a vendu ». Le montant
          exact remplace le « 0.28M » d'avant, qui arrondissait un nombre que la ligne du
          dessous ecrivait deja en entier. */}
      <CarteStat
        libelle="Chiffre d'affaires généré par les livraisons"
        isLoading={enChargement}
        valeur={formatMontant(mainKPIs?.totalOrderValue ?? 0)}
        note="Ce que le partenaire a vendu grâce à nos livraisons"
        icone={DollarSign}
        ton="attention"
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
