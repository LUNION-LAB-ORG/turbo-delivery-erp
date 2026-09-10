'use client';

import { Card } from '@heroui-v3/react';
import { IFinancialDetails } from '@/features/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { FinancialDetailRow } from '@/features/rapports-performance/components/financial-detail-row';

interface FinancialDetailsSectionProps {
  financialDetails?: IFinancialDetails;
}

interface FinancialDetailItem {
  label: string;
  value: number | undefined;
  withBorder?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  rowClassName?: string;
}

function formatFinancialAmount(value?: number): string {
  if (!value) {
    return '0 FCFA';
  }

  return formatCFA(Math.round(value));
}

export function FinancialDetailsSection({ financialDetails }: FinancialDetailsSectionProps) {
  const detailItems: FinancialDetailItem[] = [
    {
      label: 'Grace a nos livraisons, le partenaire a vendu',
      value: financialDetails?.totalOrderAmount,
      withBorder: true,
    },
    {
      label: "Les frais de livraison generes sur l'ensemble des courses ce mois",
      value: financialDetails?.deliveryFeesCollected,
      withBorder: true,
    },
    {
      label: 'Frais de service TURBO DELIVERY obtenu',
      value: financialDetails?.turboDeliveryServiceFees,
      withBorder: true,
      // `text-orange-600` et `text-green-600` sont deux palettes brutes : elles ne bougent
      // pas avec le theme et le vert 600 passe sous le seuil de contraste sur fond sombre.
      // Les jetons `*-soft-foreground` du projet disent la MEME chose - ce que TURBO
      // preleve, ce qui reste a regler - et sont derives du texte de la page, donc lisibles
      // dans les deux themes. Ce sont ceux qu'emploient deja les cartes de tete.
      valueClassName: 'font-semibold text-warning-soft-foreground',
    },
    {
      label: 'Facture total a regler au compte du mois en cours',
      value: financialDetails?.totalFacture,
      rowClassName: 'py-4',
      labelClassName: 'text-foreground font-medium',
      valueClassName: 'text-xl font-bold text-success-soft-foreground',
    },
  ];

  return (
    <Card>
      <Card.Content className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Détails Financiers</h2>
        <div className="space-y-4">
          {detailItems.map((item) => (
            <FinancialDetailRow
              key={item.label}
              label={item.label}
              value={formatFinancialAmount(item.value)}
              withBorder={item.withBorder}
              rowClassName={item.rowClassName}
              labelClassName={item.labelClassName}
              valueClassName={item.valueClassName}
            />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
