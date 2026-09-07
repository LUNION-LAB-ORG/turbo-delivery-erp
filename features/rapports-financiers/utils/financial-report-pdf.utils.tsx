import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';

export interface FinancialReportPdfParams {
  /** Vue PARTIELLE : la lecture a ete plafonnee. Optionnels, cf. l'export CSV. */
  fixesTronquees?: boolean;
  totalFixes?: number;
  variablesTronquees?: boolean;
  totalVariables?: number;
  metrics: { label: string; value: string }[];
  kpis: { label: string; value: string; unit?: string }[];
  fixedCosts: { label: string; percentage: number; amount: string }[];
  variableExpenses: { date: string; designation: string; amount: string }[];
  debut?: Date;
  fin?: Date;
}

function fmtDate(d?: Date): string {
  if (!d) return '-';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fmtNow(): string {
  const now = new Date();
  return `${fmtDate(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Remplace \u202F et \u00A0 (espaces insécables) par un espace ASCII normal */
function sanitize(value: string): string {
  return value.replace(/[\u202F\u00A0]/g, ' ');
}

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  title: { fontSize: 18, color: '#7c3aed', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 14 },
  metaBox: { backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 10, marginBottom: 18 },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { fontFamily: 'Helvetica-Bold', width: 90 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', borderBottom: '1.5pt solid #7c3aed', paddingBottom: 4, marginBottom: 10, marginTop: 16 },
  // KPI row (Vue d'ensemble)
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  kpiCard: { width: '30%', backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 8 },
  kpiLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111' },
  kpiCardWarning: { width: '30%', backgroundColor: '#fff7ed', border: '1pt solid #fed7aa', borderRadius: 4, padding: 8 },
  kpiCardSuccess: { width: '30%', backgroundColor: '#f0fdf4', border: '1pt solid #bbf7d0', borderRadius: 4, padding: 8 },
  kpiValueWarning: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#c2410c' },
  kpiValueSuccess: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#15803d' },
  // Indicateurs Clés
  indRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  indCard: { flex: 1, backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 10 },
  indLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  indValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111' },
  indUnit: { fontSize: 9, fontFamily: 'Helvetica', color: '#6b7280' },
  // Charges Fixes
  chargeRow: { flexDirection: 'row', padding: '6 4', borderBottom: '1pt solid #f3f4f6', alignItems: 'center' },
  chargeRowAlt: { flexDirection: 'row', padding: '6 4', borderBottom: '1pt solid #f3f4f6', backgroundColor: '#f9fafb', alignItems: 'center' },
  chargeLabel: { flex: 3 },
  chargeBarBg: { flex: 4, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginHorizontal: 8 },
  chargeBarFill: { height: 6, backgroundColor: '#7c3aed', borderRadius: 3 },
  chargePct: { width: 28, textAlign: 'right', color: '#6b7280' },
  chargeAmount: { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  // Dépenses Variables
  tableHeader: { flexDirection: 'row', backgroundColor: '#ede9fe', padding: 7, borderBottom: '1pt solid #ddd6fe' },
  tableRow: { flexDirection: 'row', padding: 7, borderBottom: '1pt solid #f3f4f6' },
  tableRowAlt: { flexDirection: 'row', padding: 7, borderBottom: '1pt solid #f3f4f6', backgroundColor: '#f9fafb' },
  colDate: { width: 60 },
  colDesig: { flex: 1 },
  colMontant: { width: 80, textAlign: 'right' },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

const HIGHLIGHTS = ['warning', 'success'];

function FinancialReportPdfDocument({ metrics, kpis, fixedCosts, variableExpenses, debut, fin,
  fixesTronquees, totalFixes, variablesTronquees, totalVariables }: FinancialReportPdfParams) {
  const now = fmtNow();
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Entête */}
        <Text style={s.title}>Rapport Financier</Text>
        <Text style={s.subtitle}>Turbo Delivery ERP</Text>

        <View style={s.metaBox}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Periode :</Text>
            <Text>{fmtDate(debut)} - {fmtDate(fin)}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Date export :</Text>
            <Text>{now}</Text>
          </View>
        </View>

        {/* Section 1 — Vue d'Ensemble */}
        <Text style={s.sectionTitle}>{"Vue d'ensemble"}</Text>
        <View style={s.kpiRow}>
          {metrics.map((m, i) => {
            const cardStyle = m.label === 'Total Depenses' || m.label === 'Total Dépenses'
              ? s.kpiCardWarning
              : m.label === 'Benefice' || m.label === 'Bénéfice'
              ? s.kpiCardSuccess
              : s.kpiCard;
            const valStyle = m.label === 'Total Depenses' || m.label === 'Total Dépenses'
              ? s.kpiValueWarning
              : m.label === 'Benefice' || m.label === 'Bénéfice'
              ? s.kpiValueSuccess
              : s.kpiValue;
            return (
              <View key={i} style={cardStyle}>
                <Text style={s.kpiLabel}>{m.label}</Text>
                <Text style={valStyle}>{sanitize(m.value)}</Text>
              </View>
            );
          })}
        </View>

        {/* Section 2 — Indicateurs Clés */}
        <Text style={s.sectionTitle}>Indicateurs Cles</Text>
        <View style={s.indRow}>
          {kpis.map((k, i) => (
            <View key={i} style={s.indCard}>
              <Text style={s.indLabel}>{k.label}</Text>
              <Text style={s.indValue}>
                {sanitize(k.value)}{k.unit ? ' ' : ''}<Text style={s.indUnit}>{k.unit ?? ''}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Section 3 — Répartition des Charges Fixes */}
        <Text style={s.sectionTitle}>Repartition des Charges Fixes</Text>
        {/* Les pourcentages portent sur les lignes CHARGEES. Sans cette mention, le PDF
            presentait une repartition partielle comme complete, hors de tout contexte. */}
        {fixesTronquees && (
          <Text style={s.sectionTitle}>
            Repartition PARTIELLE — {fixedCosts.length} charges sur {totalFixes}
          </Text>
        )}
        <View style={s.tableHeader}>
          <Text style={[s.chargeLabel, s.thText]}>Libelle</Text>
       
          <Text style={[s.chargeAmount, s.thText]}>Montant</Text>
        </View>
        {fixedCosts.map((c, i) => (
          <View key={i} style={i % 2 === 0 ? s.chargeRow : s.chargeRowAlt}>
            <Text style={s.chargeLabel}>{c.label}</Text>
            <Text style={s.chargeAmount}>{sanitize(c.amount)}</Text>
          </View>
        ))}

        {/* Section 4 — Dépenses Variables */}
        <Text style={s.sectionTitle}>Depenses Variables de la Periode</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colDate, s.thText]}>Date</Text>
          <Text style={[s.colDesig, s.thText]}>Designation</Text>
          <Text style={[s.colMontant, s.thText]}>Montant</Text>
        </View>
        {variableExpenses.map((e, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={s.colDate}>{e.date}</Text>
            <Text style={s.colDesig}>{e.designation}</Text>
            <Text style={s.colMontant}>{sanitize(e.amount)}</Text>
          </View>
        ))}

        <Text style={s.footer}>Genere par Turbo Delivery ERP - {now}</Text>
      </Page>
    </Document>
  );
}

export async function exportFinancialReportPdf(params: FinancialReportPdfParams): Promise<void> {
  const blob = await pdf(<FinancialReportPdfDocument {...params} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const debutStr = params.debut ? params.debut.toISOString().slice(0, 7) : 'debut';
  const finStr = params.fin ? params.fin.toISOString().slice(0, 7) : 'fin';
  a.download = `rapport_financier_${debutStr}_${finStr}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
