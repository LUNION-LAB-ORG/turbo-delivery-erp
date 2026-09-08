/**
 * PAS de `'use client'` ici, et c'est essentiel.
 *
 * <p>Ce module n'exporte que des DONNEES et des fonctions PURES. La directive y a
 * pourtant vecu, et elle a provoque la panne du 27/08/2026 : `utils/route-permission.ts`
 * importe `menuData` et `correspond`, et la garde d'acces de `app/(protected)/layout.tsx`
 * (un composant SERVEUR) fait `for (const item of menuData)`. Sur un module marque
 * client, le serveur ne recoit pas le tableau mais une REFERENCE client ; iterer dessus
 * lit `Symbol.iterator` et leve :</p>
 * <pre>
 *   Cannot read Symbol exports. Only named exports are supported
 *   on a client module imported on the server.
 * </pre>
 * <p>Toutes les pages authentifiees hors `/analystics` et `/settings/profile` rendaient
 * donc un 500 opaque. Invisible partout en amont : `tsc` ne modelise pas la frontiere
 * et voit les vrais types, et `next build` compile sans le moindre avertissement.</p>
 *
 * <p>Les ICONES importees ci-dessous sont, elles, des composants clients. C'est sans
 * consequence : on se contente de STOCKER la reference dans `icon`, jamais de l'appeler
 * ni de la lire cote serveur. Seule la barre laterale, qui est cliente, les rend.</p>
 *
 * <p>⚠ Ne rien ajouter ici qui s'execute a l'import (hook, acces a `window`, etat) :
 * ce module est desormais dans le graphe SERVEUR.</p>
 */
import { IconBuildingSkyscraper, IconLayoutDashboard, IconMap, IconMotorbike, IconSettings2, IconShieldLock, IconUser, IconUsers } from '@tabler/icons-react';
import { AlertTriangle, BarChart, Bell, CheckCircle, FileText, History, Layers, List, Lock, Receipt, ShoppingCartIcon, SquareUser, Ticket, TrendingUp, Wallet } from 'lucide-react';
import { AiOutlineDollarCircle } from 'react-icons/ai';
import { TbTruckDelivery } from 'react-icons/tb';
import type { AppAbility, AppActions, AppSubjects } from '@/lib/casl/ability';

export interface IMenuData {
  isHeader?: boolean;
  title: string;
  icon?: React.ElementType;
  path?: string;
  children?: IMenuData[];
  can?: { action: AppActions; subject: AppSubjects };
}

/**
 * ORGANISATION DE LA BARRE : par TRAVAIL, pas par module.
 *
 * <p>Elle comptait quinze entrees de premier niveau, ordonnees par rien : les quatre
 * ecrans d'administration (Personnel, Supervision, Utilisateurs, Privileges) etaient
 * poses ENTRE Turboys et Finance et coupaient le bloc d'exploitation en deux. Sur la
 * fenetre reelle d'un poste (environ 563 px de haut), quinze lignes ne tiennent pas :
 * le comptable descendait sous huit entrees qu'il n'ouvre jamais pour atteindre
 * Finance, en douzieme position.</p>
 *
 * <p>Onze entrees desormais, groupees par ce que fait la personne devant l'ecran. Rien
 * n'a ete retire : les 52 chemins declares sont tous encore la, avec le meme `can`.
 * C'est une contrainte MECANIQUE et pas seulement une regle : `utils/route-permission.ts`
 * derive l'autorisation d'une route de ce tableau, et son defaut est FERME. Retirer une
 * entree d'ici ne la cache pas, elle ferme la route a tous les roles.</p>
 *
 * <p>Deux niveaux au maximum, et c'est impose par les rendus : `sidebar.tsx` rend les
 * enfants d'un groupe en `<Link>` sans recursion, et `privileges-matrix.tsx` aplatit sur
 * un seul cran. Un groupe dans un groupe perdrait ses petits-enfants dans la matrice des
 * privileges SANS que rien ne le signale.</p>
 *
 * <p>Les groupes ne portent plus de `can`. Un groupe n'a pas de chemin, il n'autorise
 * donc aucune route ; son seul effet etait sur l'affichage, ou il pouvait montrer un
 * groupe VIDE a un role autorise sur le groupe mais sur aucun de ses ecrans.
 * `filterMenuByAbility` garde deja un groupe des qu'un enfant passe.</p>
 */
