'use client';

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Button, Drawer, Spinner } from '@heroui-v3/react';
import { Eye } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import FacturePdf from '@/components/finance/recouvrements/factures/pdf/facture-pdf';
import { useFactureDetailQuery } from '@/features/recouvrements/queries/facture.query';

interface FacturePdfViewerProps {
  factureId: string;
}

/**
 * Le tiroir venait de shadcn (vaul), une quatrieme mecanique de panneau a cote du
 * `Drawer` de la v3 deja utilise par les autres tiroirs de l'ERP.
 *
 * <p>Le declencheur etait un bouton ICONE sans nom accessible : une colonne de dix
 * factures donnait dix boutons annonces « bouton » par un lecteur d'ecran. Il porte
 * desormais le libelle du geste.</p>
 */
function FacturePdfViewer({ factureId }: FacturePdfViewerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const {
    data: factureDetail,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useFactureDetailQuery(factureId, isOpen);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <Button aria-label="Voir la facture" isIconOnly onPress={onOpen} size="sm" variant="outline">
        <Eye aria-hidden="true" className="size-4" />
      </Button>

      <Drawer isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            {/* La v3 pose `w-80 sm:w-96` sur le panneau lateral : 384 px ne rendent pas
                une page A4 lisible. */}
            <Drawer.Dialog className="w-full max-w-[95vw] sm:w-[52rem]">
              <Drawer.Header className="pe-8">
                <Drawer.Heading className="text-base font-semibold text-foreground">
                  Détails de la facture
                </Drawer.Heading>
                <Drawer.CloseTrigger />
              </Drawer.Header>

              <Drawer.Body className="flex flex-col">
                {isLoading && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2">
                    <Spinner />
                    <p className="text-sm text-muted">Lecture de la facture…</p>
                  </div>
                )}

                {/* Le message brut de l'exception remplacait la page : il ne disait rien
                    d'actionnable et n'offrait pas de reessayer. */}
                {!isLoading && isError && (
                  <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="la facture" />
                )}

                {!isLoading && !isError && factureDetail && (
                  <PDFViewer className="min-h-0 w-full flex-1 rounded-md border border-separator">
                    <FacturePdf factureDetail={factureDetail} />
                  </PDFViewer>
                )}
              </Drawer.Body>

              <Drawer.Footer>
                <Button onPress={onClose} size="sm" variant="ghost">
                  Fermer
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  );
}

export default FacturePdfViewer;
