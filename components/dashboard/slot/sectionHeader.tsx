import { usePathname } from 'next/navigation'
import Link from 'next/link';
import { title } from '@/components/primitives';
import TextInputToUrl from '../price-liste/searchDelivery';

export default function SectionHeader() {

    const pathname = usePathname()
   
     const pushUrl = pathname ==='/delivery-men/slot' ?'/delivery-men/creneau-progression': pathname=== '/delivery-men/slot/turboys-assignes'? '/delivery-men/creneau-progression/turboys-assignes':''
   

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Créneaux</h1>
            </div>


            <div className='relative flex items-center gap-24 mmax-w-36 py-6'>
            <TextInputToUrl />
            <Link href={pushUrl} className={title({ size: 'h6', class: 'text-primary' })}>voir detail</Link>

            </div>
        </div>
    );
}