const menuData: IMenuData[] = [
  { icon: IconLayoutDashboard, title: 'dashboard', path: '/analystics', can: { action: 'access', subject: 'Analytics' } },

  /**
   * Le poste temps reel. Trois entrees de premier niveau n'en font plus qu'une.
   *
   * <p>« Est-ce qu'il est necessaire d'avoir 3 menus pour courses » : verifie dans le
   * code, et la reponse n'est pas celle qu'on attendait. Les trois routes ne montent
   * PAS le meme composant avec un parametre.</p>
   * <ul>
   *   <li>`/external_delivery` lit `/en-attente/pagination` et rend des `CourseCard` ;
   *       il porte une ALARME SONORE en boucle et se rafraichit toutes les 15 s ;</li>
   *   <li>`/external_delivery/all` lit `/autre-statut/pagination` et rend les MEMES
   *       `CourseCard` : c'est la meme liste, coupee par statut, sur deux points
   *       d'entree DISJOINTS. Aucun endpoint ne rend les deux moities ;</li>
   *   <li>`/new-deliveries` lit `/journaliere` et rend un `PaginatedResponse<Restaurant>` :
   *       ce n'est pas une liste de courses, c'est un COMPTE par partenaire.</li>
   * </ul>
   * <p>Donc : deux moities d'une liste et un agregat d'une autre forme. Les fondre en un
   * ecran a filtre demanderait de recoudre deux paginations, ou un endpoint qui n'existe
   * pas : c'est un lot ECRAN + BACKEND, pas un lot menu. Les trois gardent leur URL.</p>
   *
   * <p>Ce que le menu peut faire, et fait ici : les mettre au meme endroit et les rendre
   * distinguables. Trafic et courses etaient separes alors qu'ils sont UN SEUL geste,
   * une course arrive et on lui affecte un livreur pris dans la file : le dispatcheur
   * devait deplier deux groupes pour un aller-retour qu'il fait toute la journee.</p>
   *
   * <p>Ordre : ce qui appelle un geste d'abord (les courses qui attendent, puis qui est
   * disponible pour les prendre), la surveillance ensuite, la recherche en dernier.</p>
   */
  {
    icon: TbTruckDelivery,
    title: 'Trafic & courses',
    children: [
      { icon: TbTruckDelivery, title: 'Nouvelles courses', path: '/external_delivery', can: { action: 'read', subject: 'Commande' } },
      { icon: SquareUser, title: "File d'attente", path: '/file-attente', can: { action: 'read', subject: 'Trafic' } },
      { icon: IconMap, title: 'Localisation des Turboys (Maps)', path: '/trafic', can: { action: 'read', subject: 'Trafic' } },
      { icon: AlertTriangle, title: 'Centre de contrôle STANDARD', path: '/trafic/standard', can: { action: 'read', subject: 'Incident' } },
      // « Courses Journalieres » annoncait une troisieme liste de courses. L'ecran rend
      // des RESTAURANTS avec leurs compteurs du jour, pas des courses : le libelle le
      // rangeait dans la mauvaise famille, et c'est ce qui faisait croire a trois listes.
      { icon: IconBuildingSkyscraper, title: 'Point du jour', path: '/new-deliveries', can: { action: 'read', subject: 'Commande' } },
      // « Toutes les courses » etait FAUX : la route sert `/autre-statut/pagination`, qui
      // exclut EN_ATTENTE. Les nouvelles courses n'y sont jamais. Ce qu'on y trouve, ce
      // sont les courses qui ont quitte la file : assignees, en livraison, terminees,
      // annulees.
      { icon: List, title: 'Courses traitées', path: '/external_delivery/all', can: { action: 'read', subject: 'Commande' } },
      // Autre canal que l'integration partenaire, meme poste : le sujet CASL est
      // CommandeClient et non Commande.
      { icon: ShoppingCartIcon, title: 'Commandes / Client', path: '/commandes', can: { action: 'read', subject: 'CommandeClient' } },
    ],
  },

  /**
   * La chaine du ticket, de la saisie au paiement, dans l'ordre ou elle se parcourt.
   *
   * <p>« Validation des tickets » et « Tickets » se recouvraient parce qu'ils sont le
   * MEME sujet coupe en deux : la premiere station, la saisie du bon de livraison,
   * etait rangee sous les courses externes, ou elle n'a rien a faire (l'ecran monte
   * `TicketPageClient`, avec l'etabli de saisie et l'archive, et depend des creneaux et
   * des livreurs, pas des courses partenaires).</p>
   *
   * <p>Chaque entree est le poste d'un role, et CASL ne montre a chacun que le sien :
   * pour l'agent V1 ce groupe se reduit a une ligne. C'est le regroupement qui rend ce
   * filtrage lisible, au lieu de huit entrees eparpillees sur deux endroits.</p>
   */
  {
    icon: Ticket,
    title: 'Tickets & paie',
    children: [
      { icon: Ticket, title: 'Saisie des tickets', path: '/tickets', can: { action: 'read', subject: 'Ticket' } },
      { icon: Lock, title: 'Régularisation', path: '/validation-tickets/regularisation', can: { action: 'read', subject: 'ValidationTicket' } },
      { icon: Lock, title: 'Vérification V1', path: '/validation-tickets/verification-v1', can: { action: 'read', subject: 'VerificationV1' } },
      { icon: Lock, title: 'Verrouillage V2', path: '/validation-tickets/verrouillage-v2', can: { action: 'read', subject: 'VerrouillageV2' } },
      { icon: Receipt, title: 'Grille de paiement', path: '/validation-tickets/grille-de-paiement', can: { action: 'read', subject: 'GrillePaiement' } },
      { icon: CheckCircle, title: 'Visa DGA', path: '/validation-tickets/visa-dga', can: { action: 'valider-dga', subject: 'Depense' } },
      { icon: CheckCircle, title: 'Approbation finale', path: '/validation-tickets/approbation-finale', can: { action: 'approuver-dg', subject: 'PageApprobationFinale' } },
      { icon: History, title: 'Historique des créneaux', path: '/validation-tickets/historique-creneaux', can: { action: 'read', subject: 'HistoriqueCreneaux' } },
    ],
  },

  /**
   * Le parc coursiers. Les pointages a arbitrer passent en tete : c'est la seule entree
   * du groupe qui attend un geste chaque jour, et un pointage valide fait entrer en file
   * d'attente. Le reste planifie ou se lit.
   *
   * <p>⚠ L'entree `/delivery-men` reste COMMENTEE. Sa regle d'acces vit desormais dans
   * `REGLES_HORS_MENU` de `utils/route-permission.ts`, qui couvre les seize ecrans du
   * segment : la decommenter ferait apparaitre une entree que personne n'a demandee.</p>
   */
  {
    icon: IconMotorbike,
    title: 'Turboys',
    children: [
      // Arbitrage des pointages hors-zone (regle owner 2026-07-31) : un pointage
      // valide compte, et fait entrer en file d'attente si c'est la montee.
      { icon: IconMotorbike, title: 'Pointages à valider', path: '/delivery-men/pointages-a-valider', can: { action: 'read', subject: 'Livreur' } },
      { icon: IconBuildingSkyscraper, title: 'Créneaux', path: '/delivery-men/creneaux', can: { action: 'read', subject: 'Creneau' } },
      { icon: IconBuildingSkyscraper, title: 'Programmes hebdo', path: '/delivery-men/programmes', can: { action: 'read', subject: 'Creneau' } },
      // « Men » ne dit rien en francais. L'ecran declare lui-meme `title: 'Coursiers'`
      // dans ses metadonnees ; le menu dit maintenant la meme chose que l'onglet.
      // { icon: IconMotorbike, title: 'Liste', path: '/delivery-men', can: { action: 'read', subject: 'Livreur' } },
      { icon: IconMotorbike, title: 'Coursiers', path: '/delivery-men/men', can: { action: 'read', subject: 'Livreur' } },
      { icon: TrendingUp, title: 'Performance', path: '/delivery-men/performance', can: { action: 'read', subject: 'Performance' } },
      { icon: History, title: 'Reporting & historisation', path: '/reporting', can: { action: 'read', subject: 'Reporting' } },
    ],
  },

  {
    icon: IconBuildingSkyscraper,
    title: 'Partenaires',
    children: [
      { icon: IconBuildingSkyscraper, title: 'Liste', path: '/restaurants', can: { action: 'read', subject: 'Restaurant' } },
      { icon: Layers, title: 'Groupes', path: '/restaurants/groupes', can: { action: 'read', subject: 'GroupePartenaire' } },
      { icon: AiOutlineDollarCircle, title: 'Grille tarifaire', path: '/price-list', can: { action: 'read', subject: 'Restaurant' } },
      { icon: BarChart, title: 'Rapports Performance', path: '/finance/rapports-performance', can: { action: 'read', subject: 'RapportPerformancePartenaire' } },
    ],
  },

  /**
   * Finance : ce sur quoi on AGIT. Le groupe en comptait treize, ou les postes de
   * travail, les lectures d'analyse et les reglages etaient melanges. Le comptable
   * qui vient editer une facture parcourait six ecrans de rapports pour la trouver.
   *
   * <p>Le decoupage suit la question « qu'est-ce qui appelle un geste » : ici les gestes
   * et les deux reglages qui les gouvernent ; le recouvrement dans son propre groupe,
   * parce que c'est une chaine ; les lectures dans « Analyses & rapports ».</p>
   */
  {
    icon: Wallet,
    title: 'Finance',
    children: [
      { icon: IconLayoutDashboard, title: 'Tableau de bord', path: '/finance/dashboard', can: { action: 'read', subject: 'Finance' } },
      { icon: Receipt, title: 'Facturation partenaire', path: '/finance/facturation-plage', can: { action: 'read', subject: 'Finance' } },
      // « Validation » seul ne disait pas de quoi, a cote de « Validation DGA » et de
      // « Validation des tickets ». Le sujet CASL de l'ecran est ChargeFixe.
      { icon: CheckCircle, title: 'Validation des charges', path: '/finance/validation', can: { action: 'read', subject: 'ChargeFixe' } },
      { icon: Wallet, title: 'Gestion des paiements', path: '/finance/gestion-paiements', can: { action: 'read', subject: 'Paiement' } },
      { icon: IconSettings2, title: 'Primes & commission', path: '/finance/primes', can: { action: 'read', subject: 'GrillePaiement' } },
      { icon: IconSettings2, title: 'Configuration', path: '/finance/configuration', can: { action: 'read', subject: 'PageFinanceConfig' } },
    ],
  },

  /**
   * Le recouvrement, poste par poste, dans l'ordre ou l'argent remonte.
   *
   * <p>Le groupe s'appelait « Comptabilite ». « Finance » et « Comptabilite » sont deux
   * noms du meme service, et c'est exactement pourquoi les deux entrees paraissaient se
   * recouvrir : elles ne disaient pas ce qu'elles contenaient. Ce groupe-ci ne contient
   * pas de la comptabilite, il contient UNE chaine (les six sujets CASL `Page*` sont
   * les bureaux successifs d'un meme dossier), plus la liste des factures a recouvrer, qui
   * en est l'entree et qui trainait sous Finance.</p>
   *
   * <p>2026-05, permissions granulaires : le RECOUVREUR ne voit QUE Agent Recouvreur.
   * Le COMPTABLE (Responsable Financier dans le workflow) voit Responsable Financier +
   * Caissier. Les DG/DGA voient tout via 'manage all' / 'read all'.</p>
   */
  {
    icon: Receipt,
    title: 'Recouvrement',
    children: [
      { icon: SquareUser, title: 'Recouvrements', path: '/finance/recouvrement', can: { action: 'read', subject: 'Finance' } },
      { icon: FileText, title: 'Agent Recouvreur', path: '/finance/comptabilite/agent-recouvreur', can: { action: 'read', subject: 'PageAgentRecouvreur' } },
      { icon: Wallet, title: 'Caissier', path: '/finance/comptabilite/caissier', can: { action: 'read', subject: 'PageCaissier' } },
      { icon: FileText, title: 'Responsable Financier', path: '/finance/comptabilite/responsable-financier', can: { action: 'read', subject: 'PageResponsableFinancier' } },
      { icon: CheckCircle, title: 'Validation DGA', path: '/finance/comptabilite/validation-dga', can: { action: 'read', subject: 'PageValidationDga' } },
      // SPEC-RECOUV-002, aval du visa : orientation des fonds (DG/DGA) + verification des depots.
      { icon: Wallet, title: 'Orientation des fonds', path: '/finance/comptabilite/orientation-fonds', can: { action: 'read', subject: 'OrientationFonds' } },
      { icon: CheckCircle, title: 'Vérification dépôts', path: '/finance/comptabilite/verification-depots', can: { action: 'read', subject: 'VerificationDepots' } },
      // ENCOURS : releve des restes a payer (factures editees non recouvrees), par mois/an.
      { icon: TrendingUp, title: 'Encours', path: '/finance/comptabilite/encours', can: { action: 'read', subject: 'PageEncours' } },
    ],
  },

  /**
   * Ce qui se contente d'informer. Aucun de ces six ecrans n'attend un geste : on y
   * vient pour lire un chiffre, jamais pour changer un etat. Les melanger aux postes de
   * travail obligeait a relire treize libelles pour trouver le seul ou l'on agit.
   */
  {
    icon: BarChart,
    title: 'Analyses & rapports',
    children: [
      { icon: TrendingUp, title: 'Rentabilité (temps réel)', path: '/finance/rentabilite', can: { action: 'read', subject: 'Finance' } },
      { icon: TrendingUp, title: 'Analyse de rentabilité', path: '/finance/analyse-rentabilite', can: { action: 'read', subject: 'Finance' } },
      { icon: FileText, title: 'Rapports financiers', path: '/finance/rapports-financiers', can: { action: 'read', subject: 'Finance' } },
      // « Cumule » corrige en « Cumul » : c'etait une faute, pas un terme metier.
      { icon: List, title: 'Cumul de revenus globaux', path: '/finance/revenue', can: { action: 'read', subject: 'Finance' } },
      { icon: Layers, title: 'Cumul des investissements internes', path: '/finance/revenue/investissement', can: { action: 'read', subject: 'Finance' } },
      { icon: BarChart, title: 'Dashboard Performance', path: '/finance/rapports-performance/dashboard-performance', can: { action: 'read', subject: 'DashboardPerformance' } },
    ],
  },

  /**
   * Administrer les comptes et surveiller. Quatre entrees de premier niveau qui
   * s'ouvrent rarement, et par peu de monde, mais qui etaient posees au MILIEU de la
   * barre : elles separaient Turboys de Finance et repoussaient la finance en douzieme
   * position pour tout le monde.
   */
  {
    icon: IconShieldLock,
    title: 'Administration',
    children: [
      { icon: IconUser, title: 'Personnel TURBO', path: '/personnel', can: { action: 'read', subject: 'Personnel' } },
      // « Utilisateurs actif » n'etait pas du francais. L'ecran declare `title: 'Utilisateurs'`.
      { icon: IconUsers, title: 'Utilisateurs', path: '/users', can: { action: 'read', subject: 'Utilisateur' } },
      { icon: Lock, title: 'Privilèges', path: '/privileges', can: { action: 'read', subject: 'Utilisateur' } },
      { icon: IconShieldLock, title: 'Supervision & Audit', path: '/supervision', can: { action: 'read', subject: 'Supervision' } },
    ],
  },

  { icon: Bell, title: 'Notifications', path: '/notification', can: { action: 'access', subject: 'Notification' } },
  { icon: IconSettings2, title: 'Paramètres', path: '/settings/profile', can: { action: 'access', subject: 'Parametre' } },
];

