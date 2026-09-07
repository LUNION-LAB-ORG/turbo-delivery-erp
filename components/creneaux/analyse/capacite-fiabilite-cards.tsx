'use client';

import { Card, Chip, ProgressBar } from '@heroui-v3/react';
import { Calendar, Clock } from 'lucide-react';

interface CapaciteData {
  inscrits: number;
  pourcentage: number;
  tauxConfirmation: number;
  total: number;
}

interface FiabiliteData {
  absencesJustifiees: number;
  gpsConfirme: number;
  pourcentage: number;
  total: number;
}

interface CapaciteFiabiliteCardsProps {
  capacite: CapaciteData;
  fiabilite: FiabiliteData;
}

/**
 * Prévu contre réel : deux cartes côte à côte.
 *
 * <h3>Ce qui change</h3>
 * <p>Les pastilles « PRÉVISIONNEL » et « RÉEL » étaient peintes en `bg-amber-100` et
 * `bg-green-100` par un objet `classNames` qui court-circuitait le composant : de l'ambre
 * pour dire « prévu », du vert pour dire « constaté ». Ce ne sont pas des états, ce sont
 * deux natures de mesure, et les deux titres les nomment déjà.</p>
 *
 * <p>Tous les libellés avaient perdu leurs accents : « Capacite Prevue », « Fiabilite
 * Terrain », « Presence GPS confirmee », « Absences justifiees ».</p>
 */
function CarteMesure({
  chiffre,
  icone: Icone,
  lignes,
  nature,
  titre,
}: {
  chiffre: number;
  icone: typeof Calendar;
  lignes: { libelle: string; valeur: string }[];
  nature: string;
  titre: string;
}) {
  return (
    <Card>
      <Card.Content className="gap-3 p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-foreground">{titre}</h3>
          <Icone aria-hidden="true" className="size-5 text-muted" />
        </div>
        <Chip className="w-fit" size="sm" variant="soft">
          <Chip.Label>{nature}</Chip.Label>
        </Chip>
        <p className="text-4xl font-bold tabular-nums text-foreground">{chiffre}%</p>
        {/* `ProgressBar` remplit en ACCENT par defaut, le rouge de marque : les deux
            barres de mesure s'affichaient dans la couleur de l'alarme. */}
        <ProgressBar aria-label={titre} color="default" value={chiffre}>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <div className="flex flex-col gap-1 pt-1">
          {lignes.map((l) => (
            <div className="flex justify-between text-sm" key={l.libelle}>
              <span className="text-muted">{l.libelle}</span>
              <span className="font-semibold tabular-nums text-foreground">{l.valeur}</span>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

export function CapaciteFiabiliteCards({ capacite, fiabilite }: CapaciteFiabiliteCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CarteMesure
        chiffre={capacite.pourcentage}
        icone={Calendar}
        lignes={[
          { libelle: 'Turboys inscrits', valeur: `${capacite.inscrits} / ${capacite.total}` },
          { libelle: 'Taux de confirmation', valeur: `${capacite.tauxConfirmation}%` },
        ]}
        nature="Prévisionnel"
        titre="Capacité prévue"
      />
      <CarteMesure
        chiffre={fiabilite.pourcentage}
        icone={Clock}
        lignes={[
          { libelle: 'Présence GPS confirmée', valeur: `${fiabilite.gpsConfirme} / ${fiabilite.total}` },
          { libelle: 'Absences justifiées', valeur: String(fiabilite.absencesJustifiees) },
        ]}
        nature="Réel"
        titre="Fiabilité terrain"
      />
    </div>
  );
}
