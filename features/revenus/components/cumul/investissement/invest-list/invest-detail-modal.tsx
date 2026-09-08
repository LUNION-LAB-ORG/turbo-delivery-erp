'use client';

import { differenceInDays } from 'date-fns';
import { Calendar, Clock, User, Wallet } from 'lucide-react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IInvestissement } from '@/features/revenus/types/revenus.types';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';

interface InvestDetailModalProps {
  investissement: IInvestissement;
  onFermer: () => void;
  ouvert: boolean;
}

/**
 * L'etat d'une echeance : ce qu'elle vaut, et la couleur qui va avec.
 *
 * <p>Les quatre etats etaient peints en `text-red-600 bg-red-50`, `bg-orange-50`,
 * `bg-green-50` : de la palette brute, sans variante sombre, donc du texte fonce sur fond
 * clair par-dessus une surface sombre. Ils passent par les jetons du theme, qui portent
 * les deux modes. Ici la couleur DIT quelque chose : elle marque l'urgence.</p>
 */
const getDeadlineStatus = (deadline: string) => {
  const daysUntilDeadline = differenceInDays(new Date(deadline), new Date());

  if (daysUntilDeadline < 0) {
    return {
      color: 'border-danger/30 bg-danger/10 text-danger-soft-foreground',
      days: `${Math.abs(daysUntilDeadline)} jour(s) de retard`,
      status: 'Échéance dépassée',
    };
  }
  if (daysUntilDeadline < 7) {
    return {
      color: 'border-danger/30 bg-danger/10 text-danger-soft-foreground',
      days: `${daysUntilDeadline} jour(s) restant(s)`,
      status: 'Échéance imminente',
    };
  }
  if (daysUntilDeadline < 30) {
    return {
      color: 'border-warning/30 bg-warning/10 text-warning-soft-foreground',
      days: `${daysUntilDeadline} jour(s) restant(s)`,
      status: 'Échéance proche',
    };
  }
  return {
    color: 'border-success/30 bg-success/10 text-success-soft-foreground',
    days: `${daysUntilDeadline} jour(s) restant(s)`,
    status: 'Échéance éloignée',
  };
};

export function InvestDetailModal({ investissement, onFermer, ouvert }: InvestDetailModalProps) {
  const deadlineStatus = getDeadlineStatus(investissement.deadline);

  return (
    <FenetreAction
      libelleFermer="Fermer"
      onFermer={onFermer}
      ouvert={ouvert}
      titre="Détails de l'investissement"
    >
      {/*
       * L'investisseur etait dans un cartouche BLEU et le montant dans un cartouche VERT :
       * deux couleurs qui ne disaient rien d'autre que « c'est une autre rubrique », et le
       * vert d'un pret non rembourse se lit comme un acquittement. Les rubriques sont
       * neutres ; seule l'echeance, qui appelle un geste, garde une couleur.
       */}
      <div className="flex items-start gap-3 rounded-lg border border-separator bg-surface-secondary p-4">
        <User aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Investisseur</p>
          <p className="text-lg font-semibold wrap-break-word text-foreground">
            {investissement.nomInvestisseur}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-separator bg-surface-secondary p-4">
        <Wallet aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Montant du prêt</p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatCFA(investissement.montant)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-separator bg-surface-secondary p-4">
          <Calendar aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Date d&apos;investissement</p>
            <p className="font-medium tabular-nums text-foreground">
              {formatDateFR(investissement.dateInvestissement)}
            </p>
          </div>
        </div>

        <div className={`flex items-start gap-3 rounded-lg border p-4 ${deadlineStatus.color}`}>
          <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs">Échéance</p>
            <p className="font-medium tabular-nums">{formatDateFR(investissement.deadline)}</p>
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${deadlineStatus.color}`}>
        <div>
          <p className="font-semibold">{deadlineStatus.status}</p>
          <p className="text-sm tabular-nums">{deadlineStatus.days}</p>
        </div>
        <Clock aria-hidden="true" className="size-8 shrink-0 opacity-50" />
      </div>
    </FenetreAction>
  );
}
