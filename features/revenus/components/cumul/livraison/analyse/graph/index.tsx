'use client';

import { Card, Tabs } from '@heroui-v3/react';

import { ILivraison } from '@/features/revenus/types/livraison.types';

import { LivraisonHebdomadaireChart } from './livraison-hebdomadaire';
import { LivraisonJournaliereChart } from './livraison-journaliere';
import { LivraisonMensuelleChart } from './livraison_mensuelle';

/**
 * Le rapport des revenus de livraison, a trois echelles de temps.
 *
 * <h3>Ce qui change</h3>
 * <p>Les trois onglets venaient de shadcn et etaient peints en ROUGE DE MARQUE une fois
 * actifs, avec leur contrepartie `dark:` recopiee a la main sur chacun. Une echelle de
 * temps n'appelle aucun geste : elle dit ou l'on regarde. L'onglet actif se lit desormais
 * a son etat, comme partout ailleurs dans l'ERP, et le rouge reste disponible pour ce qui
 * demande une action.</p>
 *
 * <p>PAS de `Tabs.Indicator` : il rend un `SelectionIndicator` de react-aria qui LEVE hors
 * d'un `SharedElementTransition` et fait tomber la page entiere.</p>
 *
 * <p>La grille de trois colonnes pleine largeur disparait aussi : trois libelles d'un mot
 * etires sur toute la carte se lisaient comme trois boutons d'action.</p>
 */
export default function LivraisonAnalyseChart({ livraison }: { livraison: ILivraison[] }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Rapport des revenus</Card.Title>
      </Card.Header>
      {/*
       * Deux enveloppes imbriquees portaient chacune `px-4 py-6`, plus un `-mt-6` qui
       * remontait le bloc sous son voisin : la carte tient sa propre respiration.
       */}
      <Card.Content>
        <Tabs defaultSelectedKey="jour">
          <Tabs.List>
            <Tabs.Tab id="jour">Jours</Tabs.Tab>
            <Tabs.Tab id="semaine">Semaines</Tabs.Tab>
            <Tabs.Tab id="mois">Mois</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel className="pt-4" id="jour">
            <LivraisonJournaliereChart livraison={livraison} />
          </Tabs.Panel>
          <Tabs.Panel className="pt-4" id="semaine">
            <LivraisonHebdomadaireChart livraison={livraison} />
          </Tabs.Panel>
          <Tabs.Panel className="pt-4" id="mois">
            <LivraisonMensuelleChart livraison={livraison} />
          </Tabs.Panel>
        </Tabs>
      </Card.Content>
    </Card>
  );
}
