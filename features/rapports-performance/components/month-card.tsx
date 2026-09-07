'use client';

import { TrendingUp, Users, Briefcase, ArrowUpRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, ProgressBar } from '@heroui-v3/react';
import { CardContent } from '@/components/ui/card';
import { MonthData } from '../hooks/use-bilan-annuel';

interface MonthCardProps {
  month: MonthData;
}

function MonthStatsCards({ month }: MonthCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-surface-secondary border-separator">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Courses</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{month.courses}</p>
        </CardContent>
      </Card>
      <Card className="bg-surface-secondary border-separator">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Staff</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{month.staff}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthFinancials({ month }: MonthCardProps) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <div className="flex items-center gap-1 text-muted text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>CA</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{month.ca}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-muted text-xs mb-1">
            <PlusCircle className="w-3 h-3" />
            <span>Autres entrées</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{month.autresEntrees}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-muted text-xs mb-1">
            <span>% Dépenses</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{month.expenses}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-muted text-xs mb-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Remboursements</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{month.reimbursements}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-muted text-xs mb-1">
            <Briefcase className="w-3 h-3" />
            <span>Investissements</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{month.investments}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Progression annuelle</span>
          <span className="text-muted">{month.progress}/12</span>
        </div>
        {/* Sans `color`, la v3 remplit en accent — le rouge de marque sur un simple
            avancement dans l'annee. */}
        <ProgressBar
          aria-label="Progression annuelle"
          className="h-2"
          color="default"
          value={(month.progress / 12) * 100}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </>
  );
}

function MonthProfitability({ month }: MonthCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-foreground font-semibold mb-3">
        <div className="w-1 h-4 bg-foreground rounded-full" />
        RENTABILITÉ
      </div>
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <p className="text-xs text-muted mb-1">Résultat du mois</p>
          <p className="text-base sm:text-lg font-bold text-green-700 mb-1 break-all">
            {month.monthlyResult}
          </p>
          <p className="text-xs text-muted">Bénéfice mensuel</p>
        </CardContent>
      </Card>
      <Card className="bg-blue-600 text-white border-blue-600">
        <CardContent className="p-4">
          <p className="text-xs text-blue-100 mb-1">RENTABILITÉ CUMULÉE YTD</p>
          <p className="text-base sm:text-lg font-bold mb-1 break-all">
            {month.cumulativeResult}
          </p>
          <p className="text-xs text-blue-100">Depuis : {month.monthName}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-blue-100 hover:text-white hover:bg-blue-700 p-0 h-auto"
          >
            Voir détails
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function MonthCard({ month }: MonthCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${month.hasData ? 'text-red-600' : 'text-muted'}`}>
            {month.monthName}
          </h2>
          {month.hasData && month.isProfitable && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 hover:bg-green-100"
            >
              Rentable
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <MonthStatsCards month={month} />
            {month.hasData ? (
              <MonthFinancials month={month} />
            ) : (
              <p className="text-muted text-sm italic">Aucun chiffre pour ce mois</p>
            )}
          </div>
          {month.hasData && <MonthProfitability month={month} />}
        </div>
      </CardContent>
    </Card>
  );
}
