'use client';

import { Button, Card, Checkbox, Table } from '@heroui-v3/react';
import React from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { renderAgentActions } from '@/components/finance/agent-recouvreur/agent-recouvreur-columns';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import { FiltreStatut } from '@/components/finance/common/filtre-statut';
import { FenetreOrientation } from '@/components/finance/orientation-fonds/fenetre-orientation';
import {
  FILE_TOUTES,
  FILES_ORIENTATION,
  type LigneOrientation,
  sommeMontants,
} from '@/components/finance/orientation-fonds/ligne-orientation';
import {
  BarreLotOrientation,
  type OngletOrientation,
  OngletsOrientation,
  TableauOrientation,
} from '@/components/finance/orientation-fonds/table-orientation';
import { createResponsableFinancierColumns } from '@/components/finance/responsable-financier/responsable-financier-columns';
import type { IFactureRF } from '@/components/finance/responsable-financier/responsable-financier-columns';
import { FactureMobileCard, MobileCardList } from '@/components/finance/shared/facture-mobile-card';
import type { IAgentFacture } from '@/features/agent-recouvreur';

/**
 * Le banc de la chaîne de recouvrement.
 *
 * <p>Il monte les VRAIS composants (la pastille de statut commune, la colonne d'actions
 * du responsable financier, celle de l'agent recouvreur, la carte tactile) sur les
 * SEIZE statuts du parcours. C'est là que se voit ce qu'a changé la refonte : trois tons
 * au lieu de seize teintes, un seul bouton plein par ligne, et le même mot de la même
 * couleur d'un écran à l'autre.</p>
 */

const STATUTS = [
  'DRAFT',
  'À valider',
  'Validé',
  'Recouvrement',
  'En cours',
  'Déposé partenaire',
  'Preuve ajoutée',
  'Acompte 1',
  'Acompte 2',
  'Soldé',
  'Versé au caissier',
  'En attente visa DGA',
  'Visé DGA',
  'Orienté banque',
  'Conservé en caisse',
  'Rejeté DGA',
  'Clôturé',
] as const;

function factureRF(statut: string, i: number): IFactureRF {
  return {
    agent: 'K. Adama',
    cycle: 'HEBDOMADAIRE',
    depotBanque: i % 4 === 0 ? '12/08/2026' : null,
    depotPartenaire: i % 3 === 0 ? { agent: 'M. Diarra', date: '08/08/2026' } : null,
    emission: '01/08/2026',
    id: `f-${i}`,
    montant: 250000 + i * 37000,
    montantRecouvre: i % 2 === 0 ? 120000 + i * 5000 : null,
    numero: `FA-2026-0${String(i + 10)}`,
    partenaire: ['PIZZA ROMA', 'CHICKEN NATION', 'LE BISTROT'][i % 3],
    periodeDebut: '2026-08-01',
    periodeFin: '2026-08-07',
    pourcentageRecouvre: i % 2 === 0 ? 40 + i : null,
    statut: statut as IFactureRF['statut'],
  };
}

/** Le pendant agent : couverture partielle une ligne sur deux, pour voir les deux boutons. */
function factureAgent(statut: string, i: number): IAgentFacture {
  const montant = 250000 + i * 37000;
  return {
    agent: 'K. Adama',
    cycle: 'HEBDOMADAIRE',
    emission: '01/08/2026',
    id: `a-${i}`,
    montant,
    montantRecouvre: i % 3 === 0 ? montant : i % 3 === 1 ? Math.round(montant * 0.4) : null,
    numero: `FA-2026-0${String(i + 10)}`,
    partenaire: ['PIZZA ROMA', 'CHICKEN NATION', 'LE BISTROT'][i % 3],
    pourcentageRecouvre: 40,
    statut,
  } as IAgentFacture;
}

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne, et `bg-success` ne peint alors plus rien.</p>
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

/**
 * Rend la cellule d'une colonne TanStack hors de son tableau.
 *
 * <p>Le banc monte la colonne ACTIONS telle que la page la construit, sans passer par
 * `useReactTable` : seul `row.original` est lu par cette cellule.</p>
 */
type CelluleColonne = NonNullable<ColumnDef<IFactureRF>['cell']>;
function rendreCellule(cellule: CelluleColonne | undefined, facture: IFactureRF) {
  if (typeof cellule !== 'function') return null;
  return cellule({ row: { original: facture } } as Parameters<typeof cellule>[0]);
}

