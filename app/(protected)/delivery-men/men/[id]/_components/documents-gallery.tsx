'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Modal, Tooltip } from '@heroui-v3/react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  X,
} from 'lucide-react';

import { SectionTitle } from './section-title';

export interface DocItem {
  key: string;
  label: string;
  /** URL ABSOLUE (déjà résolue vers le bon endpoint). */
  url: string;
}

function estPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function extensionDepuisUrl(url: string): string {
  const m = url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

/** URL du proxy ERP : affichage INLINE (PDF/image affichés, jamais téléchargés). */
function urlInline(url: string): string {
  return `/api/fichier?u=${encodeURIComponent(url)}`;
}

/** URL du proxy ERP en mode TÉLÉCHARGEMENT (attachment + nom de fichier). */
function urlTelechargement(url: string, nom: string): string {
  return `/api/fichier?u=${encodeURIComponent(url)}&dl=1&nom=${encodeURIComponent(nom)}`;
}

/** Télécharge via le proxy (même origine → pas de CORS, disposition attachment fiable). */
function telecharger(url: string, nomFichier: string) {
  const a = document.createElement('a');
  a.href = urlTelechargement(url, nomFichier);
  a.rel = 'noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DocumentsGallery({ docs }: { docs: DocItem[] }) {
  const items = useMemo(() => docs.filter((d) => !!d.url), [docs]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);

  const doc = openIndex != null ? items[openIndex] : null;

  const go = useCallback(
    (delta: number) => {
      setZoom(false);
      setOpenIndex((i) => {
        if (i == null) return i;
        const n = items.length;
        return ((i + delta) % n + n) % n;
      });
    },
    [items.length],
  );

  // Navigation clavier dans la visionneuse.
  useEffect(() => {
    if (openIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') setOpenIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, go]);

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-separator bg-surface p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Documents du livreur</SectionTitle>
        {/* Le compteur etait peint en ROUGE DE MARQUE : un nombre de pieces n'appelle
            aucune action. */}
        <Chip size="sm" variant="soft">
          <Chip.Label>
            {items.length} document{items.length > 1 ? 's' : ''}
          </Chip.Label>
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((d, i) => {
          const pdf = estPdf(d.url);
          return (
            <div key={d.key} className="group flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setZoom(false);
                  setOpenIndex(i);
                }}
                className="relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-separator bg-surface-secondary transition-all hover:border-foreground/30 hover:shadow-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Voir ${d.label}`}
              >
                {pdf ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-secondary text-muted">
                    <FileText className="h-9 w-9" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">PDF</span>
                  </div>
                ) : (
                  <DocThumbnail url={d.url} label={d.label} />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                    <Eye className="h-3.5 w-3.5" /> Agrandir
                  </span>
                </div>
              </button>

              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-medium text-muted" title={d.label}>
                  {d.label}
                </span>
                <Tooltip>
                  <Button
                    aria-label={`Télécharger ${d.label}`}
                    className="shrink-0"
                    isIconOnly
                    onPress={() => telecharger(d.url, `${d.label}.${extensionDepuisUrl(d.url)}`)}
                    size="sm"
                    variant="ghost"
                  >
                    <Download aria-hidden="true" className="size-4" />
                  </Button>
                  <Tooltip.Content>Télécharger</Tooltip.Content>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {/*
       * Visionneuse plein ecran.
       *
       * <p>Elle garde volontairement sa chrome SOMBRE dans les deux themes : une piece
       * d'identite ou un contrat scanne se regarde sur un fond neutre et fonce, comme dans
       * toutes les visionneuses. C'est le seul endroit de l'ERP ou une surface ne suit pas
       * le theme, et c'est un choix, pas un oubli.</p>
       */}
      <Modal isOpen={openIndex != null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-6xl bg-neutral-900">
              {doc && (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {estPdf(doc.url) ? (
                        <FileText aria-hidden="true" className="size-4 shrink-0 text-white/60" />
                      ) : (
                        <ImageIcon aria-hidden="true" className="size-4 shrink-0 text-white/60" />
                      )}
                      <span className="truncate text-sm font-medium text-white">{doc.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-white/40">
                        {(openIndex ?? 0) + 1} / {items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        className="bg-white/10 text-white hover:bg-white/20"
                        onPress={() =>
                          telecharger(doc.url, `${doc.label}.${extensionDepuisUrl(doc.url)}`)
                        }
                        size="sm"
                        variant="ghost"
                      >
                        <Download aria-hidden="true" className="size-4" />
                        Télécharger
                      </Button>
                      <Tooltip>
                        <Button
                          aria-label="Ouvrir dans un onglet"
                          className="text-white hover:bg-white/20"
                          isIconOnly
                          onPress={() => window.open(urlInline(doc.url), '_blank', 'noreferrer')}
                          size="sm"
                          variant="ghost"
                        >
                          <ExternalLink aria-hidden="true" className="size-4" />
                        </Button>
                        <Tooltip.Content>Ouvrir dans un onglet</Tooltip.Content>
                      </Tooltip>
                      <Tooltip>
                        <Button
                          aria-label="Fermer"
                          className="text-white hover:bg-white/20"
                          isIconOnly
                          onPress={() => setOpenIndex(null)}
                          size="sm"
                          variant="ghost"
                        >
                          <X aria-hidden="true" className="size-5" />
                        </Button>
                        <Tooltip.Content>Fermer</Tooltip.Content>
                      </Tooltip>
                    </div>
                  </div>

                  <Modal.Body className="p-0">
                    <div className="relative flex min-h-[60vh] items-center justify-center">
                      {items.length > 1 && (
                        <>
                          <Button
                            aria-label="Précédent"
                            className="absolute left-2 z-10 rounded-full bg-white/10 text-white hover:bg-white/25"
                            isIconOnly
                            onPress={() => go(-1)}
                            variant="ghost"
                          >
                            <ChevronLeft aria-hidden="true" className="size-6" />
                          </Button>
                          <Button
                            aria-label="Suivant"
                            className="absolute right-2 z-10 rounded-full bg-white/10 text-white hover:bg-white/25"
                            isIconOnly
                            onPress={() => go(1)}
                            variant="ghost"
                          >
                            <ChevronRight aria-hidden="true" className="size-6" />
                          </Button>
                        </>
                      )}

                      {estPdf(doc.url) ? (
                        <iframe
                          className="h-[75vh] w-full rounded-lg bg-surface"
                          src={urlInline(doc.url)}
                          title={doc.label}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={doc.label}
                          className={`rounded-lg transition-transform duration-200 ${
                            zoom
                              ? 'max-h-none max-w-none cursor-zoom-out'
                              : 'max-h-[75vh] max-w-full cursor-zoom-in object-contain'
                          }`}
                          onClick={() => setZoom((z) => !z)}
                          src={doc.url}
                        />
                      )}
                    </div>
                  </Modal.Body>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  );
}

/** Miniature image avec repli icône si le chargement échoue. */
function DocThumbnail({ url, label }: { url: string; label: string }) {
  const [erreur, setErreur] = useState(false);
  if (erreur) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-secondary text-muted">
        <ImageIcon className="h-9 w-9" />
        <span className="px-2 text-center text-[10px] font-medium">Aperçu indisponible</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label}
      loading="lazy"
      onError={() => setErreur(true)}
      className="h-full w-full object-cover"
    />
  );
}
