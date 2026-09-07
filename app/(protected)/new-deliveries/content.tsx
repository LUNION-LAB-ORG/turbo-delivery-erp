'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Chip, Skeleton } from '@heroui-v3/react';

import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { getPaginationCourseExterneJournaliere } from '@/src/actions/courses.actions';
import CourseJournaliere from '../external_delivery/component/course-journaliere';

interface Props {
  data: PaginatedResponse<Restaurant> | null;
}

/**
 * Point du jour, restaurant par restaurant : combien de courses sont encore en
 * cours et combien sont terminées. Rafraîchi automatiquement toutes les 30 s.
 */
export default function Content({ data: initialData }: Props) {
  const [pageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Restaurant> | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  // `getPaginationCourseExterneJournaliere` avale l'erreur et rend `null` :
  // une page absente est une lecture qui a echoue, jamais une journee vide.
  const [erreurLecture, setErreurLecture] = useState(!initialData);

  const restaurants = data?.content ?? [];
  const totalEnCours = useMemo(
    () => restaurants.reduce((s, r) => s + (r.coursesEnCours ?? 0), 0),
    [restaurants],
  );

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getPaginationCourseExterneJournaliere(page - 1, pageSize);
      setData(newData);
      setErreurLecture(!newData);
    } catch {
      setErreurLecture(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Rafraîchissement silencieux toutes les 60 s (supervision du jour).
  //
  // 60 et non 30 : c'est un écran de point du jour, pas un écran de dispatch. Les
  // deux écrans de courses externes qui gardent 15 s, eux, portent une ALARME SONORE
  // et doivent continuer à sonner onglet caché : leur cadence est justifiée.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const newData = await getPaginationCourseExterneJournaliere(currentPage - 1, pageSize);
        setData(newData);
        setErreurLecture(!newData);
      } catch {
        setErreurLecture(true);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [currentPage, pageSize]);

  return (
    <div className="w-full h-full pb-10 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          {/* Le titre etait peint en ROUGE DE MARQUE. */}
          <h1 className="text-2xl font-bold text-foreground">Courses journalières</h1>
          <p className="text-sm text-muted mt-0.5 capitalize">
            {dayjs().format('dddd DD/MM/YYYY')} — point par restaurant partenaire
          </p>
        </div>
        {/* Le compteur se tait en cas d'echec : sans donnee, il afficherait un
            "Tout est a jour" vert qui contredit l'etat d'erreur juste dessous.

            « X courses a suivre » etait peint en AVERTISSEMENT. Des courses en cours,
            c'est l'activite normale d'une journee de livraison, pas une anomalie : c'est
            ce qu'il reste a suivre, donc l'accent, qui dit « regarde ici ». */}
        {!(erreurLecture && restaurants.length === 0) && (
          <Chip color={totalEnCours > 0 ? 'accent' : 'success'} variant="soft">
            <Chip.Label>
              {totalEnCours > 0
                ? `${totalEnCours} course${totalEnCours > 1 ? 's' : ''} à suivre`
                : 'Tout est à jour'}
            </Chip.Label>
          </Chip>
        )}
      </div>

      {/* Grille des restaurants */}
      {erreurLecture && restaurants.length === 0 ? (
        // A la place du message de vide : "Aucune course aujourd'hui" est ce
        // qu'on affiche quand la journee est reellement vide.
        <EtatErreur
          quoi="les courses journalières"
          onReessayer={() => fetchData(currentPage)}
          enCours={isLoading}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="rounded-xl h-36" />
          ))}
        </div>
      ) : restaurants.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {restaurants.map((restaurant) => (
            <CourseJournaliere key={restaurant.restaurantId} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <EmptyDataTable
          title="Aucune course aujourd'hui"
          message="Les restaurants ayant émis des courses aujourd'hui apparaîtront ici avec leur point en cours / terminées."
        />
      )}

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center mt-2 w-full">
          <PaginationTableau
            onPage={fetchData}
            page={currentPage}
            total={data?.totalPages ?? 1}
          />
        </div>
      )}
    </div>
  );
}
