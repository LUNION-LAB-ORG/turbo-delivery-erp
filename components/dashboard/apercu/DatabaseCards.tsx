import { title } from '@/components/primitives';
import { formatNumber } from '@/utils/formatNumber';
import { Divider } from "@heroui/react";

export default function DatabaseCards({ items }: { items: { label: string; value: number }[] }) {
    return (
        <div className="flex gap-4 overflow-auto py-4 ">
            {items.map((item, index) => (
                <div key={index} className="shrink-0 min-w-40 flex justify-between items-center gap-4">
                    <CardContent {...item} />
                    {(index != items.length - 1 || index == 0) && <Divider orientation="vertical" />}
                </div>
            ))}
        </div>
    );
}

export function CardContent({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="flex flex-col justify-between gap-2">
                <h3 className={title({ size: 'h6', class: 'text-primary' })}>{label}</h3>
                <p className={title({ size: 'h4' })}>{formatNumber(value ?? 0)}</p>
            </div>
        </div>
    );
}
