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
  restaurantId?: string;
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
  mainKPIs: IMainKPIs;
  geographicData: IGeographicLocation[];
  weeklyActivity: IWeeklyActivity[];
  secondaryKPIs: ISecondaryKPIs;
  financialDetails: IFinancialDetails;
}