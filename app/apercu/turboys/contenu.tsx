'use client';

import { Alert, Avatar, Button, Card, Chip, Meter, Table } from '@heroui-v3/react';
import React from 'react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import { ChampListeMultiple } from '@/components/commons/champs-formulaire';
import { PastilleNom, StatusChip } from '@/components/restaurants/table/restaurant-table-columns';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne — `bg-success` ne peint alors plus rien.</p>
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

function Section({ children, titre }: { children: React.ReactNode; titre: string }) {
  return (
    <Card>
      <Card.Header>
        <span className="text-sm font-semibold text-foreground">{titre}</span>
      </Card.Header>
      <Card.Content className="flex-row flex-wrap items-center gap-3">{children}</Card.Content>
    </Card>
  );
}

const TYPES = ['INDEPENDANT', 'JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INCONNU'];

const CLE_STATUT: Record<string, { libelle: string; ton: 'danger' | 'default' | 'success' }> = {
  ACTIVE: { libelle: 'Active', ton: 'success' },
  CONSOMMEE: { libelle: 'Consommée', ton: 'default' },
  EXPIREE: { libelle: 'Expirée', ton: 'default' },
  REVOQUEE: { libelle: 'Révoquée', ton: 'danger' },
};

const PARTENAIRES = [
  { label: 'Chez Tantie Adjo', value: 'p1' },
  { label: 'Le Grand Wharf', value: 'p2' },
  { label: 'Maquis du Rond-Point', value: 'p3' },
  { label: 'Yamoussa Grill', value: 'p4' },
  { label: 'Cocody Burger', value: 'p5' },
];

const COLONNES = ['Livreur', 'Type', 'Salaire', 'Commission', 'Statut'] as const;

const LIGNES = [
  { com: 60, nom: 'OTE Azo', sal: null, statut: 1, type: 'INDEPENDANT' },
  { com: null, nom: 'DIABATE Moussa', sal: 5000, statut: 1, type: 'JOURNALIER' },
  { com: 60, nom: 'KONE Salif', sal: null, statut: 0, type: 'SUPERVISEUR_LIVREUR' },
  { com: null, nom: 'YAO Kouassi', sal: null, statut: null, type: null },
];

