import { useEffect, useRef } from 'react';

/**
 * Charge la page suivante quand la sentinelle entre dans la fenêtre.
 *
 * <h3>Ce qui change</h3>
 * <p>La version d'origine n'avait AUCUNE garde contre un appel pendant qu'une page était
 * déjà en train d'arriver :</p>
 *
 * <pre>
 *   if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
 * </pre>
 *
 * <p>Or l'effet se ré-exécute à chaque changement de `hasNextPage`, donc à chaque page
 * reçue : l'observateur est recréé, il rappelle immédiatement son callback avec la
 * sentinelle toujours visible — elle ne descend qu'une fois les nouvelles lignes rendues —
 * et redemande aussitôt la page suivante. Toutes les pages s'enchaînent sans que personne
 * ait défilé, la mémoire de l'onglet monte, et le navigateur finit par le tuer.</p>
 *
 * <p>Deux gardes désormais. `enCours` empêche d'en redemander une tant que la précédente
 * n'est pas arrivée. Et `dejaDemande` bloque les rappels multiples du même cycle
 * d'intersection, que l'observateur émet volontiers pendant un défilement rapide.</p>
 *
 * @param fetchNextPage à appeler pour charger la suite
 * @param hasNextPage   reste-t-il quelque chose à charger
 * @param enCours       une page est déjà en vol (`isFetchingNextPage`)
 */
export const useInfiniteScroll = (
  fetchNextPage: () => void,
  hasNextPage: boolean | undefined,
  enCours?: boolean,
) => {
  const observerTarget = useRef(null);
  const dejaDemande = useRef(false);

  useEffect(() => {
    // Une page vient d'arriver : on redevient disponible pour la suivante.
    if (!enCours) dejaDemande.current = false;
  }, [enCours]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          // Sortie de la fenêtre : le prochain passage pourra redemander.
          dejaDemande.current = false;
          return;
        }
        if (!hasNextPage || enCours || dejaDemande.current) return;
        dejaDemande.current = true;
        fetchNextPage();
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, enCours]);

  return observerTarget;
};
