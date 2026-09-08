'use client';

import { Button, Card, Chip } from '@heroui-v3/react';
import { CircleAlert, CircleCheck, KeyRound, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { ChampMotDePasse } from '@/components/commons/champs-formulaire';
import { definirCodeSecurite } from '@/src/actions/users.actions';

const LONGUEUR_CODE = 4;

/**
 * Un fait a savoir sur le code, sous son libelle.
 *
 * <p>`alerte` teinte le fait en danger : reserve au cas ou l'on SAIT qu'aucun code
 * n'est defini, parce qu'alors le fait cesse d'informer et appelle le geste.</p>
 */
function Fait({
  alerte,
  children,
  libelle,
}: {
  alerte?: boolean;
  children: React.ReactNode;
  libelle: string;
}) {
  return (
    <div
      className={[
        'rounded-lg border p-3',
        alerte ? 'border-danger/30 bg-danger/5' : 'border-separator bg-surface-secondary',
      ].join(' ')}
    >
      <p
        className={[
          'flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase',
          alerte ? 'text-danger-soft-foreground' : 'text-muted',
        ].join(' ')}
      >
        {alerte && <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />}
        {libelle}
      </p>
      <p className="mt-1 text-sm text-foreground">{children}</p>
    </div>
  );
}

/*
 * LE CODE SE SAISIT MASQUE.
 *
 * <p>Une version precedente l'avait mis en quatre cases distinctes, `InputOTP`, en
 * faisant valoir qu'un code de quatre chiffres a une forme et que la masquer cachait
 * ses propres fautes de frappe. La forme est un vrai gain, l'argument sur le masquage
 * n'en est pas un : `InputOTP.Slot` rend le caractere EN CLAIR, il n'expose aucun
 * moyen de le masquer — et ce code autorise la suppression d'une deduction, c'est-a-dire
 * de l'argent. L'ERP se tient sur des postes partages, en salle : la supervision compte
 * quatre sessions simultanees a cet instant meme. Un secret ne se tape pas en clair
 * parce que celui qui le tape est seul en theorie.</p>
 *
 * <p>Le champ partage repond a la seule objection valable : il est masque par defaut et
 * porte un bouton « afficher » que l'operateur actionne quand il veut se relire. Le
 * masquage est le defaut, la relecture est un geste.</p>
 */

/**
 * Le code de securite (4 chiffres) du DG et du DGA.
 *
 * <h3>Le seul geste de la page Parametres</h3>
 * <p>La carte etait releguee dans une colonne d'un tiers, a cote d'une fiche de profil
 * en lecture qui prenait les deux autres. Elle prend maintenant toute la largeur, et
 * elle repond aux trois questions qu'on se pose devant elle avant de taper quoi que
 * ce soit : ce que le code est, quand il est demande, et s'il est deja defini.</p>
 *
 * <h3>Ce que l'ecran ne savait pas dire</h3>
 * <p>Quand AUCUN code n'etait defini, l'ecran etait rigoureusement identique au cas
 * ou il l'etait : meme titre, meme formulaire, aucun etat. Or main-backend est
 * fail-closed, et il verifie le code saisi contre ceux de TOUS les DG/DGA actifs :
 * tant qu'aucun d'eux n'en a defini, plus personne ne peut supprimer une deduction,
 * et rien nulle part ne le disait. La consequence est ecrite en clair, dans les deux
 * cas, parce qu'elle est vraie dans les deux cas.</p>
 *
 * <p>La pastille d'etat, elle, ne s'allume que si le serveur le dit : `codeSecurite`
 * est `@JsonIgnore` cote erp-backend et le profil ne porte pas encore le booleen
 * derive. Affirmer « pas defini » sur cette seule absence serait une invention.</p>
 */
export function CodeSecuriteCard({
  estDefini,
  username,
}: {
  /** `undefined` : le serveur ne le dit pas encore. La carte n'affirme alors rien. */
  estDefini?: boolean;
  username: string;
}) {
  const [motDePasse, setMotDePasse] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  /*
   * L'enregistrement vient de prouver qu'un code existe : la pastille le dit sans
   * attendre un rechargement du profil. Le succes doit rester lisible apres la
   * disparition du toast.
   */
  const [defini, setDefini] = useState(estDefini);

  /*
   * Trois libelles, parce qu'il y a trois etats et non deux : tant que le serveur
   * ne dit pas si un code existe, « Definir » comme « Changer » affirmeraient l'un
   * des deux. « Enregistrer » est vrai dans tous les cas.
   */
  const libelleBouton =
    defini === undefined ? 'Enregistrer le code' : defini ? 'Changer le code' : 'Définir le code';

  const codeComplet = code.length === LONGUEUR_CODE;
  const confirmationComplete = confirmation.length === LONGUEUR_CODE;
  const discordance = codeComplet && confirmationComplete && code !== confirmation;
  // erp-backend refuse en CS12 un code egal au mot de passe : le dire ici evite un
  // aller-retour pour une regle qu'on peut verifier sur place.
  const codeEgalMotDePasse = codeComplet && motDePasse.length > 0 && code === motDePasse;

  const enregistrer = async () => {
    if (!/^\d{4}$/.test(code)) {
      toast.error('Le code doit faire exactement 4 chiffres.');
      return;
    }
    if (code !== confirmation) {
      toast.error('Le code et sa confirmation ne sont pas identiques.');
      return;
    }
    setEnCours(true);
    const res = await definirCodeSecurite({ username, password: motDePasse, code });
    setEnCours(false);
    if (res.status === 'success') {
      toast.success('Code de sécurité enregistré', {
        description: 'Ce code sera exigé pour les actions finance sensibles.',
      });
      setDefini(true);
      setMotDePasse('');
      setCode('');
      setConfirmation('');
    } else {
      toast.error('Enregistrement refusé', { description: res.message });
    }
  };

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between gap-3">
        <Card.Title className="flex items-center gap-2 text-base">
          <ShieldCheck aria-hidden="true" className="size-4 text-muted" />
          Code de sécurité
        </Card.Title>
        {defini !== undefined && (
          <Chip color={defini ? 'success' : 'danger'} size="sm" variant="soft">
            <Chip.Label>{defini ? 'Votre code est défini' : 'Aucun code défini'}</Chip.Label>
          </Chip>
        )}
      </Card.Header>

      <Card.Content className="gap-4">
        {/*
         * Les trois choses qu'on veut savoir avant de taper quoi que ce soit. La
         * troisieme est la seule que l'ecran ne disait NULLE PART, alors qu'elle est
         * vraie dans tous les cas : le code saisi est confronte a ceux de TOUS les
         * DG/DGA actifs. Un seul code defini dans l'entreprise suffit donc a debloquer
         * l'action, et n'en avoir aucun la bloque pour tout le monde.
         */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Fait libelle="Ce que c'est">
            Quatre chiffres, <span className="font-medium">différents de votre mot de passe</span>.
            Votre mot de passe est demandé pour le définir ou le changer.
          </Fait>
          <Fait libelle="Quand il est demandé">
            À la suppression d&apos;une déduction partenaire, dans{' '}
            <span className="font-medium">Comptabilité &rsaquo; Encours</span>.
          </Fait>
          <Fait alerte={defini === false} libelle="Sans code défini">
            Le code est vérifié contre ceux de tous les DG et DGA actifs : tant
            qu&apos;aucun d&apos;eux n&apos;en a défini, la suppression est refusée à tout le
            monde.
          </Fait>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            enregistrer();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChampMotDePasse
              autoComplete="current-password"
              erreur={codeEgalMotDePasse ? 'Le code doit être différent du mot de passe.' : undefined}
              label="Votre mot de passe"
              onChange={setMotDePasse}
              valeur={motDePasse}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ChampMotDePasse
                label="Nouveau code (4 chiffres)"
                onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, LONGUEUR_CODE))}
                placeholder="••••"
                valeur={code}
              />
              <ChampMotDePasse
                label="Confirmation"
                onChange={(v) => setConfirmation(v.replace(/\D/g, '').slice(0, LONGUEUR_CODE))}
                placeholder="••••"
                valeur={confirmation}
              />
            </div>
          </div>

          {/*
           * La discordance ne se voyait qu'apres l'envoi, dans un toast qui passe.
           * Elle se lit ici des que les deux codes sont complets. Le conteneur est
           * STABLE : un `aria-live` qui apparait en meme temps que son texte n'est
           * pas annonce, seul un conteneur deja monte l'est.
           */}
          {/* `empty:hidden` : sans message, le conteneur ne doit pas consommer un gap. */}
          <div aria-live="polite" className="empty:hidden">
            {discordance && (
              <p className="flex items-center gap-1.5 text-sm text-danger">
                <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                Le code et sa confirmation ne sont pas identiques.
              </p>
            )}
            {!discordance && codeComplet && confirmationComplete && !codeEgalMotDePasse && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
                Les deux saisies concordent.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              isDisabled={
                !motDePasse || !codeComplet || !confirmationComplete || discordance || codeEgalMotDePasse
              }
              isPending={enCours}
              type="submit"
              variant="primary"
            >
              <KeyRound aria-hidden="true" className="size-4" />
              {libelleBouton}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
