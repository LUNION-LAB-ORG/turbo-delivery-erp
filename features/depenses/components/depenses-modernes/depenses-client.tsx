'use client';

import { Button, Card, Chip, Label, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calculator, Download, FolderTree, Receipt, ReceiptText } from 'lucide-react';
import { useMemo, useState } from 'react';

import CarteStat from '@/components/commons/CarteStat';
import { ChampListe } from '@/components/commons/champs-formulaire';
import EtatErreur from '@/components/commons/EtatErreur';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useDepenseExport } from '@/features/depenses/hooks/use-depense-export';
import { useDepenseStats } from '@/features/depenses/hooks/use-depense-stats';
import { useDepenseTable } from '@/features/depenses/hooks/use-depense-table';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatMontant } from '@/utils/format.utils';

/** Valeur du filtre « toutes les categories ». Une cle vide n'est pas selectionnable. */
const TOUTES_CATEGORIES = 'TOUTES';

const PERIODES = [
  { label: 'Toutes les dates', value: 'tous' },
  { label: "Aujourd'hui", value: 'jour' },
  { label: 'Cette semaine', value: 'semaine' },
  { label: 'Ce mois', value: 'mois' },
  { label: 'Cette année', value: 'annee' },
] as const;

/**
 * La plage de dates d'une periode, ou rien du tout pour « toutes les dates ».
 *
 * <p>La semaine commencait DIMANCHE : `today.getDate() - today.getDay()`, la convention
 * anglo-saxonne. Un lundi matin, « cette semaine » excluait donc le lundi meme et
 * remontait au dimanche precedent. Elle suit la locale francaise.</p>
 */
function plageDeLaPeriode(periode: string): undefined | { debut: Date; fin: Date } {
  const maintenant = new Date();

  switch (periode) {
    case 'jour':
      return { debut: startOfDay(maintenant), fin: endOfDay(maintenant) };
    case 'semaine':
      return { debut: startOfWeek(maintenant, { locale: fr }), fin: endOfWeek(maintenant, { locale: fr }) };
    case 'mois':
      return { debut: startOfMonth(maintenant), fin: endOfMonth(maintenant) };
    case 'annee':
      return { debut: startOfYear(maintenant), fin: endOfYear(maintenant) };
    default:
      return undefined;
  }
}

/**
 * Une date de ligne, ou un tiret quand elle est illisible.
 *
 * <p>`new Date(undefined)` rend « Invalid Date » a l'ecran ; un tiret dit la meme chose
 * sans faire croire a une valeur.</p>
 */
