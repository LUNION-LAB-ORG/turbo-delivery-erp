/**
 * La taille de liste demandée par les deux onglets de Performance.
 *
 * <p>⚠ Ce fichier est SÉPARÉ de `performance.action.ts` à dessein : ce dernier porte
 * `'use server'`, et un module de Server Actions ne peut exporter que des fonctions
 * asynchrones. Y déclarer une constante casse la compilation.</p>
 *
 * <p>Ces écrans n'ont AUCUN contrôle de pagination : ce qui n'est pas dans la première
 * page n'est atteignable par aucun geste. La taille doit donc couvrir la population
 * entière, pas seulement une première page.</p>
 *
 * <p>Mesure du 11/09/2026 en production : 9 birds et 13 turboys ayant un emploi du temps
 * sur la semaine en cours. 200 laisse une marge large devant les 77 livreurs annoncés par
 * le cahier des charges « Performance de la Flotte ».</p>
 *
 * <p>⚠ Ce nombre ne garantit rien à lui seul : c'est `AvertissementListeTronquee`, monté
 * dans les deux écrans, qui empêche une troncature de passer inaperçue le jour où la
 * flotte dépassera cette valeur.</p>
 */
export const TAILLE_LISTE_PERFORMANCE = 200;
