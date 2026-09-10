'use client';

import { Button, Card } from '@heroui-v3/react';
import { ArrowDown } from 'lucide-react';

import { IFinancialDetails } from '@/features/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { FinancialDetailRow } from '@/features/rapports-performance/components/financial-detail-row';

import { ANCRE_DETAIL_PAR_STORE } from './detail-par-store/detail-par-store-table-columns';

interface FinancialDetailsSectionProps {
  financialDetails?: IFinancialDetails;
  /**
   * Vrai des que le rapport porte sur PLUSIEURS etablissements. Les quatre libelles
   * passent alors au pluriel et le bloc renvoie au detail par store.
   */
  consolide?: boolean;
  /** Le nombre d'etablissements cumules, pour nommer le renvoi. */
  nombreEtablissements?: number | null;
  /**
   * Le bloc « Detail par store » est REELLEMENT rendu plus bas.
   *
   * <p>Distinct de `consolide` a dessein : entre le clic sur un groupe et l'arrivee de la
   * reponse, la selection est deja consolidee alors que le tableau n'existe pas encore. Un
   * renvoi affiche dans cet intervalle emmenerait vers une ancre absente, c'est-a-dire
   * nulle part - et un bouton qui ne fait rien apprend a ne plus cliquer sur les autres.</p>
   */
  detailDisponible?: boolean;
  /** Les bornes lues, pour dire de quelle periode cette facture est celle. */
  debut?: Date;
  fin?: Date;
}

interface FinancialDetailItem {
  label: string;
  value: number | undefined;
  withBorder?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  rowClassName?: string;
}

/**
 * ⚠ `!value` renvoyait « 0 FCFA » pour une valeur ABSENTE comme pour un zero mesure.
 *
 * <p>Tant que la reponse n'est pas la, les quatre lignes affirmaient donc « 0 FCFA » : un
 * partenaire qui n'a rien vendu et une lecture qui n'a pas encore abouti s'ecrivaient
 * pareil. Un zero affirme se lit comme une mesure. Un tiret dit « on ne sait pas », ce qui
 * est la verite, et c'est le defaut que le reste de cet ecran a deja abandonne.</p>
 *
 * <p>Un zero REEL, lui, continue de s'ecrire « 0 FCFA » : sur avril 2026, LE PETIT CAFE
 * n'a genere aucun frais de service, et c'est un fait a montrer.</p>
 */
function formatFinancialAmount(value?: number | null): string {
  if (value == null) {
    return '—';
  }

  return formatCFA(Math.round(value));
}

function formatBorne(d?: Date): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function FinancialDetailsSection({
  consolide = false,
  debut,
  detailDisponible = false,
  financialDetails,
  fin,
  nombreEtablissements,
}: FinancialDetailsSectionProps) {
  /*
   * La derniere ligne disait « au compte du mois en cours » alors que la periode vient d'un
   * SELECTEUR DE DATES : sur une plage d'avril lue en septembre, la phrase designait un
   * mois qui n'a rien a voir avec le montant affiche juste a cote. Les bornes reellement
   * lues remplacent la formule, et la formule generique ne sert que si elles manquent.
   */
  const bornes =
    formatBorne(debut) && formatBorne(fin)
      ? `du ${formatBorne(debut)} au ${formatBorne(fin)}`
      : 'sur la période';

  /*
   * Les quatre libelles etaient ecrits AU SINGULIER - « le partenaire a vendu », « Frais de
   * service obtenu ». Sur un cumul de quatre partenaires ou d'un groupe entier, chacun
   * devient faux : il n'y a pas un partenaire, il y en a plusieurs, et le montant est leur
   * somme. Le pluriel n'est pas une coquetterie de langue, c'est ce qui empeche de lire le
   * total d'un groupe comme le chiffre d'un seul etablissement.
   */
  const detailItems: FinancialDetailItem[] = [
    {
      label: consolide
        ? 'Grâce à nos livraisons, les partenaires ont vendu'
        : 'Grace a nos livraisons, le partenaire a vendu',
      value: financialDetails?.totalOrderAmount,
      withBorder: true,
    },
    {
      label: consolide
        ? "Les frais de livraison generes sur l'ensemble de leurs courses"
        : "Les frais de livraison generes sur l'ensemble des courses",
      value: financialDetails?.deliveryFeesCollected,
      withBorder: true,
    },
    {
      label: consolide
        ? 'Frais de service TURBO DELIVERY obtenus'
        : 'Frais de service TURBO DELIVERY obtenu',
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
      label: `Facture totale a regler ${bornes}`,
      value: financialDetails?.totalFacture,
      rowClassName: 'py-4',
      labelClassName: 'text-foreground font-medium',
      valueClassName: 'text-xl font-bold text-success-soft-foreground',
    },
  ];

  /*
   * Le renvoi vers le detail par store n'existe QUE sur un consolide : en unitaire, ce bloc
   * ne bouge pas d'un pixel. Il porte le nombre d'etablissements plutot qu'un « voir le
   * detail » muet, parce que c'est ce nombre qui dit combien de lignes cette facture
   * additionne.
   */
  const renvoi = () => {
    document
      .getElementById(ANCRE_DETAIL_PAR_STORE)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

        {consolide && detailDisponible && (
          <div className="mt-4 flex justify-end">
            <Button onPress={renvoi} size="sm" variant="ghost">
              <ArrowDown aria-hidden="true" className="size-4" />
              {nombreEtablissements
                ? `Voir le détail des ${nombreEtablissements} établissements`
                : 'Voir le détail par store'}
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
