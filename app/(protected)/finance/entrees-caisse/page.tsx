'use client';

import { Button } from '@heroui-v3/react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import EtatErreur from '@/components/commons/EtatErreur';
import DateFilterInput from '@/components/finance/date-filter-input';
import { CreerEntreeCaisseModal } from '@/components/finance/entrees-caisse/creer-entree-caisse-modal';
import { EntreeCaisseTable } from '@/components/finance/entrees-caisse/entree-caisse-table';
import { useEntreeCaisseTable } from '@/features/entrees-caisse/hooks/use-entree-caisse-table';

export default function EntreesCaissePage() {
  const router = useRouter();
  const { table, isLoading, isFetching, isError, refetch, pagination, filters, handleDateChange } =
    useEntreeCaisseTable();

  return (
    /*
     * Le `p-6` de cette page DOUBLAIT celui de la coquille (`content-animation`), ou la
     * largeur de page se decide une fois pour les 155 ecrans : les entrees de caisse
     * commencaient donc 24 px plus a droite que le reste de la Finance.
     */
    <div className="flex flex-col gap-4">
      {/*
       * Le bouton venait de shadcn et ecoutait `onClick`. Le bouton de la v3 ecoute
       * `onPress` et IGNORE `onClick` en silence : un report mecanique aurait laisse ici
       * un « Retour » qui se survole, s'enfonce, et ne revient nulle part.
       */}
      <Button className="w-fit" onPress={() => router.back()} size="sm" variant="ghost">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour
      </Button>

      {/*
       * `flex-wrap` : la fenetre de l'operateur fait ~1000 px, et le selecteur de periode
       * pose a cote du bouton de creation depasse cette largeur des que le titre s'allonge.
       */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {/*
           * Le titre etait peint en couleur de MARQUE (`text-primary`), et le sous-titre
           * portait `text-muted-foreground`, un jeton shadcn. Un titre de page nomme une
           * categorie : il ne demande aucun geste, donc il ne prend pas l'accent.
           */}
          <h1 className="text-2xl font-bold text-foreground">Entrées Caisse</h1>
          <p className="text-sm text-muted">Gestion et historique des entrées caisse</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
          <CreerEntreeCaisseModal />
        </div>
      </div>

      {isError ? (
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les entrées caisse" />
      ) : (
        <EntreeCaisseTable
          isFetching={isFetching}
          isLoading={isLoading}
          pagination={pagination}
          table={table}
        />
      )}
    </div>
  );
}
