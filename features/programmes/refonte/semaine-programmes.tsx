'use client';

import { Button, Card, Checkbox, Chip, ComboBox, Dropdown, Input, Label, ListBox, SearchField, type Selection, Separator, Spinner, Table, ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui-v3/react';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import React from 'react';

import type { IAutosuffisanceJour, IJourProgramme, IProgramme, StatutProgramme } from '@/features/turboys/types/programme.types';
import { carburantAffiche, totauxCarburant } from '@/features/turboys/utils/carburant.utils';
import { estSeptSurSept, libelleJourInactif, OBSERVATION_SEPT_SUR_SEPT } from '@/features/turboys/utils/jour.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { libelleWhatsApp } from '@/features/turboys/utils/whatsapp-statut.utils';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * La semaine des programmes, refondue.
 *
 * <h3>Ce que l'écran demandait de faire, et ce qu'il coûtait</h3>
 * <p>Son but tient en une phrase : que chaque livreur ait, pour la semaine à venir, un
 * programme PUBLIÉ qu'il puisse accepter. Rien ne le disait. L'écran s'ouvrait sur un
 * titre, sept boutons de barre d'outils et deux filtres, puis une grille de douze
 * colonnes où chaque ligne portait quatre à cinq boutons de même poids visuel. Sur
 * quarante livreurs, cela faisait deux cents boutons, et « Publier » — le seul geste qui
 * fait avancer la semaine — se répétait quarante fois, une ligne après l'autre.</p>
 *
 * <h3>Les trois questions, et ce qu'elles changent</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : où en est la semaine. Combien de programmes
 *       attendent encore d'être publiés, et combien ont été REFUSÉS — un refus laisse un
 *       livreur sans semaine, c'est la seule urgence de cet écran et il n'était signalé
 *       que par une puce rouge au milieu d'une ligne.</li>
 *   <li><b>Ce qui appelle une action</b> : publier. Le geste devient un LOT — on coche,
 *       on publie une fois — et chaque ligne ne garde qu'un seul bouton, celui de son
 *       étape suivante ; le reste passe dans un menu. Cent soixante boutons disparaissent
 *       de l'écran sans qu'aucune capacité ne soit perdue, « Envoyer au livreur »
 *       comprise, qui était enterrée dans la fenêtre d'aperçu.</li>
 *   <li><b>La forme de la donnée</b> : une semaine de planning EST une grille, elle est
 *       conservée. Mais un jour de repos n'est pas une faute : il s'affichait en rouge,
 *       encadré, sur fond `bg-danger-50`, alors qu'une semaine normale en compte deux. Le
 *       repos devient un tiret, et la couleur revient à ce qu'elle doit dire.</li>
 * </ul>
 *
 * <h3>Ce qui apparaît, et qui n'existait pas</h3>
 * <p>La recherche par nom. Avec quarante lignes et deux filtres par catégorie, retrouver
 * un livreur se faisait à l'œil.</p>
 *
 * <h3>Le carburant</h3>
 * <p>Le document que les Opérations produisaient à la main portait, pour chaque livreur,
 * son carburant de la semaine, des sous-totaux par population, un grand total et l'écart
 * contre la semaine précédente. L'écran ne portait rien de cela. Il porte maintenant les
 * quatre, calculés depuis les programmes : le montant figé par le serveur quand le
 * programme est parti chez le livreur, le prévisionnel sinon. Le prévisionnel est en gris,
 * parce qu'il n'engage encore rien.</p>
 */

export interface SemaineProgrammesProps {
  programmes: IProgramme[];
  /** Créneaux déclarés par les indépendants via l'app — lecture seule. */
  independants: IProgramme[];
  autosuffisance: IAutosuffisanceJour[];
  annee: number;
  semaine: number;
  onSemaine: (delta: number) => void;

  typeFiltre: string;
  onTypeFiltre: (v: string) => void;
  typeOptions: { cle: string; libelle: string }[];
  partenaires: { id: string; nom: string }[];
  partenaireFiltre: string;
  onPartenaireFiltre: (v: string) => void;
  partenairesEnCours?: boolean;

  onApercu: (p: IProgramme) => void;
  /** Le carburant du programme, en un geste : un montant par jour travaillé. */
  onCarburant: (p: IProgramme) => void;
  /** Le même geste sur les lignes cochées. */
  onCarburantLot: (programmes: IProgramme[]) => void;
  onEditer: (p: IProgramme) => void;
  onPlanifier: (p: IProgramme) => void;
  onPublier: (p: IProgramme) => void;
  /** Envoyer (ou relancer) la notification au livreur. */
  onEnvoyer: (p: IProgramme) => void;
  /** Renvoyer par WhatsApp seulement, sans republier. */
  onRenvoyerWhatsApp: (p: IProgramme) => void;
  /** Qui a changé quoi sur ce programme, et quand. */
  onHistorique: (p: IProgramme) => void;
  onSupprimer: (p: IProgramme) => void;
  onNouveau: () => void;
  /** Publier d'un coup les programmes cochés. */
  onPublierLot: (ids: string[]) => void;

  /** Dupliquer la semaine précédente entière vers celle-ci, en brouillon. */
  onDupliquerSemainePrecedente: () => void;
  onImporterFichier: () => void;
  onTelechargerModele: () => void;
  onExporterExcel: () => void;
  onExporterPdf: () => void;
  importEnCours?: boolean;
  lotEnCours?: boolean;

  idEnCours?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onReessayer?: () => void;

  independantsIsLoading?: boolean;
  independantsIsError?: boolean;
  onReessayerIndependants?: () => void;
  autosuffisanceIsLoading?: boolean;
  autosuffisanceIsError?: boolean;

  /** Total carburant de la semaine précédente, pour l'écart. Null : pas de terme de comparaison. */
  carburantSemainePrecedente?: number | null;
  /** La ligne d'engagement dans le circuit finance, rendue par l'appelant : elle porte ses propres requêtes. */
  engagement?: React.ReactNode;
}

const JOURS = [
  { cle: 'LUNDI', court: 'Lun' },
  { cle: 'MARDI', court: 'Mar' },
  { cle: 'MERCREDI', court: 'Mer' },
  { cle: 'JEUDI', court: 'Jeu' },
  { cle: 'VENDREDI', court: 'Ven' },
  { cle: 'SAMEDI', court: 'Sam' },
  { cle: 'DIMANCHE', court: 'Dim' },
];

/*
 * Le vocabulaire de la maquette M2 ; le workflow backend reste
 * BROUILLON → PLANIFIE → NOTIFIE → ACCEPTE / REFUSE.
 *
 * `color` porte l'echelle semantique, `variant` l'intensite : c'est la convention posee
 * par `VisaDgaStatutBadge`. L'aplat est reserve aux deux etats qui tranchent — accepte,
 * refuse — et le fond doux aux etats de passage.
 */
const STATUT: Record<string, { libelle: string; couleur: 'default' | 'warning' | 'success' | 'danger'; plein: boolean }> = {
  BROUILLON: { couleur: 'default', libelle: 'Brouillon', plein: false },
  PLANIFIE: { couleur: 'default', libelle: 'Planifié', plein: false },
  NOTIFIE: { couleur: 'warning', libelle: 'Publié', plein: false },
  ACCEPTE: { couleur: 'success', libelle: 'Accepté', plein: true },
  REFUSE: { couleur: 'danger', libelle: 'Refusé', plein: true },
};

/*
 * Les colonnes de la grille, enumerees une seule fois.
 *
 * <p>React Aria EXIGE autant de cellules que de colonnes et leve sinon « Cell count must
 * match column count » — une exception qui fait tomber la page entiere en 500. Le
 * squelette de chargement comptait `JOURS.length + 4` la ou il en faut cinq de plus ; ni
 * `tsc` ni le build ne l'ont vu, seul l'ecran. Le compte se derive donc d'ici.</p>
 */
const COLONNES_GRILLE = ['coche', 'livreur', 'postes', ...JOURS.map((j) => j.cle), 'carburant', 'statut', 'actions'];

/** Les populations du document papier, dans son ordre. */
const TYPES_CARBURANT = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT'];

/** Un écart signé : le signe fait partie du nombre, pas de la couleur. */
const formatEcart = (n: number) => (n === 0 ? formatMontant(0) : `${n > 0 ? '+' : '−'}${formatMontant(Math.abs(n))}`);

/** Les colonnes de la table des independants, en lecture seule. */
const COLONNES_INDEPENDANTS = ['livreur', ...JOURS.map((j) => j.cle)];

/** Publiable : le programme n'est pas encore parti chez le livreur. */
const estAPublier = (p: IProgramme) => p.statut === 'BROUILLON' || p.statut === 'PLANIFIE';

/** Sans carburant : aucun jour travaillé ne porte de montant, figé ou prévisionnel. */
const estSansCarburant = (p: IProgramme) => carburantAffiche(p).montant === null;

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

/** Les partenaires desservis sur la semaine, toutes journées confondues. */
function postesSemaine(p: IProgramme): string[] {
  return Array.from(new Set((p.jours ?? []).flatMap((j) => (j.postes ?? []).map((po) => po.restaurantNom).filter((n): n is string => Boolean(n)))));
}

/**
 * Une journée.
 *
 * <p>Le repos s'affichait en capitales rouges dans un cadre `bg-danger-50`. Une semaine
 * normale compte deux jours de repos : l'écran signalait donc deux fautes par ligne, et
 * quatre-vingts sur une flotte de quarante. Un jour sans service est un tiret.</p>
 */
function CelluleJour({ jour }: { jour?: IJourProgramme }) {
  if (!jour?.actif) {
    /*
     * La cloture nocturne repasse aussi `actif` a false quand elle conclut a une
     * absence. Le tiret du repos mentait alors : l'absence s'ecrit.
     */
    const libelle = libelleJourInactif(jour);
    if (libelle !== 'Repos') {
      return <span className="block text-center text-[11px] leading-tight text-foreground">{libelle}</span>;
    }
    return (
      <span aria-label="Repos" className="block text-center text-muted" role="img">
        —
      </span>
    );
  }
  return (
    <span className="block text-center leading-tight">
      <span className="block text-xs font-medium tabular-nums text-foreground">{hhmm(jour.debut)}</span>
      <span className="block text-[11px] tabular-nums text-muted">{hhmm(jour.fin)}</span>
    </span>
  );
}

/**
 * Le carburant d'une ligne.
 *
 * <p>Figé par le serveur : en pleine couleur. Encore prévisionnel : en gris, avec la
 * mention, parce qu'il changera si les Ops retouchent le programme avant publication. Un
 * programme sans aucun montant rend un tiret, pas « 0 FCFA » — rien de saisi n'est pas
 * zéro franc.</p>
 */
function CelluleCarburant({ p }: { p: IProgramme }) {
  const { fige, montant } = carburantAffiche(p);
  if (montant === null) {
    return (
      <span aria-label="Aucun montant" className="block text-end text-muted" role="img">
        —
      </span>
    );
  }
  return (
    <span className={cn('block text-end tabular-nums', fige ? 'text-foreground' : 'text-muted')}>
      {formatMontant(montant)}
      {!fige && <span className="block text-[11px] leading-tight">prévisionnel</span>}
    </span>
  );
}

/** L'étape suivante du programme, celle qui fait avancer la semaine. */
function ProchainGeste({ enCours, onPlanifier, onPublier, p }: { enCours: boolean; onPlanifier: () => void; onPublier: () => void; p: IProgramme }) {
  if (p.statut === 'BROUILLON') {
    return (
      <Button isPending={enCours} onPress={onPlanifier} size="sm" variant="outline">
        Planifier
      </Button>
    );
  }
  if (p.statut === 'PLANIFIE') {
    return (
      <Button isPending={enCours} onPress={onPublier} size="sm" variant="primary">
        {enCours ? <Spinner size="sm" /> : null}
        Publier
      </Button>
    );
  }
  return null;
}

export function SemaineProgrammes({
  programmes,
  independants,
  autosuffisance,
  annee,
  semaine,
  onSemaine,
  typeFiltre,
  onTypeFiltre,
  typeOptions,
  partenaires,
  partenaireFiltre,
  onPartenaireFiltre,
  partenairesEnCours = false,
  onApercu,
  onCarburant,
  onCarburantLot,
  onEditer,
  onPlanifier,
  onPublier,
  onEnvoyer,
  onRenvoyerWhatsApp,
  onHistorique,
  onSupprimer,
  onNouveau,
  onPublierLot,
  onDupliquerSemainePrecedente,
  onImporterFichier,
  onTelechargerModele,
  onExporterExcel,
  onExporterPdf,
  importEnCours = false,
  lotEnCours = false,
  idEnCours = null,
  isLoading = false,
  isError = false,
  onReessayer,
  independantsIsLoading = false,
  independantsIsError = false,
  onReessayerIndependants,
  autosuffisanceIsLoading = false,
  autosuffisanceIsError = false,
  carburantSemainePrecedente = null,
  engagement = null,
}: SemaineProgrammesProps) {
  const [recherche, setRecherche] = React.useState('');
  const [seulement, setSeulement] = React.useState<'TOUS' | 'A_PUBLIER' | 'REFUSE' | 'SANS_CARBURANT'>('TOUS');
  const [coches, setCoches] = React.useState<Selection>(new Set());
  /** Le nom d'un site par son identifiant : la grille l'écrit sur chaque ligne. */
  const nomSite = React.useMemo(() => new Map(partenaires.map((x) => [x.id, x.nom])), [partenaires]);

  /*
   * La selection ne survit ni au changement de semaine ni a un echec de lecture :
   * la case « Tout cocher » restait cochee au-dessus d'un tableau vide, et des
   * identifiants de la semaine precedente restaient en memoire.
   */
  React.useEffect(() => {
    setCoches(new Set());
  }, [annee, semaine, isError, isLoading]);

  const lignes = React.useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return programmes.filter((p) => {
      if (q && !(p.livreurNom ?? '').toLowerCase().includes(q)) return false;
      if (seulement === 'A_PUBLIER' && !estAPublier(p)) return false;
      if (seulement === 'REFUSE' && p.statut !== 'REFUSE') return false;
      if (seulement === 'SANS_CARBURANT' && !estSansCarburant(p)) return false;
      return true;
    });
  }, [programmes, recherche, seulement]);

  const aPublier = React.useMemo(() => programmes.filter(estAPublier), [programmes]);
  const refuses = React.useMemo(() => programmes.filter((p) => p.statut === 'REFUSE'), [programmes]);
  const carburant = React.useMemo(() => totauxCarburant(programmes), [programmes]);
  const ecart = carburantSemainePrecedente === null || carburantSemainePrecedente === undefined ? null : carburant.total - carburantSemainePrecedente;

  /*
   * La selection porte maintenant DEUX gestes : publier, et poser le carburant. Toute
   * ligne se coche. Chaque bouton dit son propre compte — « Publier les 5 publiables
   * coches », « Carburant des 14 coches » — et la case ne ment plus, parce qu'elle ne
   * pretend plus vouloir dire « publiable ». Avant, seules les lignes publiables se
   * cochaient : une semaine deja publiee ne pouvait recevoir son carburant qu'une ligne
   * a la fois.
   */
  const programmesCoches = React.useMemo(
    () => (coches === 'all' ? lignes : lignes.filter((p) => coches.has(p.id))),
    [coches, lignes],
  );

  const idsCoches = React.useMemo(() => programmesCoches.filter(estAPublier).map((p) => p.id), [programmesCoches]);

  const maxAutosuffisance = Math.max(1, ...autosuffisance.map((j) => j.total));

  return (
    <div className="flex flex-col gap-4">
      {/*
       * OU EN EST LA SEMAINE. L'ecran s'ouvrait sur un titre et sept boutons ; il
       * s'ouvre sur les deux nombres qui disent s'il reste du travail, et sur le
       * geste qui le fait — en lot.
       */}
      <Card className={cn(refuses.length > 0 && 'border-danger/30')}>
        <Card.Content className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <span className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-foreground">{isError || isLoading ? '—' : aPublier.length}</span>
                <span className="text-sm text-muted">à publier</span>
              </span>
              <span className="flex items-baseline gap-2">
                <span className={cn('text-2xl font-bold tabular-nums', refuses.length > 0 ? 'text-danger-soft-foreground' : 'text-foreground')}>{isError || isLoading ? '—' : refuses.length}</span>
                <span className="text-sm text-muted">{refuses.length > 1 ? 'refusés' : 'refusé'}</span>
              </span>
              <span className="text-sm text-muted">sur {isError || isLoading ? '—' : programmes.length} programmes</span>
            </div>

            {/* La semaine EST le sujet de l'ecran : son selecteur passe en tete. */}
            <div className="flex flex-nowrap items-center gap-1">
              <Button aria-label="Semaine précédente" isIconOnly onPress={() => onSemaine(-1)} size="sm" variant="ghost">
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <span className="whitespace-nowrap px-1 text-sm font-medium text-foreground">
                Semaine {semaine} / {annee}
              </span>
              <Button aria-label="Semaine suivante" isIconOnly onPress={() => onSemaine(1)} size="sm" variant="ghost">
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>

          {/*
           * COMBIEN ON DECAISSE. Le second nombre que l'operateur cherche, apres « ou en
           * est la semaine » : le total carburant, ses sous-totaux par population, et
           * l'ecart contre la semaine precedente — les quatre lignes du document papier.
           */}
          {!isLoading && !isError && programmes.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{formatMontant(carburant.total)}</span>
                  <span className="text-sm text-muted">de carburant cette semaine</span>
                </span>
                {TYPES_CARBURANT.filter((t) => carburant.parType[t] !== undefined).map((t) => (
                  <span className="flex items-baseline gap-1.5 text-sm" key={t}>
                    <span className="text-muted">{getTurboyTypeDisplay(t).labelPlural}</span>
                    <span className="font-medium tabular-nums text-foreground">{formatMontant(carburant.parType[t])}</span>
                  </span>
                ))}
                {ecart !== null && (
                  <span className="flex items-baseline gap-1.5 text-sm">
                    <span className="text-muted">écart vs semaine précédente</span>
                    <span className="font-medium tabular-nums text-foreground">{formatEcart(ecart)}</span>
                  </span>
                )}
                {carburant.previsionnel > 0 && (
                  <span className="text-xs text-muted">
                    dont {formatMontant(carburant.previsionnel)} prévisionnels, figés à la publication
                  </span>
                )}
                {carburant.sansMontant > 0 && (
                  <span className="text-xs text-muted">
                    {carburant.sansMontant} programme{carburant.sansMontant > 1 ? 's' : ''} sans montant
                  </span>
                )}
              </div>
              {/* L'ENGAGEMENT : le seul geste de l'ecran qui engage de l'argent, sous les totaux qu'il engage. */}
              {engagement}
            </>
          )}

          {!isLoading && !isError && (aPublier.length > 0 || refuses.length > 0 || programmesCoches.length > 0) && (
            <>
              <Separator />
              <div className="flex flex-wrap items-center gap-2">
                {/*
                 * LES GESTES EN LOT. « Publier » se repetait une fois par
                 * ligne : quarante clics pour lancer une semaine. Le carburant,
                 * pareil : un montant pour toutes les lignes cochees.
                 */}
                {idsCoches.length > 0 && (
                  <Button isPending={lotEnCours} onPress={() => onPublierLot(idsCoches)} variant="primary">
                    {lotEnCours ? <Spinner size="sm" /> : null}
                    Publier les {idsCoches.length} programme{idsCoches.length > 1 ? 's' : ''} publiable{idsCoches.length > 1 ? 's' : ''} coché{idsCoches.length > 1 ? 's' : ''}
                  </Button>
                )}
                {programmesCoches.length > 0 && (
                  <Button onPress={() => onCarburantLot(programmesCoches)} variant={idsCoches.length > 0 ? 'outline' : 'primary'}>
                    Carburant des {programmesCoches.length} coché{programmesCoches.length > 1 ? 's' : ''}
                  </Button>
                )}
                {programmesCoches.length === 0 && aPublier.length > 0 && (
                  <span className="text-sm text-muted">Cochez des lignes pour publier, ou poser le carburant, en une fois.</span>
                )}

                {refuses.length > 0 && (
                  <Button onPress={() => setSeulement(seulement === 'REFUSE' ? 'TOUS' : 'REFUSE')} size="sm" variant={seulement === 'REFUSE' ? 'primary' : 'outline'}>
                    {seulement === 'REFUSE' ? 'Voir toute la semaine' : `Voir les ${refuses.length} refus`}
                  </Button>
                )}
              </div>
            </>
          )}
        </Card.Content>
      </Card>

      {/*
       * LA BARRE D'OUTILS. Sept controles de meme poids ; il en reste quatre, et
       * les deux exports tiennent dans un menu — ce sont deux formats du meme geste.
       */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* La recherche par nom n'existait pas : on cherchait a l'oeil. */}
          <SearchField className="w-full sm:w-64" onChange={setRecherche} value={recherche}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Rechercher un livreur…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {/*
           * Des ComboBox et non des Select : la liste des partenaires depasse la
           * centaine, et dans ce projet tout ce qui est une liste se cherche.
           */}
          <ComboBox className="w-full sm:w-48" onSelectionChange={(c) => onTypeFiltre(String(c ?? 'TOUS'))} selectedKey={typeFiltre}>
            <Label>Type</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Tous" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={typeOptions}>
                {(o: { cle: string; libelle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.libelle}>
                    {o.libelle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox className="w-full sm:w-56" onSelectionChange={(c) => onPartenaireFiltre(String(c ?? 'TOUS'))} selectedKey={partenaireFiltre}>
            <Label>Partenaire</Label>
            <ComboBox.InputGroup>
              <Input placeholder={partenairesEnCours ? 'Chargement…' : 'Tous'} />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={[{ id: 'TOUS', nom: 'Tous les partenaires' }, ...partenaires]}>
                {(o: { id: string; nom: string }) => (
                  <ListBox.Item id={o.id} textValue={o.nom}>
                    {o.nom}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <Button isPending={importEnCours} variant="outline">
              {importEnCours ? <Spinner size="sm" /> : null}
              Importer
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Options d’import"
                onAction={(k) => {
                  if (k === 'dupliquer') onDupliquerSemainePrecedente();
                  if (k === 'fichier') onImporterFichier();
                  if (k === 'modele') onTelechargerModele();
                }}
              >
                <Dropdown.Item id="dupliquer">Dupliquer la semaine précédente</Dropdown.Item>
                <Dropdown.Item id="fichier">Importer un fichier (.xlsx, .csv)</Dropdown.Item>
                <Dropdown.Item id="modele">Télécharger le modèle</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Dropdown>
            <Button isDisabled={lignes.length === 0} variant="outline">
              Exporter
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="Format d’export" onAction={(k) => (k === 'excel' ? onExporterExcel() : onExporterPdf())}>
                <Dropdown.Item id="excel">Excel</Dropdown.Item>
                <Dropdown.Item id="pdf">PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Button onPress={onNouveau} variant="primary">
            <Plus aria-hidden="true" className="size-4" />
            Nouveau programme
          </Button>
        </div>
      </div>

      {/* Le filtre d'etape : il rejoint la barre, sous les listes. */}
      <ToggleButtonGroup
        onSelectionChange={(s) => {
          const v = Array.from(s)[0];
          if (v) setSeulement(String(v) as 'TOUS' | 'A_PUBLIER' | 'REFUSE' | 'SANS_CARBURANT');
        }}
        selectedKeys={new Set([seulement])}
        selectionMode="single"
      >
        <ToggleButton id="TOUS">Tous</ToggleButton>
        <ToggleButton id="A_PUBLIER">À publier</ToggleButton>
        <ToggleButton id="REFUSE">Refusés</ToggleButton>
        <ToggleButton id="SANS_CARBURANT">Sans carburant</ToggleButton>
      </ToggleButtonGroup>

      {/* ── LA GRILLE ────────────────────────────────────────────────────────────── */}
      <Card>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer className="max-h-[34rem] overflow-y-auto">
              <Table.Content
                aria-label={`Programmes hebdomadaires de la semaine ${semaine} de ${annee}`}
                className="min-w-[64rem]"
                onSelectionChange={setCoches}
                selectedKeys={coches}
                selectionMode="multiple"
              >
                <Table.Header>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary pe-0" id="coche">
                    <Checkbox aria-label="Tout cocher" slot="selection">
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="livreur" isRowHeader>
                    Livreur
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="postes">
                    Site · Postes
                  </Table.Column>
                  {JOURS.map((j) => (
                    <Table.Column className="sticky top-0 z-20 bg-surface-secondary px-2 text-center" id={j.cle} key={j.cle}>
                      {j.court}
                    </Table.Column>
                  ))}
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary text-end" id="carburant">
                    Carburant
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="statut">
                    Statut
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="actions">
                    {''}
                  </Table.Column>
                </Table.Header>

                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        {isError ? (
                          <>
                            <p className="text-sm text-foreground">Les programmes n’ont pas pu être lus.</p>
                            {onReessayer && (
                              <Button onPress={onReessayer} size="sm" variant="outline">
                                Réessayer
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted">
                            {seulement === 'A_PUBLIER'
                              ? 'Tous les programmes de la semaine sont publiés.'
                              : seulement === 'REFUSE'
                                ? 'Aucun refus cette semaine.'
                                : seulement === 'SANS_CARBURANT'
                                  ? 'Tous les programmes ont leur carburant.'
                                  : 'Aucun programme pour cette semaine.'}
                          </p>
                        )}
                      </div>
                    )
                  }
                >
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES_GRILLE.map((c) => (
                            <Table.Cell key={`sq-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isError || isLoading ? [] : lignes).map((p) => {
                    const enCours = idEnCours === p.id;
                    const s = STATUT[p.statut ?? ''] ?? {
                      couleur: 'default' as const,
                      libelle: p.statut ?? '—',
                      plein: false,
                    };
                    return (
                      <Table.Row id={p.id} key={p.id}>
                        <Table.Cell className="pe-0">
                          <Checkbox aria-label={`Cocher ${p.livreurNom ?? 'ce programme'}`} slot="selection">
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="block max-w-[12rem] truncate font-medium">{p.livreurNom ?? '—'}</span>
                          {p.typeLivreur && <span className="block text-xs text-muted">{getTurboyTypeDisplay(p.typeLivreur).label}</span>}
                          {/*
                           * Sept jours travailles : le repos n'a pas ete pris, et il se regle.
                           * La direction veut le lire sans recoupement, ligne par ligne.
                           */}
                          {estSeptSurSept(p.jours) && (
                            <Tooltip>
                              <Chip className="mt-1" color="warning" size="sm" variant="soft">
                                <Chip.Label>7 j/7, repos à compenser</Chip.Label>
                              </Chip>
                              <Tooltip.Content>{OBSERVATION_SEPT_SUR_SEPT}</Tooltip.Content>
                            </Tooltip>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          {/* Le site de la semaine d'abord, les postes desservis dessous. */}
                          <span className="block max-w-[14rem] truncate text-xs font-medium text-foreground">
                            {p.siteId ? (nomSite.get(p.siteId) ?? 'Site inconnu') : 'Sans site'}
                            {p.siteId && p.siteDeLaSemaine ? <span className="font-normal text-muted"> · cette semaine</span> : null}
                          </span>
                          {postesSemaine(p).length > 0 ? (
                            <span className="block max-w-[14rem] truncate text-xs text-muted">{postesSemaine(p).join(' · ')}</span>
                          ) : null}
                        </Table.Cell>

                        {JOURS.map((j) => (
                          <Table.Cell className="px-2" key={j.cle}>
                            <CelluleJour jour={(p.jours ?? []).find((x) => (x.jour ?? '').toUpperCase() === j.cle)} />
                          </Table.Cell>
                        ))}

                        <Table.Cell className="text-xs">
                          <CelluleCarburant p={p} />
                        </Table.Cell>

                        <Table.Cell>
                          <div className="flex flex-col items-start gap-1">
                            <Chip color={s.couleur} size="sm" variant={s.plein ? 'primary' : 'soft'}>
                              <Chip.Label>{s.libelle}</Chip.Label>
                            </Chip>
                            {/*
                             * Le motif du refus etait cache dans un `title`
                             * sur le mot « Refusé » : la raison pour
                             * laquelle un livreur n'a pas de semaine ne se
                             * survole pas, elle se lit.
                             */}
                            {p.statut === 'REFUSE' && p.motifRefus && <span className="max-w-[14rem] text-xs text-muted">{p.motifRefus}</span>}
                            {/* Ce que l'envoi WhatsApp a donne : parti, ou pourquoi pas. */}
                            {(() => {
                              const w = libelleWhatsApp(p);
                              if (!w) return null;
                              return (
                                <span className={cn('max-w-[14rem] text-[11px] leading-tight', w.ton === 'attention' ? 'text-warning-soft-foreground' : 'text-muted')}>
                                  {w.texte}
                                </span>
                              );
                            })()}
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          {/*
                           * UN seul bouton : l'etape suivante. Les autres
                           * gestes passent dans le menu — « Envoyer au
                           * livreur » compris, qui n'etait joignable que
                           * par la fenetre d'apercu.
                           */}
                          <div className="flex items-center justify-end gap-1">
                            <ProchainGeste enCours={enCours} onPlanifier={() => onPlanifier(p)} onPublier={() => onPublier(p)} p={p} />
                            <Dropdown>
                              <Button aria-label={`Autres actions pour ${p.livreurNom ?? 'ce programme'}`} isIconOnly size="sm" variant="ghost">
                                <MoreHorizontal aria-hidden="true" className="size-4" />
                              </Button>
                              <Dropdown.Popover>
                                <Dropdown.Menu
                                  aria-label="Actions du programme"
                                  disabledKeys={[
                                    ...(estAPublier(p) || p.statut === 'REFUSE' ? [] : ['supprimer']),
                                    // Le WhatsApp seul ne se renvoie que sur un programme deja parti.
                                    ...(estAPublier(p) ? ['whatsapp'] : []),
                                  ]}
                                  onAction={(k) => {
                                    if (k === 'apercu') onApercu(p);
                                    if (k === 'carburant') onCarburant(p);
                                    if (k === 'editer') onEditer(p);
                                    if (k === 'envoyer') onEnvoyer(p);
                                    if (k === 'whatsapp') onRenvoyerWhatsApp(p);
                                    if (k === 'historique') onHistorique(p);
                                    if (k === 'supprimer') onSupprimer(p);
                                  }}
                                >
                                  <Dropdown.Item id="apercu">Aperçu</Dropdown.Item>
                                  <Dropdown.Item id="carburant">Carburant…</Dropdown.Item>
                                  <Dropdown.Item id="editer">Éditer</Dropdown.Item>
                                  <Dropdown.Item id="envoyer">Envoyer au livreur</Dropdown.Item>
                                  <Dropdown.Item id="whatsapp">Renvoyer par WhatsApp</Dropdown.Item>
                                  <Dropdown.Item id="historique">Historique…</Dropdown.Item>
                                  <Dropdown.Item id="supprimer">Supprimer</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          </div>
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

      {/*
       * L'AUTOSUFFISANCE (RG-32), en jetons du theme : les barres etaient peintes
       * en `bg-primary` et `bg-secondary`, deux jetons de l'ancienne bibliotheque
       * qui ne disent plus rien dans le nouveau theme.
       */}
      <Card>
        <Card.Content className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">Livreurs actifs par jour</span>
            <div className="flex items-center gap-3 text-xs text-muted">
              {/*
               * Deux intensites du MEME ton : c'est une seule quantite — les
               * livreurs actifs du jour — coupee en deux. `bg-surface-tertiary`
               * pour les planifies etait du gris sur le gris de la piste :
               * la moitie du graphique ne se voyait pas.
               */}
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent/40" /> Indépendants
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent" /> Planifiés
              </span>
            </div>
          </div>

          {autosuffisanceIsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : autosuffisanceIsError ? (
            <p className="py-4 text-center text-sm text-muted">L’autosuffisance n’a pas pu être lue.</p>
          ) : (
            <div className="flex items-end justify-between gap-2">
              {autosuffisance.map((j) => (
                <div className="flex flex-1 flex-col items-center gap-1" key={j.jour}>
                  <span className="text-xs font-medium tabular-nums text-foreground">{j.total}</span>
                  <span
                    className="flex h-24 w-full max-w-[44px] flex-col justify-end overflow-hidden rounded-md bg-surface-secondary"
                    title={`${j.independants} indépendant(s), ${j.planifies} planifié(s)`}
                  >
                    <span className="block w-full bg-accent" style={{ height: `${(j.planifies / maxAutosuffisance) * 100}%` }} />
                    <span className="block w-full bg-accent/40" style={{ height: `${(j.independants / maxAutosuffisance) * 100}%` }} />
                  </span>
                  <span className="text-xs text-muted">{JOURS.find((x) => x.cle === j.jour)?.court ?? j.jour}</span>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* ── LES INDEPENDANTS, en lecture seule ───────────────────────────────────── */}
      <Card>
        <Card.Content className="gap-3 p-0">
          <div className="px-4 pt-4">
            <span className="text-sm font-semibold text-foreground">Indépendants — créneaux déclarés depuis l’app</span>
            <p className="text-xs text-muted">Lecture seule : ces créneaux viennent du livreur, pas des Opérations.</p>
          </div>

          <Table>
            <Table.ScrollContainer className="max-h-[24rem] overflow-y-auto">
              <Table.Content aria-label="Créneaux déclarés par les indépendants" className="min-w-[52rem]">
                <Table.Header>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="livreur" isRowHeader>
                    Livreur
                  </Table.Column>
                  {JOURS.map((j) => (
                    <Table.Column className="sticky top-0 z-20 bg-surface-secondary px-2 text-center" id={j.cle} key={j.cle}>
                      {j.court}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    independantsIsLoading ? null : (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        {/*
                         * Un echec de lecture ne se dit pas « aucun
                         * independant » : c'est le message d'une semaine
                         * sans creneau, et l'equipe en conclurait qu'il
                         * n'y a personne.
                         */}
                        {independantsIsError ? (
                          <>
                            <p className="text-sm text-foreground">Les créneaux déclarés n’ont pas pu être lus.</p>
                            {onReessayerIndependants && (
                              <Button onPress={onReessayerIndependants} size="sm" variant="outline">
                                Réessayer
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted">Aucun indépendant déclaré cette semaine.</p>
                        )}
                      </div>
                    )
                  }
                >
                  {independantsIsLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <Table.Row id={`sqi-${i}`} key={`sqi-${i}`}>
                          {COLONNES_INDEPENDANTS.map((c) => (
                            <Table.Cell key={`sqi-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(independantsIsError || independantsIsLoading ? [] : independants).map((p) => (
                    <Table.Row id={p.id} key={p.id}>
                      <Table.Cell>
                        <span className="block max-w-[14rem] truncate">{p.livreurNom ?? '—'}</span>
                      </Table.Cell>
                      {JOURS.map((j) => (
                        <Table.Cell className="px-2" key={j.cle}>
                          <CelluleJour jour={(p.jours ?? []).find((x) => (x.jour ?? '').toUpperCase() === j.cle)} />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
    </div>
  );
}

export type { StatutProgramme };
