import type { ModeSelection } from '@/features/rapports-performance/filters/performance.filters';
import type { ISelectionAnalytics } from '@/features/rapports-performance/types/performance.type';

/**
 * Ce que l'ecran DIT de sa selection : un libelle, un sujet de phrase, un nombre, et le
 * cas echeant la raison pour laquelle il n'y a rien a lire.
 */
export interface DescriptionSelection {
  /** « PLATO », « 4 partenaires », « Groupe AGHA », « Tous les partenaires ». */
  libelle: string;
  /**
   * Le meme fait, mais en SUJET DE PHRASE accorde : « Restaurant PLATO a realise »,
   * « les 4 partenaires selectionnes ont realise », « le groupe AGHA a realise ».
   *
   * <p>Il existe parce que le resume de bas de page insere ce libelle dans une phrase.
   * « Restaurant 4 partenaires a realise » etait la formulation obtenue en y posant le
   * libelle brut : elle ne veut rien dire, et l'accord du verbe etait faux une fois sur
   * deux.</p>
   */
  sujet: string;
  /** Vrai des que le rapport porte sur PLUSIEURS etablissements nommes. */
  consolide: boolean;
  /** Le nombre d'etablissements agreges, quand il est connu. */
  nombre: number | null;
  /**
   * Ce qui empeche de lire quelque chose, en une phrase adressee a l'operateur.
   * Nul dans le cas courant.
   */
  avertissement: string | null;
}

/** De quoi nommer un identifiant : les options du selecteur, deja chargees. */
export interface RepertoireNoms {
  nomRestaurant: (id: string) => string | undefined;
  nomGroupe: (id: string) => string | undefined;
}

/** L'etat de l'URL, seul disponible tant que la reponse n'est pas la. */
export interface SelectionDemandee {
  mode: ModeSelection;
  restaurantId: string;
  restaurantIds: string[];
  groupeId: string;
}

const TOUS = 'Tous les partenaires';
const SUJET_TOUS = "l'ensemble des partenaires a réalisé";

function pluriel(n: number): string {
  return `${n} partenaire${n > 1 ? 's' : ''}`;
}

function unitaire(nom: string): DescriptionSelection {
  return {
    libelle: nom,
    sujet: `Restaurant ${nom} a réalisé`,
    consolide: false,
    nombre: 1,
    avertissement: null,
  };
}

const GLOBAL: DescriptionSelection = {
  libelle: TOUS,
  sujet: SUJET_TOUS,
  consolide: false,
  nombre: null,
  avertissement: null,
};

/**
 * Ce que le SERVEUR a agrege, mis en mots.
 *
 * <p>La source est `selection`, et non l'URL : c'est le serveur qui arbitre entre les
 * parametres recus, et lui seul sait si le groupe demande existe. Un ecran qui se nommerait
 * depuis ses propres filtres annoncerait « Groupe AGHA » sur un groupe dissous, avec des
 * cartes a zero juste en dessous et rien pour expliquer l'ecart.</p>
 *
 * <p>⚠ Les deux echecs de groupe se distinguent par `groupeNom`, et par lui seul :
 * nul = le groupe n'existe pas, non nul = le groupe existe mais ne contient aucun
 * etablissement. Ce ne sont pas les memes gestes de reparation, donc pas le meme
 * message.</p>
 */
export function decrireSelectionServeur(
  selection: ISelectionAnalytics,
  noms: RepertoireNoms,
): DescriptionSelection {
  const nombre = selection.restaurantIds.length;

  if (selection.mode === 'GROUPE') {
    if (!selection.groupeNom) {
      return {
        libelle: 'Groupe introuvable',
        sujet: 'la sélection a réalisé',
        consolide: false,
        nombre: 0,
        avertissement:
          "Ce groupe n'existe plus ou n'a jamais existé. Le lien pointe peut-être vers un groupe dissous.",
      };
    }

    if (nombre === 0) {
      return {
        libelle: `Groupe ${selection.groupeNom}`,
        sujet: `le groupe ${selection.groupeNom} a réalisé`,
        consolide: false,
        nombre: 0,
        avertissement:
          'Ce groupe ne contient aucun établissement : il n’y a rien à cumuler sur la période.',
      };
    }

    return {
      libelle: `Groupe ${selection.groupeNom}`,
      sujet: `le groupe ${selection.groupeNom} a réalisé`,
      consolide: true,
      nombre,
      avertissement: null,
    };
  }

  if (selection.mode === 'MULTI') {
    // Un seul etablissement coche n'est pas un cumul : il se nomme, comme en unitaire.
    if (nombre === 1) {
      return unitaire(noms.nomRestaurant(selection.restaurantIds[0]) ?? selection.restaurantIds[0]);
    }

    return {
      libelle: pluriel(nombre),
      sujet: `les ${nombre} partenaires sélectionnés ont réalisé`,
      consolide: nombre > 1,
      nombre,
      avertissement: null,
    };
  }

  if (selection.mode === 'UNITAIRE' && selection.restaurantId) {
    return unitaire(noms.nomRestaurant(selection.restaurantId) ?? selection.restaurantId);
  }

  return GLOBAL;
}

/**
 * Le libelle affichable, en donnant la priorite a la reponse du serveur et en retombant
 * sur l'URL tant qu'elle n'est pas arrivee.
 *
 * <p>Le repli n'est pas un detail de confort : sans lui, l'en-tete annonce « Tous les
 * partenaires » pendant chaque lecture, y compris celles qui suivent un changement de
 * partenaire - l'ecran dirait donc le contraire de ce qu'on vient de lui demander.</p>
 */
export function decrireSelection(
  selection: ISelectionAnalytics | undefined,
  demandee: SelectionDemandee,
  noms: RepertoireNoms,
): DescriptionSelection {
  if (selection) {
    return decrireSelectionServeur(selection, noms);
  }

  if (demandee.mode === 'GROUPE') {
    if (!demandee.groupeId) return GLOBAL;
    const nom = noms.nomGroupe(demandee.groupeId);
    return {
      libelle: nom ? `Groupe ${nom}` : 'Groupe',
      sujet: nom ? `le groupe ${nom} a réalisé` : 'le groupe a réalisé',
      consolide: true,
      nombre: null,
      avertissement: null,
    };
  }

  if (demandee.mode === 'MULTI') {
    const nombre = demandee.restaurantIds.length;
    if (nombre === 0) return GLOBAL;
    if (nombre === 1) {
      return unitaire(noms.nomRestaurant(demandee.restaurantIds[0]) ?? demandee.restaurantIds[0]);
    }
    return {
      libelle: pluriel(nombre),
      sujet: `les ${nombre} partenaires sélectionnés ont réalisé`,
      consolide: true,
      nombre,
      avertissement: null,
    };
  }

  if (!demandee.restaurantId) return GLOBAL;

  return unitaire(noms.nomRestaurant(demandee.restaurantId) ?? 'sélectionné');
}

/**
 * Le meme libelle, rendu utilisable dans un NOM DE FICHIER.
 *
 * <p>Les accents et les apostrophes typographiques traversent mal les systemes de fichiers
 * de nos postes et les boites mail ou ces PDF finissent. Le libelle est ramene a l'ASCII et
 * les espaces a des traits d'union, sans jamais rendre une chaine vide - un fichier nomme
 * `rapport-performance--2026-09-10.pdf` ne dirait plus rien.</p>
 */
export function libellePourFichier(libelle: string): string {
  const sansAccent = libelle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sansAccent || 'selection';
}