export default menuData;

/**
 * Menu reduit a ce que le role a le droit de voir.
 *
 * <p>Vivait dans `components/layouts/sidebar.tsx` et n'existait QUE la : le menu
 * horizontal de `components/layouts/header.tsx` rendait `menuData` brut, donc non
 * filtre. Invisible tant que `themeConfig.menu` vaut « vertical » (le defaut),
 * mais `App.tsx` lit ce reglage dans `localStorage` : la valeur « horizontal » est
 * atteignable, et le menu y listait alors des entrees interdites au role.</p>
 */
export const filterMenuByAbility = (menu: IMenuData[], ability: AppAbility): IMenuData[] => {
  return menu.reduce<IMenuData[]>((acc, item) => {
    const children = item.children ? filterMenuByAbility(item.children, ability) : undefined;
    const allowedBySelf = item.can ? ability.can(item.can.action, item.can.subject) : false;
    const allowedByChild = !!children && children.length > 0;

    if (!item.can && !item.children) return acc;
    if (!allowedBySelf && !allowedByChild) return acc;

    acc.push(children !== undefined ? { ...item, children } : item);
    return acc;
  }, []);
};

/** Toutes les cibles declarees dans le menu, a plat. */
export const collecterChemins = (menu: IMenuData[]): string[] =>
  menu.flatMap((i) => [...(i.path ? [i.path] : []), ...(i.children ? collecterChemins(i.children) : [])]);

