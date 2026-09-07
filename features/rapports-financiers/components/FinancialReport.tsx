'use client';

import { Download } from 'lucide-react';
import { Button, Card, CardBody, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Spinner, ProgressBar } from '@/components/heroui';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useMemo, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useRapportFinancier } from '@/features/finance-dashboard/queries/global-stats.query';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { exportFinancialReportCsv } from '@/features/rapports-financiers/utils/financial-report-export.utils';
import { exportFinancialReportPdf } from '@/features/rapports-financiers/utils/financial-report-pdf.utils';
import EtatErreur from '@/components/commons/EtatErreur';

interface RapportFinancierResponse {
  chiffreAffaire: number;
  depensesFixes: number;
  depensesVariables: number;
  totalDepenses: number;
  benefice: number;
  tauxMarge: number;
  coutJournalierMoyen: number;
  caJournalierMoyen: number;
}

interface FixedCost {
  label: string;
  percentage: number;
  amount: string;
}

interface VariableExpense {
  date: string;
  designation: string;
  amount: string;
}

export default function FinancialReport() {
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      debut: startOfMonth(now),
      fin: endOfMonth(now),
    };
  });

  const handleDateChange = (value: any) => {
    setFilters({
      debut: value?.from,
      fin: value?.to,
    });
  };

  // Récupérer les données de l'API avec le hook useRapportFinancier
  const {
    data: rapportData,
    isFetching: isFetchingRapport,
    isError: isErrorRapport,
    refetch: refetchRapport,
  } = useRapportFinancier({
    debut: filters.debut,
    fin: filters.fin,
  }) as { data: RapportFinancierResponse | undefined; isLoading: boolean; isFetching: boolean; isError: boolean; refetch: () => void };

  // Récupérer les charges fixes
  const {
    data: chargesFixesData,
    isFetching: isFetchingChargesFixes,
    isError: isErrorChargesFixes,
    refetch: refetchChargesFixes,
  } = useChargesFixesQuery({
    // `debut`/`fin` etaient ABSENTS alors que la page porte un selecteur de periode et
    // que le rapport principal, lui, les passe (voir plus haut). La « Repartition des
    // Charges Fixes » interrogeait donc TOUTES les charges, toutes periodes confondues,
    // sous un titre qui laissait croire l'inverse — et la carte « Vue d'Ensemble » juste
    // au-dessus affichait, elle, le total filtre sur la periode choisie.
    debut: filters.debut ? format(filters.debut, 'yyyy-MM-dd') : undefined,
    fin: filters.fin ? format(filters.fin, 'yyyy-MM-dd') : undefined,
    size: 100,
  });

  // Calculs dynamiques basés sur les données du rapport financier
  const metrics = useMemo(() => {
    if (!rapportData) {
      return [
        { label: "Chiffre d'Affaires", value: '0 FCFA' },
        { label: 'Dépenses Fixes', value: '0 FCFA' },
        { label: 'Dépenses Variables', value: '0 FCFA' },
        { label: 'Total Dépenses', value: '0 FCFA', highlight: 'warning' as const },
        { label: 'Bénéfice', value: '0 FCFA', highlight: 'success' as const },
      ];
    }

    // Utiliser la structure exacte de l'API
    const chiffreAffaire = rapportData.chiffreAffaire || 0;
    const depensesFixes = rapportData.depensesFixes || 0;
    const depensesVariables = rapportData.depensesVariables || 0;
    const totalDepenses = rapportData.totalDepenses || 0;
    const benefice = rapportData.benefice || 0;

    return [
      { label: "Chiffre d'Affaires", value: formatCFA(chiffreAffaire) },
      { label: 'Dépenses Fixes', value: formatCFA(depensesFixes) },
      { label: 'Dépenses Variables', value: formatCFA(depensesVariables) },
      { label: 'Total Dépenses', value: formatCFA(totalDepenses), highlight: 'warning' as const },
      { label: 'Bénéfice', value: formatCFA(benefice), highlight: 'success' as const },
    ];
  }, [rapportData]);

  const kpis = useMemo(() => {
    if (!rapportData) {
      return [
        { label: 'Taux de Marge', value: '0.00%' },
        { label: 'Coût Journalier Moyen', value: '0', unit: 'FCFA' },
        { label: 'CA Journalier Moyen', value: '0', unit: 'FCFA' },
      ];
    }

    // Utiliser les valeurs directement de l'API
    const tauxMarge = rapportData.tauxMarge || 0;
    const coutJournalierMoyen = rapportData.coutJournalierMoyen || 0;
    const caJournalierMoyen = rapportData.caJournalierMoyen || 0;

    return [
      { label: 'Taux de Marge', value: `${tauxMarge.toFixed(2)}%` },
      { label: 'Coût Journalier Moyen', value: Math.round(coutJournalierMoyen).toString(), unit: 'FCFA' },
      { label: 'CA Journalier Moyen', value: Math.round(caJournalierMoyen).toString(), unit: 'FCFA' },
    ];
  }, [rapportData]);

  // Transformer les dépenses fixes en données pour le graphique
  /**
   * Vrai quand la reponse porte plus de lignes que les 100 demandees.
   *
   * <p>Le denominateur ci-dessous est une somme sur les lignes RECUES. Au-dela du
   * plafond, les barres totalisent donc 100 % d'un sous-ensemble : une charge pesant
   * 3 % du reel s'affiche a 12 %. Et ces pourcentages partent tels quels dans le CSV et
   * le PDF, ou plus rien ne rappelle qu'ils ont ete calcules sur une partie. On ne peut
   * pas corriger le calcul sans tout charger — on dit donc que la vue est partielle.</p>
   */
  const fixesTronquees =
    (chargesFixesData?.totalElements ?? 0) > (chargesFixesData?.content?.length ?? 0);

  const fixedCosts: FixedCost[] = useMemo(() => {
    const content = chargesFixesData?.content;
    if (!content || content.length === 0) return [];

    const totalFixes = content.reduce((sum, c) => sum + (c.montant || 0), 0);

    return content.map((charge) => ({
      label: charge.designation,
      percentage: totalFixes > 0 ? Math.round((charge.montant / totalFixes) * 100) : 0,
      amount: formatCFA(charge.montant),
    }));
  }, [chargesFixesData]);

  const handleExportCsv = () => {
    exportFinancialReportCsv({
      metrics,
      kpis,
      fixedCosts,
      variableExpenses,
      debut: filters.debut,
      fin: filters.fin,
      // Le fichier sort du batiment : il doit dire lui-meme que la vue est partielle.
      fixesTronquees,
      totalFixes: chargesFixesData?.totalElements,
      variablesTronquees,
      totalVariables: chargesVariablesData?.totalElements,
    });
  };

  const handleExportPdf = async () => {
    await exportFinancialReportPdf({
      metrics,
      kpis,
      fixedCosts,
      variableExpenses,
      debut: filters.debut,
      fin: filters.fin,
      fixesTronquees,
      totalFixes: chargesFixesData?.totalElements,
      variablesTronquees,
      totalVariables: chargesVariablesData?.totalElements,
    });
  };

  const {
    data: chargesVariablesData,
    isLoading: chargesVariablesLoading,
    isFetching: isFetchingChargesVariables,
    isError: isErrorChargesVariables,
    refetch: refetchChargesVariables,
  } = useChargesVariablesQuery({
    // Meme correctif que pour les charges fixes : la liste « Depenses Variables de la
    // Periode » ignorait la periode.
    debut: filters.debut ? format(filters.debut, 'yyyy-MM-dd') : undefined,
    fin: filters.fin ? format(filters.fin, 'yyyy-MM-dd') : undefined,
    size: 100,
  });

  const variablesTronquees =
    (chargesVariablesData?.totalElements ?? 0) > (chargesVariablesData?.content?.length ?? 0);

  const variableExpenses: VariableExpense[] = (chargesVariablesData?.content ?? []).map((charge) => {
    const rawDate = charge.dateDecaissement ?? charge.createdAt;
    return {
      date: rawDate ? format(new Date(rawDate), 'dd/MM/yyyy') : '-',
      designation: charge.designation,
      amount: formatCFA(charge.montant),
    };
  });

  return (
    <div className="bg-surface-secondary p-6">
      {/* Header */}
      <div className="bg-surface rounded-xl border border-separator p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Rapports Financiers</h1>
              <p className="text-sm text-muted">Consultez et exportez vos rapports mensuels</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button color="primary" className="bg-purple-600" startContent={<Download className="w-4 h-4" />} onPress={handleExportCsv}>
              Exporter CSV
            </Button>
            <Button color="secondary" variant="bordered" startContent={<Download className="w-4 h-4" />} onPress={handleExportPdf}>
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5">
            <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vue d'Ensemble */}
          <Card>
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Vue d&#39;Ensemble</h2>
              {/* Sans rapport, `metrics` retombe sur une liste entierement a « 0 FCFA »
                  y compris le benefice : un rapport illisible se lisait comme un mois blanc. */}
              {isErrorRapport ? (
                <EtatErreur quoi="le rapport financier" onReessayer={() => refetchRapport()} enCours={isFetchingRapport} />
              ) : (
              <div className="space-y-3">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${metric.highlight === 'warning' ? 'bg-orange-50' : metric.highlight === 'success' ? 'bg-green-50' : ''}`}
                  >
                    <span className={`text-sm ${metric.highlight ? 'font-medium' : 'text-muted'}`}>{metric.label}</span>
                    <span className={`text-sm font-semibold ${metric.highlight === 'warning' ? 'text-orange-700' : metric.highlight === 'success' ? 'text-green-700' : 'text-foreground'}`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
              )}
            </CardBody>
          </Card>

          {/* Indicateurs Clés */}
          <Card>
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Indicateurs Clés</h2>
              {isErrorRapport ? (
                <EtatErreur quoi="les indicateurs clés" onReessayer={() => refetchRapport()} enCours={isFetchingRapport} />
              ) : (
              <div className="space-y-3">
                {kpis.map((kpi, index) => (
                  <div key={index} className="p-4 bg-surface-secondary rounded-lg border border-separator">
                    <p className="text-sm text-muted mb-1">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground">
                      {kpi.value}
                      {kpi.unit && <span className="text-base font-normal text-muted ml-1">{kpi.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Répartition des Charges Fixes */}
        <Card>
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Répartition des Charges Fixes
              {fixesTronquees && (
                <span className="ml-2 text-sm font-normal text-muted">
                  {chargesFixesData?.content?.length} charges sur {chargesFixesData?.totalElements} — répartition partielle
                </span>
              )}
            </h2>
            {isErrorChargesFixes ? (
              /* Sur echec la liste des charges est vide : la repartition disparait
                 sans un mot, comme s'il n'y avait aucune charge fixe. */
              <EtatErreur quoi="les charges fixes" onReessayer={() => refetchChargesFixes()} enCours={isFetchingChargesFixes} />
            ) : (
            <div className="space-y-4">
              {fixedCosts.map((cost, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">{cost.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted">{cost.percentage}%</span>
                      <span className="text-sm font-medium text-foreground w-24 text-right">{cost.amount}</span>
                    </div>
                  </div>
                  {/* `accent` peignait en ROUGE DE MARQUE la part de chaque poste de
                      cout : dix barres rouges pour dix repartitions ordinaires. */}
                  <ProgressBar
                    aria-label={cost.label}
                    className="h-2"
                    color="default"
                    value={cost.percentage}
                  >
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                </div>
              ))}
            </div>
            )}
          </CardBody>
        </Card>

        {/* Dépenses Variables de la Période */}
        <Card>
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Dépenses Variables de la Période
              {variablesTronquees && (
                <span className="ml-2 text-sm font-normal text-muted">
                  {chargesVariablesData?.content?.length} sur {chargesVariablesData?.totalElements} affichées
                </span>
              )}
            </h2>

            {/* Ecran a double rendu : le tableau desktop ET les cartes mobiles disaient
                « Aucune depense variable sur la periode ». Les deux sont remplaces
                ensemble, sinon l'un des deux affichages continuerait de mentir. */}
            {isErrorChargesVariables ? (
              <EtatErreur quoi="les dépenses variables" onReessayer={() => refetchChargesVariables()} enCours={isFetchingChargesVariables} />
            ) : (
            <>
            {/* Tableau — desktop uniquement (≥ md) */}
            <div className="hidden md:block">
              <Table aria-label="Dépenses variables">
                <TableHeader>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>DÉSIGNATION</TableColumn>
                  <TableColumn className="text-right">MONTANT</TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={chargesVariablesLoading}
                  loadingContent={<Spinner color="primary" label="Chargement des dépenses…" />}
                  emptyContent={chargesVariablesLoading ? ' ' : 'Aucune dépense variable sur la période'}
                >
                  {variableExpenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm text-muted">{expense.date}</TableCell>
                      <TableCell className="text-sm text-foreground">{expense.designation}</TableCell>
                      <TableCell className="text-sm text-foreground text-right font-medium">{expense.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile — cartes tactiles (remplace le tableau < md) */}
            <div className="md:hidden space-y-3">
              {variableExpenses.length === 0 ? (
                <p className="text-sm text-muted text-center py-10">Aucune dépense variable sur la période</p>
              ) : (
                variableExpenses.map((expense, index) => (
                  <div key={index} className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{expense.designation}</p>
                      <span className="text-sm font-semibold text-foreground shrink-0">{expense.amount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">Date</span>
                      <span className="text-sm text-foreground">{expense.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
