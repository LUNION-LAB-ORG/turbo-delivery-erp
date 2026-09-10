import * as XLSX from 'xlsx';

import { COLONNES_CLASSEMENT } from '@/features/classement-partenaires/components/classement-table-columns';
import type { IClassement } from '@/features/classement-partenaires/types/classement.types';
import { instant, jourCourt, libellePeriode } from '@/features/classement-partenaires/utils/classement-format.utils';
import { LIBELLE_TRI } from '@/features/classement-partenaires/utils/classement-tri.utils';

/**
 * Le classement en tableur.
 *
 * <h3>Des NOMBRES, pas des chaines</h3>
 * <p>Chaque colonne chiffree ecrit sa valeur brute, pas « 12 610 500 FCFA ». Un montant
 * ecrit en texte ne s'additionne pas, ne se trie pas, ne se met pas en graphique : le
 * destinataire du fichier devrait le retaper. La mise en forme est portee par le format de
 * cellule, pas par le contenu.</p>
 *
 * <h3>Une cellule VIDE quand il n'y a pas de commission</h3>
 * <p>`null` produit une cellule reellement vide. Zero se serait somme avec les autres et
 * aurait fait mentir toute colonne calculee par le lecteur du fichier.</p>
 *
 * <h3>La periode est en tete</h3>
 * <p>Un classement sans sa periode ne veut rien dire, et un fichier voyage loin de l'ecran
 * qui l'a produit. On y ajoute l'indicateur de tri, parce que le RANG en depend
 * entierement, et la provenance des chiffres, archive ou recalcul.</p>
 */
export function construireClassementExcel(classement: IClassement): ArrayBuffer {
  const classeur = XLSX.utils.book_new();

  const enTete: (string | number | null)[][] = [
    ['CLASSEMENT DES PARTENAIRES'],
    [],
    ['Période', libellePeriode(classement.periode)],
    ['Du', jourCourt(classement.periode.debut)],
    ['Au', jourCourt(classement.periode.fin)],
    ['Classé par', `${LIBELLE_TRI[classement.tri]} (${classement.sens === 'ASC' ? 'croissant' : 'décroissant'})`],
    [
      'Source des chiffres',
      classement.periode.source === 'SNAPSHOT'
        ? 'Instantané figé'
        : 'Recalculé au moment de l’export',
    ],
    ['Calculé le', instant(classement.periode.calculeLe)],
    [],
  ];

  const titres = COLONNES_CLASSEMENT.map((c) => c.libelle);
  const lignes = classement.lignes.map((l) => COLONNES_CLASSEMENT.map((c) => c.brut(l)));
  const totaux = COLONNES_CLASSEMENT.map((c) => c.totalBrut(classement.totaux));

  const tout = [...enTete, titres, ...lignes, totaux];
  const feuille = XLSX.utils.aoa_to_sheet(tout);

  /*
   * Le format monetaire est pose sur les CELLULES, pas dans le texte : le tableur affiche
   * « 12 610 500 FCFA » et calcule quand meme sur 12610500.
   */
  const premiereLigneDonnees = enTete.length + 1;
  const derniereLigne = tout.length - 1;
  /*
   * Des codes de format EXCEL, pas du texte francais : la virgule y DESIGNE le separateur
   * de milliers, qu'Excel remplace par celui de la machine du lecteur. Une espace ecrite
   * en dur a cette place donne un format que le tableur ignore, et la colonne retombe en
   * nombres nus.
   */
  const FORMAT: Record<string, string> = {
    commission: '#,##0" FCFA"',
    montantLivraison: '#,##0" FCFA"',
    nbLivraisons: '#,##0',
    rang: '0',
    tauxSucces: '0.0" %"',
    totalARegler: '#,##0" FCFA"',
    valeurCommandes: '#,##0" FCFA"',
  };

  COLONNES_CLASSEMENT.forEach((colonne, indexColonne) => {
    const format = FORMAT[colonne.cle];
    if (!format) return;
    for (let ligne = premiereLigneDonnees; ligne <= derniereLigne; ligne += 1) {
      const adresse = XLSX.utils.encode_cell({ c: indexColonne, r: ligne });
      const cellule = feuille[adresse];
      if (cellule && typeof cellule.v === 'number') cellule.z = format;
    }
  });

  feuille['!cols'] = COLONNES_CLASSEMENT.map((c) => ({
    wch: c.cle === 'nom' ? 32 : Math.max(12, c.libelle.length + 4),
  }));

  XLSX.utils.book_append_sheet(classeur, feuille, 'Classement');

  return XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });
}

/** Ecrit le fichier. Le nom porte la periode : deux exports ne s'ecrasent pas. */
export function exporterClassementExcel(classement: IClassement): void {
  const donnees = construireClassementExcel(classement);
  const blob = new Blob([donnees], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `classement-partenaires-${classement.periode.debut}_${classement.periode.fin}.xlsx`;
  lien.click();
  URL.revokeObjectURL(url);
}
