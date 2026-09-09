export type IDepense = {
  id: string;
  libelle: string;
  montant: number;
  description?: string;
  justificatif?: string;
  dateDepense: string;
  typeDepense: string;
  sourcePaiement?: string;
  creerPar?: string;
  statut: string;
  categorie: {
    id: string;
    nomCategorie: string;
    description: string;
  };
  investissement?: {
    id: string;
    nomInvestisseur: string;
    montant: number;
  };
  createdAt: string;
  updatedAt: string;
};

export interface IDepensesParams {
  page?: number;
  limit?: number;
  categorie?: string;
  categoriesDepense?: string[]; // Ajouté pour supporter plusieurs catégories
  montant?: number;
  typeDepense?: string;
  dateDepense?: string;
  debut?: Date;
  fin?: Date;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface IDepenseStats {
  nombre_categories: number;
  montant_total: number;
  nombre_depenses: number;
}

export interface IDepenseStatsParams {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[]; // ✅ AJOUTÉ: Supporter le filtrage par catégories pour les stats
}

export interface IDepenseSummary {
  totalRecurrentes: number;
  totalNonRecurrentes: number;
}

export interface IDepenseSummaryParams {
  debut?: Date;
  fin?: Date;
  categoriesDepense?: string[]; // ✅ AJOUTÉ: Supporter le filtrage par catégories pour le summary
}
