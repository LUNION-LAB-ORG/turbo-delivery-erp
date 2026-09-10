'use client';

import { Clock, TrendingUp, Box } from 'lucide-react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { ISecondaryKPIs } from '@/features/rapports-performance/types/performance.type';

interface MiddleStatsSectionProps {
  secondaryKPIs?: ISecondaryKPIs;
  /** Voir `top-stats-section.tsx` : un zero affirme se lit comme une mesure. */
  enChargement?: boolean;
}

/**
 * Les trois chiffres secondaires de la fiche de performance.
 *
 * <h3>Ce qui change, et pourquoi</h3>
 * <p>Deux de ces trois cartes affirmaient un chiffre que personne n'a mesure.</p>
 *
 * <p><b>Temps moyen de livraison.</b> La production rend 0.0 pour tout le monde : les
 * horodatages de recuperation et de remise ne sont pas renseignes sur les courses. La
 * carte le presentait en « 0 min », c'est-a-dire une livraison instantanee. Un temps
 * qu'on ne mesure pas n'est pas un temps nul : la carte dit desormais un tiret.</p>
 *
 * <p><b>Articles par commande.</b> `AnalyticsService` passe la constante `1.0` : aucune
 * requete ne compte les lignes de commande. La carte affichait donc « 1 » depuis
 * toujours, et le lecteur y lisait une moyenne. Meme traitement.</p>
 *
 * <p>La <b>croissance mensuelle</b>, elle, est bien calculee. ⚠ Signale et NON corrige :
 * `calculateGrowth` s'appuie sur `countOrdersBetween`, qui ne filtre ni le statut ni les
 * lignes supprimees, alors que la carte des livraisons ne compte que les courses
 * terminees. Les deux nombres ne portent donc pas sur la meme population.</p>
 */
export function MiddleStatsSection({ enChargement = false, secondaryKPIs }: MiddleStatsSectionProps) {
  const tempsMoyen = secondaryKPIs?.averageDeliveryTime;
  const articles = secondaryKPIs?.averageItemsPerOrder;

  return (
    <GrilleStats colonnes={3} className="md:grid-cols-3">
      <CarteStat
        icone={Clock}
        isLoading={enChargement}
        libelle="Temps Moyen de Livraison"
        note={tempsMoyen ? 'De la récupération à la remise' : 'Non mesuré : les horaires de course ne sont pas renseignés'}
        valeur={tempsMoyen ? `${tempsMoyen} min` : '—'}
      />

      <CarteStat
        icone={TrendingUp}
        isLoading={enChargement}
        libelle="Croissance Mensuelle"
        note="Par rapport au mois précédent"
        ton="succes"
        valeur={secondaryKPIs?.monthlyGrowth != null ? `${secondaryKPIs.monthlyGrowth.toFixed(1)}%` : '—'}
      />

      <CarteStat
        icone={Box}
        isLoading={enChargement}
        libelle="Articles par Commande"
        note={articles ? 'Moyenne par livraison' : 'Non mesuré : les lignes de commande ne sont pas comptées'}
        valeur={articles ? articles.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—'}
      />
    </GrilleStats>
  );
}
