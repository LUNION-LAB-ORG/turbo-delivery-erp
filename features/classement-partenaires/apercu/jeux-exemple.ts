import type {
  IClassement,
  ILigneClassement,
  ITendanceRang,
  ITotauxClassement,
} from '@/features/classement-partenaires/types/classement.types';

/**
 * Les jeux d'exemple du banc du CLASSEMENT.
 *
 * <p>Ils reproduisent le contrat REEL de `/api/erp/analytics/classement`, mesure sur la
 * production le 10/09/2026 : soixante-neuf lignes sur avril 2026, dix-huit taux de succes
 * nuls, aucun instantane, `tendance.raison` a `AUCUN_INSTANTANE_PRECEDENT`. Un banc qui
 * inventerait un autre contrat ne verifierait rien, en particulier pas les deux etats que
 * cet ecran doit savoir dire : « pas de tendance » et « pas de commission ».</p>
 */

/** Reproductible : deux ouvertures du banc doivent montrer la meme chose. */
function alea(graine: number) {
  let e = graine;
  return () => {
    e = (e * 1103515245 + 12345) % 2147483648;
    return e / 2147483648;
  };
}

const NOMS = [
  'AGHA ZONE 4',
  "BRO'S BURGER",
  'LA VILLA DI SORRENTO',
  'KITCHEN HEALTHY',
  'TSUNAMI ZONE 4',
  'CHICKEN NATION ZONE 4',
  'CHEZ MOUSTAPHA',
  'HOT BAYTS',
  'CAFE FNEICH',
  'PLATO',
  'LE MAQUIS DU VALLON',
  'SUSHI TIME BIETRY',
];

