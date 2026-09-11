import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import {
  IFinancialDetails,
  IMainKPIs,
  ISecondaryKPIs,
  IStorePerformance,
} from '../types/performance.type';
import { libellePourFichier } from './selection.utils';

export interface ExportParams {
  mainKPIs?: IMainKPIs;
  secondaryKPIs?: ISecondaryKPIs;
  financialDetails?: IFinancialDetails;
  /**
   * Ce sur quoi le rapport porte : « PLATO », « 4 partenaires », « Groupe AGHA ».
   *
   * <p>Le champ s'appelait `selectedRestaurant` et l'en-tete du document ecrivait
   * « Restaurant : X ». Sur un cumul, le PDF annoncait donc un etablissement qui n'existe
   * pas, et son nom de fichier aussi - deux documents de deux groupes differents pouvaient
   * meme se recouvrir dans le dossier de telechargement.</p>
   */
  libelleSelection: string;
  /** Vrai quand les montants cumulent plusieurs etablissements : les libelles s'accordent. */
  consolide?: boolean;
  /**
   * Le detail par etablissement, quand il existe. NUL en unitaire et en global : le
   * document ne porte alors aucune page de detail, exactement comme l'ecran.
   */
  parStore?: IStorePerformance[] | null;
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

/**
 * Un montant SANS son suffixe, pour le tableau du detail par store ou l'unite est portee
 * une seule fois par l'en-tete de colonne.
 *
 * <p>L'arrondi est fait AVANT le groupement : `1.85782951E8` arrive en nombre a virgule
 * flottante depuis le JSON, et `toString()` sur un tel nombre pose des decimales que
 * l'expression de groupement decoupe n'importe ou.</p>
 */
function fmtMontantColonne(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return fmtNum(Math.round(value));
}

function fmtTauxColonne(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return `${value.toFixed(1)} %`;
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
  kpiLabel: { fontSize: 7, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111' },
  /* La decomposition sous « Montant total de livraisons », exactement comme a l'ecran. */
  kpiNote: { fontSize: 6.5, color: '#6b7280', marginTop: 3 },
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

  /*
   * Le detail par store : sept colonnes a largeur FIXE, en points.
   *
   * Des `flex` proportionnels donnaient a la colonne « Facture » la meme largeur qu'a
   * « Taux », alors qu'elle doit loger « 111 354 651 » quand l'autre loge « 100.0 % ». La
   * somme fait 535 pt, soit exactement la largeur utile d'une A4 moins les marges de 30 pt
   * du gabarit : une colonne de plus deborderait sans que rien ne le signale.
   */
  storeHeader: { flexDirection: 'row', backgroundColor: '#fed7aa', paddingVertical: 5, paddingHorizontal: 4, borderBottom: '1pt solid #e5e7eb' },
  storeRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottom: '1pt solid #f3f4f6' },
  storeRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottom: '1pt solid #f3f4f6', backgroundColor: '#f9fafb' },
  storeRowTotal: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderTop: '1.5pt solid #9ca3af', backgroundColor: '#ecfdf5' },
  storeCellNom: { width: 125, fontSize: 8 },
  storeCellLivraisons: { width: 55, fontSize: 8, textAlign: 'right' },
  storeCellValeur: { width: 85, fontSize: 8, textAlign: 'right' },
  storeCellTaux: { width: 50, fontSize: 8, textAlign: 'right' },
  storeCellFrais: { width: 75, fontSize: 8, textAlign: 'right' },
  storeCellCommission: { width: 75, fontSize: 8, textAlign: 'right' },
  storeCellFacture: { width: 70, fontSize: 8, textAlign: 'right' },
  storeTh: { fontFamily: 'Helvetica-Bold' },
  storeTotalText: { fontFamily: 'Helvetica-Bold', color: '#065f46' },
});

/** N'importe quel style de cette feuille : `object` n'est pas accepte par react-pdf. */
type StylePdf = (typeof s)[keyof typeof s];

/**
 * Une ligne du detail par store : SEPT colonnes, dans l'ordre de l'ecran.
 *
 * <p>La ligne de total emprunte le meme composant, avec la police du total en supplement.
 * C'est ce qui garantit que le total tombe SOUS sa colonne : deux listes de cellules
 * ecrites separement se seraient decalees a la premiere colonne ajoutee.</p>
 */
