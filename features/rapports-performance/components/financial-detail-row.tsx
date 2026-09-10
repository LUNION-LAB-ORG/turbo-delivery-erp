import { cn } from '@/lib/utils';

interface FinancialDetailRowProps {
  label: string;
  value: string;
  rowClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  withBorder?: boolean;
}

export function FinancialDetailRow({
  label,
  value,
  rowClassName = '',
  labelClassName = 'text-muted',
  valueClassName = 'font-semibold text-foreground',
  withBorder = false,
}: FinancialDetailRowProps) {
  const borderClassName = withBorder ? 'border-b border-separator' : '';

  return (
    <div className={`flex items-center text-medium justify-between py-3 ${borderClassName} ${rowClassName}`.trim()}>
      <span className={labelClassName}>{label}</span>
      {/* `tabular-nums` est pose ICI et non dans la valeur par defaut : les quatre lignes
          empilees sont quatre montants qu'on compare a l'oeil, et un appelant qui surcharge
          `valueClassName` pour peindre son chiffre ne doit pas pouvoir emporter la chasse
          fixe avec lui. L'alignement a droite, lui, vient deja du `justify-between`. */}
      <span className={cn('text-lg tabular-nums', valueClassName)}>{value}</span>
    </div>
  );
}

