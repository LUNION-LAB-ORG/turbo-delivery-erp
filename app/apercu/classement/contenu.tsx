'use client';

import { Button } from '@heroui-v3/react';
import { format } from 'date-fns';
import React from 'react';

import { BandeauHistorique } from '@/features/classement-partenaires/components/bandeau-historique';
import { ClassementEntete } from '@/features/classement-partenaires/components/classement-entete';
import { ClassementTable } from '@/features/classement-partenaires/components/classement-table';
import {
  JEUX_CLASSEMENT,
  type CleJeuClassement,
} from '@/features/classement-partenaires/apercu/jeux-exemple';
import type { IClassement, ILigneClassement } from '@/features/classement-partenaires/types/classement.types';
import { libellePeriode } from '@/features/classement-partenaires/utils/classement-format.utils';
import { COLONNE_DE_TRI } from '@/features/classement-partenaires/utils/classement-tri.utils';

import type { SortDescriptor } from '@heroui-v3/react';

/**
 * Le banc du CLASSEMENT.
 *
 * <p>Il monte les VRAIS composants de l'ecran, entete, bandeau d'historique et tableau,
 * sur des donnees d'exemple. Seule la lecture reseau est remplacee : un banc qui remonterait
 * la page a sa facon ne montrerait pas l'ecran, il montrerait le banc.</p>
 *
 * <h3>Les etats qu'on oublie de regarder</h3>
 * <ul>
 *   <li><b>Sans instantane</b>, le jeu par defaut : c'est l'etat REEL de la production le
 *       jour ou cet ecran est livre. Aucune fleche de tendance nulle part, et un bandeau
 *       qui doit expliquer pourquoi sans ressembler a une panne ;</li>
 *   <li><b>Avec tendances</b> : les quatre sens, hausse, baisse, stable et nouveau, dont
 *       le dernier n'est PAS une chute ;</li>
 *   <li><b>Ex aequo</b> : 1, 2, 2, 4, 5, 5, 5, 8. Le rang saute apres une egalite. Si un
 *       jour un rendu renumerote les lignes par leur position, cela se verra ici ;</li>
 *   <li><b>Aucun partenaire</b> : la periode existe, elle est vide. A ne pas confondre
 *       avec l'echec de lecture, qui est un bouton a part.</li>
 * </ul>
 *
 * <h3>Ce qui n'est pas sur le banc, et pourquoi</h3>
 * <p>La fiche d'evolution et la comparaison de deux periodes portent chacune LEUR requete
 * et n'ont pas de forme d'exemple : les monter ici ferait partir de vrais appels vers la
 * production depuis une page hors session. Elles se regardent sur l'ecran reel. Le bouton
 * de fiche du tableau est en revanche bien la, et il annonce le partenaire demande.</p>
 *
 * <p>La barre du haut n'appartient PAS a l'ecran. Tout ce qui est sous elle, si.</p>
 */

