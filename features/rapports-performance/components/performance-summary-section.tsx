'use client';

import { AlertCircle } from 'lucide-react';
import { Card } from '@heroui-v3/react';
import { IMainKPIs, ISecondaryKPIs } from '@/features/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { formatNumber } from '@/utils/formatNumber';

interface PerformanceSummarySectionProps {
  mainKPIs?: IMainKPIs;
  secondaryKPIs?: ISecondaryKPIs;
  selectedRestaurant: string;
}

export function PerformanceSummarySection({
  mainKPIs,
  secondaryKPIs,
  selectedRestaurant,
}: PerformanceSummarySectionProps) {
  // Le taux vaut `null` quand aucune course n'a ete conclue sur la periode : la phrase
  // s'arrete alors au temps moyen. `mainKPIs.successRate.toFixed(1)` sur un `null` faisait
  // tomber le resume ENTIER, et « un taux de succes de 0.0% » se lirait comme un echec.
  const mentionDuTaux =
    mainKPIs?.successRate != null
      ? ` avec un taux de succès de ${mainKPIs.successRate.toFixed(1)}%`
      : '';

  // Le temps moyen vaut 0 pour TOUT LE MONDE en production : les horodatages de course
  // ne sont pas renseignes. « Le temps moyen de livraison est de 0 minutes » affirmait
  // donc une livraison instantanee. La phrase ne mentionne le temps que s'il existe.
  const mentionDuTemps =
    secondaryKPIs?.averageDeliveryTime
      ? ` Le temps moyen de livraison est de ${secondaryKPIs.averageDeliveryTime} minutes.`
      : '';

  return (
    <Card>
      <Card.Content className="p-6 bg-orange-50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Résumé de Performance</h3>
            <p className="text-sm text-foreground leading-relaxed">
              {mainKPIs && secondaryKPIs ? (
                <>
                  Grâce à Turbo Delivery, Restaurant {selectedRestaurant || 'Tous'} a réalisé{' '}
                  {formatNumber(mainKPIs.totalDeliveries)} livraisons pour un montant total de{' '}
                  {formatCFA(Math.round(mainKPIs.totalOrderValue))} durant la période
                  sélectionnée{mentionDuTaux}.{mentionDuTemps}
                </>
              ) : (
                <>Chargement des données de performance...</>
              )}
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
