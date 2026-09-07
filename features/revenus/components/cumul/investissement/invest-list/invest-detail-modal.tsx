'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, DollarSign, Eye, User, Clock } from 'lucide-react';
import { IInvestissement } from '@/features/revenus/types/revenus.types';
import Image from 'next/image';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { differenceInDays } from 'date-fns';

interface InvestDetailModalProps {
  investissement: IInvestissement;
}

// Fonction pour déterminer la couleur et le statut de l'échéance
const getDeadlineStatus = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const daysUntilDeadline = differenceInDays(deadlineDate, today);

  if (daysUntilDeadline < 0) {
    return {
      color: 'text-red-600 bg-red-50',
      status: 'Échéance dépassée',
      days: `${Math.abs(daysUntilDeadline)} jour(s) de retard`,
    };
  } else if (daysUntilDeadline < 7) {
    return {
      color: 'text-red-600 bg-red-50',
      status: 'Échéance imminente',
      days: `${daysUntilDeadline} jour(s) restant(s)`,
    };
  } else if (daysUntilDeadline < 30) {
    return {
      color: 'text-orange-600 bg-orange-50',
      status: 'Échéance proche',
      days: `${daysUntilDeadline} jour(s) restant(s)`,
    };
  } else {
    return {
      color: 'text-green-600 bg-green-50',
      status: 'Échéance éloignée',
      days: `${daysUntilDeadline} jour(s) restant(s)`,
    };
  }
};

export function InvestDetailModal({ investissement }: InvestDetailModalProps) {
  const deadlineStatus = getDeadlineStatus(investissement.deadline);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer hover:text-blue-800 transition-colors">
          <Eye className="h-5 w-5 text-red-500" />
          <span className="hidden md:flex text-sm font-medium">Voir détails</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div>
            <DialogTitle className="text-xl">Détails de l&apos;investissement</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Informations complètes</p>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Investisseur */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Investisseur</p>
              <p className="font-semibold text-lg">{investissement.nomInvestisseur}</p>
            </div>
          </div>

          {/* Montant */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Montant du prêt</p>
              <p className="font-bold text-2xl text-green-600">{formatCFA(investissement.montant)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Date d'investissement */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-secondary">
              <div className="p-2 rounded-full bg-surface-secondary">
                <Calendar className="h-5 w-5 text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Date d&apos;investissement</p>
                <p className="font-medium">{formatDateFR(investissement.dateInvestissement)}</p>
              </div>
            </div>

            {/* Échéance */}
            <div className={`flex items-start gap-3 p-4 rounded-lg ${deadlineStatus.color}`}>
              <div className="p-2 rounded-full bg-surface/50">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs opacity-75">Échéance</p>
                <p className="font-medium">{formatDateFR(investissement.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Statut de l'échéance */}
          <div className={`p-4 rounded-lg ${deadlineStatus.color} border-2 border-current/20`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{deadlineStatus.status}</p>
                <p className="text-sm opacity-75">{deadlineStatus.days}</p>
              </div>
              <Clock className="h-8 w-8 opacity-50" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer flex-1">
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
