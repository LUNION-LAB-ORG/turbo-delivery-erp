'use client';

import React from 'react';

import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import progresseBare2 from '@/components/dashboard/delivery-men/progression/progression-barre2';
import { formatDate } from '@/utils/date-formate';

import { CelluleCoursier } from '../../_composants/cellule-coursier';

/**
 * Palier bas de la barre de progression partagee : en dessous, elle passe au rouge.
 * Le seuil est repris ici pour COMPTER les decrochages, pas pour les recolorier. Il est
 * exporte pour que la ligne de situation de la page compte avec la MEME valeur que les
 * blocs, sans quoi le total de tete et la somme des blocs pourraient se contredire.
 *
 * SIGNALEMENT, hors de ces deux fichiers : la valeur vit deja en dur dans
 * components/dashboard/delivery-men/progression/progression-barre2.tsx, qui teste
 * `progression < 100 && progression >= 65`. Les deux copies ne sont reliees par rien.
 * Si quelqu'un deplace le palier de la barre partagee, les barres basculeront de couleur
 * a une valeur pendant que le comptage continuera a 65 : le resume de bloc dira alors le
 * contraire de ce que l'ecran montre, ligne par ligne. Le seuil devrait etre exporte par
 * le fichier de la barre, qui est PARTAGE et n'est donc pas modifie ici.
 */
export const SEUIL_RETARD = 65;

/**
 * L'ordre de lecture des coursiers. Il est decide UNE fois en tete de page et applique a
 * tous les blocs : dix controles identiques, un par etablissement, feraient dix reponses
 * possibles a une question qui n'en a qu'une.
 */
export type OrdreCoursiers = 'nom' | 'retard';

/** La periode d'un creneau se lit comme une plage, pas comme deux dates separees. */
function libellePeriode(creneau?: CreneauVM): string {
  const debut = creneau?.jourDebut ? formatDate(creneau.jourDebut, 'DD/MM/YYYY') : null;
  const fin = creneau?.jourFin ? formatDate(creneau.jourFin, 'DD/MM/YYYY') : null;

  if (debut && fin) return `${debut} au ${fin}`;
  if (debut) return `à partir du ${debut}`;
  if (fin) return `jusqu'au ${fin}`;
  return 'Non défini';
}

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Ou en est le creneau : le jour en cours et le nombre de jours qu'il compte.
 *
 * <p>Sans cette information le compte de decrochages ne veut rien dire : au premier jour
 * d'un creneau tout le monde est a 0 %, donc tout le monde est « sous 65 % ». Un signal
 * qui se declenche chaque lundi n'est plus un signal, c'est du bruit. Le jour ecoule est
 * le denominateur qui manque, et il se deduit des deux dates deja recues.</p>
 */
function avancementCreneau(debut?: string, fin?: string, maintenant?: null | number) {
  if (!debut || !fin || maintenant === null || maintenant === undefined) return null;

  const t0 = new Date(debut).getTime();
  const t1 = new Date(fin).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) return null;

  const total = Math.round((t1 - t0) / MS_PAR_JOUR) + 1;
  const ecoule = Math.floor((maintenant - t0) / MS_PAR_JOUR) + 1;

  return { ecoule: Math.min(total, ecoule), total };
}

interface Props {
  initialData: Livreur[];
  /**
   * Le nom du site, pour le nom accessible du tableau. La page en empile un par
   * etablissement : sans lui, un lecteur d'ecran annonce dix tableaux portant le meme
   * nom et n'offre aucun moyen de savoir de quel restaurant il s'agit.
   */
  nomEtablissement: string;
  ordre: OrdreCoursiers;
}

