import * as XLSX from 'xlsx';

import { COLONNES_DETAIL_PAR_STORE } from '@/features/rapports-performance/components/detail-par-store/detail-par-store-table-columns';
import type { IStorePerformance } from '@/features/rapports-performance/types/performance.type';

import type { ExportParams } from './performance-export.utils';
import { libellePourFichier } from './selection.utils';

/*
 * Le rapport en tableur.
 *
 * <h3>Pourquoi ce fichier existe</h3>
 * <p>La page n'avait qu'un export PDF. La note de cadrage demande les deux, et un PDF ne
 * sert pas a la meme chose : on ne peut ni trier, ni filtrer, ni sommer un rapport imprime.
 * Le classement, lui, avait deja ses deux boutons - ce qui rendait l'absence d'autant plus
 * visible en passant d'un ecran a l'autre.</p>
 *
 * <h3>Des NOMBRES, pas des chaines</h3>
 * <p>Chaque valeur chiffree ecrit sa valeur brute, pas « 10 776 200 FCFA ». Un montant
 * ecrit en texte ne s'additionne pas, ne se trie pas, ne se met pas en graphique : le
 * destinataire devrait le retaper. La mise en forme est portee par le format de cellule.</p>
 *
 * <h3>Une cellule VIDE quand la grandeur n'est pas mesuree</h3>
 * <p>`null` produit une cellule reellement vide. Zero se serait somme avec les autres et
 * aurait fait mentir toute colonne calculee par le lecteur du fichier - et « 0 min » de
 * temps de livraison est precisement l'une des quatre valeurs fabriquees que ce chantier a
 * retirees de l'ecran.</p>
 */

/** Des codes de format EXCEL : la virgule y DESIGNE le separateur de milliers, que le
 *  tableur remplace par celui de la machine du lecteur. Une espace ecrite en dur a cette
 *  place donne un format que le tableur ignore, et la colonne retombe en nombres nus. */
const FCFA = '#,##0" FCFA"';
const ENTIER = '#,##0';
const POURCENT = '0.0" %"';
const MINUTES = '0" min"';

type Ligne = [string, string | number | null] | [string] | [];

interface LigneFormatee {
  ligne: Ligne;
  format?: string;
}