function formatDateLigne(valeur: string | undefined) {
  if (!valeur) return '-';
  try {
    return format(parseISO(valeur), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

/** Le libelle d'une depense. Les deux champs coexistent selon l'anciennete de la ligne. */
function libelleDepense(depense: IDepense) {
  return depense.libelle || depense.description || 'Sans libellé';
}

interface LigneCategorie {
  depenses: IDepense[];
  nom: string;
  nombre: number;
  total: number;
}

/** Les premieres depenses d'une categorie, pour savoir ce qu'elle contient. */
function apercuDesDepenses(depenses: IDepense[]) {
  const premieres = depenses.slice(0, 3).map(libelleDepense).join(', ');
  const reste = depenses.length - 3;
  return reste > 0 ? `${premieres} +${reste} autres` : premieres;
}

/**
 * L'historique des depenses.
 *
 * <h3>Ce qui change</h3>
 * <p>Les depenses etaient des CARTES empilees, une par ligne, montant a droite en chasse
 * proportionnelle et a une hauteur differente selon la longueur du libelle. Deux montants
 * ne se comparaient pas d'un regard, et vingt depenses demandaient cinq ecrans de
 * defilement. Ce sont des chiffres d'argent : ils vivent en colonne, alignes a droite, en
 * chasse tabulaire.</p>
 *
 * <p>Le bandeau portait trois cartes en degrade ROUGE, ORANGE et VIOLET. Aucune des trois
 * ne signalait quoi que ce soit : le rouge de cet ERP dit « ceci appelle un geste », et un
 * total de depenses n'appelle rien. Elles sont neutres.</p>
 *
 * <p>« Exporter » ne portait AUCUN gestionnaire : le bouton s'affichait, s'enfoncait, et
 * ne produisait pas de fichier. Il est branche sur l'export Excel du module, avec la
 * periode et la categorie choisies a l'ecran.</p>
 *
 * <p>La page annoncait « l'historique complet » alors qu'elle lit une PAGE de vingt lignes
 * du mois en cours, sans pagination : les depenses au-dela de la vingtieme etaient
 * invisibles et rien ne le disait. La pagination est la, le nombre total de depenses du
 * mois est ecrit sous la liste, et les cartes de tete disent ce qu'elles totalisent.</p>
 *
 * <p>Enfin, les statistiques du mois etaient LUES puis jetees : `useDepenseStats` etait
 * appele a chaque visite et son resultat n'apparaissait nulle part. Le total du mois
 * entier sert desormais de reference sous le total affiche.</p>
 */
export default function DepensesModernesClient() {
  const [onglet, setOnglet] = useState('depenses');
  const [recherche, setRecherche] = useState('');
  const [periode, setPeriode] = useState<string>('tous');
  const [categorieId, setCategorieId] = useState<string>(TOUTES_CATEGORIES);

  const {
    depenses,
    isError: isErrorDepenses,
    isFetching: isFetchingDepenses,
    isLoading: isLoadingDepenses,
    pagination,
    refetch: refetchDepenses,
  } = useDepenseTable();
  const {
    data: statsMois,
    isError: isErrorStats,
    isLoading: isLoadingStats,
  } = useDepenseStats();
  const {
    categories,
    isError: isErrorCategories,
    isFetching: isFetchingCategories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useCategorieDepense();
  const { exportDepensesToExcel, isLoadingDepenseExport } = useDepenseExport();

  // Les deux listes alimentent les compteurs ET les onglets : sur echec, tout
  // retombe a 0 et sur « Aucune depense trouvee », qui se lit comme un mois sans
  // depense. On dit l'echec au lieu de le laisser passer pour un resultat.
  const isErreurDonnees = isErrorDepenses || isErrorCategories;
  const isReessaiEnCours = isFetchingDepenses || isFetchingCategories;
  const reessayerDonnees = () => {
    if (isErrorDepenses) refetchDepenses();
    if (isErrorCategories) refetchCategories();
  };

  const plage = useMemo(() => plageDeLaPeriode(periode), [periode]);

  const depensesFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return (depenses ?? []).filter((depense: IDepense) => {
      const correspondRecherche =
        !terme ||
        depense.id?.toLowerCase().includes(terme) ||
        depense.libelle?.toLowerCase().includes(terme) ||
        depense.description?.toLowerCase().includes(terme) ||
        depense.categorie?.nomCategorie?.toLowerCase().includes(terme);

      let correspondDate = true;
      if (plage && depense.dateDepense) {
        const date = new Date(depense.dateDepense);
        correspondDate = date >= plage.debut && date <= plage.fin;
      }

      // Le filtre portait sur le NOM de la categorie : deux categories homonymes
      // etaient confondues, et l'export ne savait pas quel identifiant envoyer.
      const correspondCategorie =
        categorieId === TOUTES_CATEGORIES || depense.categorie?.id === categorieId;

      return correspondRecherche && correspondDate && correspondCategorie;
    });
  }, [categorieId, depenses, plage, recherche]);

  const totalAffiche = useMemo(
    () => depensesFiltrees.reduce((somme, depense) => somme + (depense.montant || 0), 0),
    [depensesFiltrees],
  );
  const moyenneAffichee =
    depensesFiltrees.length > 0 ? Math.round(totalAffiche / depensesFiltrees.length) : 0;

  const categoriesTriees = useMemo(() => {
    const parNom = new Map<string, LigneCategorie>();

    depensesFiltrees.forEach((depense) => {
      const nom = depense.categorie?.nomCategorie || 'Non catégorisé';
      const ligne = parNom.get(nom) ?? { depenses: [], nom, nombre: 0, total: 0 };
      ligne.depenses.push(depense);
      ligne.nombre += 1;
      ligne.total += depense.montant || 0;
      parNom.set(nom, ligne);
    });

    return Array.from(parNom.values()).sort((a, b) => b.total - a.total);
  }, [depensesFiltrees]);

  const optionsCategories = useMemo(
    () => [
      { label: 'Toutes les catégories', value: TOUTES_CATEGORIES },
      ...(categories ?? []).map((categorie) => ({
        label: categorie.nomCategorie,
        value: categorie.id,
      })),
    ],
    [categories],
  );

  const exporter = () =>
    exportDepensesToExcel({
      categoriesDepense: categorieId === TOUTES_CATEGORIES ? undefined : [categorieId],
      debut: plage?.debut,
      fin: plage?.fin,
    });

  const colonnesDepenses: readonly ColonneResponsive<IDepense>[] = [
    {
      cle: 'depense',
      identite: true,
      libelle: 'Dépense',
      rendu: (depense) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{libelleDepense(depense)}</p>
          <p className="text-xs tabular-nums text-muted">REF-{depense.id}</p>
        </div>
      ),
    },
    {
      cle: 'categorie',
      libelle: 'Catégorie',
      rendu: (depense) => (
        <Chip size="sm" variant="soft">
          <Chip.Label>{depense.categorie?.nomCategorie || 'Non catégorisé'}</Chip.Label>
        </Chip>
      ),
    },
    {
      cle: 'date',
      libelle: 'Date',
      rendu: (depense) => formatDateLigne(depense.dateDepense),
    },
    {
      cle: 'montant',
      libelle: 'Montant',
      nombre: true,
      rendu: (depense) => formatMontant(depense.montant ?? 0),
    },
  ];

  const colonnesCategories: readonly ColonneResponsive<LigneCategorie>[] = [
    {
      cle: 'categorie',
      identite: true,
      libelle: 'Catégorie',
      rendu: (ligne) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{ligne.nom}</p>
          <p className="truncate text-xs text-muted">{apercuDesDepenses(ligne.depenses)}</p>
        </div>
      ),
    },
    {
      cle: 'nombre',
      libelle: 'Dépenses',
      nombre: true,
      rendu: (ligne) => ligne.nombre,
    },
    {
      cle: 'moyenne',
      libelle: 'Moyenne',
      nombre: true,
      rendu: (ligne) => formatMontant(Math.round(ligne.total / ligne.nombre)),
    },
    {
      cle: 'total',
      libelle: 'Total',
      nombre: true,
      rendu: (ligne) => formatMontant(ligne.total),
    },
  ];

  const pluriel = depensesFiltrees.length > 1 ? 's' : '';

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Historique des dépenses</h1>
        {/* Exporter n'est ni une reussite ni un danger : c'est une action ordinaire. */}
        <Button isPending={isLoadingDepenseExport} onPress={exporter} variant="outline">
          <Download aria-hidden="true" className="size-4" />
          Exporter
        </Button>
      </div>

      {isErreurDonnees && (
        <EtatErreur
          compact
          enCours={isReessaiEnCours}
          onReessayer={reessayerDonnees}
          quoi="les dépenses"
        />
      )}

      {/* `md` et non `lg` : la fenetre des postes fait 1000 px, le seuil `lg` ne s'y
          ouvre jamais et le bandeau resterait sur deux colonnes. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <CarteStat
          accent
          icone={Receipt}
          isError={isErrorDepenses}
          isLoading={isLoadingDepenses}
          libelle="Total des dépenses affichées"
          note={
            isLoadingStats || isErrorStats || !statsMois
              ? undefined
              : `Mois entier : ${formatMontant(statsMois.montant_total)}`
          }
          valeur={formatMontant(totalAffiche)}
        />
        <CarteStat
          icone={FolderTree}
          isError={isErrorCategories}
          isLoading={isLoadingCategories}
          libelle="Catégories"
          note="Types de dépenses"
          valeur={(categories ?? []).length}
        />
        <CarteStat
          icone={Calculator}
          isError={isErrorDepenses}
          isLoading={isLoadingDepenses}
          libelle="Moyenne par dépense"
          note={`Sur ${depensesFiltrees.length} dépense${pluriel} affichée${pluriel}`}
          valeur={formatMontant(moyenneAffichee)}
        />
      </div>

      <ToggleButtonGroup
        className="flex-wrap"
        onSelectionChange={(selection) =>
          setOnglet(String(Array.from(selection)[0] ?? 'depenses'))
        }
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        <ToggleButton id="depenses">
          <ReceiptText aria-hidden="true" className="size-4" />
          Toutes les dépenses
          <span className="tabular-nums opacity-70">{depensesFiltrees.length}</span>
        </ToggleButton>
        <ToggleButton id="categories">
          <FolderTree aria-hidden="true" className="size-4" />
          Par catégorie
          <span className="tabular-nums opacity-70">{categoriesTriees.length}</span>
        </ToggleButton>
      </ToggleButtonGroup>

      <Card>
        <Card.Header className="flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between">
          <SearchField
            className="md:max-w-xs md:flex-1"
            onChange={setRecherche}
            value={recherche}
          >
            <Label>Rechercher</Label>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Libellé, référence ou catégorie" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-48">
              <ChampListe
                label="Période"
                onChange={(valeur) => setPeriode(valeur || 'tous')}
                options={PERIODES}
                placeholder="Toutes les dates"
                valeur={periode}
              />
            </div>
            <div className="sm:w-56">
              <ChampListe
                // Une liste vide se lit « il n'y a pas de categorie » ; quand c'est la
                // lecture du referentiel qui a echoue, le champ le dit.
                erreur={isErrorCategories ? 'Liste des catégories indisponible' : undefined}
                label="Catégorie"
                messageListeVide="Aucune catégorie ne correspond"
                onChange={(valeur) => setCategorieId(valeur || TOUTES_CATEGORIES)}
                options={optionsCategories}
                placeholder="Toutes les catégories"
                valeur={categorieId}
              />
            </div>
          </div>
        </Card.Header>

        <Card.Content className="p-0">
          <div hidden={onglet !== 'depenses'}>
            <div className="px-4 pt-4 md:p-0">
              <TableauResponsive
                cleLigne={(depense) => depense.id}
                colonnes={colonnesDepenses}
                enChargement={isLoadingDepenses}
                enCoursDeRelance={isFetchingDepenses}
                erreur={isErrorDepenses}
                libelle="Dépenses"
                lignes={depensesFiltrees}
                onReessayer={() => refetchDepenses()}
                quoi="les dépenses"
                vide="Aucune dépense trouvée"
              />
            </div>

            {!isErrorDepenses && (
              <div className="flex flex-col gap-2 border-t border-separator px-4 py-3 md:flex-row md:items-center md:justify-between">
                {/* La liste n'a jamais montre que la page chargee. Le dire est le
                    minimum : sans cela, une depense absente passe pour inexistante. */}
                <p className="text-xs text-muted">
                  {depensesFiltrees.length} dépense{pluriel} affichée{pluriel} sur{' '}
                  <span className="tabular-nums">{pagination.totalItems}</span> du mois en cours.
                  La recherche et les filtres portent sur la page chargée.
                </p>
                <PaginationTableau
                  onPage={pagination.handlePageChange}
                  page={pagination.page + 1}
                  total={pagination.pageCount}
                />
              </div>
            )}
          </div>

          <div hidden={onglet !== 'categories'}>
            <div className="px-4 pt-4 md:p-0">
              <TableauResponsive
                cleLigne={(ligne) => ligne.nom}
                colonnes={colonnesCategories}
                enChargement={isLoadingDepenses}
                enCoursDeRelance={isFetchingDepenses}
                erreur={isErrorDepenses}
                libelle="Dépenses par catégorie"
                lignes={categoriesTriees}
                onReessayer={() => refetchDepenses()}
                quoi="les dépenses par catégorie"
                vide="Aucune catégorie trouvée"
              />
            </div>

            {!isErrorDepenses && (
              <div className="border-t border-separator px-4 py-3">
                <p className="text-xs text-muted">
                  Regroupement des {depensesFiltrees.length} dépense{pluriel} affichée{pluriel},
                  soit <span className="tabular-nums">{formatMontant(totalAffiche)}</span>.
                </p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
