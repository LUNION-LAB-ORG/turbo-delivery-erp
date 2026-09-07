"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Download, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Receipt, Filter } from "lucide-react";
import { useDepenseTable } from "@/features/depenses/hooks/use-depense-table";
import { useDepenseStats } from "@/features/depenses/hooks/use-depense-stats";
import { useCategorieDepense } from "@/features/depenses/hooks/use-categorie-depense";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import EtatErreur from "@/components/commons/EtatErreur";
import { formatMontant } from '@/utils/format.utils';

export default function DepensesModernesClient() {
    const [activeTab, setActiveTab] = useState("toutes");
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("tous");
    const [categorieFilter, setCategorieFilter] = useState("toutes");

    const {
        depenses,
        isLoading: isLoadingDepenses,
        isFetching: isFetchingDepenses,
        isError: isErrorDepenses,
        refetch: refetchDepenses,
    } = useDepenseTable();
    const { data: statsData, isLoading: isLoadingStats } = useDepenseStats();
    const {
        categories,
        isLoading: isLoadingCategories,
        isFetching: isFetchingCategories,
        isError: isErrorCategories,
        refetch: refetchCategories,
    } = useCategorieDepense();

    // Les deux listes alimentent les compteurs ET les onglets : sur echec, tout
    // retombe a 0 et sur « Aucune depense trouvee », qui se lit comme un mois sans
    // depense. On dit l'echec au lieu de le laisser passer pour un resultat.
    const isErreurDonnees = isErrorDepenses || isErrorCategories;
    const isReessaiEnCours = isFetchingDepenses || isFetchingCategories;
    const reessayerDonnees = () => {
        if (isErrorDepenses) refetchDepenses();
        if (isErrorCategories) refetchCategories();
    };

    // Calculer les totaux
    const totalDepenses = depenses?.reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0) || 0;
    const nombreDepenses = depenses?.length || 0;
    const nombreCategories = categories?.length || 0;

    // Filtrer les données
    const filteredDepenses = depenses?.filter((dep: any) => {
        // Filtre par recherche
        const searchMatch = !searchTerm || 
            dep.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dep.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dep.categorie?.nomCategorie?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par date
        let dateMatch = true;
        if (dateFilter !== "tous" && dep.dateDepense) {
            const depDate = new Date(dep.dateDepense);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch (dateFilter) {
                case "aujourd'hui":
                    const todayEnd = new Date(today);
                    todayEnd.setHours(23, 59, 59, 999);
                    dateMatch = depDate >= today && depDate <= todayEnd;
                    break;
                case "semaine":
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    dateMatch = depDate >= weekStart && depDate <= weekEnd;
                    break;
                case "mois":
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    monthEnd.setHours(23, 59, 59, 999);
                    dateMatch = depDate >= monthStart && depDate <= monthEnd;
                    break;
                case "annee":
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    const yearEnd = new Date(today.getFullYear(), 11, 31);
                    yearEnd.setHours(23, 59, 59, 999);
                    dateMatch = depDate >= yearStart && depDate <= yearEnd;
                    break;
            }
        }

        // Filtre par catégorie
        const categorieMatch = categorieFilter === "toutes" || 
            dep.categorie?.nomCategorie === categorieFilter;

        return searchMatch && dateMatch && categorieMatch;
    }) || [];

    // Grouper par catégorie pour l'onglet catégories
    const depensesByCategorie = filteredDepenses.reduce((acc: any, dep: any) => {
        const categorie = dep.categorie?.nomCategorie || 'Non catégorisé';
        if (!acc[categorie]) {
            acc[categorie] = {
                categorie,
                depenses: [],
                total: 0,
                nombre: 0
            };
        }
        acc[categorie].depenses.push(dep);
        acc[categorie].total += dep.montant || 0;
        acc[categorie].nombre += 1;
        return acc;
    }, {});

    const sortedCategories = Object.values(depensesByCategorie).sort((a: any, b: any) => b.total - a.total);

    return (
        <div className="p-6 space-y-6">
            {/* En-tête */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Historique des Dépenses</h1>
                        <p className="text-muted mt-2">
                            Consultez l&apos;historique complet des dépenses par catégorie
                        </p>
                    </div>
                    <Button className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exporter
                    </Button>
                </div>

                {/* Cartes de statistiques */}
                {isErreurDonnees ? (
                    <Card>
                        <CardContent className="p-0">
                            <EtatErreur
                                quoi="les dépenses"
                                onReessayer={reessayerDonnees}
                                enCours={isReessaiEnCours}
                            />
                        </CardContent>
                    </Card>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-linear-to-r from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-600 text-sm font-medium">Total Dépenses</p>
                                    <p className="text-2xl font-bold text-red-900">
                                        {formatMontant(totalDepenses)}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                        <span className="text-xs text-red-600">
                                            {nombreDepenses} transactions
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-red-200 rounded-full">
                                    <Receipt className="w-6 h-6 text-red-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-r from-orange-50 to-orange-100 border-orange-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-600 text-sm font-medium">Catégories</p>
                                    <p className="text-2xl font-bold text-orange-900">
                                        {nombreCategories}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Filter className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs text-orange-600">
                                            Types de dépenses
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-200 rounded-full">
                                    <Filter className="w-6 h-6 text-orange-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-r from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-600 text-sm font-medium">Moyenne/Dépense</p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {formatMontant(nombreDepenses > 0 ? Math.round(totalDepenses / nombreDepenses) : 0)}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <DollarSign className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs text-purple-600">
                                            Par transaction
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-200 rounded-full">
                                    <DollarSign className="w-6 h-6 text-purple-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                )}

                {/* Filtres */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted" />
                        <Input
                            placeholder="Rechercher par libellé, catégorie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filtrer par date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tous">Toutes les dates</SelectItem>
                            <SelectItem value="aujourd'hui">Aujourd&apos;hui</SelectItem>
                            <SelectItem value="semaine">Cette semaine</SelectItem>
                            <SelectItem value="mois">Ce mois</SelectItem>
                            <SelectItem value="annee">Cette année</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={categorieFilter} onValueChange={setCategorieFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Filtrer par catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="toutes">Toutes les catégories</SelectItem>
                            {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.nomCategorie}>
                                    {cat.nomCategorie}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Onglets */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-surface-secondary p-1 rounded-lg">
                        <TabsTrigger 
                            value="toutes" 
                            className={`flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 ${
                                activeTab === "toutes" ? "bg-red-500 text-white shadow-lg" : "text-muted hover:text-foreground"
                            }`}
                        >
                            <span>Toutes les dépenses</span>
                            <Badge variant={activeTab === "toutes" ? "secondary" : "outline"} className={
                                activeTab === "toutes" ? "bg-surface text-red-500" : ""
                            }>
                                {filteredDepenses.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="categories" 
                            className={`flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 ${
                                activeTab === "categories" ? "bg-red-500 text-white shadow-lg" : "text-muted hover:text-foreground"
                            }`}
                        >
                            <span>Par catégorie</span>
                            <Badge variant={activeTab === "categories" ? "secondary" : "outline"} className={
                                activeTab === "categories" ? "bg-surface text-red-500" : ""
                            }>
                                {sortedCategories.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="toutes" className="space-y-4">
                        <div className="grid gap-4">
                            {isErreurDonnees ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <EtatErreur
                                            quoi="les dépenses"
                                            onReessayer={reessayerDonnees}
                                            enCours={isReessaiEnCours}
                                        />
                                    </CardContent>
                                </Card>
                            ) : filteredDepenses.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-muted">Aucune dépense trouvée</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredDepenses.map((depense: any) => (
                                    <Card key={depense.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-red-100 rounded-full">
                                                        <Receipt className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{depense.libelle}</h3>
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                                {depense.categorie?.nomCategorie || 'Non catégorisé'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted">
                                                            REF-{depense.id}
                                                        </p>
                                                        <p className="text-xs text-muted">
                                                            {depense.dateDepense && format(new Date(depense.dateDepense), 'PPP', { locale: fr })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-red-600">
                                                        {formatMontant(depense.montant ?? 0)}
                                                    </p>
                                                    <p className="text-xs text-muted">
                                                        Dépense {depense.categorie?.nomCategorie?.toLowerCase() || 'générale'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-4">
                        <div className="grid gap-4">
                            {isErreurDonnees ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <EtatErreur
                                            quoi="les dépenses par catégorie"
                                            onReessayer={reessayerDonnees}
                                            enCours={isReessaiEnCours}
                                        />
                                    </CardContent>
                                </Card>
                            ) : sortedCategories.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-muted">Aucune catégorie trouvée</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                sortedCategories.map((categorie: any) => (
                                    <Card key={categorie.categorie} className="hover:shadow-md transition-shadow border-2 border-orange-200">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-orange-100 rounded-full">
                                                        <Filter className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{categorie.categorie}</h3>
                                                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                                {categorie.nombre} dépenses
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted">
                                                            {categorie.depenses.length} transactions
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {categorie.depenses.slice(0, 3).map((dep: any) => (
                                                                <span key={dep.id} className="text-xs bg-surface-secondary px-2 py-1 rounded">
                                                                    {dep.libelle}
                                                                </span>
                                                            ))}
                                                            {categorie.depenses.length > 3 && (
                                                                <span className="text-xs bg-surface-secondary px-2 py-1 rounded">
                                                                    +{categorie.depenses.length - 3} autres
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-orange-600">
                                                        {formatMontant(categorie.total)}
                                                    </p>
                                                    <p className="text-xs text-muted">
                                                        Moyenne: {formatMontant(Math.round(categorie.total / categorie.nombre))}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
