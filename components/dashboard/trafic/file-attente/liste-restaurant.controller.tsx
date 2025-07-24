import { FilleAttenteVM } from "@/types/file-attente.model";
import { useEffect, useState } from "react";

interface Props {
    datas?: FilleAttenteVM[];
}

export function useListeRestaurantController({ datas }: Props) {
    const [paginationDatas, setPaginationDatas] = useState<FilleAttenteVM[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const prevPage = 4;

    const paginate = (data: FilleAttenteVM[], pageNumber: number, perPage: number) => {
        const start = pageNumber * perPage;
        return data.slice(start, start + perPage);
    };

    useEffect(() => {
        const sortedData = [...(datas || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); // 🔁 tri croissant
        const slicedData = paginate(sortedData, currentPage, prevPage);
        setPaginationDatas(slicedData);
    }, [currentPage, datas]);

    return {
        paginationDatas,
        setCurrentPage,
        currentPage,
        prevPage,
        paginate
    };
}
