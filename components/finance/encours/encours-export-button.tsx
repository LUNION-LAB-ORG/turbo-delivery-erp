'use client';

import { useState } from 'react';
import { Button, Dropdown, Spinner } from '@heroui-v3/react';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { encoursAPI, IEncoursParams } from '@/features/encours';

/** Export serveur du releve (PDF OpenPDF / Excel POI) : telecharge le blob renvoye. */
export function EncoursExportButton({
  params,
  isDisabled,
}: {
  params: IEncoursParams;
  isDisabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setLoading(true);
    const id = toast.loading('Génération du fichier…');
    try {
      const blob = await encoursAPI.exporter(params, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const moisSuffix = params.mois ? `_${params.mois}` : '';
      a.download = `encours_${params.annee}${moisSuffix}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export prêt', { id });
    } catch (error) {
      toast.error("Échec de l'export", {
        id,
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    /*
     * Le `Button` est enfant DIRECT de `Dropdown` : `Dropdown.Trigger` rend son propre
     * `<button>` et en produisait un dans un bouton. `isLoading`, `startContent` et
     * `endContent` sont des props de la v2, ignorees EN SILENCE par la v3 : le bouton
     * avait perdu ses deux icones et son indicateur d'attente.
     */
    <Dropdown>
      <Button isDisabled={isDisabled} isPending={loading} size="sm" variant="outline">
        {loading ? <Spinner size="sm" /> : <Download aria-hidden="true" className="size-4" />}
        Exporter
        <ChevronDown aria-hidden="true" className="size-4" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label="Format d'export"
          onAction={(key) => handleExport(key as 'pdf' | 'xlsx')}
        >
          <Dropdown.Item id="pdf">PDF (relevé)</Dropdown.Item>
          <Dropdown.Item id="xlsx">Excel (valeurs)</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
