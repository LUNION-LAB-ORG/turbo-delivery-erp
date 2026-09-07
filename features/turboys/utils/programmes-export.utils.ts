// Module M2 — Export de la grille hebdomadaire des programmes (RG-26).
// Excel via `xlsx`, PDF via `jsPDF` (table dessinée à la main, même pattern de
// marque que features/men/utils/export-pdf.ts — jspdf-autotable n'est pas une dép).

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { IProgramme } from '../types/programme.types';
import { carburantAffiche, totauxCarburant } from './carburant.utils';
import { getTurboyTypeDisplay } from './type-livreur-display';

const JOURS: Array<{ key: string; court: string }> = [
  { key: 'LUNDI', court: 'Lun' },
  { key: 'MARDI', court: 'Mar' },
  { key: 'MERCREDI', court: 'Mer' },
  { key: 'JEUDI', court: 'Jeu' },
  { key: 'VENDREDI', court: 'Ven' },
  { key: 'SAMEDI', court: 'Sam' },
  { key: 'DIMANCHE', court: 'Dim' },
];

const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PLANIFIE: 'Planifié',
  NOTIFIE: 'Publié',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

function libelleType(p: IProgramme): string {
  return p.typeLivreur ? getTurboyTypeDisplay(p.typeLivreur).label : '';
}

function libelleStatut(p: IProgramme): string {
  return STATUT_LABEL[p.statut ?? ''] ?? p.statut ?? '';
}

/** Cellule d'un jour : "10:00-22:00" si travaillé, sinon "Repos". */
function celluleJour(p: IProgramme, jourKey: string): string {
  const j = p.jours?.find((x) => (x.jour ?? '').toUpperCase() === jourKey);
  if (!j || !j.actif) return 'Repos';
  return `${hhmm(j.debut)}-${hhmm(j.fin)}`;
}

/** Le carburant d'une ligne pour un export : le montant figé, sinon le prévisionnel, sinon rien. */
function carburantExport(p: IProgramme): number | '' {
  const { montant } = carburantAffiche(p);
  return montant === null ? '' : montant;
}

