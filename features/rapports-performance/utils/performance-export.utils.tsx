import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { IMainKPIs, ISecondaryKPIs, IFinancialDetails } from '../types/performance.type';

export interface ExportParams {
  mainKPIs?: IMainKPIs;
  secondaryKPIs?: ISecondaryKPIs;
  financialDetails?: IFinancialDetails;
  selectedRestaurant: string;
  debut?: Date;
  fin?: Date;
}

/** Formatage PDF-safe : utilise un espace ASCII standard (pas \u202F) */
function fmtPdf(value?: number): string {
  if (value == null) return '-';
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

function fmtNum(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function fmtDate(d?: Date): string {
  if (!d) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function fmtNow(): string {
  const now = new Date();
  return `${fmtDate(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  title: { fontSize: 18, color: '#ef4444', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 14 },
  metaBox: { backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 10, marginBottom: 18 },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { fontFamily: 'Helvetica-Bold', width: 90 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', borderBottom: '1.5pt solid #ef4444', paddingBottom: 4, marginBottom: 10, marginTop: 14 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 10 },
  kpiLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fed7aa', padding: 7, borderBottom: '1pt solid #e5e7eb' },
  tableRow: { flexDirection: 'row', padding: 7, borderBottom: '1pt solid #f3f4f6' },
  tableRowAlt: { flexDirection: 'row', padding: 7, borderBottom: '1pt solid #f3f4f6', backgroundColor: '#f9fafb' },
  tableRowTotal: { flexDirection: 'row', padding: 7, backgroundColor: '#ecfdf5' },
  colLabel: { flex: 3 },
  colValue: { flex: 2, textAlign: 'right' },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  totalText: { fontFamily: 'Helvetica-Bold', color: '#065f46', fontSize: 11 },
  orangeText: { color: '#ea580c' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

function PerformancePdfDocument({ mainKPIs, secondaryKPIs, financialDetails, selectedRestaurant, debut, fin }: ExportParams) {
  const now = fmtNow();
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Rapport de Performance</Text>
        <Text style={s.subtitle}>Restaurant : {selectedRestaurant}</Text>

        <View style={s.metaBox}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Periode :</Text>
            <Text>{fmtDate(debut)} - {fmtDate(fin)}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Date d&apos;export :</Text>
            <Text>{now}</Text>
          </View>
        </View>

        {/* KPIs principaux. Trois cartes, comme a l'ecran.
            Deux ont ete retirees, pour deux raisons differentes :
            - « Chiffre d'Affaires » portait mainKPIs.chiffreAffaires, qui additionnait les
              entrees de caisse GLOBALES : le PDF de chaque partenaire emportait le meme
              million appartenant a un autre. Ce que la carte voulait dire, la facture a
              regler, est ecrit plus bas dans le detail financier ;
            - « CA (Chiffre d'Affaires) » affichait financialDetails.totalOrderAmount,
              exactement le meme nombre que la carte voisine, sous un troisieme nom. */}
        <Text style={s.sectionTitle}>Indicateurs Cles de Performance</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Nombre de Livraisons</Text>
            <Text style={s.kpiValue}>{fmtNum(mainKPIs?.totalDeliveries ?? 0)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Chiffre d&apos;affaires genere par les livraisons</Text>
            <Text style={s.kpiValue}>{fmtPdf(mainKPIs?.totalOrderValue)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Taux de Succes</Text>
            <Text style={s.kpiValue}>{mainKPIs?.successRate != null ? `${mainKPIs.successRate.toFixed(1)}%` : '-'}</Text>
          </View>
        </View>

        {/* KPIs secondaires */}
        <Text style={s.sectionTitle}>Metriques Operationnelles</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Temps Moyen de Livraison</Text>
            <Text style={s.kpiValue}>{secondaryKPIs?.averageDeliveryTime ?? '-'} min</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Croissance Mensuelle</Text>
            <Text style={s.kpiValue}>{secondaryKPIs?.monthlyGrowth != null ? `${secondaryKPIs.monthlyGrowth.toFixed(1)}%` : '-'}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Articles par Commande</Text>
            <Text style={s.kpiValue}>{secondaryKPIs?.averageItemsPerOrder ?? '-'}</Text>
          </View>
        </View>

        {/* Détails financiers */}
        <Text style={s.sectionTitle}>Details Financiers</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colLabel, s.thText]}>Libelle</Text>
          <Text style={[s.colValue, s.thText]}>Montant</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.colLabel}>Grace a nos livraisons, le partenaire a vendu</Text>
          <Text style={s.colValue}>{fmtPdf(financialDetails?.totalOrderAmount)}</Text>
        </View>
        <View style={s.tableRowAlt}>
          <Text style={s.colLabel}>Frais de livraison generes sur l&apos;ensemble des courses</Text>
          <Text style={s.colValue}>{fmtPdf(financialDetails?.deliveryFeesCollected)}</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.colLabel}>Frais de service TURBO DELIVERY obtenus</Text>
          <Text style={[s.colValue, s.orangeText]}>{fmtPdf(financialDetails?.turboDeliveryServiceFees)}</Text>
        </View>
        <View style={s.tableRowTotal}>
          <Text style={[s.colLabel, s.totalText]}>Facture totale a regler au compte du mois en cours</Text>
          <Text style={[s.colValue, s.totalText]}>{fmtPdf(financialDetails?.totalFacture)}</Text>
        </View>

        <Text style={s.footer}>Genere par Turbo Delivery ERP - {now}</Text>
      </Page>
    </Document>
  );
}

export async function exportPerformancePdf(params: ExportParams): Promise<void> {
  const blob = await pdf(<PerformancePdfDocument {...params} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-performance-${params.selectedRestaurant}-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