function jour(d?: Date): string {
  if (!d) return '-';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function instantExport(): string {
  const n = new Date();
  return `${jour(n)} ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

/**
 * La feuille « Rapport » : LES MEMES QUATRE INDICATEURS QUE L'ECRAN, dans le meme ordre,
 * puis les metriques operationnelles, puis le detail financier.
 *
 * <p>La decomposition de « Montant total de livraisons » est ecrite en deux lignes filles
 * plutot qu'en note : dans un tableur, une note est une chaine qu'on ne peut pas sommer,
 * alors que deux lignes chiffrees se verifient a la calculatrice.</p>
 */
function lignesRapport({
  consolide,
  debut,
  financialDetails,
  fin,
  libelleSelection,
  mainKPIs,
  secondaryKPIs,
}: ExportParams): LigneFormatee[] {
  const vendu = consolide
    ? 'Grâce à nos livraisons, les partenaires ont vendu'
    : 'Grâce à nos livraisons, le partenaire a vendu';

  return [
    { ligne: ['RAPPORT DE PERFORMANCE'] },
    { ligne: [] },
    { ligne: ['Sélection', libelleSelection] },
    { ligne: ['Du', jour(debut)] },
    { ligne: ['Au', jour(fin)] },
    { ligne: ['Exporté le', instantExport()] },
    { ligne: [] },

    { ligne: ['INDICATEURS CLÉS'] },
    { ligne: ['Nombre de livraisons', mainKPIs?.totalDeliveries ?? null], format: ENTIER },
    { ligne: ['Montant total de livraisons', financialDetails?.totalFacture ?? null], format: FCFA },
    {
      ligne: ['    dont frais de livraison', financialDetails?.deliveryFeesCollected ?? null],
      format: FCFA,
    },
    {
      ligne: ['    dont commission', financialDetails?.turboDeliveryServiceFees ?? null],
      format: FCFA,
    },
    {
      ligne: ['Montant de commandes généré par les courses TURBO', mainKPIs?.totalOrderValue ?? null],
      format: FCFA,
    },
    { ligne: ['Taux de succès', mainKPIs?.successRate ?? null], format: POURCENT },
    { ligne: [] },

    { ligne: ['MÉTRIQUES OPÉRATIONNELLES'] },
    {
      ligne: ['Temps moyen de livraison', secondaryKPIs?.averageDeliveryTime ?? null],
      format: MINUTES,
    },
    { ligne: ['Croissance mensuelle', secondaryKPIs?.monthlyGrowth ?? null], format: POURCENT },
    { ligne: ['Articles par commande', secondaryKPIs?.averageItemsPerOrder ?? null], format: ENTIER },
    { ligne: [] },

    { ligne: ['DÉTAILS FINANCIERS'] },
    { ligne: [vendu, financialDetails?.totalOrderAmount ?? null], format: FCFA },
    {
      ligne: [
        "Frais de livraison générés sur l'ensemble des courses",
        financialDetails?.deliveryFeesCollected ?? null,
      ],
      format: FCFA,
    },
    {
      ligne: ['Frais de service TURBO DELIVERY obtenus', financialDetails?.turboDeliveryServiceFees ?? null],
      format: FCFA,
    },
    {
      ligne: ['Facture totale à régler sur la période', financialDetails?.totalFacture ?? null],
      format: FCFA,
    },
  ];
}

/**
 * La ligne de total du detail par store, REFAITE depuis les lignes exportees.
 *
 * <p>⚠ Le taux n'y figure pas, et ce n'est pas un oubli : il ne s'additionne pas. Le taux
 * de tete est celui de l'ensemble des courses, pas la moyenne des taux par etablissement -
 * une moyenne de moyennes donnerait le meme poids a un store de 8 455 livraisons et a un
 * autre qui en compte 144.</p>
 */
function totalStores(lignes: IStorePerformance[]): IStorePerformance {
  return lignes.reduce<IStorePerformance>(
    (t, l) => ({
      ...t,
      totalDeliveries: t.totalDeliveries + (l.totalDeliveries ?? 0),
      totalOrderValue: t.totalOrderValue + (l.totalOrderValue ?? 0),
      deliveryFeesCollected: t.deliveryFeesCollected + (l.deliveryFeesCollected ?? 0),
      turboDeliveryServiceFees: t.turboDeliveryServiceFees + (l.turboDeliveryServiceFees ?? 0),
      totalFacture: t.totalFacture + (l.totalFacture ?? 0),
    }),
    {
      restaurantId: 'total',
      nom: `Total — ${lignes.length} établissement${lignes.length > 1 ? 's' : ''}`,
      totalDeliveries: 0,
      totalOrderValue: 0,
      successRate: null,
      deliveryFeesCollected: 0,
      turboDeliveryServiceFees: 0,
      totalFacture: 0,
    },
  );
}

const FORMAT_COLONNE_STORE: Partial<Record<string, string>> = {
  totalDeliveries: ENTIER,
  totalOrderValue: FCFA,
  successRate: POURCENT,
  deliveryFeesCollected: FCFA,
  turboDeliveryServiceFees: FCFA,
  totalFacture: FCFA,
};

function feuilleDetailParStore(lignes: IStorePerformance[]): XLSX.WorkSheet {
  /*
   * Les colonnes viennent de COLONNES_DETAIL_PAR_STORE, la MEME liste que l'ecran. Ecrire
   * ici une seconde liste d'intitules ferait exactement ce que ce fichier de colonnes
   * documente avoir deja coute : trois listes qui divergent, et une colonne ajoutee a
   * l'ecran qui manque en silence dans le fichier exporte.
   */
  const titres = COLONNES_DETAIL_PAR_STORE.map((c) => c.entete);

  const valeur = (ligne: IStorePerformance, id: string): string | number | null => {
    const v = ligne[id as keyof IStorePerformance];
    if (id === 'nom') return (v as string | null) ?? ligne.restaurantId;
    return typeof v === 'number' ? v : null;
  };

  const corps = lignes.map((l) => COLONNES_DETAIL_PAR_STORE.map((c) => valeur(l, c.id)));
  const total = totalStores(lignes);
  const ligneTotal = COLONNES_DETAIL_PAR_STORE.map((c) =>
    c.id !== 'nom' && !c.totalisable ? null : valeur(total, c.id),
  );

  const tout = [titres, ...corps, ligneTotal];
  const feuille = XLSX.utils.aoa_to_sheet(tout);

  COLONNES_DETAIL_PAR_STORE.forEach((colonne, indexColonne) => {
    const format = FORMAT_COLONNE_STORE[colonne.id];
    if (!format) return;
    for (let ligne = 1; ligne < tout.length; ligne += 1) {
      const adresse = XLSX.utils.encode_cell({ c: indexColonne, r: ligne });
      const cellule = feuille[adresse];
      if (cellule && typeof cellule.v === 'number') cellule.z = format;
    }
  });

  feuille['!cols'] = COLONNES_DETAIL_PAR_STORE.map((c) => ({
    wch: c.id === 'nom' ? 34 : Math.max(14, c.entete.length + 2),
  }));

  return feuille;
}

export function construireRapportExcel(params: ExportParams): ArrayBuffer {
  const classeur = XLSX.utils.book_new();

  const lignes = lignesRapport(params);
  const feuille = XLSX.utils.aoa_to_sheet(lignes.map((l) => l.ligne));

  lignes.forEach((l, index) => {
    if (!l.format) return;
    const adresse = XLSX.utils.encode_cell({ c: 1, r: index });
    const cellule = feuille[adresse];
    if (cellule && typeof cellule.v === 'number') cellule.z = l.format;
  });

  feuille['!cols'] = [{ wch: 52 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(classeur, feuille, 'Rapport');

  /*
   * Le detail par store n'a sa feuille QUE quand le serveur l'a servi avec des lignes.
   * `parStore` nul (mode unitaire) ou vide (groupe inconnu, groupe sans etablissement) ne
   * produit pas d'onglet : une feuille a en-tetes sans une seule ligne se lirait comme une
   * perte de donnee, alors que l'ecran, lui, explique la raison.
   */
  if (params.parStore && params.parStore.length > 0) {
    XLSX.utils.book_append_sheet(classeur, feuilleDetailParStore(params.parStore), 'Détail par store');
  }

  return XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });
}

/** Ecrit le fichier. Le nom DIT la selection et la periode : deux exports ne s'ecrasent pas. */
export function exporterRapportExcel(params: ExportParams): void {
  const donnees = construireRapportExcel(params);
  const blob = new Blob([donnees], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `rapport-performance-${libellePourFichier(params.libelleSelection)}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  lien.click();
  URL.revokeObjectURL(url);
}