/**
 * La progression des coursiers assignes a un site partenaire, sur le creneau en cours.
 *
 * <h3>Ce que l'operateur cherche</h3>
 * <p>Cet ecran empile un bloc par restaurant, et chaque bloc empile ses coursiers. Un
 * superviseur qui l'ouvre cherche le plus souvent QUI DECROCHE, pour appeler la personne
 * ailleurs. La version precedente mettait le nom en premiere colonne et la barre en
 * deuxieme, dans l'ordre du serveur : sur dix sites de huit coursiers, il fallait balayer
 * quatre-vingts barres pour trouver les trois qui comptent.</p>
 *
 * <p>Les lignes sont donc triees par progression CROISSANTE, et le retard arrive en haut
 * du bloc. Mais ce n'etait qu'une hypothese sur l'usage, imposee sans retour possible :
 * un superviseur a qui l'on cite un nom au telephone, lui, balayait tout. L'ordre est
 * maintenant un CHOIX, pris en tete de page et applique a tous les blocs a la fois.</p>
 *
 * <p>L'ordre brut du serveur n'est volontairement pas propose : la reponse ne documente
 * aucun tri, il n'est donc pas reproductible d'une lecture a l'autre et ne repond a
 * aucune question qu'un operateur se pose. Les deux ordres offerts sont deterministes et
 * couvrent les deux vraies questions de l'ecran, le retard et le nom.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Rien. Il n'y a sur ce bloc ni lien de detail, ni fenetre, ni mutation : il informe.
 * Aucune teinte d'accent n'y a donc sa place, y compris sur le compte de decrochages, qui
 * est un COMPTAGE et non une echelle : 3, 8 ou 12, sans palier ni maximum. La seule
 * couleur conservee est celle de la barre, qui est une echelle sur une valeur mesuree.
 * Le retard est deja dit trois fois par ailleurs, par les barres rouges, par la remontee
 * des lignes en tete et par le compte lui-meme.</p>
 *
 * <h3>La forme de la donnee</h3>
 * <p>Des coursiers comparables sur un meme axe : un tableau sur poste, des cartes sur
 * telephone, via le composant partage. Deux colonnes « Debut » et « Fin » repetaient en
 * revanche la meme paire de dates sur chaque ligne du bloc, puisque tous les coursiers
 * d'un site partagent le creneau. Une valeur identique sur toutes les lignes n'est pas
 * une colonne, c'est une legende : elle remonte en tete de bloc. La colonne reapparait
 * telle quelle des que les dates different d'un coursier a l'autre, et les deux dates
 * restent lisibles dans les deux cas.</p>
 *
 * <h3>Ce qui a ete retire, et pourquoi</h3>
 * <p>Le COMPTE DE COURSIERS de la legende. Le bloc affichait « N coursiers assignes »
 * huit pixels sous l'en-tete du parent, qui affiche deja « N turboys assignes » sur la
 * MEME donnee : meme nombre, deux vocabulaires concurrents. La legende de creneau reste,
 * elle dit autre chose ; le comptage part. Aucune information n'est perdue.</p>
 *
 * <p>Le repli d'avatar pointait `assets/images/avatar.png` SANS barre oblique de tete :
 * l'URL se resolvait sous la route courante, donc sous
 * /delivery-men/creneau-progression/, et repondait 404. Le fichier, lui, EXISTE bien
 * (public/assets/images/avatar.png) : ce qui etait faux, c'etait le CHEMIN, pas l'image.
 * Inutile donc d'ajouter quoi que ce soit au depot. La cellule partagee retombe sur les
 * initiales, qui distinguent les lignes mieux qu'une silhouette identique pour tous.</p>
 *
 * <p>Le tableau s'annoncait aux lecteurs d'ecran « TABLEAU DE PROGRESSION DES TURBOYS »,
 * et les valeurs absentes « NON DEFINI », en capitales et sans accent. Les capitales se
 * lisent lettre par lettre sur certains lecteurs.</p>
 */
