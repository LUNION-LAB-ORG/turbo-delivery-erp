'use client';

import { Card, Tabs } from '@heroui-v3/react';

import { ICommission } from '@/features/revenus/types/commission.types';

import { CommissionHebdomadaireChart } from './commision-hebdomadaire';
import { CommissionJournaliereChart } from './commission-journaliere';
import { CommissionMensuelleChart } from './commission-mensuelle';

/**
 * Les commissions fixes vues a trois pas de temps.
 *
 * <h3>Ce qui change</h3>
 * <p>Les onglets venaient de shadcn, la derniere bibliotheque doublonnee du projet, et
 * l'onglet actif etait peint en ROUGE DE MARQUE par quatre classes recopiees a
 * l'identique sur les trois declencheurs. Le rouge de l'ERP annonce un geste ; il
 * designait ici un PAS DE TEMPS, c'est-a-dire une categorie, ce qui ne dit rien. La v3
 * marque l'onglet actif par son etat, comme partout ailleurs.</p>
 *
 * <p>PAS de `Tabs.Indicator` : il rend un `SelectionIndicator` de react-aria qui exige un
 * `SharedElementTransition` en ancetre et fait tomber la page entiere sans lui.</p>
 *
 * <p>Le cadre etait un `div` portant `shadow-lg rounded-lg border border-separator` :
 * le dessin d'une carte, refait a la main a cote d'une carte de la bibliotheque. Les deux
 * enveloppes `px-4 py-6` imbriquees, plus un `-mt-6` qui remontait le bloc sous son
 * voisin, sont remplacees par l'espacement de la carte.</p>
 */
export default function CommissionAnalyseChart({
  commissionFixe,
}: {
  commissionFixe: ICommission[];
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">Rapport des commissions fixes</Card.Title>
      </Card.Header>
      <Card.Content>
        <Tabs defaultSelectedKey="jours">
          {/* La rangee defile plutot que de pousser la page : la fenetre reelle des
              postes fait 1000 px, coquille comprise. */}
          <Tabs.List className="overflow-x-auto">
            <Tabs.Tab id="jours">Jours</Tabs.Tab>
            <Tabs.Tab id="semaines">Semaines</Tabs.Tab>
            <Tabs.Tab id="mois">Mois</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel className="pt-4" id="jours">
            <CommissionJournaliereChart commissionFixe={commissionFixe} />
          </Tabs.Panel>
          <Tabs.Panel className="pt-4" id="semaines">
            <CommissionHebdomadaireChart commissionFixe={commissionFixe} />
          </Tabs.Panel>
          <Tabs.Panel className="pt-4" id="mois">
            <CommissionMensuelleChart commissionFixe={commissionFixe} />
          </Tabs.Panel>
        </Tabs>
      </Card.Content>
    </Card>
  );
}
