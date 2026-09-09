'use client';

import { Tabs } from '@heroui-v3/react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { IEncoursReleve, formatCompact, formatNombre } from '@/features/encours';

import { EncoursCharts, TOP_PARTENAIRES } from './encours-charts';
import { EncoursDeductionsTable } from './encours-deductions-table';
import { EncoursMobileCards } from './encours-mobile-cards';
import { EncoursTable } from './encours-table';

/**
 * Les trois sections du releve ENCOURS.
 *
 * <h3>Pourquoi ce decoupage, et pas un autre</h3>
 * <p>La page empilait bandeau, releve, deux graphiques et registre : 1 400 px de haut sur
 * une fenetre qui en fait 563. Trois quarts du contenu se lisaient au defilement, donc ne
 * se lisaient pas. Le decoupage suit la question « que regarde l'operateur en premier ».
 * Il ouvre cet ecran pour RELANCER : le releve ligne a ligne est le geste, il reste sous
 * le premier onglet et garde tout le pli pour lui. Ce qui explique d'ou vient l'encours -
 * la saisonnalite, le classement des partenaires - se consulte apres, sur decision, et
 * n'a plus a pousser le travail vers le bas. Le registre des avances, qui appartient a
 * l'annee et non au filtre courant, est la troisieme.</p>
 *
 * <p>Le bandeau de chiffres et la barre de filtres restent AU-DESSUS : ils valent pour
 * les trois sections, les cacher derriere un onglet reviendrait a les nier.</p>
 *
 * <h3>Un onglet muet cache son contenu</h3>
 * <p>Chaque onglet porte un compte ou un montant. Sans cela, « Repartition » ne dit pas
 * s'il y a douze mois derriere ou zero, et l'operateur doit cliquer pour l'apprendre :
 * l'onglet aurait alors RETIRE de l'information au lieu d'en ranger.</p>
 *
 * <h3>Pourquoi le trait est dessine a la main</h3>
 * <p>`Tabs.Indicator` est la piece prevue pour cela, et elle ne fonctionne pas dans ce
 * projet : rendue telle quelle elle leve `<SharedElement> must be rendered inside a
 * <SharedElementTransition>` et emporte la page en 500 ; enveloppee dans un
 * `SharedElementTransition` elle ne rend aucun noeud. Mesure a l'ecran, deux fois. Le
 * trait est donc pose sur l'onglet lui-meme. Il prend l'accent, et c'est legitime : il ne
 * colorie pas une categorie, il dit ou l'on est. Meme modele que
 * `components/finance/recouvrements/recouvrement-content-tabs.tsx`.</p>
 */
const MARQUE_ACTIVE =
  'border-b-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:font-semibold';

/**
 * La section ouverte vit dans l'URL, comme le reste de l'etat de cet ecran.
 *
 * <p>L'annee, le mois, le cycle, le partenaire et les points de vente sont deja des
 * parametres d'URL (`encours-view`). Garder la section en etat local rendait tout lien
 * partage boiteux : le destinataire retombait sur « Releve » avec des filtres qui
 * portaient sur une section fermee. C'est aussi la convention du module voisin,
 * `recouvrement-content-tabs`, qui met son onglet dans l'etat de requete.</p>
 *
 * <p>Le parseur est ici et non dans `features/encours/filters` parce que la section n'est
 * pas un filtre de la LECTURE : elle n'entre pas dans les parametres de la requete. Il est
 * en revanche prefixe `en` comme les autres cles de cet ecran, et il n'accepte que les
 * trois valeurs connues - une cle inventee dans l'URL laisserait react-aria sans onglet
 * selectionne, donc sans aucun panneau a l'ecran. `clearOnDefault` evite d'ecrire un
 * parametre pour la section qui s'ouvre de toute facon.</p>
 */
const SECTIONS = ['releve', 'repartition', 'deductions'] as const;

const parseurSection = parseAsStringLiteral(SECTIONS)
  .withDefault('releve')
  .withOptions({ clearOnDefault: true });

/**
 * L'annonce chiffree d'un onglet.
 *
 * <p>Elle reste en `muted` : elle SITUE ce qu'il y a derriere, elle n'appelle pas. Elle
 * disparait tant que le releve n'est pas lu, plutot que d'annoncer zero facture a propos
 * d'une lecture qui n'a pas encore repondu.</p>
 *
 * <p>Deux precautions, apprises a l'ecran ailleurs dans ce projet. Les trois `Tabs.Tab`
 * sont ecrits EN CLAIR et non produits par un composant maison : `Tabs.List` construit une
 * collection react-aria a partir de ses enfants directs, et l'envelopper est le genre de
 * detour qui se paie en 500. Et le libelle est dans un `<span>`, pas en texte nu : cette
 * annonce apparait quand le releve arrive, or React ne retire que le noeud hote le plus
 * haut, et un noeud de texte nu voisin d'un element qui va et vient est exactement la
 * configuration qui a fait tomber les tickets.</p>
 */