export default function TableCreneau({ initialData, nomEtablissement, ordre }: Props) {
  // La date du jour est lue APRES le montage. Lue pendant le rendu, elle differerait
  // entre le serveur et le navigateur (fuseau, minuit) et casserait l'hydratation de la
  // page, qui est rendue cote serveur.
  const [maintenant, setMaintenant] = React.useState<null | number>(null);
  React.useEffect(() => setMaintenant(Date.now()), []);

  const lignes = React.useMemo(() => {
    const source = initialData ?? [];
    const parNom = (a: Livreur, b: Livreur) =>
      (a.nomComplet ?? '').localeCompare(b.nomComplet ?? '', 'fr');

    if (ordre === 'nom') return [...source].sort(parNom);

    // A progression egale, le nom departage : sans ce second critere l'ordre de deux
    // coursiers a 0 % changerait d'une lecture a l'autre.
    return [...source].sort(
      (a, b) => (a.progression ?? 0) - (b.progression ?? 0) || parNom(a, b),
    );
  }, [initialData, ordre]);

  const enRetard = lignes.filter((l) => (l.progression ?? 0) < SEUIL_RETARD).length;

  // Un creneau commun a tout le bloc se dit une fois en legende ; sinon il redevient
  // une colonne, car la difference entre deux coursiers est alors la donnee elle-meme.
  const debut = lignes[0]?.creneauVM?.jourDebut;
  const fin = lignes[0]?.creneauVM?.jourFin;
  const memePeriode =
    Boolean(debut) &&
    Boolean(fin) &&
    lignes.every((l) => l.creneauVM?.jourDebut === debut && l.creneauVM?.jourFin === fin);

  const avancement = memePeriode ? avancementCreneau(debut, fin, maintenant) : null;

  // Les colonnes sont memoisees comme les lignes : reconstruites a chaque rendu, elles
  // fabriquaient de nouveaux objets et de nouvelles fermetures `rendu`, ce qui annulait
  // l'interet du memo voisin.
  const colonnes: ColonneResponsive<Livreur>[] = React.useMemo(() => {
    const base: ColonneResponsive<Livreur>[] = [
      {
        cle: 'nom',
        identite: true,
        libelle: 'Coursier',
        rendu: (l) => (
          <CelluleCoursier avatarUrl={l.avatar} nom={l.nomComplet || 'Non défini'} />
        ),
      },
      {
        cle: 'progression',
        // Libelle court a dessein. Sur une carte tactile, le composant partage pose le
        // libelle a gauche sans le laisser retrecir et la valeur a droite : « Progression
        // du creneau », 22 caracteres, ne laissait qu'un tiers de largeur a la barre sur
        // un telephone de 375 px. Le creneau est deja dit par la legende du bloc.
        libelle: 'Progression',
        rendu: (l) => progresseBare2(l),
      },
      {
        cle: 'jours',
        libelle: 'Jours travaillés',
        nombre: true,
        rendu: (l) =>
          l.jour ? (
            <span className="text-sm text-foreground">
              {l.jour.jourTravaille}
              <span className="text-muted">/7</span>
            </span>
          ) : (
            <span className="text-sm text-muted">Non défini</span>
          ),
      },
    ];

    if (!memePeriode) {
      base.push({
        cle: 'creneau',
        libelle: 'Créneau',
        rendu: (l) => (
          <span className="text-sm whitespace-nowrap text-foreground tabular-nums">
            {libellePeriode(l.creneauVM)}
          </span>
        ),
      });
    }

    return base;
  }, [memePeriode]);

  return (
    <div className="p-4">
      {lignes.length > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3">
          <p className="text-sm text-muted">
            {memePeriode
              ? `Créneau du ${libellePeriode(lignes[0]?.creneauVM)}`
              : 'Créneaux différents selon le coursier'}
            {avancement && avancement.ecoule > 0
              ? ` · jour ${avancement.ecoule} sur ${avancement.total}`
              : ''}
            {avancement && avancement.ecoule <= 0 ? ' · créneau à venir' : ''}
          </p>
          {/* Le compte porte son denominateur : « 3 des 8 » se juge, « 3 » s'alarme. Avec
              le jour ecoule dit juste a cote, l'operateur voit tout de suite qu'un bloc
              entier sous le seuil au premier jour d'un creneau est normal. */}
          {enRetard > 0 && (
            <p className="text-sm font-medium text-foreground tabular-nums">
              {enRetard} des {lignes.length} sous {SEUIL_RETARD}&nbsp;%
            </p>
          )}
        </div>
      )}

      <TableauResponsive
        cleLigne={(l) => l.id}
        colonnes={colonnes}
        libelle={`Progression des coursiers assignés à ${nomEtablissement}`}
        lignes={lignes}
        vide="Aucun coursier assigné sur ce site"
      />
    </div>
  );
}