const COLONNES_RF = ['Statut', 'Actions du responsable financier'] as const;
const COLONNES_AGENT = ['Statut', "Actions de l'agent recouvreur"] as const;

const FILTRES_RF = [
  { label: 'Tous', value: 'Tous' },
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'À valider', value: 'À valider' },
  { label: 'Validé', value: 'Validé' },
  { label: 'Recouvrement', value: 'Recouvrement' },
  { label: 'En cours', value: 'En cours' },
  { label: 'Déposé partenaire', value: 'Déposé partenaire' },
  { label: 'Preuve ajoutée', value: 'Preuve ajoutée' },
  { label: 'Soldé', value: 'Soldé' },
  { label: 'Versé au caissier', value: 'Versé au caissier' },
  { label: 'En attente visa DGA', value: 'En attente visa DGA' },
  { label: 'Orientation des fonds', value: 'Visé DGA' },
  { label: 'Rejeté DGA', value: 'Rejeté DGA' },
  { label: 'Clôturé', value: 'Clôturé' },
] as const;

/*
 * La file d'orientation des fonds. Deux lignes deja visees, deux qui le seront par la
 * decision : c'est la seule difference entre les deux statuts que la page agrege, et il
 * faut la voir dans la colonne « Visa DGA ».
 */
const LIGNES_ORIENTATION: LigneOrientation[] = [
  {
    dateVisa: '2026-08-12',
    id: 'o-1',
    montant: 1250000,
    numero: 'FA-2026-0014',
    numeroVisa: 'VISA-2026-0087',
    partenaire: 'PIZZA ROMA',
    viseur: 'A. Koné',
  },
  { id: 'o-2', montant: 486000, numero: 'FA-2026-0015', partenaire: 'CHICKEN NATION' },
  { id: 'o-3', montant: 92500, numero: 'FA-2026-0016', partenaire: 'LE BISTROT' },
  {
    dateVisa: '2026-08-10',
    id: 'o-4',
    montant: 3040000,
    numero: 'FA-2026-0017',
    numeroVisa: 'VISA-2026-0081',
    partenaire: 'PIZZA ROMA',
    viseur: 'M. Diarra',
  },
];

/*
 * Les fonds conserves en caisse : l'autre liste de l'ecran, avec l'autre geste
 * (« Re-orienter vers la banque »). Elle n'etait sur aucun banc, alors qu'elle porte le
 * meme bouton d'accent que la file de decision.
 */
const LIGNES_CAISSE: LigneOrientation[] = [
  {
    dateVisa: '2026-08-05',
    id: 'c-1',
    montant: 92500,
    numero: 'FA-2026-0009',
    numeroVisa: 'VISA-2026-0074',
    partenaire: 'LE BISTROT',
    viseur: 'A. Koné',
  },
];

const FILTRES_AGENT = [
  { label: 'Tous', value: 'Tous' },
  { label: 'Recouvrement', value: 'Recouvrement' },
  { label: 'Déposé partenaire', value: 'Déposé partenaire' },
  { label: 'Soldé', value: 'Soldé' },
  { label: 'Versé au caissier', value: 'Versé au caissier' },
] as const;