function Annonce({ texte }: { texte: string }) {
  if (!texte) return null;
  return <span className="ms-1.5 text-xs font-normal tabular-nums text-muted">{texte}</span>;
}

export function EncoursSectionsTabs({
  hauteur,
  releve,
  zoneReleve,
}: {
  /** Hauteur MESUREE du cadre de defilement du releve. */
  hauteur?: number;
  /** Absent tant que la lecture reseau n'a pas repondu : les onglets sont deja montes. */
  releve?: IEncoursReleve;
  /**
   * Reference-FONCTION du cadre mesure, et non un `RefObject` : react-aria demonte les
   * panneaux fermes, donc le noeud change. Voir `encours-hauteur`.
   */
  zoneReleve: (noeud: HTMLDivElement | null) => void;
}) {
  const [section, setSection] = useQueryState('enSection', parseurSection);

  // UNE seule regle : l'annonce compte les BARRES que la section trace. Le graphe mensuel
  // en trace une par colonne du releve, mois a zero compris - un mois sans reste est une
  // information, pas une colonne absente - et le classement en trace au plus six. Compter
  // d'un cote les mois non nuls et de l'autre les partenaires sans condition laissait
  // l'onglet annoncer « 0 mois » devant un graphe de douze barres.
  const nbMois = releve?.moisColonnes?.length ?? 0;
  const nbTop = Math.min(TOP_PARTENAIRES, releve?.partenaires?.length ?? 0);
  const deductions = releve?.deductions ?? [];

  const annonceReleve = releve
    ? `${formatNombre(releve.nbFactures)} facture${releve.nbFactures > 1 ? 's' : ''}`
    : '';
  const annonceRepartition = releve
    ? `${formatNombre(nbMois)} mois · ${formatNombre(nbTop)} partenaire${nbTop > 1 ? 's' : ''}`
    : '';
  const annonceDeductions = releve
    ? `${formatNombre(deductions.length)} ligne${deductions.length > 1 ? 's' : ''} · ${formatCompact(releve.totalDeductions)} FCFA`
    : '';

  return (
    <Tabs
      className="w-full"
      onSelectionChange={(cle) => void setSection(String(cle) as (typeof SECTIONS)[number])}
      selectedKey={section}
      variant="secondary"
    >
      {/* Le conteneur gere lui-meme le debordement et sort ses chevrons : trois libelles
          annonces ne tiennent pas toujours sur la fenetre reelle des postes (1000 px). */}
      <Tabs.ListContainer>
        <Tabs.List>
          <Tabs.Tab className={MARQUE_ACTIVE} id="releve">
            <span className="text-sm">Relevé</span>
            <Annonce texte={annonceReleve} />
          </Tabs.Tab>
          <Tabs.Tab className={MARQUE_ACTIVE} id="repartition">
            <span className="text-sm">Répartition</span>
            <Annonce texte={annonceRepartition} />
          </Tabs.Tab>
          <Tabs.Tab className={MARQUE_ACTIVE} id="deductions">
            <span className="text-sm">Déductions &amp; avances</span>
            <Annonce texte={annonceDeductions} />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>

      {/*
       * L'enveloppe mesuree est montee EN PERMANENCE, meme sans releve : sans elle il n'y a
       * aucun noeud a mesurer au premier rendu, le cadre de defilement reste sans hauteur
       * et le tableau s'etire sur 35 000 px des que le releve arrive.
       *
       * Les panneaux non selectionnes sont DEMONTES, et c'est voulu : force-montes,
       * react-aria les rend caches, `getBoundingClientRect()` y renvoie zero, et la mesure
       * du releve retomberait sur son plancher des qu'un autre onglet est ouvert. C'est
       * pour ce demontage que `zoneReleve` est une reference-FONCTION : le noeud est neuf a
       * chaque retour sur cet onglet, et la mesure doit se rejouer sur lui.
       */}
      <Tabs.Panel className="pt-2.5" id="releve">
        <div ref={zoneReleve}>
          {releve ? (
            <>
              <div className="hidden md:block">
                <EncoursTable hauteur={hauteur} releve={releve} />
              </div>
              <div className="md:hidden">
                <EncoursMobileCards releve={releve} />
              </div>
            </>
          ) : null}
        </div>
      </Tabs.Panel>

      <Tabs.Panel className="pt-2.5" id="repartition">
        {releve ? <EncoursCharts releve={releve} /> : null}
      </Tabs.Panel>

      <Tabs.Panel className="pt-2.5" id="deductions">
        {releve ? (
          <EncoursDeductionsTable deductions={deductions} total={releve.totalDeductions} />
        ) : null}
      </Tabs.Panel>
    </Tabs>
  );
}