// ── Excel ─────────────────────────────────────────────────────────────────────
export function exporterProgrammesExcel(programmes: IProgramme[], annee: number, semaine: number): void {
  const entete = ['Livreur', 'Type', 'Statut', ...JOURS.map((j) => j.court), 'Carburant (FCFA)'];
  const lignes = programmes.map((p) => [
    p.livreurNom ?? '',
    libelleType(p),
    libelleStatut(p),
    ...JOURS.map((j) => celluleJour(p, j.key)),
    carburantExport(p),
  ]);
  // Le total en pied, comme sur le document papier : c'est lui qu'on decaisse.
  const totaux = totauxCarburant(programmes);
  const pied = ['Total', '', '', ...JOURS.map(() => ''), totaux.total];
  const sheet = XLSX.utils.aoa_to_sheet([entete, ...lignes, pied]);
  sheet['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 12 }, ...JOURS.map(() => ({ wch: 13 })), { wch: 16 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, `S${semaine}-${annee}`);
  XLSX.writeFile(workbook, `programmes_${annee}_S${semaine}.xlsx`);
}

// ── PDF ───────────────────────────────────────────────────────────────────────
const RED = [220, 38, 38] as const;
const YELLOW = [250, 204, 21] as const;
const DARK = [30, 30, 30] as const;
const GRAY = [100, 100, 100] as const;
const LIGHT = [241, 245, 249] as const;
const BORDER = [210, 218, 230] as const;

interface ColPdf {
  header: string;
  w: number;
  value: (p: IProgramme) => string;
  /** Un montant s'aligne a droite. */
  droite?: boolean;
}

/*
 * La colonne Carburant prend 24 mm ; les sept jours passent de 26 a 24 mm pour que la
 * table tienne toujours dans les 283 mm utiles d'une A4 paysage. Elle est alignee a
 * droite, comme tout montant.
 */
const COLS_PDF: ColPdf[] = [
  { header: 'Livreur', w: 38, value: (p) => p.livreurNom ?? '—' },
  { header: 'Type', w: 30, value: libelleType },
  ...JOURS.map((j) => ({ header: j.court, w: 24, value: (p: IProgramme) => celluleJour(p, j.key) })),
  { header: 'Carburant', w: 24, value: (p) => { const { montant } = carburantAffiche(p); return montant === null ? '—' : montant.toLocaleString('fr-FR'); }, droite: true },
  { header: 'Statut', w: 22, value: libelleStatut },
];

const TABLE_W = COLS_PDF.reduce((s, c) => s + c.w, 0);
const START_X = 14;
const ROW_H = 7;
const HEADER_H = 9;
const HEADER_BAND_H = 26;
const PAGE_MARGIN_BOTTOM = 15;

const truncate = (t: string, max: number) => (t.length > max ? t.slice(0, max - 1) + '…' : t);

export function exporterProgrammesPdf(
  programmes: IProgramme[],
  annee: number,
  semaine: number,
  filtreLabel = 'Tous',
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawPageHeader() {
    doc.setFillColor(...RED);
    doc.rect(0, 0, pageW, HEADER_BAND_H, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, HEADER_BAND_H - 3, pageW, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(`Programmes — Semaine ${semaine} / ${annee}`, START_X, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 230, 150);
    doc.text(
      `Type : ${filtreLabel}   •   ${programmes.length} livreur(s)   •   Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      START_X,
      19,
    );
    doc.setTextColor(...DARK);
  }

  function drawTableHeader(y: number): number {
    doc.setFillColor(...RED);
    doc.roundedRect(START_X, y, TABLE_W, HEADER_H, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let x = START_X;
    for (const col of COLS_PDF) {
      if (col.droite) doc.text(col.header, x + col.w - 2.5, y + 6, { align: 'right' });
      else doc.text(col.header, x + 2.5, y + 6);
      x += col.w;
    }
    doc.setTextColor(...DARK);
    return y + HEADER_H;
  }

  drawPageHeader();
  let y = drawTableHeader(HEADER_BAND_H + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  for (let i = 0; i < programmes.length; i++) {
    if (y + ROW_H > pageH - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      drawPageHeader();
      y = drawTableHeader(HEADER_BAND_H + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(START_X, y, TABLE_W, ROW_H, 'F');
    }
    doc.setDrawColor(...BORDER);
    doc.line(START_X, y + ROW_H, START_X + TABLE_W, y + ROW_H);

    const p = programmes[i];
    let x = START_X;
    for (const col of COLS_PDF) {
      const raw = col.value(p);
      if (raw === 'Repos') doc.setTextColor(...GRAY);
      else if (col.header === 'Statut') doc.setTextColor(...DARK);
      else doc.setTextColor(...DARK);
      const texte = truncate(raw, Math.floor(col.w / 1.7));
      if (col.droite) doc.text(texte, x + col.w - 2.5, y + 4.7, { align: 'right' });
      else doc.text(texte, x + 2.5, y + 4.7);
      x += col.w;
    }
    y += ROW_H;
  }

  // Le pied du document papier : total carburant et sous-totaux par population.
  const totaux = totauxCarburant(programmes);
  if (totaux.total > 0 || totaux.sansMontant < programmes.length) {
    if (y + ROW_H * 2 > pageH - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      drawPageHeader();
      y = HEADER_BAND_H + 4;
    }
    y += 2;
    doc.setDrawColor(...BORDER);
    doc.line(START_X, y, START_X + TABLE_W, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text('Total carburant de la semaine', START_X + 2.5, y);
    doc.text(`${totaux.total.toLocaleString('fr-FR')} FCFA`, START_X + TABLE_W - 2.5, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    const parType = Object.entries(totaux.parType)
      .map(([t, m]) => `${getTurboyTypeDisplay(t).labelPlural} ${m.toLocaleString('fr-FR')}`)
      .join('   •   ');
    const complement = totaux.previsionnel > 0 ? `   •   dont ${totaux.previsionnel.toLocaleString('fr-FR')} prévisionnels` : '';
    doc.text(`${parType}${complement}`, START_X + 2.5, y);
  }

  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`Page ${pg} / ${totalPages}`, pageW - 28, pageH - 6);
    doc.setFillColor(...RED);
    doc.rect(0, pageH - 5, pageW, 5, 'F');
  }

  doc.save(`programmes_${annee}_S${semaine}.pdf`);
}

// ── PDF individuel (un livreur) ────────────────────────────────────────────────
const JOURS_LONG: Array<{ key: string; label: string }> = [
  { key: 'LUNDI', label: 'Lundi' },
  { key: 'MARDI', label: 'Mardi' },
  { key: 'MERCREDI', label: 'Mercredi' },
  { key: 'JEUDI', label: 'Jeudi' },
  { key: 'VENDREDI', label: 'Vendredi' },
  { key: 'SAMEDI', label: 'Samedi' },
  { key: 'DIMANCHE', label: 'Dimanche' },
];

/** Document portrait « X, voici ton programme cette semaine » pour un livreur. */
export function exporterProgrammeIndividuelPdf(programme: IProgramme, annee: number, semaine: number): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const nom = programme.livreurNom ?? '—';
  const prenom = (programme.livreurNom ?? '').split(' ')[0] || 'Bonjour';

  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setFillColor(...YELLOW);
  doc.rect(0, 27, pageW, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Mon programme', 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 230, 150);
  doc.text(`${nom}${programme.typeLivreur ? ' • ' + libelleType(programme) : ''}  •  Semaine ${semaine} / ${annee}`, 14, 22);
  doc.setTextColor(...DARK);

  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${prenom}, voici ton programme cette semaine`, 14, y);
  y += 10;

  doc.setFontSize(11);
  for (const jr of JOURS_LONG) {
    const j = programme.jours?.find((x) => (x.jour ?? '').toUpperCase() === jr.key);
    const repos = !j || !j.actif;
    doc.setDrawColor(...BORDER);
    doc.line(14, y + 8, pageW - 14, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(jr.label, 16, y + 5.5);
    doc.setFont('helvetica', 'normal');
    if (repos) {
      doc.setTextColor(...RED);
      doc.text('Repos', pageW - 16, y + 5.5, { align: 'right' });
    } else {
      doc.setTextColor(...DARK);
      doc.text(`${hhmm(j!.debut)} – ${hhmm(j!.fin)}`, pageW - 16, y + 5.5, { align: 'right' });
    }
    y += 11;
  }

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    14,
    y + 6,
  );

  doc.save(`programme_${nom.replace(/\s+/g, '_')}_S${semaine}.pdf`);
}
