'use client';

import { Tabs } from '@heroui-v3/react';
import React from 'react';
import { toast } from 'sonner';

import { BandeauHistorique } from '@/features/classement-partenaires/components/bandeau-historique';
import { ClassementEntete } from '@/features/classement-partenaires/components/classement-entete';
import { ClassementTable } from '@/features/classement-partenaires/components/classement-table';
import { ComparaisonPeriodes } from '@/features/classement-partenaires/components/comparaison-periodes';
import { FicheEvolution } from '@/features/classement-partenaires/components/fiche-evolution';
import { useClassementTable } from '@/features/classement-partenaires/hooks/use-classement-table';
import type { ILigneClassement } from '@/features/classement-partenaires/types/classement.types';
import { exporterClassementExcel } from '@/features/classement-partenaires/utils/classement-excel.utils';
import { libellePeriode } from '@/features/classement-partenaires/utils/classement-format.utils';
import { exporterClassementPdf } from '@/features/classement-partenaires/utils/classement-pdf.utils';

/**
 * LA CLASSIFICATION DES PARTENAIRES.
 *
 * <h3>Les trois questions, avant le code</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : l'ordre, et ce que chacun doit. Le tableau
 *       ouvre l'ecran, premier en haut, et la colonne « total a regler » est la seule en
 *       graisse pleine. Tout le reste est du contexte pose au-dessus en une ligne.</li>
 *   <li><b>Ce qui appelle un geste</b> : changer l'indicateur de tri, qui refait le
 *       classement ; exporter ; capturer l'instantane qui manque ; ouvrir la fiche d'un
 *       partenaire. Le rang, les montants et la tendance INFORMENT et ne se cliquent pas.
 *       Un seul de ces gestes ecrit quelque chose sur le serveur, et c'est le seul qui
 *       porte l'accent.</li>
 *   <li><b>La forme naturelle</b> : un classement chiffre se lit en colonnes alignees,
 *       chasse tabulaire, montants a droite, une ligne de totaux. Pas en tuiles, pas en
 *       podium, pas en camembert.</li>
 * </ul>
 *
 * <h3>Pourquoi la comparaison est dans un onglet et non sous le tableau</h3>
 * <p>Elle porte SES PROPRES periodes, qui n'ont aucune raison d'etre celle du classement.
 * Posee dessous, elle donnerait a lire deux tableaux qui se ressemblent sur des periodes
 * differentes, et le lecteur attribuerait au premier les chiffres du second. Un onglet dit
 * qu'on change d'objet.</p>
 *
 * <p>L'onglet actif et les deux mois compares restent en etat LOCAL, contrairement aux
 * filtres du classement. Un lien partage doit rendre le classement que l'on voit ; le
 * mettre a moitie dans l'URL rendrait des liens qui ouvrent un onglet vide.</p>
 */

/** Le trait de l'onglet ouvert. `Tabs.Indicator` est inutilisable dans ce projet. */
const MARQUE_ACTIVE =
  'border-b-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:font-semibold';

export function ClassementVue() {
  const {
    changerTri,
    classement,
    descripteurTri,
    filtres,
    isError,
    isFetching,
    isLoading,
    lignes,
    refetch,
    totaux,
  } = useClassementTable();

  const [fiche, setFiche] = React.useState<{ id: string; nom: string } | null>(null);

  const ouvrirFiche = React.useCallback((ligne: ILigneClassement) => {
    setFiche({ id: ligne.restaurantId, nom: ligne.nom?.trim() || 'ce partenaire' });
  }, []);

  /*
   * Les exports ne partent JAMAIS sans donnees. Sans cette garde, un clic pendant le
   * chargement produirait un fichier a zero ligne, indiscernable d'un mois sans activite
   * une fois sorti de l'ecran qui l'a fabrique.
   */
  const exporter = (quoi: 'excel' | 'pdf') => async () => {
    if (!classement || classement.lignes.length === 0) {
      toast.warning('Rien à exporter', {
        description: 'Le classement doit être chargé et contenir au moins un partenaire.',
      });
      return;
    }
    try {
      if (quoi === 'excel') exporterClassementExcel(classement);
      else await exporterClassementPdf(classement);
    } catch (erreur) {
      toast.error("L'export n'a pas abouti", {
        description: erreur instanceof Error ? erreur.message : 'Erreur inconnue',
      });
    }
  };

  return (
    <div className="bg-surface-secondary p-6">
      <ClassementEntete
        classement={classement}
        isLoading={isLoading}
        onExportExcel={exporter('excel')}
        onExportPdf={exporter('pdf')}
      />

      <Tabs className="w-full" defaultSelectedKey="classement" variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab className={MARQUE_ACTIVE} id="classement">
              Classement
            </Tabs.Tab>
            <Tabs.Tab className={MARQUE_ACTIVE} id="comparaison">
              Comparer deux périodes
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="flex flex-col gap-4 pt-4" id="classement">
          {/* L'explication de ce qui manque vient AVANT le tableau : la colonne de
              tendance y est vide, et une colonne vide sans motif se lit comme une panne. */}
          {classement && <BandeauHistorique classement={classement} />}

          <ClassementTable
            descripteurTri={descripteurTri}
            isError={isError}
            isFetching={isFetching}
            isLoading={isLoading}
            libellePeriode={libellePeriode(classement?.periode)}
            lignes={lignes}
            onFiche={ouvrirFiche}
            onReessayer={() => refetch()}
            onTri={changerTri}
            totaux={totaux}
          />
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="comparaison">
          <ComparaisonPeriodes
            moisAffiche={classement?.periode.mois ?? null}
            sens={filtres.sens}
            tri={filtres.tri}
          />
        </Tabs.Panel>
      </Tabs>

      <FicheEvolution
        nom={fiche?.nom ?? ''}
        onClose={() => setFiche(null)}
        restaurantId={fiche?.id ?? null}
        sens={filtres.sens}
        tri={filtres.tri}
      />
    </div>
  );
}