function identifiant(i: number): string {
  return `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
}

/** Une ligne coherente : le total a regler est TOUJOURS la somme des deux montants. */
function ligne(
  i: number,
  options: {
    nbLivraisons: number;
    montantLivraison: number;
    commission: number;
    soumisCommission?: boolean;
    commissionInattendue?: boolean;
    tauxSucces?: number | null;
    tendance?: ITendanceRang | null;
    rang: number;
    valeurCommandes: number;
  },
): ILigneClassement {
  const soumis = options.soumisCommission ?? true;
  return {
    commission: options.commission,
    commissionInattendue: options.commissionInattendue ?? false,
    montantLivraison: options.montantLivraison,
    nbLivraisons: options.nbLivraisons,
    nom: NOMS[i % NOMS.length],
    rang: options.rang,
    restaurantId: identifiant(i),
    soumisCommission: soumis,
    tauxSucces: options.tauxSucces === undefined ? 100 : options.tauxSucces,
    tendance: options.tendance ?? null,
    totalARegler: options.montantLivraison + (soumis || options.commissionInattendue ? options.commission : 0),
    typeCommission: soumis ? (i % 3 === 0 ? 'POURCENTAGE' : 'MONTANT_FIXE') : 'AUCUNE',
    valeurCommandes: options.valeurCommandes,
  };
}

function totaux(lignes: ILigneClassement[]): ITotauxClassement {
  return {
    commission: lignes.reduce((n, l) => n + l.commission, 0),
    montantLivraison: lignes.reduce((n, l) => n + l.montantLivraison, 0),
    nbLivraisons: lignes.reduce((n, l) => n + l.nbLivraisons, 0),
    nbPartenairesClasses: lignes.length,
    totalARegler: lignes.reduce((n, l) => n + l.totalARegler, 0),
    valeurCommandes: lignes.reduce((n, l) => n + l.valeurCommandes, 0),
  };
}

function fabriquerLignes(graine: number, nb: number): ILigneClassement[] {
  const suivant = alea(graine);
  const brutes = Array.from({ length: nb }, (_, i) => {
    const nbLivraisons = Math.round(20 + suivant() * 800);
    return {
      commission: Math.round(nbLivraisons * (200 + suivant() * 400)),
      i,
      montantLivraison: Math.round(nbLivraisons * (1400 + suivant() * 400)),
      nbLivraisons,
      valeurCommandes: Math.round(nbLivraisons * (9000 + suivant() * 7000)),
    };
  });
  brutes.sort((a, b) => b.nbLivraisons - a.nbLivraisons);

  return brutes.map((b, index) => {
    /*
     * Un partenaire sur cinq n'est soumis a AUCUNE commission, et sa commission vaut alors
     * ZERO : c'est ce que rend le serveur, et la cellule doit rester vide sans que le
     * total du bas ne bouge. Un seul porte l'incoherence `commissionInattendue` : un
     * montant fige sur les courses alors que le regime dit qu'il n'y en a pas. Ce cas-la
     * s'affiche AVEC son montant et une alerte, exactement l'inverse du precedent, et il
     * n'existe nulle part ailleurs sur le banc.
     */
    const soumis = b.i % 5 !== 3;
    const incoherent = b.i === 8;

    return ligne(b.i, {
      commission: soumis || incoherent ? b.commission : 0,
      commissionInattendue: incoherent,
      montantLivraison: b.montantLivraison,
      nbLivraisons: b.nbLivraisons,
      rang: index + 1,
      soumisCommission: incoherent ? false : soumis,
      /* Un taux nul sur un partenaire sans course conclue : un tiret, jamais « 0 % ». */
      tauxSucces: b.i % 7 === 2 ? null : Math.round((88 + alea(b.i)() * 12) * 10) / 10,
      valeurCommandes: b.valeurCommandes,
    });
  });
}

function socle(lignes: ILigneClassement[]): Omit<IClassement, 'tendance' | 'instantaneAbsent'> {
  return {
    lignes,
    parametresIgnores: [],
    periode: {
      calculeLe: '2026-09-10T17:26:11.937Z',
      debut: '2026-04-01',
      fin: '2026-04-30',
      granularite: 'MENSUEL',
      mois: '2026-04',
      source: 'CALCUL',
    },
    selection: {
      groupeId: null,
      groupeNom: null,
      mode: 'GLOBAL',
      parametresIgnores: [],
      restaurantId: null,
      restaurantIds: [],
    },
    sens: 'DESC',
    tri: 'LIVRAISONS',
    totaux: totaux(lignes),
  };
}

/**
 * L'ETAT DU JOUR : aucun instantane n'existe, donc aucune tendance.
 *
 * <p>C'est ce que verra le commanditaire en ouvrant l'ecran, et c'est le jeu par defaut du
 * banc. Toutes les lignes ont `tendance: null` : la colonne de rang ne porte aucune fleche,
 * et le bandeau du haut doit dire pourquoi.</p>
 */
const LIGNES_SANS_INSTANTANE = fabriquerLignes(11, 12);

export const SANS_INSTANTANE: IClassement = {
  ...socle(LIGNES_SANS_INSTANTANE),
  instantaneAbsent: true,
  tendance: {
    disponible: false,
    mois: '2026-03',
    periodeDebut: '2026-03-01',
    periodeFin: '2026-03-31',
    raison: 'AUCUN_INSTANTANE_PRECEDENT',
    source: 'SNAPSHOT',
  },
};

/** Les quatre sens de tendance, dont `NOUVEAU`, qui n'est PAS une chute. */
const TENDANCES: ITendanceRang[] = [
  { ecart: 0, libelle: '=', rangPrecedent: 1, sens: 'STABLE' },
  { ecart: 2, libelle: '+2', rangPrecedent: 4, sens: 'HAUSSE' },
  { ecart: -1, libelle: '-1', rangPrecedent: 2, sens: 'BAISSE' },
  { ecart: null, libelle: null, rangPrecedent: null, sens: 'NOUVEAU' },
];

export const AVEC_TENDANCES: IClassement = {
  ...socle(
    LIGNES_SANS_INSTANTANE.map((l, i) => ({
      ...l,
      tendance: { ...TENDANCES[i % TENDANCES.length], rangPrecedent: Math.max(1, l.rang + (i % 3) - 1) },
    })),
  ),
  instantaneAbsent: false,
  periode: { ...socle(LIGNES_SANS_INSTANTANE).periode, source: 'SNAPSHOT' },
  tendance: {
    disponible: true,
    mois: '2026-03',
    periodeDebut: '2026-03-01',
    periodeFin: '2026-03-31',
    raison: null,
    source: 'SNAPSHOT',
  },
};

/**
 * LES EX AEQUO : 1, 2, 2, 4, 5, 5, 5, 8.
 *
 * <p>Le rang arrive du serveur et il SAUTE apres une egalite, comme sur un podium. Ce jeu
 * existe pour verifier qu'aucun rendu ne renumerote les lignes par leur position : une
 * renumerotation ferait disparaitre l'egalite, qui est une information.</p>
 */
const RANGS_EX_AEQUO = [1, 2, 2, 4, 5, 5, 5, 8, 9, 9, 11, 12];

export const EX_AEQUO: IClassement = {
  ...socle(
    LIGNES_SANS_INSTANTANE.map((l, i) => {
      const jumele = RANGS_EX_AEQUO[i] === RANGS_EX_AEQUO[i - 1];
      const reference = jumele ? LIGNES_SANS_INSTANTANE[i - 1] : l;
      return {
        ...l,
        /* A egalite de rang, l'indicateur de tri doit porter la MEME valeur : sinon
           l'egalite affichee contredirait les nombres de la ligne. */
        nbLivraisons: reference.nbLivraisons,
        rang: RANGS_EX_AEQUO[i],
      };
    }),
  ),
  instantaneAbsent: true,
  tendance: SANS_INSTANTANE.tendance,
};

export const JEUX_CLASSEMENT = {
  sansInstantane: { classement: SANS_INSTANTANE, libelle: "Sans instantané (l'état du jour)" },
  avecTendances: { classement: AVEC_TENDANCES, libelle: 'Avec tendances' },
  exAequo: { classement: EX_AEQUO, libelle: 'Ex aequo' },
  vide: {
    classement: { ...SANS_INSTANTANE, lignes: [], totaux: totaux([]) },
    libelle: 'Aucun partenaire',
  },
};

export type CleJeuClassement = keyof typeof JEUX_CLASSEMENT;
