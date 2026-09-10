export interface IMainKPIs {
  totalDeliveries: number;
  /**
   * Ce que le partenaire a vendu grace a nos livraisons : la somme du prix des commandes
   * terminees. C'est le chiffre d'affaires que la page annonce en tete.
   */
  totalOrderValue: number;
  /**
   * Part des courses terminees parmi les courses CONCLUES, terminees ou annulees.
   *
   * <p>`null` quand aucune course n'a ete conclue sur la periode : le taux n'existe pas
   * alors, et « 0 % » se lirait comme un echec total. L'ecran affiche un tiret.</p>
   */
  successRate: number | null;
  /**
   * Commission + frais de livraison des courses terminees, c'est-a-dire ce que TURBO
   * facture, et non ce que le partenaire encaisse.
   *
   * <p>Toujours servi par l'API, PLUS AFFICHE : le meme montant figure, sous son vrai nom,
   * dans le detail financier (« Facture totale a regler »). La carte qui le montrait en
   * tete de page s'appelait « Chiffre d'Affaires » et additionnait en plus les entrees de
   * caisse GLOBALES, donc l'argent des autres partenaires.</p>
   */
  chiffreAffaires: number;
}

export interface IGeographicLocation {
  name: string;
  deliveries: number;
  value: number;
  color: string;
}

export interface IWeeklyActivity {
  day: string; // French day name returned by API: "Lundi", "Mardi", etc.
  deliveries: number;
  revenue: number;
}

export interface IPerformanceParams {
  debut: Date;
  fin: Date;
  /** Mode UNITAIRE. Conserve tel quel : des liens circulent avec ce seul parametre. */
  restaurantId?: string;
  /** Mode MULTI : plusieurs partenaires coches a la main. */
  restaurantIds?: string[];
  /** Mode GROUPE : un groupe deja constitue dans l'ERP. */
  groupeId?: string;
}

/**
 * Les trois chiffres secondaires, TOUS nullables, et le type doit le dire.
 *
 * <p>Le serveur rend `null` quand la grandeur n'est pas mesurable, au lieu d'un zero qui
 * se lirait comme une mesure : `averageDeliveryTime` quand aucune course de la periode ne
 * porte d'horodatage, `monthlyGrowth` quand le mois precedent n'a aucune livraison, et
 * `averageItemsPerOrder` toujours, faute de source pour cette population.</p>
 *
 * <p>Les declarer `number` faisait mentir le type : les trois consommateurs testaient deja
 * l'absence, mais rien ne les y obligeait, et le prochain appel a `.toFixed()` sans garde
 * aurait fait une page blanche.</p>
 */
export interface ISecondaryKPIs {
  averageDeliveryTime: number | null;
  monthlyGrowth: number | null;
  averageItemsPerOrder: number | null;
}

export interface IFinancialDetails {
  totalOrderAmount: number;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  totalFacture: number;
}

/**
 * Interface principale regroupant l'ensemble des données du tableau de bord
 */
export interface IDashboardData {
  /**
   * Ce sur quoi le rapport a ete calcule. Toujours present, y compris en vue globale.
   *
   * <p>Optionnel dans le TYPE, et pas dans le contrat : une reponse mise en cache avant
   * l'arrivee de ce bloc, ou un banc qui ne le fabrique pas, ne doit pas faire tomber
   * l'ecran sur un `selection.mode` lu dans le vide.</p>
   */
  selection?: ISelectionAnalytics;
  mainKPIs: IMainKPIs;
  geographicData: IGeographicLocation[];
  weeklyActivity: IWeeklyActivity[];
  secondaryKPIs: ISecondaryKPIs;
  financialDetails: IFinancialDetails;
  /**
   * Le detail par etablissement.
   *
   * <p>⚠ NULL en `GLOBAL` et en `UNITAIRE` : il n'y a rien a detailler, et un tableau vide
   * se lirait « aucun store », ce qui serait faux. NON NUL, eventuellement VIDE, en `MULTI`
   * et en `GROUPE`. La distinction pilote l'affichage du bloc : `null` le retire,
   * `[]` l'affiche avec sa raison.</p>
   */
  parStore?: IStorePerformance[] | null;
}
/**
 * Ce sur quoi le rapport a REELLEMENT ete calcule, tel que le serveur l'arbitre.
 *
 * <p>Miroir de `SelectionAnalyticsVm`. L'endpoint accepte trois facons de designer une
 * selection et ne rend jamais 400 : il tranche par precedence `groupeId` > `restaurantIds`
 * > `restaurantId` et rend son arbitrage ici. C'est CE bloc qui nomme l'ecran, pas l'URL :
 * un en-tete qui annonce « Groupe AGHA » quand le serveur a agrege autre chose est un
 * mensonge silencieux, et c'est exactement ce que ce bloc empeche.</p>
 */
export interface ISelectionAnalytics {
  /** `GLOBAL` | `UNITAIRE` | `MULTI` | `GROUPE`. Jamais nul. */
  mode: 'GLOBAL' | 'UNITAIRE' | 'MULTI' | 'GROUPE';
  /** Renseigne en `UNITAIRE` seulement. */
  restaurantId: string | null;
  /**
   * Les etablissements effectivement agreges, apres deduplication. Jamais nul.
   * Vide en `GLOBAL` (aucun filtre) ET en `GROUPE` quand le groupe est inconnu ou vide.
   */
  restaurantIds: string[];
  groupeId: string | null;
  /**
   * ⚠ Les deux cas de groupe se distinguent ICI, et nulle part ailleurs :
   * `groupeNom` NUL avec `restaurantIds` vide = groupe INCONNU (dissous, ou mauvais lien).
   * `groupeNom` NON NUL avec `restaurantIds` vide = groupe REEL mais VIDE.
   * Deux causes differentes, donc deux messages differents a l'operateur.
   */
  groupeNom: string | null;
  /** Les parametres de selection recus puis ecartes par la precedence. Jamais nul. */
  parametresIgnores: string[];
}

/**
 * Une ligne du bloc « Detail par store », servie DANS LA MEME REPONSE que le consolide.
 *
 * <p>C'est ce qui rend l'addition a l'oeil possible : la somme des lignes vaut le total de
 * tete pour les livraisons, la valeur des commandes, les frais, la commission et la
 * facture. Verifie en production au franc pres. Deux appels a deux instants differents ne
 * garantiraient pas cela.</p>
 *
 * <p>⚠ `successRate` est la SEULE grandeur qui ne s'additionne pas : le taux de tete est
 * celui de l'ensemble, pas la moyenne des lignes. Aucun total ne se met sous cette
 * colonne.</p>
 */
export interface IStorePerformance {
  restaurantId: string;
  /** NULL quand l'identifiant ne correspond a aucun etablissement : l'identifiant sert alors de repli. */
  nom: string | null;
  totalDeliveries: number;
  totalOrderValue: number;
  /** NULL quand aucune course de ce store n'est conclue sur la periode. */
  successRate: number | null;
  deliveryFeesCollected: number;
  turboDeliveryServiceFees: number;
  totalFacture: number;
}