export default function ApercuRecouvrement() {
  const [sombre, setSombre] = useThemeSombre();
  const [statutFiltre, setStatutFiltre] = React.useState('');
  const [statutAgent, setStatutAgent] = React.useState('');
  const [cochees, setCochees] = React.useState<Set<string>>(new Set());
  const [cibleOrientation, setCibleOrientation] = React.useState<LigneOrientation[] | null>(null);
  const [ongletBanc, setOngletBanc] = React.useState<string>(FILE_TOUTES);
  const [pageOrientation, setPageOrientation] = React.useState(1);
  const rien = () => undefined;

  const basculer = (id: string) =>
    setCochees((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  const lignesCochees = LIGNES_ORIENTATION.filter((l) => cochees.has(l.id));

  // L'onglet trie sur le visa : « En attente visa DGA » = les lignes sans numero de visa,
  // « Vise DGA » = celles qui en portent un. C'est la meme partition que celle que le
  // serveur rend a l'ecran, sur deux statuts.
  const lignesFile = LIGNES_ORIENTATION.filter(
    (l) =>
      ongletBanc === FILE_TOUTES ||
      (ongletBanc === 'Visé DGA' ? Boolean(l.numeroVisa) : !l.numeroVisa),
  );

  // Deux lignes par page : le pied de tableau et sa pagination ne se rendent qu'au-dela
  // d'une page, et c'est justement la piece que le banc ne montrait pas.
  const pagesOrientation = Math.max(1, Math.ceil(lignesFile.length / 2));
  const pageCourante = Math.min(pageOrientation, pagesOrientation);
  const lignesPage = lignesFile.slice((pageCourante - 1) * 2, pageCourante * 2);

  const idsPage = lignesPage.map((l) => l.id);
  const pageCochee = idsPage.length > 0 && idsPage.every((id) => cochees.has(id));
  const pagePartielle = idsPage.some((id) => cochees.has(id)) && !pageCochee;
  const basculerPage = () =>
    setCochees((prev) => {
      const suivant = new Set(prev);
      if (pageCochee) idsPage.forEach((id) => suivant.delete(id));
      else idsPage.forEach((id) => suivant.add(id));
      return suivant;
    });

  /* Le panneau d'une file : la case « Selectionner la page » puis le tableau. Les trois
     onglets de file rendent le meme, sur la partition lue plus haut. */
  const panneauFileBanc = (
    <div className="flex flex-col gap-3">
      <Checkbox isIndeterminate={pagePartielle} isSelected={pageCochee} onChange={basculerPage}>
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <span className="text-sm text-muted">Sélectionner la page</span>
        </Checkbox.Content>
      </Checkbox>

      <TableauOrientation
        estSelectionnee={(id) => cochees.has(id)}
        libelle="Opérations en attente d'orientation"
        libelleAction="Orienter"
        lignes={lignesPage}
        onAction={(l) => setCibleOrientation([l])}
        onBasculer={basculer}
        onPage={(p) => {
          // Comme sur la page : la selection ne survit ni a l'onglet ni au changement de
          // page, sans quoi le geste en lot porterait sur des lignes qui ne sont plus la.
          setPageOrientation(p);
          setCochees(new Set());
        }}
        page={pageCourante}
        totalPages={pagesOrientation}
        vide="Aucune opération en attente d'orientation."
      />
    </div>
  );

  const ongletsBanc: OngletOrientation[] = [
    ...FILES_ORIENTATION.map((f) => {
      const dedans = LIGNES_ORIENTATION.filter(
        (l) =>
          f.value === FILE_TOUTES ||
          (f.value === 'Visé DGA' ? Boolean(l.numeroVisa) : !l.numeroVisa),
      );
      return {
        cle: f.value,
        libelle: f.label,
        montant: sommeMontants(dedans),
        nombre: dedans.length,
        panneau: panneauFileBanc,
      };
    }),
    {
      cle: 'Conservé en caisse',
      libelle: 'Conservés en caisse',
      montant: sommeMontants(LIGNES_CAISSE),
      nombre: LIGNES_CAISSE.length,
      panneau: (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Fonds de roulement gardés en caisse, ré-orientables un par un.
          </p>
          <TableauOrientation
            libelle="Fonds conservés en caisse"
            libelleAction="Ré-orienter vers la banque"
            lignes={LIGNES_CAISSE}
            onAction={rien}
            vide="Aucun fonds conservé en caisse."
          />
        </div>
      ),
    },
  ];

  // La colonne ACTIONS du responsable financier, telle que la page la monte.
  const colonnesRF = createResponsableFinancierColumns(rien, rien, rien, rien);
  const celluleActionsRF = colonnesRF.find((c) => c.id === 'actions')?.cell;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
        <span className="font-bold tracking-wider uppercase">Aperçu · Recouvrement</span>
        <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
          {sombre ? 'sombre' : 'clair'}
        </Button>
      </header>

      <main className="mx-auto flex max-w-[1500px] flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Les seize statuts</h1>
          <p className="text-sm text-muted">La pastille commune, puis les actions de chaque poste sur le même statut.</p>
        </div>

        <Card>
          <Card.Content className="flex-row flex-wrap gap-2">
            {STATUTS.map((s) => (
              <ChipStatutFacture key={s} statut={s} />
            ))}
          </Card.Content>
        </Card>

        {/* Les deux filtres : quatorze options (Responsable financier) et cinq (Agent
            recouvreur), qui doivent tenir sans deborder du 1400 px au 375 px. */}
        <Card>
          <Card.Content className="flex-row flex-wrap items-end gap-4">
            <FiltreStatut onChange={setStatutFiltre} options={FILTRES_RF} valeur={statutFiltre} />
            <FiltreStatut onChange={setStatutAgent} options={FILTRES_AGENT} valeur={statutAgent} />
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Actions du responsable financier">
                  <Table.Header>
                    {COLONNES_RF.map((c) => (
                      <Table.Column id={c} isRowHeader={c === 'Statut'} key={c}>
                        {c}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {STATUTS.map((s, i) => (
                      <Table.Row id={s} key={s}>
                        <Table.Cell>
                          <ChipStatutFacture statut={s} />
                        </Table.Cell>
                        <Table.Cell>{rendreCellule(celluleActionsRF, factureRF(s, i))}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Actions de l'agent recouvreur">
                  <Table.Header>
                    {COLONNES_AGENT.map((c) => (
                      <Table.Column id={c} isRowHeader={c === 'Statut'} key={c}>
                        {c}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body>
                    {STATUTS.map((s, i) => (
                      <Table.Row id={s} key={s}>
                        <Table.Cell>
                          <ChipStatutFacture statut={s} />
                        </Table.Cell>
                        <Table.Cell>{renderAgentActions(factureAgent(s, i), rien, rien, rien)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-foreground">Orientation des fonds</h2>
          <p className="text-sm text-muted">
            Une file, pas une grille de cartes, et des onglets plutôt qu&apos;une pile : chaque
            onglet annonce son compte et son montant, le bouton de ligne reprend l&apos;accent
            parce qu&apos;« Orienter » est le geste de l&apos;écran, et le geste en lot dit
            combien il engage. Cochez une ligne pour le voir apparaître. La file est paginée
            deux par deux ici, pour que le pied de tableau soit visible sur quatre lignes
            d&apos;exemple.
          </p>
        </div>

        {/*
         * Les onglets de l'ecran, montes sur les memes lignes d'exemple. Le champ File
         * (un menu deroulant) et le bandeau de trois cartes ont fusionne ici : le compte
         * et le montant de chaque ensemble sont sur l'onglet.
         *
         * `RestaurantSelect` est absent A DESSEIN : il LIT la liste des restaurants
         * derriere l'authentification, et un 401 sur ce banc public deconnecte la session.
         */}
        <OngletsOrientation
          onSelection={(cle) => {
            setOngletBanc(cle);
            setPageOrientation(1);
            setCochees(new Set());
          }}
          onglets={ongletsBanc}
          selection={ongletBanc}
        />

        <BarreLotOrientation
          montant={sommeMontants(lignesCochees)}
          nombre={lignesCochees.length}
          onEffacer={() => setCochees(new Set())}
          onOrienter={() => setCibleOrientation(lignesCochees)}
        />

        <FenetreOrientation
          ligneUnique={cibleOrientation?.length === 1 ? cibleOrientation[0] : undefined}
          montant={sommeMontants(cibleOrientation ?? [])}
          nombre={cibleOrientation?.length ?? 0}
          onConfirmer={() => setCibleOrientation(null)}
          onFermer={() => setCibleOrientation(null)}
          ouvert={!!cibleOrientation}
        />

        <div>
          <h2 className="text-lg font-bold text-foreground">Cartes tactiles</h2>
          <p className="text-sm text-muted">Ce que voit un comptable sur son téléphone, sous 768 px.</p>
        </div>
        <div className="max-w-sm">
          {/* `MobileCardList` se masque au-dessus de `md` : le banc force l'affichage. */}
          <div className="[&>div]:block">
            <MobileCardList>
              {['À valider', 'Soldé', 'Rejeté DGA', 'Clôturé'].map((s, i) => {
                const f = factureRF(s, i);
                return (
                  <FactureMobileCard
                    actions={
                      <Button className="w-full" variant="primary">
                        Valider la facture
                      </Button>
                    }
                    fields={[
                      { label: 'Cycle', value: f.cycle },
                      { label: 'Agent', value: f.agent },
                      { label: 'Émission', value: f.emission },
                    ]}
                    key={s}
                    montant={`${f.montant.toLocaleString('fr-FR')} F CFA`}
                    numero={f.numero}
                    partenaire={f.partenaire}
                    statut={<ChipStatutFacture statut={s} />}
                  />
                );
              })}
            </MobileCardList>
          </div>
        </div>
      </main>
    </div>
  );
}