/**
 * Correspondance par SEGMENT, jamais par prefixe brut.
 *
 * <p>Sans le `/` final, `/delivery-men/performance` matcherait
 * `/delivery-men/performance-apercue/xxx`, qui est un autre ecran.</p>
 */
export const correspond = (cheminMenu: string, pathname: string) =>
  pathname === cheminMenu || pathname.startsWith(cheminMenu + '/');

/**
 * Groupe (entree a sous-menu) qui contient la route courante.
 *
 * <p>Recursif A DESSEIN. Aucune entree n'utilise `isHeader` aujourd'hui, donc une
 * recherche au premier niveau suffirait ; mais le rendu SAIT deja imbriquer un
 * groupe sous un en-tete de section, et cette recherche cesserait alors de trouver
 * le groupe SANS que rien ne le signale : ni le compilateur, ni le build.</p>
 */
export const trouverGroupeParent = (menu: IMenuData[], pathname: string | null): IMenuData | undefined => {
  for (const item of menu) {
    if (item.children?.some((c) => c.path && correspond(c.path, pathname ?? ''))) return item;
    const dansEnfants = item.children ? trouverGroupeParent(item.children, pathname) : undefined;
    if (dansEnfants) return dansEnfants;
  }
  return undefined;
};

/**
 * Entree de menu a surligner. Le plus long chemin qui correspond gagne, sinon les
 * paires parent/enfant s'allument a deux : `/trafic` contre `/trafic/standard`,
 * `/restaurants` contre `/restaurants/groupes`.
 */