/**
 * Bascule le theme sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : la feuille de style declare encore des jetons shadcn en
 * triplets HSL bruts dans la meme portee `.dark` que HeroUI, et sur un div imbrique c'est le
 * triplet qui gagne. `bg-success` ne peint alors plus rien.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
  const [sombre, setSombre] = React.useState(false);
  React.useEffect(() => {
    const html = document.documentElement;
    const avant = html.className;
    html.className = sombre ? 'dark' : 'light';
    return () => {
      html.className = avant;
    };
  }, [sombre]);
  return [sombre, setSombre];
}

export default function ApercuClassement() {
  const [cle, setCle] = React.useState<CleJeuClassement>('sansInstantane');
  const [sombre, setSombre] = useThemeSombre();
  const [posteReel, setPosteReel] = React.useState(true);
  const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
  const [moisEnCours, setMoisEnCours] = React.useState(false);
  const [demande, setDemande] = React.useState<string | null>(null);
  const [tri, setTri] = React.useState<SortDescriptor>({
    column: COLONNE_DE_TRI.LIVRAISONS,
    direction: 'descending',
  });

  /*
   * Un mois NON CLOS ne se capture pas : le bandeau doit alors ecrire la raison au lieu
   * d'offrir un bouton dont on sait qu'il sera refuse. C'est invisible tant qu'on ne
   * regarde le banc qu'un mois deja termine.
   */
  const base = JEUX_CLASSEMENT[cle].classement;
  const classement: IClassement = moisEnCours
    ? {
        ...base,
        tendance: { ...base.tendance, mois: format(new Date(), 'yyyy-MM') },
      }
    : base;

  const enChargement = etat === 'chargement';
  const enEchec = etat === 'echec';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
        <span className="font-bold uppercase tracking-wider">Aperçu · Classement</span>

        {(Object.keys(JEUX_CLASSEMENT) as CleJeuClassement[]).map((k) => (
          <Button key={k} onPress={() => setCle(k)} size="sm" variant={cle === k ? 'primary' : 'ghost'}>
            {JEUX_CLASSEMENT[k].libelle}
          </Button>
        ))}

        <Button
          className="ms-auto"
          onPress={() =>
            setEtat((e) => (e === 'normal' ? 'chargement' : e === 'chargement' ? 'echec' : 'normal'))
          }
          size="sm"
          variant="outline"
        >
          {etat === 'normal' ? 'chargé' : etat === 'chargement' ? 'en chargement' : 'échec de lecture'}
        </Button>
        <Button onPress={() => setMoisEnCours((v) => !v)} size="sm" variant="outline">
          {moisEnCours ? 'mois en cours' : 'mois clos'}
        </Button>
        <Button onPress={() => setPosteReel((v) => !v)} size="sm" variant="outline">
          {posteReel ? 'fenêtre 1000 px' : 'pleine largeur'}
        </Button>
        <Button onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
          {sombre ? 'sombre' : 'clair'}
        </Button>
      </header>

      <div className="mx-auto" style={{ maxWidth: posteReel ? 1000 : 1500 }}>
        {/* Le meme habillage que `ClassementVue`, a la classe pres. */}
        <div className="bg-surface-secondary p-6">
          <ClassementEntete
            classement={enEchec ? undefined : classement}
            isLoading={enChargement}
            /* Le banc n'ecrit aucun fichier : les boutons sont la pour etre REGARDES, a
               leur taille et a leur place reelles. */
            onExportExcel={() => setDemande('export Excel')}
            onExportPdf={() => setDemande('export PDF')}
          />

          <div className="flex flex-col gap-4">
            {/* Le bandeau porte le seul bouton du module qui ECRIT en base. Le banc lui
                donne un gestionnaire qui n'ecrit rien : sans cela, un clic ici capturerait
                un instantane REEL en production depuis une page de developpement. */}
            {!enEchec && !enChargement && (
              <BandeauHistorique
                classement={classement}
                onCapturer={(mois) => setDemande(`capture de l'instantané ${mois}`)}
              />
            )}

            <ClassementTable
              descripteurTri={tri}
              isError={enEchec}
              isFetching={false}
              isLoading={enChargement}
              libellePeriode={libellePeriode(classement.periode)}
              lignes={enEchec ? [] : classement.lignes}
              onFiche={(ligne: ILigneClassement) => setDemande(`fiche de ${ligne.nom}`)}
              onReessayer={() => setEtat('normal')}
              onTri={setTri}
              totaux={classement.totaux}
            />

            {/*
             * Le tri est SERVEUR sur l'ecran reel : il refait le classement, rang compris.
             * Le banc n'a pas de serveur, donc un clic sur un en-tete ne deplace ici que
             * l'indicateur. C'est ce qu'il verifie : que la fleche apparaisse du bon cote,
             * et que les colonnes de nombres gardent leur alignement a droite.
             */}
            <p className="text-xs text-muted">
              Tri : {String(tri.column)} / {tri.direction}. Sur l&apos;écran réel, ce clic relance
              la requête et renumérote les rangs ; ici seul l&apos;indicateur bouge.
            </p>

            {demande && (
              <p className="text-xs text-muted">
                Geste demandé : {demande}. Le banc ne l&apos;exécute pas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
