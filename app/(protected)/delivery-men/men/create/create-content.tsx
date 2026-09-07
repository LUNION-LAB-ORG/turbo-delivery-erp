'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Avatar, Button, Switch } from '@heroui-v3/react';
import { ArrowLeft, Camera, FileText, Upload } from 'lucide-react';

import {
  ChampListe,
  ChampMotDePasse,
  ChampTexte,
} from '@/components/commons/champs-formulaire';
import { LienBouton } from '@/components/commons/LienBouton';
import { TitreSection } from '@/components/commons/TitreSection';
import {
  createTurboySchema,
  type CreateTurboyDTO,
  TYPE_DOCUMENT_OPTIONS,
  TYPE_VEHICULE_OPTIONS,
} from '@/features/turboys/schemas/create-turboy.schema';
import { createLivreur } from '@/features/turboys/actions/create-turboy.action';

/*
 * Les cinq titres de section etaient peints en ROUGE DE MARQUE par un `SectionTitle`
 * local — le sixieme exemplaire de ce composant dans le projet, tous identiques. Le
 * `TitreSection` partage en tient lieu.
 */

// ─── File upload zone ─────────────────────────────────────────────────────────
function UploadZone({
  label,
  preview,
  onChange,
  multiple,
}: {
  label: string;
  preview?: string | null;
  onChange: (files: FileList | null) => void;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      {/*
       * DEUX boutons pour le meme geste : le carre et le rond ouvraient tous les deux le
       * meme selecteur de fichier. Aucun des deux n'avait de nom accessible — au clavier,
       * on tabulait sur deux boutons muets qui faisaient la meme chose.
       */}
      <button
        aria-label={label}
        className="flex size-16 flex-col items-center justify-center rounded-lg border-2 border-dashed border-separator text-muted transition-colors hover:border-foreground/40 hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
        onClick={() => ref.current?.click()}
        type="button"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Aperçu du fichier choisi" className="size-full rounded-lg object-cover" src={preview} />
        ) : (
          <>
            <Upload aria-hidden="true" className="mb-1 size-5" />
            <span className="text-center text-[10px] leading-tight">{label}</span>
          </>
        )}
      </button>
      <input
        accept="image/*"
        className="hidden"
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
        ref={ref}
        type="file"
      />
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function CreateContent() {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cniFiles, setCniFiles] = useState<File[]>([]);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [contratFile, setContratFile] = useState<File | null>(null);
  // fiche d'identification (PDF ou image scannée)
  const [ficheIdentificationFile, setFicheIdentificationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTurboyDTO>({
    resolver: zodResolver(createTurboySchema),
    defaultValues: {
      nom: '',
      prenoms: '',
      birthDay: '',
      habitation: '',
      telephone: '',
      email: '',
      typeDocument: '',
      numeroCni: '',
      typeVehicule: '',
      nomVehicule: '',
      immatriculation: '',
      numeroPersonneAContacter: '',
      permisConduire: false,
      telephoneCompte: '',
      password: '',
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: CreateTurboyDTO) {
    setIsSubmitting(true);
    const fd = new FormData();
    // V48 : permisConduire est un boolean, donc `if (v)` skip "false".
    // On itère explicitement pour gérer boolean/string différemment.
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      // Map frontend schema field names to backend API field names
      const apiKey = k === 'numeroPersonneAContacter' ? 'personneAContacter' : k;
      fd.append(apiKey, typeof v === 'boolean' ? String(v) : (v as string));
    });
    if (avatarFile) fd.append('avatar', avatarFile);
    cniFiles.forEach((f, i) => fd.append(`cni_${i}`, f));
    if (vehicleFile) fd.append('vehiclePhoto', vehicleFile);
    if (contratFile) fd.append('contrat', contratFile);
    if (ficheIdentificationFile) fd.append('ficheIdentification', ficheIdentificationFile);

    const result = await createLivreur(fd);
    setIsSubmitting(false);
    if (result.status === 'success') {
      toast.success(result.message);
      router.push('/delivery-men/men');
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="pb-16">
      {/* Back link */}
      <Link
        href="/delivery-men/men"
        className="mb-4 flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour à la liste
      </Link>

      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold text-foreground">Créer un nouveau profil</h1>
      <p className="text-sm text-muted mb-8">Enregistrer un nouveau coursier dans le système</p>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {/* ── Photo de profil ── */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs p-6">
          <TitreSection>Photo de profil</TitreSection>
          <div className="flex items-center gap-5">
            {/*
             * L'emplacement de la photo etait un `<div onClick>` — donc rien que le
             * clavier atteigne — peint en `bg-primary/20` avec un « ? » en ROUGE DE
             * MARQUE au centre. Le seul vrai bouton, celui de l'appareil photo, n'avait
             * pas de nom accessible.
             */}
            <div className="relative">
              <Avatar className="size-16">
                {avatarPreview && <Avatar.Image alt="Photo choisie" src={avatarPreview} />}
                <Avatar.Fallback>?</Avatar.Fallback>
              </Avatar>
              <Button
                aria-label="Choisir une photo de profil"
                className="absolute -right-1 -bottom-1 rounded-full"
                isIconOnly
                onPress={() => avatarRef.current?.click()}
                size="sm"
                variant="primary"
              >
                <Camera aria-hidden="true" className="size-3" />
              </Button>
              <input accept="image/*" className="hidden" onChange={handleAvatarChange} ref={avatarRef} type="file" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Téléchargez une photo</p>
              <p className="text-xs text-muted">JPG, PNG ou GIF (max: 2MB)</p>
            </div>
          </div>

          {/* Contrat + Fiche d'identification */}
          <div className="mt-5 pt-5 border-t border-separator grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contrat */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Contrat du livreur</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-separator px-4 py-2.5 text-sm text-muted transition-colors hover:border-foreground/40 hover:text-foreground">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{contratFile ? contratFile.name : 'Importer le contrat (PDF, JPG, PNG)'}</span>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setContratFile(e.target.files[0]); }}
                />
              </label>
              {contratFile && (
                <p className="mt-1.5 text-xs text-success">{contratFile.name} sélectionné</p>
              )}
            </div>

            {/* Fiche d'identification Turboy */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Fiche d&apos;identification Turboy</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-separator px-4 py-2.5 text-sm text-muted transition-colors hover:border-foreground/40 hover:text-foreground">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>{ficheIdentificationFile ? ficheIdentificationFile.name : 'Importer la fiche (PDF, JPG, PNG)'}</span>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setFicheIdentificationFile(e.target.files[0]); }}
                />
              </label>
              {ficheIdentificationFile && (
                <p className="mt-1.5 text-xs text-success">
                  {ficheIdentificationFile.name} sélectionné
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Informations personnelles ── */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs p-6">
          <TitreSection>Informations personnelles</TitreSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="nom"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.nom?.message}
                  label="Nom"
                  onChange={field.onChange}
                  placeholder="Douze"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="prenoms"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.prenoms?.message}
                  label="Prénom"
                  onChange={field.onChange}
                  placeholder="Ousmane"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="birthDay"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.birthDay?.message}
                  label="Date de naissance"
                  onChange={field.onChange}
                  type="date"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="habitation"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.habitation?.message}
                  label="Domicile"
                  onChange={field.onChange}
                  placeholder="Koumassi Zone 4"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="telephone"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  aide="Laisser vide si le numéro n'est pas connu"
                  erreur={errors.telephone?.message}
                  label="Téléphone"
                  onChange={field.onChange}
                  placeholder="+225 0000000000"
                  type="tel"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.email?.message}
                  label="Adresse mail"
                  onChange={field.onChange}
                  placeholder="email@example.com"
                  type="email"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="numeroPersonneAContacter"
              control={control}
              render={({ field }) => (
                <div className="sm:col-span-2">
                  <ChampTexte
                    erreur={errors.numeroPersonneAContacter?.message}
                    label="Personne à contacter en cas d'urgence"
                    onChange={field.onChange}
                    placeholder="+225 0000000000"
                    type="tel"
                    valeur={field.value ?? ''}
                  />
                </div>
              )}
            />
          </div>

          {/* Permis de conduire */}
          <div className="mt-5 pt-5 border-t border-separator">
            <Controller
              name="permisConduire"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Permis de conduire</p>
                    <p className="text-xs text-muted">Le livreur détient-il un permis valide ?</p>
                  </div>
                  <Switch isSelected={field.value ?? false} onChange={field.onChange}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
              )}
            />
          </div>
        </section>

        {/* ── Document d'identité ── */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs p-6">
          <TitreSection>Document d&apos;identité</TitreSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Controller
              name="typeDocument"
              control={control}
              render={({ field }) => (
                <ChampListe
                  erreur={errors.typeDocument?.message}
                  label="Type de document"
                  onChange={field.onChange}
                  options={TYPE_DOCUMENT_OPTIONS}
                  placeholder="Rechercher un type"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="numeroCni"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.numeroCni?.message}
                  label="Numéro de la pièce"
                  onChange={field.onChange}
                  placeholder="CI0000000000"
                  valeur={field.value ?? ''}
                />
              )}
            />
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Photo de la pièce (max 2)</p>
            <UploadZone
              label="Importer"
              multiple
              onChange={(files) => {
                if (files) setCniFiles(Array.from(files).slice(0, 2));
              }}
            />
            {cniFiles.length > 0 && (
              <p className="mt-2 text-xs text-success">
                {cniFiles.length} fichier{cniFiles.length > 1 ? 's' : ''} sélectionné
                {cniFiles.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </section>

        {/* ── Informations du véhicule ── */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs p-6">
          <TitreSection>Informations du véhicule</TitreSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Controller
              name="typeVehicule"
              control={control}
              render={({ field }) => (
                <ChampListe
                  erreur={errors.typeVehicule?.message}
                  label="Type"
                  onChange={field.onChange}
                  options={TYPE_VEHICULE_OPTIONS}
                  placeholder="Rechercher un type"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="nomVehicule"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.nomVehicule?.message}
                  label="Nom du véhicule"
                  onChange={field.onChange}
                  placeholder="KTML 31"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="immatriculation"
              control={control}
              render={({ field }) => (
                <div className="sm:col-span-2">
                  <ChampTexte
                    erreur={errors.immatriculation?.message}
                    label="Immatriculation du véhicule"
                    onChange={field.onChange}
                    placeholder="CI0000000000"
                    valeur={field.value ?? ''}
                  />
                </div>
              )}
            />
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Photo du véhicule</p>
            <UploadZone
              label="Ajouter une photo"
              onChange={(files) => { if (files?.[0]) setVehicleFile(files[0]); }}
            />
            {vehicleFile && (
              <p className="mt-2 text-xs text-success">{vehicleFile.name} sélectionné</p>
            )}
          </div>
        </section>

        {/* ── Compte du livreur ── */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs p-6">
          <TitreSection>Compte du livreur</TitreSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="telephoneCompte"
              control={control}
              render={({ field }) => (
                <ChampTexte
                  erreur={errors.telephoneCompte?.message}
                  label="Numéro de téléphone"
                  onChange={field.onChange}
                  placeholder="0930000300"
                  type="tel"
                  valeur={field.value ?? ''}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <ChampMotDePasse
                  erreur={errors.password?.message}
                  label="Mot de passe"
                  onChange={field.onChange}
                  valeur={field.value ?? ''}
                />
              )}
            />
          </div>
        </section>

        {/* ── Footer actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {/* `as={Link}` etait une prop de la v2 : le Button v3 l'ignore et le lien
              disparaitrait. C'est un vrai <a href>, portant les classes du bouton. */}
          <LienBouton href="/delivery-men/men" variante="ghost">
            Annuler
          </LienBouton>
          <Button isPending={isSubmitting} type="submit" variant="primary">
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