export const trouverCheminActif = (menu: IMenuData[], pathname: string | null): string =>
  collecterChemins(menu)
    .filter((cm) => correspond(cm, pathname ?? ''))
    .sort((a, b) => b.length - a.length)[0] ?? '';

/**
 * Titre de l'entree de menu correspondant a la route courante, et celui de son groupe.
 *
 * <p>L'en-tete de page etait vide : un bouton hamburger visible en mobile seulement, les
 * notifications, le compte. Une barre pleine largeur pour trois elements alignes a droite.
 * L'operateur qui arrivait sur un ecran par un lien direct n'avait AUCUN repere : le seul
 * indice de sa position etait le surlignage dans la barre laterale, invisible des qu'elle
 * est repliee.</p>
 *
 * <p>On rend le titre de l'entree ET celui de sa section parente, pour composer un fil
 * « Section · Page ». Rien n'est trouve (sur une route hors menu, par exemple), on rend
 * `undefined` et l'appelant n'affiche rien plutot qu'un libelle invente.</p>
 */
export const trouverTitreActif = (
  menu: IMenuData[],
  pathname: string | null,
): { titre?: string; section?: string } => {
  const chemin = trouverCheminActif(menu, pathname);
  if (!chemin) return {};

  const chercher = (items: IMenuData[], section?: string): { titre?: string; section?: string } => {
    for (const item of items) {
      if (item.path === chemin) return { titre: item.title, section };
      if (item.children) {
        // Un groupe porte sa propre section ; un en-tete de menu la remplace.
        const dessous = chercher(item.children, item.isHeader ? item.title : (section ?? item.title));
        if (dessous.titre) return dessous;
      }
    }
    return {};
  };

  return chercher(menu);
};
