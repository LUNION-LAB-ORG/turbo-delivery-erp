// Rapport PDF « Encours / Restes a payer ».
//
// Genere cote client via jsPDF (deja installe). Aucune dependance ajoutee. Design
// inspire du systeme UI/UX pro max (rapport finance executive) adapte a la
// marque Turbo Delivery (brand orange #FF1A00).
//
// Structure : bandeau de marque -> 3 cartes KPI -> table dense par partenaire
// (rang + nom + cycle + total + periodes) -> bandeau TOTAL -> pied de page
// (date, filtres, pagination).

import jsPDF from 'jspdf';
import { construireResumeDus, type PartenaireResumeDu } from '@/features/encours/utils/resume-dus.utils';
import type { IEncoursReleve, IEncoursParams } from '@/features/encours';

// ──────────────────────────────────────────────────────────────────────────
// Design tokens (RGB triplets pour jsPDF)
// ──────────────────────────────────────────────────────────────────────────
const BRAND = [255, 26, 0] as const; // #FF1A00, orange Turbo
const BRAND_DARK = [192, 18, 0] as const; // accent fonce pour montants critiques
const PALE_BRAND = [255, 237, 232] as const; // bandeau TOTAL
const INK = [15, 23, 42] as const; // slate-900, titres
const INK_2 = [51, 65, 85] as const; // slate-700, corps de texte
const MUTED = [100, 116, 139] as const; // slate-500, libelles et periodes
const BORDER = [226, 232, 240] as const; // slate-200, separateurs
const ALT_ROW = [249, 250, 252] as const; // slate-50, alternance des lignes
const WHITE = [255, 255, 255] as const;

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────
const MOIS_NOMS = [
  '',
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

/**
 * Formate un montant en FCFA pour le PDF.
 *
 * IMPORTANT (fix 2026-06-06) : `toLocaleString('fr-FR')` insere des espaces
 * etroits insecables (U+202F) entre les milliers. Helvetica built-in de
 * jsPDF (encodage WinAnsi/CP1252) ne supporte PAS ce glyphe -> rendu comme
 * "/" en sortie ("14/544/368 FCFA" au lieu de "14 544 368 FCFA"). On
 * remplace par des espaces standards (U+0020). Idem pour U+00A0 (NBSP)
 * qui pose le meme probleme.
 */
function fmtFcfa(n: number): string {
  const rounded = Math.round(n);
  const formatted = rounded
    .toLocaleString('fr-FR')
    .replace(/ /g, ' ')
    .replace(/ /g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Calcule la fontSize maximum qui fait tenir `text` dans `maxWidth`. Decremente
 * d'1pt a chaque iteration jusqu'a `minSize`. Utile pour les KPI cards quand
 * la valeur formatee est plus large que la carte (ex. "14 544 368 FCFA" a 18pt).
 */
function fitFontSize(doc: jsPDF, text: string, maxWidth: number, startSize: number, minSize: number): number {
  let size = startSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > minSize) {
    size -= 1;
    doc.setFontSize(size);
  }
  return size;
}

/**
 * Tronque `text` avec "..." si plus large que `maxWidth` a la `fontSize`
 * courante. Boucle reduisant char par char jusqu'a ce que ca tienne.
 */
function truncateToFit(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && doc.getTextWidth(s + '…') > maxWidth) {
    s = s.slice(0, -1);
  }
  return s + '…';
}

function fmtDateLong(d = new Date()): string {
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function setFill(doc: jsPDF, [r, g, b]: readonly [number, number, number]) {
  doc.setFillColor(r, g, b);
}
function setText(doc: jsPDF, [r, g, b]: readonly [number, number, number]) {
  doc.setTextColor(r, g, b);
}
function setStroke(doc: jsPDF, [r, g, b]: readonly [number, number, number]) {
  doc.setDrawColor(r, g, b);
}

// ──────────────────────────────────────────────────────────────────────────
// Resume : meme logique que CSV (solde > 0, hors "A venir" et glyphe d'absence)
// ──────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────
// Layout pieces
// ──────────────────────────────────────────────────────────────────────────
const PAGE_W = 595; // A4 portrait pt
const PAGE_H = 842;
const MARGIN = 40;
const HEADER_H = 96;
const FOOTER_H = 36;

interface FooterInfo {
  filtersLabel: string;
  generatedAt: string;
  totalPages: () => number; // resolved at the end
}

function drawHeader(doc: jsPDF, page: number) {
  // Bandeau brand
  setFill(doc, BRAND);
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

  setText(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('TURBO DELIVERY', MARGIN, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text('Relevé des restes à payer', MARGIN, 60);

  // Sous-titre droite
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const dateStr = fmtDateLong();
  const w = doc.getTextWidth(dateStr);
  doc.text(dateStr, PAGE_W - MARGIN - w, 40);

  if (page > 1) {
    doc.setFontSize(8);
    const ctn = `Suite, page ${page}`;
    const wc = doc.getTextWidth(ctn);
    doc.text(ctn, PAGE_W - MARGIN - wc, 60);
  }

  // Petite barre fine accent
  setFill(doc, BRAND_DARK);
  doc.rect(0, HEADER_H, PAGE_W, 3, 'F');
}

function drawKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  sub?: string,
  emphasis: 'normal' | 'brand' = 'normal',
) {
  // Card background
  setFill(doc, WHITE);
  doc.rect(x, y, w, h, 'F');
  setStroke(doc, BORDER);
  doc.setLineWidth(0.6);
  doc.rect(x, y, w, h, 'S');

  // Top stripe brand
  setFill(doc, emphasis === 'brand' ? BRAND : BORDER);
  doc.rect(x, y, w, 3, 'F');

  // Label
  setText(doc, MUTED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(label, x + 12, y + 22);

  // Value : shrink-to-fit pour eviter le debordement type "14 544 368 FCFA"
  // qui ne tient pas a 18pt dans une card de ~160pt (fix 2026-06-06).
  setText(doc, emphasis === 'brand' ? BRAND_DARK : INK);
  doc.setFont('helvetica', 'bold');
  const startSize = emphasis === 'brand' ? 16 : 18;
  // Si la valeur tient en 1 ligne -> shrink-to-fit. Sinon (texte multiligne
  // type nom de partenaire long), garder splitTextToSize qui wrap propre.
  const fits = doc.splitTextToSize(value, w - 24);
  if (fits.length === 1) {
    fitFontSize(doc, value, w - 24, startSize, 9);
    doc.text(value, x + 12, y + 44);
  } else {
    doc.setFontSize(startSize - 4);
    doc.text(doc.splitTextToSize(value, w - 24), x + 12, y + 40);
  }

  if (sub) {
    setText(doc, INK_2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const subLines = doc.splitTextToSize(sub, w - 24);
    doc.text(subLines, x + 12, y + 64);
  }
}

function drawTableHeader(doc: jsPDF, y: number) {
  setFill(doc, INK);
  doc.rect(MARGIN, y, PAGE_W - 2 * MARGIN, 22, 'F');
  setText(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  doc.text('#', MARGIN + 8, y + 15);
  doc.text('PARTENAIRE', MARGIN + 32, y + 15);
  doc.text('CYCLE', MARGIN + 240, y + 15);
  doc.text('TOTAL DÛ', PAGE_W - MARGIN - 8, y + 15, { align: 'right' });
}

function drawFooter(doc: jsPDF, page: number, info: FooterInfo) {
  const y = PAGE_H - FOOTER_H;

  // Separateur fin
  setStroke(doc, BORDER);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  setText(doc, MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Gauche : info
  doc.text(`Généré le ${info.generatedAt}`, MARGIN, y + 14);
  doc.text(info.filtersLabel, MARGIN, y + 24);

  // Droite : pagination
  const pageLabel = `Page ${page} / ${info.totalPages()}`;
  const w = doc.getTextWidth(pageLabel);
  doc.text(pageLabel, PAGE_W - MARGIN - w, y + 14);
  doc.setFont('helvetica', 'bold');
  setText(doc, INK_2);
  const brandLabel = 'turbodeliveryapp.com';
  const wb = doc.getTextWidth(brandLabel);
  doc.text(brandLabel, PAGE_W - MARGIN - wb, y + 24);
}

// ──────────────────────────────────────────────────────────────────────────
// Builder principal
// ──────────────────────────────────────────────────────────────────────────
export function buildEncoursDusPdf(releve: IEncoursReleve, params: IEncoursParams): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const rows = construireResumeDus(releve, { avecAnnee: true, dedupliquerPeriodes: true });
  const totalDu = rows.reduce((s, r) => s + r.totalDu, 0);
  const top = rows[0];

  const filtersLabel = [
    `Année ${params.annee}`,
    `Mois : ${params.mois ? MOIS_NOMS[params.mois] : 'cumul annuel'}`,
    `Cycle : ${params.cycle ?? 'tous'}`,
    params.partenaire ? `Partenaire : ${params.partenaire}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  // Total pages computed only at the end (we don't know upfront because rows
  // can wrap multi-line periodes). We collect footers and refill at the end.
  const footerInfo: FooterInfo = {
    filtersLabel,
    generatedAt: fmtDateLong(),
    totalPages: () => doc.getNumberOfPages(),
  };

  // ── PAGE 1 ────────────────────────────────────────────────────────────
  drawHeader(doc, 1);

  // KPI cards
  const kpiY = HEADER_H + 24;
  const kpiH = 80;
  const kpiGap = 12;
  const kpiW = (PAGE_W - 2 * MARGIN - 2 * kpiGap) / 3;

  drawKpiCard(doc, MARGIN, kpiY, kpiW, kpiH, 'TOTAL DÛ', fmtFcfa(totalDu), undefined, 'brand');
  drawKpiCard(
    doc,
    MARGIN + kpiW + kpiGap,
    kpiY,
    kpiW,
    kpiH,
    'PARTENAIRES',
    `${rows.length}`,
    rows.length > 0 ? `${rows.reduce((s, r) => s + r.nbFactures, 0)} factures dues` : undefined,
  );
  drawKpiCard(
    doc,
    MARGIN + 2 * (kpiW + kpiGap),
    kpiY,
    kpiW,
    kpiH,
    'TOP CRÉANCE',
    top ? top.partenaire : 'Aucun',
    top ? fmtFcfa(top.totalDu) : undefined,
  );

  // Table
  let y = kpiY + kpiH + 24;
  drawTableHeader(doc, y);
  y += 22;

  // Rows
  rows.forEach((r, i) => {
    const periodes = r.periodes.join('  ·  ');
    // Available width pour les periodes (sous le nom partenaire), sans déborder sur le montant
    const periodesW = PAGE_W - 2 * MARGIN - 130;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const periodesLines: string[] = doc.splitTextToSize(periodes, periodesW);

    const rowH = 24 + periodesLines.length * 9;

    // Page break ?
    if (y + rowH > PAGE_H - FOOTER_H - 36) {
      drawFooter(doc, doc.getCurrentPageInfo().pageNumber, footerInfo);
      doc.addPage();
      const pageNow = doc.getCurrentPageInfo().pageNumber;
      drawHeader(doc, pageNow);
      y = HEADER_H + 24;
      drawTableHeader(doc, y);
      y += 22;
    }

    // Alt row
    if (i % 2 === 1) {
      setFill(doc, ALT_ROW);
      doc.rect(MARGIN, y, PAGE_W - 2 * MARGIN, rowH, 'F');
    }

    // Rang
    setText(doc, MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${i + 1}`, MARGIN + 8, y + 14);

    // Partenaire (bold INK) avec truncate si trop long (fix 2026-06-06 :
    // "LE GRILL MECHOUI ET L'ATELIER MECHOUI" debordait sur la colonne CYCLE).
    // Largeur dispo : de MARGIN+32 jusqu'a MARGIN+232 (8pt avant la colonne CYCLE).
    setText(doc, INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const partenaireText = truncateToFit(doc, r.partenaire, 200);
    doc.text(partenaireText, MARGIN + 32, y + 14);

    // Cycle
    setText(doc, INK_2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(r.cycle, MARGIN + 240, y + 14);

    // Montant (bold BRAND_DARK, droite)
    setText(doc, BRAND_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(fmtFcfa(r.totalDu), PAGE_W - MARGIN - 8, y + 14, { align: 'right' });

    // Periodes (MUTED, petit, sous le nom)
    setText(doc, MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(periodesLines, MARGIN + 32, y + 23);

    // Separateur bas
    setStroke(doc, BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + rowH, PAGE_W - MARGIN, y + rowH);

    y += rowH;
  });

  // Bandeau TOTAL
  if (rows.length > 0) {
    y += 6;
    // Page break si bandeau ne tient pas
    if (y + 30 > PAGE_H - FOOTER_H - 16) {
      drawFooter(doc, doc.getCurrentPageInfo().pageNumber, footerInfo);
      doc.addPage();
      const pageNow = doc.getCurrentPageInfo().pageNumber;
      drawHeader(doc, pageNow);
      y = HEADER_H + 24;
    }
    setFill(doc, PALE_BRAND);
    doc.rect(MARGIN, y, PAGE_W - 2 * MARGIN, 30, 'F');
    setStroke(doc, BRAND);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN, y + 30); // accent gauche
    setText(doc, BRAND_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL DÛ', MARGIN + 12, y + 20);
    doc.setFontSize(13);
    doc.text(fmtFcfa(totalDu), PAGE_W - MARGIN - 8, y + 20, { align: 'right' });
  } else {
    // Empty state
    setText(doc, MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(
      'Aucun partenaire avec des restes à payer sur la période sélectionnée.',
      PAGE_W / 2,
      y + 40,
      { align: 'center' },
    );
  }

  // Footer derniere page
  drawFooter(doc, doc.getCurrentPageInfo().pageNumber, footerInfo);

  return doc.output('blob');
}
