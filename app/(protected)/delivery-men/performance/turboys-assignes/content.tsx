'use client'
import { PaginatedResponse } from "@/types";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import UserListPerformanceBird from "@/components/dashboard/delivery-men/performance/user-list-performance-bird";
import useContentCtx from "./useContentCtx";
import { AvertissementListeTronquee } from "@/components/commons/AvertissementListeTronquee";

interface Props {
    initialData: PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
}

export default function Content({ initialData }: Props) {
    const { data } = useContentCtx({ initialData })

    if (!data || data.length == 0) {
        return <EmptyDataTable title="Aucun livreur" />
    }    
    return (
        <>
            {/* Le serveur annonce un total ; l'ecran n'a aucun controle de page. Sans ce
                bandeau, une liste tronquee se lit comme la liste complete. */}
            <AvertissementListeTronquee rendus={data.length} total={initialData?.totalElements} />
            <UserListPerformanceBird data={data} />
        </>
    )
}