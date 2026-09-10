import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import React from 'react';

import { COLONNES_CLASSEMENT } from '@/features/classement-partenaires/components/classement-table-columns';
import type { IClassement } from '@/features/classement-partenaires/types/classement.types';
import { instant, jourCourt, libellePeriode } from '@/features/classement-partenaires/utils/classement-format.utils';
import { LIBELLE_TRI } from '@/features/classement-partenaires/utils/classement-tri.utils';

/**
 * Le classement en PDF, MEMES colonnes qu'a l'ecran.
 *
 * <h3>Le piege des espaces</h3>
 * <p>`Intl.NumberFormat('fr-FR')` separe les milliers par une espace fine INSECABLE
 * (U+202F), et `formatMontant` colle la devise avec une insecable ordinaire (U+00A0). Les
 * polices standard de react-pdf sont encodees en WinAnsi, qui ne connait ni l'une ni
 * l'autre : le lecteur voit alors « 20/000 » ou un carre a la place de chaque espace. Tout
 * texte de ce document passe donc par `versAscii`. Le meme defaut a deja ete constate sur
 * un autre export de ce projet, ce n'est pas une precaution theorique.</p>
 *
 * <h3>Orientation paysage</h3>
 * <p>Huit colonnes, dont cinq montants a six ou neuf chiffres. En portrait, la colonne des
 * noms tombe sous six centimetres et coupe la moitie des partenaires. Le format suit la
 * donnee, pas l'habitude.</p>
 */

/** Les espaces insecables que WinAnsi ne sait pas ecrire, ramenees a l'espace ASCII. */
function versAscii(texte: string): string {
  return texte.replace(/[\u202F\u00A0\u2009]/g, ' ');
}

const LARGEUR_TOTALE = COLONNES_CLASSEMENT.reduce((n, c) => n + c.partPdf, 0);

/** La part de largeur d'une colonne, en pourcentage de la table. */
function largeur(part: number): string {
  return `${((part / LARGEUR_TOTALE) * 100).toFixed(3)}%`;
}

const s = StyleSheet.create({
  cellule: { paddingHorizontal: 4, paddingVertical: 4 },
  celluleNombre: { paddingHorizontal: 4, paddingVertical: 4, textAlign: 'right' },
  entete: {
    backgroundColor: '#f3f4f6',
    borderBottom: '1pt solid #d1d5db',
    borderTop: '1pt solid #d1d5db',
    flexDirection: 'row',
  },
  enteteTexte: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  ligne: { borderBottom: '0.5pt solid #f3f4f6', flexDirection: 'row' },
  ligneAlternee: {
    backgroundColor: '#fafafa',
    borderBottom: '0.5pt solid #f3f4f6',
    flexDirection: 'row',
  },
  ligneTotaux: {
    backgroundColor: '#f3f4f6',
    borderTop: '1pt solid #9ca3af',
    flexDirection: 'row',
    fontFamily: 'Helvetica-Bold',
  },
  meta: { color: '#4b5563', fontSize: 8, marginBottom: 2 },
  metaBloc: {
    border: '1pt solid #e5e7eb',
    borderRadius: 3,
    marginBottom: 10,
    padding: 8,
  },
  note: { color: '#6b7280', fontSize: 7, marginTop: 8 },
  page: { color: '#111827', fontFamily: 'Helvetica', fontSize: 8, padding: 24 },
  pied: {
    bottom: 12,
    color: '#9ca3af',
    fontSize: 7,
    left: 24,
    position: 'absolute',
    right: 24,
    textAlign: 'center',
  },
  titre: { fontFamily: 'Helvetica-Bold', fontSize: 14, marginBottom: 2 },
});

function DocumentClassement({ classement }: { classement: IClassement }) {
  const { lignes, periode, totaux, tri } = classement;

  return (
    <Document>
      <Page orientation="landscape" size="A4" style={s.page}>
        <Text style={s.titre}>{versAscii('Classification des partenaires')}</Text>

        <View style={s.metaBloc}>
          <Text style={s.meta}>
            {versAscii(
              `Periode : ${libellePeriode(periode)} (du ${jourCourt(periode.debut)} au ${jourCourt(periode.fin)})`,
            )}
          </Text>
          <Text style={s.meta}>
            {versAscii(
              `Classe par : ${LIBELLE_TRI[tri]} (${classement.sens === 'ASC' ? 'croissant' : 'decroissant'})`,
            )}
          </Text>
          <Text style={s.meta}>
            {versAscii(
              `Source : ${periode.source === 'SNAPSHOT' ? 'instantane fige' : "recalcule a l'instant"}, ${instant(periode.calculeLe)}`,
            )}
          </Text>
        </View>

        {/* `fixed` : l'en-tete se repete en haut de chaque page. Sans lui, la deuxieme
            page d'un classement de soixante-neuf lignes est une grille de nombres nus. */}
        <View fixed style={s.entete}>
          {COLONNES_CLASSEMENT.map((c) => (
            <Text
              key={c.cle}
              style={[c.nombre ? s.celluleNombre : s.cellule, s.enteteTexte, { width: largeur(c.partPdf) }]}
            >
              {versAscii(c.libelle)}
            </Text>
          ))}
        </View>

        {lignes.map((ligne, i) => (
          <View key={ligne.restaurantId} style={i % 2 === 1 ? s.ligneAlternee : s.ligne} wrap={false}>
            {COLONNES_CLASSEMENT.map((c) => (
              <Text
                key={c.cle}
                style={[c.nombre ? s.celluleNombre : s.cellule, { width: largeur(c.partPdf) }]}
              >
                {versAscii(c.texte(ligne))}
              </Text>
            ))}
          </View>
        ))}

        <View style={s.ligneTotaux} wrap={false}>
          {COLONNES_CLASSEMENT.map((c) => (
            <Text
              key={c.cle}
              style={[c.nombre ? s.celluleNombre : s.cellule, { width: largeur(c.partPdf) }]}
            >
              {versAscii(c.totalTexte(totaux))}
            </Text>
          ))}
        </View>

        {/* Les deux memes reserves qu'a l'ecran : un total qui depasse la somme des
            cellules visibles, et une grandeur qui ne s'additionne pas, doivent voyager
            avec le document. */}
        <Text style={s.note}>
          {versAscii(
            `Le total des commissions porte sur les ${totaux.nbPartenairesClasses} partenaires, y compris ceux dont la cellule est vide faute de regime de commission : il peut depasser la somme des montants affiches.`,
          )}
        </Text>
        <Text style={s.note}>
          {versAscii(
            "Le taux de succes n'a pas de total : un taux d'ensemble se calcule sur les courses cumulees, jamais sur la moyenne des taux de chaque ligne.",
          )}
        </Text>

        <Text
          fixed
          render={({ pageNumber, totalPages }) =>
            versAscii(`Turbo Delivery ERP - page ${pageNumber} / ${totalPages}`)
          }
          style={s.pied}
        />
      </Page>
    </Document>
  );
}

export async function exporterClassementPdf(classement: IClassement): Promise<void> {
  const blob = await pdf(<DocumentClassement classement={classement} />).toBlob();
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `classement-partenaires-${classement.periode.debut}_${classement.periode.fin}.pdf`;
  lien.click();
  URL.revokeObjectURL(url);
}
