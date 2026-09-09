'use client';

import { Tabs } from '@heroui-v3/react';
import { ReactNode } from 'react';

export type CleOnglet = 'variable' | 'fixe' | 'historique';

/**
 * Les trois destinations de la validation des charges.
 *
 * <h3>Ce qui change</h3>
 * <p>L'ecran empilait DEUX barres d'onglets a 8 px l'une de l'autre, de deux idiomes
 * differents : des pilules pour variable/fixe, un soulignement pour validation/historique.
 * La meme mecanique, dite deux fois de deux facons. Les pilules peignaient en plus
 * l'option ouverte en noir plein sur texte blanc, ce qui donnait du texte blanc sans fond
 * lisible sur le gris de la page, et on ne voyait plus laquelle des deux etait ouverte. Le
 * soulignement, lui, prenait un jaune de palette brute, sans variante sombre, qui ne
 * disait rien de plus que « ici ».</p>
 *
 * <p>Les deux niveaux fusionnent parce qu'ils ne se croisent pas : l'historique n'est PAS
 * filtre par type de charge, il les rend tous les deux. Quatre combinaisons pour trois
 * listes reelles, c'etait une case vide de trop. Restent trois destinations, une seule
 * barre, et le modele valide du depot.</p>
 *
 * <p>Le trait de l'onglet ouvert est pose sur l'onglet lui-meme : `Tabs.Indicator` leve
 * « <SharedElement> must be rendered inside a <SharedElementTransition> » et emporte la
 * page en 500, et enveloppee elle ne rend rien. Voir le raisonnement mesure dans
 * `components/finance/recouvrements/recouvrement-content-tabs.tsx`.</p>
 */
const MARQUE_ACTIVE = 'border-b-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:font-semibold';

const ONGLETS: { id: CleOnglet; libelle: string }[] = [
  { id: 'variable', libelle: 'Charges variables' },
  { id: 'fixe', libelle: 'Charges fixes' },
  { id: 'historique', libelle: 'Historique' },
];

interface TabSwitcherProps {
  cle: CleOnglet;
  onChange: (cle: CleOnglet) => void;
  /**
   * Ce que chaque file retient, pour que l'onglet FERME le dise. `null` tant que la
   * lecture n'a pas repondu : annoncer « 0 » sur un echec affirme une file vide.
   * L'historique ne compte pas, il n'attend rien.
   */
  attentes: { variable: number; fixe: number } | null;
  /**
   * Le meme noeud sert aux deux files : React Aria ne monte QUE le panneau ouvert, donc
   * il n'est rendu qu'une fois. Le contenu differe par la donnee, pas par le balisage.
   */
  file: ReactNode;
  historique: ReactNode;
}

export function TabSwitcher({ attentes, cle, onChange, file, historique }: TabSwitcherProps) {
  return (
    <Tabs className="flex min-h-0 flex-1 flex-col" onSelectionChange={(id) => onChange(String(id) as CleOnglet)} selectedKey={cle} variant="secondary">
      {/* Le conteneur sort ses chevrons quand les libelles debordent : sur la fenetre
          reelle des postes, la zone de contenu ne fait pas la largeur de l'ecran. */}
      <Tabs.ListContainer>
        <Tabs.List>
          {ONGLETS.map((onglet) => (
            <Tabs.Tab className={MARQUE_ACTIVE} id={onglet.id} key={onglet.id}>
              {onglet.libelle}
              {onglet.id !== 'historique' && attentes ? (
                <span className="ml-1.5 tabular-nums text-muted">{attentes[onglet.id]}</span>
              ) : null}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

      <Tabs.Panel className="flex min-h-0 flex-1 flex-col" id="variable">
        {file}
      </Tabs.Panel>
      <Tabs.Panel className="flex min-h-0 flex-1 flex-col" id="fixe">
        {file}
      </Tabs.Panel>
      <Tabs.Panel className="flex min-h-0 flex-1 flex-col" id="historique">
        {historique}
      </Tabs.Panel>
    </Tabs>
  );
}
