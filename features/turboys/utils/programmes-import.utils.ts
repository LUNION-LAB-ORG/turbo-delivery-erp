// Module M2 — Import de planning par fichier (.xlsx / .csv) + modèle à télécharger.
// Format : colonnes Matricule, Telephone, Livreur, Lundi…Dimanche, Carburant/jour.
// Chaque jour = "HH:mm-HH:mm" (travaillé) ou "Repos". Carburant/jour = un montant en
// FCFA posé sur chaque jour travaillé (vide : rien de saisi). Correspondance livreur par
// Matricule puis Téléphone (jamais le nom). Parse/écriture via `xlsx` (lit aussi le CSV).

import * as XLSX from 'xlsx';

import { IJourProgramme } from '../types/programme.types';

const JOURS: Array<{ key: string; col: string }> = [
  { key: 'LUNDI', col: 'Lundi' },
  { key: 'MARDI', col: 'Mardi' },
  { key: 'MERCREDI', col: 'Mercredi' },
  { key: 'JEUDI', col: 'Jeudi' },
  { key: 'VENDREDI', col: 'Vendredi' },
  { key: 'SAMEDI', col: 'Samedi' },
  { key: 'DIMANCHE', col: 'Dimanche' },
];

const COL_CARBURANT = 'Carburant/jour';
const ENTETE = ['Matricule', 'Telephone', 'Livreur', ...JOURS.map((j) => j.col), COL_CARBURANT];

export interface LivreurModele {
  matricule?: string | null;
  telephone?: string | null;
  nom: string;
}

/**
 * Génère et télécharge le modèle .xlsx : une ligne d'exemple (à remplacer) puis
 * une ligne par livreur (Repos partout) — l'Ops n'a qu'à saisir les horaires.
 */
export function telechargerModeleProgrammes(livreurs: LivreurModele[]): void {
  const exemple = [
    'EXEMPLE',
    '0700000000',
    'À remplacer — ex. Kouassi Marc',
    '08:00-17:00',
    '08:00-17:00',
    '08:00-17:00',
    '08:00-17:00',
    '08:00-17:00',
    'Repos',
    'Repos',
    4000,
  ];
  const lignes = livreurs.map((l) => [
    l.matricule ?? '',
    l.telephone ?? '',
    l.nom,
    'Repos',
    'Repos',
    'Repos',
    'Repos',
    'Repos',
    'Repos',
    'Repos',
    '',
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([ENTETE, exemple, ...lignes]);
  sheet['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 26 }, ...JOURS.map(() => ({ wch: 12 })), { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Programmes');
  XLSX.writeFile(wb, 'modele_import_programmes.xlsx');
}

export interface LigneImport {
  matricule: string;
  telephone: string;
  livreurNom: string;
  jours: IJourProgramme[];
}

const hhmm = (s: string) => {
  const t = s.trim();
  return /^\d:\d{2}$/.test(t) ? `0${t}` : t; // 8:00 -> 08:00
};

/** Parse une cellule de jour : "Repos"/vide -> repos ; "HH:mm-HH:mm" -> travaillé. */
function parseCellule(jourKey: string, raw: unknown): IJourProgramme {
  const v = String(raw ?? '').trim();
  const repos: IJourProgramme = { jour: jourKey, actif: false, debut: '08:00', fin: '18:00' };
  if (!v || /repos/i.test(v)) return repos;
  const m = v.match(/^(\d{1,2}:\d{2})\s*[-–à]\s*(\d{1,2}:\d{2})$/);
  if (!m) return repos;
  return { jour: jourKey, actif: true, debut: hhmm(m[1]), fin: hhmm(m[2]) };
}

/** "4 000", "4000 FCFA" ou 4000 → 4000 ; vide ou illisible → null. Jamais négatif. */
function parseMontant(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 ? raw : null;
  const chiffres = String(raw ?? '').replace(/[^\d]/g, '');
  if (!chiffres) return null;
  return Number(chiffres);
}

/** Lit le fichier (.xlsx/.csv) → lignes normalisées (7 jours ordonnés chacune). */
export async function lireFichierProgrammes(file: File): Promise<LigneImport[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows
    .map((r) => {
      // Un seul montant par ligne, pose sur chaque jour travaille : c'est ainsi que les
      // Operations pensent le carburant, un forfait par personne et par jour.
      const carburant = parseMontant(r[COL_CARBURANT] ?? r['Carburant']);
      return {
        matricule: String(r['Matricule'] ?? '').trim(),
        telephone: String(r['Telephone'] ?? r['Téléphone'] ?? '').trim(),
        livreurNom: String(r['Livreur'] ?? '').trim(),
        jours: JOURS.map((j) => {
          const jour = parseCellule(j.key, r[j.col]);
          return jour.actif && carburant !== null ? { ...jour, montantCarburant: carburant } : jour;
        }),
      };
    })
    // Ignore les lignes sans clé + la ligne d'exemple du modèle.
    .filter((l) => (l.matricule || l.telephone) && l.matricule.toUpperCase() !== 'EXEMPLE');
}
