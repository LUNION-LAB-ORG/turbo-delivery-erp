'use client';

import React, { useState } from 'react';
import { Button } from '@heroui-v3/react';

import Content from '@/app/(protected)/external_delivery/[course_id]/content';
import { VueTiroirCourse } from '@/app/(protected)/external_delivery/[course_id]/tiroir-course';
import { AbilityContext } from '@/lib/casl/ability-context';
import { defineAbilityFor } from '@/lib/casl/ability';
import type { CourseExterneDetail, LivreurDisponible } from '@/types/models';

/**
 * Le banc de l'ecran DETAIL D'UNE COURSE EXTERNE.
 *
 * <p>Il monte les VRAIS composants ; seule la lecture reseau est remplacee par des donnees
 * d'exemple. La barre du haut n'appartient pas a l'ecran : elle sert a le regarder dans
 * les etats qu'on oublie de verifier, l'annulation, la course sans livreur, la course a
 * une seule livraison, le chargement et l'echec du tiroir.</p>
 */

const LIVREURS: LivreurDisponible[] = Array.from({ length: 6 }).map((_, i) => ({
  avatarUrl: '',
  livreurId: `liv-${i}`,
  nomComplet: ['KOUASSI Yao', 'TRAORE Adama', 'N GUESSAN Paul', 'DIABATE Sekou', 'KONE Aya', 'BAMBA Ismael'][i],
  position: { latitude: 5.35 + i / 100, longitude: -4.02 - i / 100 },
  telephone: `07 0${i} 12 34 5${i}`,
}));

function commande(i: number, statut: string) {
  return {
    destinataire: {
      contact: `05 4${i} 88 21 0${i}`,
      nomComplet: ['ASSOUMOU Marie', 'YEBOUE Franck', 'SANGARE Fatou'][i % 3],
    },
    fraisLivraison: 1000 + i * 500,
    id: `cmd-${i}`,
    libelle: i % 2 === 0 ? '2 menus poulet braise, 1 attieke supplementaire' : '',
    lieuLivraison: {
      address: ['Cocody Riviera 3, rue des Jardins', 'Plateau, avenue Franchet d Esperey', 'Marcory Zone 4, boulevard VGE'][i % 3],
      latitude: 5.36 + i / 200,
      longitude: -4.01 - i / 200,
    },
    lieuRecuperation: { address: 'Cocody Angre 8e tranche', latitude: 5.4021, longitude: -3.9876 },
    livraisonPaye: i === 1,
    modePaiement: ['ESPECES', 'WAVE', 'ORANGE MONEY'][i % 3],
    numero: `CMD-2609${String(140 + i)}`,
    prix: 8500 + i * 2750,
    statut,
    zone: ['Riviera 3', 'Plateau centre', 'Zone 4'][i % 3],
  };
}

function courseExemple(options: {
  avecLivreur: boolean;
  nbCommandes: number;
  statut: string;
}): CourseExterneDetail {
  const statutCommande =
    options.statut === 'TERMINER'
      ? 'TERMINER'
      : options.statut === 'ANNULER'
        ? 'ANNULER'
        : options.statut === 'EN_COURS'
          ? 'EN_COURS_LIVRAISON'
          : 'EN_ATTENTE_RECUPERATION';
  const commandes = Array.from({ length: options.nbCommandes }).map((_, i) => commande(i, i === 1 ? 'EN_ATTENTE_VERSEMENT' : statutCommande));
  return {
    code: 'CE-2609-0142',
    commandes,
    dateHeureDebut: '2026-09-08T10:12:00',
    dateHeureFin: options.statut === 'TERMINER' ? '2026-09-08T11:03:00' : null,
    id: 'course-exemple',
    livreur: options.avecLivreur
      ? {
          avatarUrl: '',
          id: 'liv-9',
          matricule: 'TB-0412',
          nom: 'KOUAME',
          prenoms: 'Serge Olivier',
          telephone: '07 58 44 12 90',
        }
      : null,
    restaurant: {
      commune: 'Cocody',
      id: 'resto-1',
      latitude: 5.4021,
      localisation: 'Angre 8e tranche, carrefour Saint Jean',
      logo: '',
      longitude: -3.9876,
      nomEtablissement: 'Chez Tantie Adjoua',
      telephone: '27 22 41 08 90',
    },
    statut: options.statut,
    total: 0,
  };
}

const STATUTS = ['EN_ATTENTE', 'VALIDER', 'EN_COURS', 'TERMINER', 'ANNULER'];

export default function ApercuCourseExterne() {
  const [statut, setStatut] = useState('EN_ATTENTE');
  const [nbCommandes, setNbCommandes] = useState(2);
  const [avecLivreur, setAvecLivreur] = useState(false);
  const [tiroir, setTiroir] = useState<'ferme' | 'charge' | 'chargement' | 'erreur'>('ferme');
  const [cadre, setCadre] = useState(true);

  const course = courseExemple({ avecLivreur, nbCommandes, statut });

  return (
    <AbilityContext.Provider value={defineAbilityFor('DG')}>
      <div className="min-h-screen bg-background p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-separator bg-surface-secondary p-3 text-xs">
          {STATUTS.map((s) => (
            <Button key={s} onPress={() => setStatut(s)} size="sm" variant={s === statut ? 'primary' : 'outline'}>
              {s}
            </Button>
          ))}
          <span className="mx-2 h-5 w-px bg-separator" />
          {[1, 2, 3].map((n) => (
            <Button key={n} onPress={() => setNbCommandes(n)} size="sm" variant={n === nbCommandes ? 'primary' : 'outline'}>
              {n} cmd
            </Button>
          ))}
          <span className="mx-2 h-5 w-px bg-separator" />
          <Button onPress={() => setAvecLivreur((v) => !v)} size="sm" variant="outline">
            {avecLivreur ? 'Retirer le livreur' : 'Assigner un livreur'}
          </Button>
          <span className="mx-2 h-5 w-px bg-separator" />
          <Button onPress={() => setTiroir('charge')} size="sm" variant="outline">
            Tiroir
          </Button>
          <Button onPress={() => setTiroir('chargement')} size="sm" variant="outline">
            Tiroir en lecture
          </Button>
          <Button onPress={() => setTiroir('erreur')} size="sm" variant="outline">
            Tiroir en echec
          </Button>
          <span className="mx-2 h-5 w-px bg-separator" />
          <Button onPress={() => setCadre((v) => !v)} size="sm" variant="outline">
            {cadre ? 'Pleine largeur' : 'Cadre 1000 x 563'}
          </Button>
        </div>

        <div
          className={
            cadre
              ? 'h-[563px] w-[1000px] overflow-auto border border-separator bg-background'
              : 'w-full border border-separator bg-background'
          }
        >
          {/* Le `p-6` reproduit la zone de contenu de la coquille ERP. */}
          <div className="p-6">
            <Content course={course} delivers={LIVREURS} />
          </div>
        </div>

        <VueTiroirCourse
          chargement={tiroir === 'chargement'}
          course={tiroir === 'charge' ? course : null}
          courseId="course-exemple"
          delivers={LIVREURS}
          erreur={tiroir === 'erreur'}
          onFermer={() => setTiroir('ferme')}
          onRelire={() => setTiroir('charge')}
          ouvert={tiroir !== 'ferme'}
        />
      </div>
    </AbilityContext.Provider>
  );
}
