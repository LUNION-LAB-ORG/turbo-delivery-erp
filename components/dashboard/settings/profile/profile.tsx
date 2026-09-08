'use client';

import { Avatar, Card, Chip } from '@heroui-v3/react';
import { AtSign, CalendarDays, IdCard } from 'lucide-react';
import React from 'react';

import { formatDateFr } from '@/lib/date-utils';
import { User } from '@/types/models';

import { CodeSecuriteCard } from './code-securite-card';

/**
 * Le profil ERP porte PEUT-ETRE l'etat du code de securite.
 *
 * <p>Le champ `codeSecurite` de l'entite est `@JsonIgnore` cote erp-backend, et rien
 * d'autre dans la reponse ne permet de deviner s'il vaut NULL : l'ecran ne peut donc
 * pas dire aujourd'hui si un code existe. Le booleen DERIVE (`codeSecurite != null`,
 * jamais le hash) est demande au backend ; tant qu'il n'arrive pas, la carte se tait
 * sur l'etat au lieu d'en inventer un, et dit la seule chose vraie dans les deux cas.</p>
 */
type ProfilAvecEtatCode = User & { codeSecuriteDefini?: boolean };

/**
 * Une donnee du compte : son libelle au-dessus, sa valeur en dessous.
 *
 * <p>Trois faits alignes sur une meme ligne se lisent en balayant les libelles ;
 * empiles en liste a puces, il fallait lire chaque ligne en entier pour trouver
 * celui qu'on cherchait.</p>
 */
function Fait({
  children,
  icone: Icone,
  libelle,
  titreComplet,
}: {
  children: React.ReactNode;
  icone: typeof AtSign;
  libelle: string;
  /** Valeur complete en info-bulle, quand l'affichage la tronque. */
  titreComplet?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">
        <Icone aria-hidden="true" className="size-3.5 shrink-0" />
        {libelle}
      </p>
      <p className="mt-0.5 truncate text-sm text-foreground" title={titreComplet}>
        {children}
      </p>
    </div>
  );
}

/**
 * La page Parametres.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Le seul GESTE de l'ecran : le code de securite. La fiche de profil, elle,
 * INFORME : elle porte meme sa propre impasse (« adressez-vous a un
 * administrateur »). Elle occupait pourtant les deux tiers de la largeur pour cinq
 * lignes de texte, et le geste etait relegue dans la colonne de droite. Les deux
 * blocs sont desormais empiles, chacun sur toute la largeur : la fiche est un
 * bandeau d'identite proportionne a ses cinq faits, le code prend le corps de la
 * page. L'ordre de lecture redevient l'ordre d'importance.</p>
 *
 * <p>La couleur suit : le nom du compte et l'e-mail etaient peints en rouge de
 * MARQUE alors qu'ils informent, et le role l'etait aussi, or un role est une
 * CATEGORIE. Tout cela redevient neutre, et le rouge ne sert plus qu'au bouton qui
 * enregistre le code.</p>
 *
 * <p>Le mode edition a ete RETIRE avant cette refonte, parce qu'il ne pouvait rien
 * enregistrer : les quatre champs etaient controles SANS `onChange` (inertes), et
 * `handleSave()` refermait le formulaire sans envoyer la moindre requete, et aucune
 * action de mise a jour du profil n'existe dans le depot. Un formulaire qui promet
 * d'enregistrer et n'enregistre rien est pire qu'une fiche en lecture.</p>
 */
const UserProfile = ({ user }: { user: User }) => {
  const roleLibelle = user.role?.libelle ?? '';
  /*
   * Comparaison sur le libelle BRUT, et c'est voulu : erp-backend garde
   * `definirCodeSecurite` par `ROLES_CODE_SECURITE = List.of("DG", "DGA")`, sur ce
   * meme libelle. Passer par `normalizeRole` (qui replie ADMIN sur DG) ouvrirait
   * la carte a des comptes que le serveur refuse ensuite en CS11 : une promesse
   * que le backend ne tient pas. Les deux listes doivent bouger ENSEMBLE.
   */
  const peutDefinirCode = ['DG', 'DGA'].includes(roleLibelle);
  const nomComplet = [user.prenoms, user.nom].filter(Boolean).join(' ').trim();
  const etatCode = (user as ProfilAvecEtatCode).codeSecuriteDefini;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Content className="gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Avatar className="size-11 shrink-0">
              {/* Le texte alternatif etait « img ». */}
              {user.image && <Avatar.Image alt={nomComplet || user.username} src={user.image} />}
              <Avatar.Fallback>
                {(user.prenoms ?? user.nom ?? user.username)?.[0]?.toUpperCase() ?? '?'}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate text-base font-semibold text-foreground">
                {nomComplet || user.username}
              </h1>
              {roleLibelle && (
                <Chip color="default" size="sm" variant="soft">
                  <Chip.Label>{roleLibelle}</Chip.Label>
                </Chip>
              )}
            </div>
            {/*
             * La fiche dit elle-meme son impasse. Elle reste, mais sur la ligne
             * d'identite : sur sa propre ligne, elle pesait autant que les donnees.
             */}
            <p className="ms-auto text-xs text-muted">
              Ces informations sont tenues par l&apos;administration : pour les faire
              changer, adressez-vous à un administrateur.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Fait icone={IdCard} libelle="Identifiant">
              {user.username}
            </Fait>
            <Fait icone={AtSign} libelle="E-mail" titreComplet={user.email}>
              {/*
               * C'etait un <button> sans gestionnaire : il se donnait l'air cliquable
               * et ne faisait rien. Un e-mail qu'on lit se lit, il ne se clique pas.
               */}
              {user.email || '-'}
            </Fait>
            <Fait icone={CalendarDays} libelle="Compte créé le">
              <span className="tabular-nums">{formatDateFr(user.dateCreation)}</span>
            </Fait>
          </div>
        </Card.Content>
      </Card>

      {peutDefinirCode && <CodeSecuriteCard estDefini={etatCode} username={user.username} />}
    </div>
  );
};

export default UserProfile;
