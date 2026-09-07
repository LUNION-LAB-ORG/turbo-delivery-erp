'use client';

/* ═══════════════════════════════════════════════════════════════════════════════════
 * ⚠ DOUBLON TEMPORAIRE — NE PAS SUPPRIMER SANS LIRE CE QUI SUIT
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * La version DE RÉFÉRENCE de cette page vit désormais dans le portail partenaire V3 :
 *   turbo-partner-v3 → app/(public)/l/[token]/page.tsx
 *                    + features/localisation-client/**
 *
 * Ce fichier-ci n'est PAS l'original et n'a aucune vocation à durer. Il existe pour
 * UNE seule raison : le lien envoyé par SMS au client final pointe encore ICI.
 * Côté backend, `LocalisationClientService.lienPour()` construit
 *   {turbo.partenaire.base-lien-localisation}/l/{token}
 * et la valeur par défaut, codée en dur, est « https://admin-erp.turbodeliveryapp.com ».
 * Tant que cette variable n'a pas basculé, tout client qui ouvre son SMS atterrit sur
 * ce domaine — et donc sur ce fichier.
 *
 * HISTORIQUE — pourquoi cet avertissement est là :
 * le commit c32b4cb a sorti l'espace partenaire de l'ERP et a emporté cette page au
 * passage. Il est parti en production, et le lien SMS a répondu 404 aux clients en
 * cours de livraison. Le portail V3, lui, n'était pas encore déployé. Ce fichier est
 * la mesure de continuité qui rebouche ce trou.
 *
 * ⛔ CONDITION DE SUPPRESSION — une seule, et elle est vérifiable :
 * supprimer `app/l/` ET `app/api/partenaire/localisation-publique/` LE JOUR OÙ
 * TURBO_PARTENAIRE_BASE_LIEN_LOCALISATION (propriété `turbo.partenaire.base-lien-localisation`)
 * pointe sur https://partner.turbodeliveryapp.com en production, que le portail V3 y
 * répond, et qu'aucun lien émis vers l'ancien domaine n'est encore en vie.
 * Avant cela, supprimer = casser à nouveau des livraisons en cours.
 *
 * 🔁 EN ATTENDANT — RÈGLE DE MODIFICATION :
 * ne PAS faire évoluer cette page ici. Toute correction fonctionnelle se fait dans le
 * portail V3, puis se reporte ici si elle est urgente. Deux copies qui divergent en
 * silence, c'est le scénario à éviter : la version V3 est la seule qui fasse foi.
 *
 * Le contrat serveur, lui, est intangible dans les deux copies : le chemin `/l/[token]`
 * est une URL déjà partie par SMS. La renommer casse les liens déjà envoyés.
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Page PUBLIQUE de localisation du client final (EF-09.2) — ouverte depuis le SMS, sans
 * compte ni application. Deux moyens de se localiser : le GPS du navigateur, ou un repère
 * posé sur la carte. La position ne sert qu'à cette livraison (RG-11).
 *
 * Contraintes : mobile d'abord (le client est sur son téléphone), aucune donnée
 * personnelle affichée, gros boutons, textes simples.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

type Contexte = {
  reference: string;
  statut: 'ENVOYE' | 'RECU' | 'EXPIRE';
  dejaRecue: boolean;
  storeLatitude: number;
  storeLongitude: number;
};

type Etat =
  | { phase: 'chargement' }
  | { phase: 'invalide'; message: string }
  | { phase: 'saisie' }
  | { phase: 'envoi' }
  | { phase: 'confirme'; latitude: number; longitude: number; precisionM: number | null };

export default function LocalisationClientPage() {
  const { token } = useParams<{ token: string }>();
  const [contexte, setContexte] = useState<Contexte | null>(null);
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' });
  const [position, setPosition] = useState<{ lat: number; lng: number; precision: number | null; source: 'GPS' | 'CARTE' } | null>(null);
  const [repere, setRepere] = useState('');
  const [gpsErreur, setGpsErreur] = useState<string | null>(null);
  const carteRef = useRef<HTMLDivElement>(null);
  const carteObjets = useRef<{ map: google.maps.Map; marqueur: google.maps.Marker } | null>(null);

  useEffect(() => {
    fetch(`/api/partenaire/localisation-publique/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const corps = await r.json().catch(() => null);
          throw new Error(corps?.message ?? 'Lien invalide');
        }
        return r.json() as Promise<Contexte>;
      })
      .then((ctx) => {
        setContexte(ctx);
        setEtat(ctx.dejaRecue
          ? { phase: 'confirme', latitude: 0, longitude: 0, precisionM: null }
          : { phase: 'saisie' });
      })
      .catch((e: Error) => setEtat({ phase: 'invalide', message: e.message }));
  }, [token]);

  // Carte tactile : chargée seulement en phase de saisie, centrée sur le store.
  useEffect(() => {
    if (etat.phase !== 'saisie' || !contexte || !carteRef.current || carteObjets.current) {
      return;
    }
    const cle = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!cle) {
      return; // sans clé : le GPS reste disponible, la carte est simplement absente
    }
    const charger = () => {
      if (!carteRef.current || carteObjets.current) return;
      const centre = { lat: contexte.storeLatitude, lng: contexte.storeLongitude };
      const map = new google.maps.Map(carteRef.current, {
        center: centre,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });
      const marqueur = new google.maps.Marker({ map, position: centre, draggable: true });
      const poser = (pos: google.maps.LatLng | null | undefined) => {
        if (!pos) return;
        marqueur.setPosition(pos);
        setPosition({ lat: pos.lat(), lng: pos.lng(), precision: null, source: 'CARTE' });
      };
      map.addListener('click', (e: google.maps.MapMouseEvent) => poser(e.latLng));
      marqueur.addListener('dragend', () => poser(marqueur.getPosition()));
      carteObjets.current = { map, marqueur };
    };
    if (typeof google !== 'undefined' && google.maps) {
      charger();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${cle}`;
    script.async = true;
    script.onload = charger;
    document.head.appendChild(script);
  }, [etat.phase, contexte]);

  const partagerGps = useCallback(() => {
    setGpsErreur(null);
    if (!navigator.geolocation) {
      setGpsErreur('Votre téléphone ne permet pas la géolocalisation — posez le repère sur la carte.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy, source: 'GPS' as const };
        setPosition(pos);
        if (carteObjets.current) {
          const latLng = new google.maps.LatLng(pos.lat, pos.lng);
          carteObjets.current.marqueur.setPosition(latLng);
          carteObjets.current.map.panTo(latLng);
          carteObjets.current.map.setZoom(17);
        }
      },
      () => setGpsErreur('Position refusée — autorisez la localisation, ou posez le repère sur la carte.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, []);

  async function envoyer() {
    if (!position) return;
    setEtat({ phase: 'envoi' });
    try {
      const reponse = await fetch(`/api/partenaire/localisation-publique/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
          precisionM: position.precision,
          repere: repere.trim() || null,
          source: position.source,
        }),
      });
      if (!reponse.ok) {
        const corps = await reponse.json().catch(() => null);
        throw new Error(corps?.message ?? 'Envoi impossible — réessayez');
      }
      setEtat({ phase: 'confirme', latitude: position.lat, longitude: position.lng, precisionM: position.precision });
    } catch (e) {
      setEtat({ phase: 'saisie' });
      setGpsErreur(e instanceof Error ? e.message : 'Envoi impossible — réessayez');
    }
  }

  // ---------------------------------------------------------------- rendus

  if (etat.phase === 'chargement') {
    return <Cadre><p className="animate-pulse text-center text-muted">Chargement…</p></Cadre>;
  }

  if (etat.phase === 'invalide') {
    return (
      <Cadre>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Ce lien n&apos;est plus valable</p>
          <p className="mt-2 text-sm text-muted">{etat.message}</p>
        </div>
      </Cadre>
    );
  }

  if (etat.phase === 'confirme') {
    return (
      <Cadre reference={contexte?.reference}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</span>
          <p className="text-lg font-semibold text-foreground">Position envoyée !</p>
          <p className="text-sm text-muted">
            Votre livreur Turbo voit maintenant votre position exacte
            {etat.precisionM ? ` (précision ~${Math.round(etat.precisionM)} m)` : ''}.
          </p>
          <button
            className="mt-2 rounded-xl border border-separator px-4 py-3 text-sm font-medium text-foreground"
            onClick={() => {
              setEtat({ phase: 'saisie' });
              setPosition(null);
            }}
          >
            Modifier ma position
          </button>
          <p className="text-xs text-muted">Modifiable jusqu&apos;à l&apos;enlèvement de votre commande.</p>
        </div>
      </Cadre>
    );
  }

  return (
    <Cadre reference={contexte?.reference}>
      <p className="text-center text-lg font-semibold text-foreground">Où vous livre-t-on ?</p>

      <button
        onClick={partagerGps}
        className="w-full rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-white active:opacity-80"
        style={{ minHeight: 56 }}
      >
        📍 Partager ma position GPS
      </button>
      {position?.source === 'GPS' && (
        <p className="text-center text-sm text-green-600">
          Position captée{position.precision ? ` — précision ~${Math.round(position.precision)} m` : ''}
        </p>
      )}
      {gpsErreur && <p className="text-center text-sm text-amber-600">{gpsErreur}</p>}

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-surface-tertiary" /> ou sur la carte <span className="h-px flex-1 bg-surface-tertiary" />
      </div>

      <div ref={carteRef} className="h-64 w-full overflow-hidden rounded-2xl border border-separator bg-surface-secondary" />
      {position?.source === 'CARTE' && (
        <p className="text-center text-sm text-green-600">Repère posé — vous pouvez le déplacer.</p>
      )}

      <input
        value={repere}
        onChange={(e) => setRepere(e.target.value)}
        maxLength={200}
        placeholder="Repère (facultatif) : immeuble, étage, « portail bleu »…"
        className="w-full rounded-xl border border-separator px-4 py-3 text-sm"
      />

      <button
        onClick={envoyer}
        disabled={!position || (etat as Etat).phase === 'envoi'}
        className="w-full rounded-2xl bg-foreground px-4 py-4 text-base font-semibold text-background disabled:opacity-40"
        style={{ minHeight: 56 }}
      >
        Envoyer ma position
      </button>

      <p className="text-center text-xs text-muted">
        Votre position n&apos;est utilisée que pour cette livraison, jamais après.
      </p>
    </Cadre>
  );
}

function Cadre({ children, reference }: { children: React.ReactNode; reference?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface-secondary p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 mt-2 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">T</span>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">TURBO DELIVERY</p>
            {reference && <p className="text-xs text-muted">Course {reference}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-separator bg-surface p-5 shadow-xs">{children}</div>
      </div>
    </div>
  );
}