function LigneStore({
  ligne,
  style,
  texte,
}: {
  ligne: IStorePerformance;
  style: StylePdf;
  texte?: StylePdf;
}) {
  const st = (base: StylePdf): StylePdf | StylePdf[] => (texte ? [base, texte] : base);

  return (
    <View style={style}>
      <Text style={st(s.storeCellNom)}>{ligne.nom ?? ligne.restaurantId}</Text>
      <Text style={st(s.storeCellLivraisons)}>{fmtMontantColonne(ligne.totalDeliveries)}</Text>
      <Text style={st(s.storeCellValeur)}>{fmtMontantColonne(ligne.totalOrderValue)}</Text>
      <Text style={st(s.storeCellTaux)}>{fmtTauxColonne(ligne.successRate)}</Text>
      <Text style={st(s.storeCellFrais)}>{fmtMontantColonne(ligne.deliveryFeesCollected)}</Text>
      <Text style={st(s.storeCellCommission)}>{fmtMontantColonne(ligne.turboDeliveryServiceFees)}</Text>
      <Text style={st(s.storeCellFacture)}>{fmtMontantColonne(ligne.totalFacture)}</Text>
    </View>
  );
}

function PerformancePdfDocument({
  consolide = false,
  mainKPIs,
  secondaryKPIs,
  financialDetails,
  libelleSelection,
  parStore,
  debut,
  fin,
}: ExportParams) {
  const now = fmtNow();

  /*
   * Le total du detail est REFAIT depuis les lignes imprimees, et non recopie du bloc
   * consolide : c'est la seule facon que le pied du tableau soit le total de ce que le
   * lecteur a sous les yeux. L'API garantit l'egalite avec les cartes de tete, le document
   * la montre.
   *
   * ⚠ Le taux n'y figure pas. Il ne s'additionne pas : le taux de tete est celui de
   * l'ensemble des courses, pas la moyenne des taux par etablissement.
   */
  const totalStores = (parStore ?? []).reduce(
    (t, l) => ({
      restaurantId: 'total',
      nom: `Total - ${(parStore ?? []).length} etablissements`,
      totalDeliveries: t.totalDeliveries + (l.totalDeliveries ?? 0),
      totalOrderValue: t.totalOrderValue + (l.totalOrderValue ?? 0),
      successRate: null,
      deliveryFeesCollected: t.deliveryFeesCollected + (l.deliveryFeesCollected ?? 0),
      turboDeliveryServiceFees: t.turboDeliveryServiceFees + (l.turboDeliveryServiceFees ?? 0),
      totalFacture: t.totalFacture + (l.totalFacture ?? 0),
    }),
    {
      restaurantId: 'total',
      nom: `Total - ${(parStore ?? []).length} etablissements`,
      totalDeliveries: 0,
      totalOrderValue: 0,
      successRate: null,
      deliveryFeesCollected: 0,
      turboDeliveryServiceFees: 0,
      totalFacture: 0,
    } as IStorePerformance,
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Rapport de Performance</Text>
        {/* « Restaurant : X » devenait faux des que X etait « 4 partenaires ». */}
        <Text style={s.subtitle}>Selection : {libelleSelection}</Text>

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

        {/*
          * KPIs principaux : LES MEMES QUATRE CARTES QUE L'ECRAN, dans le meme ordre.
          *
          * C'est la regle du lot : « pareil egalement pour l'export, les stats doivent etre
          * pareils ». Un document qui porte trois cartes quand l'ecran en montre quatre
          * oblige son lecteur a rouvrir l'ERP pour retrouver le nombre manquant - ici, le
          * montant que TURBO facture, qui est justement celui qu'on exporte pour l'envoyer.
          *
          * Deux cartes anciennes ne reviennent pas, pour deux raisons differentes :
          * - « Chiffre d'Affaires » portait mainKPIs.chiffreAffaires, qui additionnait les
          *   entrees de caisse GLOBALES : le PDF de chaque partenaire emportait le meme
          *   million appartenant a un autre ;
          * - « CA (Chiffre d'Affaires) » affichait financialDetails.totalOrderAmount,
          *   exactement le meme nombre que la carte voisine, sous un troisieme nom.
          */}
        <Text style={s.sectionTitle}>Indicateurs Cles de Performance</Text>
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Nombre de Livraisons</Text>
            <Text style={s.kpiValue}>{fmtNum(mainKPIs?.totalDeliveries ?? 0)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Montant total de livraisons</Text>
            <Text style={s.kpiValue}>{fmtPdf(financialDetails?.totalFacture)}</Text>
            {/* La decomposition n'est ecrite QUE si les deux parts existent : « Frais 0 -
                Commission 0 » sous un total juste se lirait comme une facture sans origine. */}
            {financialDetails?.deliveryFeesCollected != null
              && financialDetails?.turboDeliveryServiceFees != null ? (
              <Text style={s.kpiNote}>
                Frais {fmtNum(Math.round(financialDetails.deliveryFeesCollected))}
                {' - '}
                Commission {fmtNum(Math.round(financialDetails.turboDeliveryServiceFees))}
              </Text>
            ) : null}
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Montant de commandes genere par les courses TURBO</Text>
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
            <Text style={s.kpiValue}>{secondaryKPIs?.averageDeliveryTime != null ? `${secondaryKPIs.averageDeliveryTime} min` : 'Non mesuré'}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Croissance Mensuelle</Text>
            <Text style={s.kpiValue}>{secondaryKPIs?.monthlyGrowth != null ? `${secondaryKPIs.monthlyGrowth.toFixed(1)}%` : '-'}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Articles par Commande</Text>
            <Text style={s.kpiValue}>{secondaryKPIs?.averageItemsPerOrder ?? 'Non mesuré'}</Text>
          </View>
        </View>

        {/* Détails financiers */}
        <Text style={s.sectionTitle}>Details Financiers</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colLabel, s.thText]}>Libelle</Text>
          <Text style={[s.colValue, s.thText]}>Montant</Text>
        </View>
        <View style={s.tableRow}>
          {/* Le singulier devient faux sur un cumul : « le partenaire » n'existe pas quand
              le montant additionne quatre etablissements ou un groupe entier. */}
          <Text style={s.colLabel}>
            {consolide
              ? 'Grace a nos livraisons, les partenaires ont vendu'
              : 'Grace a nos livraisons, le partenaire a vendu'}
          </Text>
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
          {/* « au compte du mois en cours » : la periode vient d'un selecteur de dates, et
              le document imprime deja ses bornes exactes dans son encadre de tete. */}
          <Text style={[s.colLabel, s.totalText]}>
            Facture totale a regler sur la periode
          </Text>
          <Text style={[s.colValue, s.totalText]}>{fmtPdf(financialDetails?.totalFacture)}</Text>
        </View>

        <Text style={s.footer}>Genere par Turbo Delivery ERP - {now}</Text>
      </Page>

      {/*
       * LE DETAIL PAR STORE, sur sa PROPRE page.
       *
       * Il n'existe que quand le serveur l'a servi - `parStore` non nul, c'est-a-dire en
       * multi et en groupe. En unitaire, le document est mot pour mot celui d'avant ce lot :
       * une page, les memes blocs, aucune page vide ajoutee.
       *
       * `parStore` VIDE (groupe inconnu, ou groupe sans etablissement) ne produit pas non
       * plus de page : imprimer un tableau a en-tetes sans une seule ligne se lirait comme
       * une perte de donnee, alors que l'ecran, lui, explique la raison.
       */}
      {parStore && parStore.length > 0 ? (
        <Page size="A4" style={s.page}>
          <Text style={s.title}>Detail par store</Text>
          <Text style={s.subtitle}>
            {libelleSelection} - {fmtDate(debut)} a {fmtDate(fin)}
          </Text>

          {/*
           * `fixed` REPETE cette ligne en tete de chaque page.
           *
           * Un groupe de trente etablissements deborde sur une seconde page, et sans cela
           * elle commencerait par sept colonnes de nombres sans un seul intitule : on ne
           * saurait plus laquelle porte la facture.
           *
           * Les intitules sont ABREGES ici, et seulement ici : chaque colonne fait entre 50
           * et 125 points, et « Frais de service TURBO DELIVERY (FCFA) » y tiendrait sur
           * cinq lignes. L'ecran, lui, les ecrit en entier.
           */}
          <View fixed style={s.storeHeader}>
            <Text style={[s.storeCellNom, s.storeTh]}>Etablissement</Text>
            <Text style={[s.storeCellLivraisons, s.storeTh]}>Livraisons</Text>
            <Text style={[s.storeCellValeur, s.storeTh]}>Valeur cmd. (FCFA)</Text>
            <Text style={[s.storeCellTaux, s.storeTh]}>Taux</Text>
            <Text style={[s.storeCellFrais, s.storeTh]}>Frais livr. (FCFA)</Text>
            <Text style={[s.storeCellCommission, s.storeTh]}>Frais TURBO (FCFA)</Text>
            <Text style={[s.storeCellFacture, s.storeTh]}>Facture (FCFA)</Text>
          </View>

          {parStore.map((ligne, index) => (
            <LigneStore
              key={ligne.restaurantId}
              ligne={ligne}
              style={index % 2 === 1 ? s.storeRowAlt : s.storeRow}
            />
          ))}

          <LigneStore ligne={totalStores} style={s.storeRowTotal} texte={s.storeTotalText} />

          <Text style={s.footer}>Genere par Turbo Delivery ERP - {now}</Text>
        </Page>
      ) : null}
    </Document>
  );
}

export async function exportPerformancePdf(params: ExportParams): Promise<void> {
  const blob = await pdf(<PerformancePdfDocument {...params} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Le nom du fichier DIT la selection : « rapport-performance-Groupe-AGHA-2026-09-10.pdf ».
  // Il portait le nom du restaurant, donc « 4 partenaires » avec ses espaces sur un cumul,
  // et le meme nom pour deux groupes differents.
  a.download = `rapport-performance-${libellePourFichier(params.libelleSelection)}-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