export default function ApercuTurboys() {
  const [sombre, setSombre] = useThemeSombre();
  const [postes, setPostes] = React.useState<string[]>(['p1', 'p3']);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
        <span className="font-bold tracking-wider uppercase">Aperçu · Turboys</span>
        <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
          {sombre ? 'sombre' : 'clair'}
        </Button>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Le vocabulaire du module</h1>
          <p className="text-sm text-muted">
            Ce qui garde une couleur la garde parce qu&apos;elle dit un état.
          </p>
        </div>

        <Section titre="Type de contrat — une catégorie, donc neutre ; sauf la lacune">
          {TYPES.map((t) => {
            const d = getTurboyTypeDisplay(t === 'INCONNU' ? null : t);
            return (
              <Chip color={d.chipColor} key={t} size="sm" variant="soft">
                <Chip.Label>{d.label}</Chip.Label>
              </Chip>
            );
          })}
        </Section>

        <Section titre="Statut d'un partenaire — et sa commission, qui ne le remplace plus">
          <StatusChip status={1} />
          <StatusChip status={0} />
          <StatusChip status={2} />
          <StatusChip status={null} />
          <span className="w-full" />
          <StatusChip status={0} typeCommission="GRATUIT" />
          <StatusChip status={1} typeCommission="GRATUIT" />
        </Section>

        <Section titre="Pastille d'initiale — plus d'arc-en-ciel, plus de blanc sur jaune">
          {['Adjo', 'Yamoussa', 'Cocody', 'Bouaké', 'Zégo'].map((n) => (
            <div className="flex items-center gap-2" key={n}>
              <PastilleNom nom={n} />
              <span className="text-sm text-foreground">{n}</span>
            </div>
          ))}
        </Section>

        <Section titre="Statuts d'une clé d'activation">
          {Object.entries(CLE_STATUT).map(([cle, v]) => (
            <Chip color={v.ton} key={cle} size="sm" variant="soft">
              <Chip.Label>{v.libelle}</Chip.Label>
            </Chip>
          ))}
        </Section>

        <div>
          <h2 className="text-lg font-bold text-foreground">La clé fraîchement émise</h2>
          <p className="text-sm text-muted">
            Le code qu&apos;on ne reverra jamais, et qu&apos;il fallait recopier à la main.
          </p>
        </div>
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Clé d’activation — à communiquer une seule fois au livreur</Alert.Title>
            <ChampCopiable className="mt-2" valeur="TB-4821-9037" />
          </Alert.Content>
        </Alert>

        <div>
          <h2 className="text-lg font-bold text-foreground">Cote de fiabilité</h2>
        </div>
        <Card>
          <Card.Content className="gap-3">
            {[92, 64, 31].map((n) => (
              <div className="flex items-center gap-4" key={n}>
                <span className="w-20 text-2xl font-bold tabular-nums text-foreground">
                  {n}
                  <span className="ml-0.5 text-sm font-normal text-muted">/100</span>
                </span>
                <Meter
                  className="flex-1"
                  color={n >= 80 ? 'success' : n >= 50 ? 'warning' : 'danger'}
                  maxValue={100}
                  value={n}
                >
                  <Meter.Track>
                    <Meter.Fill />
                  </Meter.Track>
                </Meter>
                <Chip color={n >= 80 ? 'success' : n >= 50 ? 'warning' : 'danger'} variant="soft">
                  <Chip.Label>{n >= 80 ? 'Fiable' : n >= 50 ? 'Moyenne' : 'Faible'}</Chip.Label>
                </Chip>
              </div>
            ))}
          </Card.Content>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-foreground">Postes desservis</h2>
          <p className="text-sm text-muted">
            Le choix multiple qui se cherche, là où le `Select` faisait dérouler des
            centaines de partenaires.
          </p>
        </div>
        <Card>
          <Card.Content className="max-w-md">
            <ChampListeMultiple
              label="Postes / partenaires desservis"
              onChange={setPostes}
              options={PARTENAIRES}
              placeholder="Rechercher un partenaire"
              valeurs={postes}
            />
          </Card.Content>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-foreground">La liste</h2>
          <p className="text-sm text-muted">
            Les lignes ne sont plus peintes par type ; les chiffres s&apos;alignent à droite.
          </p>
        </div>
        <Card>
          <Card.Content className="p-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Livreurs" className="min-w-[42rem]">
                  <Table.Header>
                    {COLONNES.map((c) => (
                      <Table.Column id={c} isRowHeader={c === 'Livreur'} key={c}>
                        {c}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {LIGNES.map((l) => {
                      const d = getTurboyTypeDisplay(l.type);
                      return (
                        <Table.Row id={l.nom} key={l.nom}>
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9 shrink-0">
                                <Avatar.Fallback>{l.nom[0]}</Avatar.Fallback>
                              </Avatar>
                              <span className="text-sm font-medium text-foreground">{l.nom}</span>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip color={d.chipColor} size="sm" variant="soft">
                              <Chip.Label>{d.label}</Chip.Label>
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="block text-right text-sm tabular-nums">
                              {l.sal ? `${l.sal} F` : '-'}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="block text-right text-sm tabular-nums">
                              {l.com != null ? `${l.com} %` : '-'}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip
                              color={l.statut === 1 ? 'success' : l.statut === 0 ? 'danger' : 'warning'}
                              size="sm"
                              variant="soft"
                            >
                              <Chip.Label>
                                {l.statut === 1 ? 'Actif' : l.statut === 0 ? 'Inactif' : 'Inconnu'}
                              </Chip.Label>
                            </Chip>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
