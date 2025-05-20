import { usePathname } from 'next/navigation'
import Link from 'next/link';
import { title } from '@/components/primitives';
import SearchUrl from './searche-url';
import ButtonRetour from './bouton-retour';

export default function SectionHeaderRetour({text,searchUrl}:{text:string,searchUrl?:"invisible"|undefined}) {

    const pathname = usePathname()
   
     const pushUrl = pathname ==='/delivery-men/slot' ?'/delivery-men/creneau-progression': pathname=== '/delivery-men/slot/turboys-assignes'? '/delivery-men/creneau-progression/turboys-assignes':''
   

    return (
        <div className='pb-10'>
            <div className="flex items-center ">
                <ButtonRetour/>
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>{text}</h1>
            </div>


         {searchUrl && searchUrl !=='invisible'? <div className='relative flex items-center gap-24 mmax-w-36 py-6'>
            <SearchUrl />
            </div>: ''
            }   
      
        </div>
    );
}
